import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  UserEntity,
  MaritalStatus,
  CommunityTag,
} from 'src/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/repository/user/user.repository';
import { TracerLogger } from 'src/logger/logger.service';
import { RegisterDto } from './dtos/register.dto';
import { Helper } from 'src/utils/helper';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { EmailService } from 'src/infrastructure/communication/email/email.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '1d';

  constructor(
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly logger: TracerLogger,
    private readonly emailService: EmailService,
  ) {}

  toSubmissionResponse(user: UserEntity) {
    if (!user) return null;

    // Strip sensitive/internal fields
    const {
      password,
      rejectedBy,
      suspensionReason,
      transactions,
      resetTokenExpiration,
      is_email_verified,
      lastLogonDate,
      userName,
      reset_token,
      verification_token,
      marital_status,
      is_parent,
      profilePicture,
      ResetCode,
      refresh_token,
      middle_name,
      suspended,
      deleted,
      createdAt,
      deletedAt,
      updatedAt,
      ...safe
    } = user as any;

    // Rebuild community field from stored flags
    const community: string[] = [];
    if (user.is_parent) {
      community.push(CommunityTag.PARENT);
    }
    if (user.marital_status === MaritalStatus.SINGLE) {
      community.push(CommunityTag.SINGLE);
    }
    if (user.marital_status === MaritalStatus.MARRIED) {
      community.push(CommunityTag.MARRIED);
    }

    return {
      ...safe,
      community,
    };
  }

  async validate(
    email: string,
    password: string,
  ): Promise<UserEntity | string> {
    try {
      const loginEmail = (email || '').trim().toLowerCase();
      const user: UserEntity | null =
        await this.userRepository.findByEmail(loginEmail);

      if (user) {
        const checkIfPasswordTrue = await bcrypt.compare(
          password,
          user.password,
        );
        if (checkIfPasswordTrue) {
          if (user.suspended) return 'Account is suspended';
          return user;
        }
      }

      return 'Invalid username or password';
    } catch (e) {
      this.logger.error(e);
      return 'An error occurred during authentication';
    }
  }

  async getJwtTokens(user: any) {
    const payload = {
      id: user.id,
      sub: user.id,
      email: user.email_address,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.JWT_SECRET,
        expiresIn: this.JWT_EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.JWT_REFRESH_SECRET,
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      }),
    ]);

    return {
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email_address: user.email_address,
        id: user.id,
        is_email_verified: user.is_email_verified,
      },
      token: at,
      refresh_token: rt,
    };
  }

  async updateRtHash(user: any, refreshToken: string): Promise<void> {
    try {
      const hash = await bcrypt.hash(refreshToken);
      user.refresh_token = hash;

      await this.userRepository.save(user);
    } catch (err) {
      this.logger.error(err.stack);
      throw err;
    }
  }

  async createUser(body: RegisterDto) {
    try {
      const {
        password,
        first_name,
        last_name,
        email_address,
        // phone_no,
        // community,
        // birth_date,
        // gender,
      } = body;
      const exists = await this.userRepository.findByEmail(email_address);
      if (exists) {
        throw new BadRequestException('Email or Phone already in use');
      }
      // const isPhoneExist = await this.userRepository.phoneExists(phone_no);
      const hashedPassword = await Helper.hashPassword(password);
      const newUser = new UserEntity();
      newUser.password = hashedPassword;
      newUser.first_name = first_name;
      newUser.last_name = last_name;
      newUser.email_address = email_address;

      const resetToken = Helper.randomRange(100000, 999999);
      const tokenExpiration = new Date();
      tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 3);

      //save token
      newUser.ResetCode = resetToken.toString();
      newUser.resetTokenExpiration = tokenExpiration;

      // await this.userRepository.save(user);

      const saved = await this.userRepository.save(newUser);
      const result = await this.getJwtTokens(saved);

      this.emailService
        .sendMail({
          to: saved.email_address,
          subject: 'Welcome email',
          template: 'welcome',
          data: { first_name: saved.first_name, resetToken },
        })
        .then(() => console.log('Email sent'))
        .catch((err) => this.logger.error(err));

      return result;
      // const { password: _, ...safe } = saved;
      // return safe;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Could not create user');
    }
  }

  async getProfileInformation(email: string) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) throw new NotFoundException('User not found');
      return this.toSubmissionResponse(user);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Could not fetch profile');
    }
  }

  async getUserInformation(id: number) {
    try {
      const user = await this.userRepository.findByUserId(id);
      
      // if (!user) throw new NotFoundException('User not found');
      return this.toSubmissionResponse(user);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Could not fetch profile');
    }
  }

  async verifyEmail(dto: VerifyEmailDto, email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.ResetCode) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (dto.otp !== user.ResetCode) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (
        !user.resetTokenExpiration ||
        user.resetTokenExpiration < new Date()
      ) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      user.ResetCode = null;
      user.resetTokenExpiration = null;
      user.lastLogonDate = new Date();
      user.is_email_verified = true;

      await this.userRepository.save(user);

      // if (user) {
      //   user.is_email_verified = true;
      //   user.phone_no = phone_no;
      //   user.is_parent = community?.includes(CommunityTag.PARENT) ?? false;
      //   user.marital_status =
      //     (community?.find(
      //       (v) => v === CommunityTag.SINGLE || v === CommunityTag.MARRIED,
      //     ) as unknown as MaritalStatus | undefined) ?? null;
      //   user.email_address = email_address;
      //   user.birth_date = birth_date;
      //   user.gender = gender;
      //   await this.userRepository.save(user);
      // }
      // throw new Error("Invalid ")
    } catch (err) {
      this.logger.error(err.stack);
      throw err;
    }
  }

  async forgetPassword(email: string): Promise<void> {
    try {
      const user: UserEntity | null =
        await this.userRepository.findByEmail(email);

      if (user) {
        const resetToken = Helper.randomRange(100000, 999999);
        const tokenExpiration = new Date();
        tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 3);

        //save token
        user.ResetCode = resetToken.toString();
        user.resetTokenExpiration = tokenExpiration;

        await this.userRepository.save(user);

        const data = {
          email: user.email_address,
          name: user.first_name,
          resetCode: user.ResetCode,
        };

        //send email
        this.emailService
          .sendMail({
            to: email,
            subject: 'Password Reset',
            template: 'forgot-password',
            data: data,
          })
          .then((res) => {
            this.logger.log(res);
          })
          .catch((err) => this.logger.error(err));
      } else {
        this.logger.error("User doesn't exist!!!");
      }
    } catch (e) {
      this.logger.error(e.stack);
      throw e;
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findByEmail(dto.email_address);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.ResetCode) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (dto.otp !== user.ResetCode) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (
        !user.resetTokenExpiration ||
        user.resetTokenExpiration < new Date()
      ) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      user.password = await Helper.hashPassword(dto.password);
      user.ResetCode = null;
      user.resetTokenExpiration = null;
      user.lastLogonDate = new Date();

      await this.userRepository.save(user);

      // Prepare email data
      const emailData = {
        first_name: user.first_name,
        email: user.email_address,
        date: new Date().toLocaleString(),
        ipAddress: ipAddress || 'Unknown',
      };

      this.emailService
        .sendMail({
          to: user.email_address,
          subject: 'Password Reset Confirmation',
          template: 'reset-password',
          data: emailData,
        })
        .then(() => console.log('Email sent'))
        .catch((err) => this.logger.error(err));

      return {
        success: true,
        message:
          'Password reset successful. Please check your email for confirmation',
      };
    } catch (error) {
      // Log the error
      this.logger.error(`Password reset failed:§`, error);

      // Re-throw the error for the controller to handle
      throw error;
    }
  }

  async intiateChangePassword(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (user) {
        const resetToken = Helper.randomRange(100000, 999999);
        const tokenExpiration = new Date();
        tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 3);

        //save token
        user.ResetCode = resetToken.toString();
        user.resetTokenExpiration = tokenExpiration;

        await this.userRepository.save(user);

        const data = {
          email: user.email_address,
          name: user.first_name,
          resetCode: user.ResetCode,
        };

        // send email
        this.emailService
          .sendMail({
            to: email,
            subject: 'Password Change OTP',
            template: 'initiate-change-password',
            data: data,
          })
          .then((res) => {
            this.logger.log(res);
          })
          .catch((err) => this.logger.error(err));
      }
    } catch (e) {
      this.logger.error(e.stack);
      throw e;
    }
  }

  async changePassword(
    email: string,
    dto: ChangePasswordDto,
    ipAddress: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const checkOldPassword = await bcrypt.compare(
        dto.old_password,
        user.password,
      );
      if (!checkOldPassword) {
        throw new BadRequestException('Incorrect old password provided');
      }

      user.password = await Helper.hashPassword(dto.new_password);

      const emailData = {
        first_name: user.first_name,
        email: user.email_address,
        date: Helper.getCurrentTimeDescription(),
        ipAddress: ipAddress || 'Unknown',
      };

      await this.emailService.sendMail({
        to: user.email_address,
        subject: 'Password Reset Confirmation',
        template: 'reset-password',
        data: emailData,
      });

      await this.userRepository.save(user);
    } catch (e) {
      this.logger.error(e.stack);
      throw e;
    }
  }

  async updateProfileInformation(
    email: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) throw new BadRequestException('User not found');

      const {
        birth_date,
        gender,
        community, // CommunityTag[]
        phone_no,
        first_name,
        last_name,
        email_address,
      } = dto;

      // Birth date
      if (birth_date) {
        user.birth_date = birth_date;
      }

      if (first_name) {
        user.first_name = first_name;
      }

      if (last_name) {
        user.last_name = last_name;
      }

      if (email_address) {
        user.email_address = email_address;
      }

      // Gender
      if (gender) {
        user.gender = gender;
      }

      if (phone_no) {
        user.phone_no = phone_no;
      }

      if (
        community !== undefined &&
        Array.isArray(community) &&
        community.length > 0
      ) {
        const msTags = community.filter(
          (v) => v === CommunityTag.SINGLE || v === CommunityTag.MARRIED,
        );
        if (msTags.length > 1) {
          throw new BadRequestException(
            'Only one of SINGLE or MARRIED is allowed.',
          );
        }

        // Update is_parent from tag, if present; otherwise leave as-is
        const parentFlag = community.includes(CommunityTag.PARENT);
        user.is_parent = parentFlag;

        // Derive marital_status from community tag when provided
        const derivedStatus =
          (community.find(
            (v) => v === CommunityTag.SINGLE || v === CommunityTag.MARRIED,
          ) as unknown as MaritalStatus | undefined) ?? null;

        // If neither SINGLE nor MARRIED present, keep existing value; otherwise set derived
        if (derivedStatus !== null) {
          user.marital_status = derivedStatus;
        }
      }

      if (file) {
        // Choose a storage strategy; two common options:
        // (A) Store a relative path (frontend prefixes with your static base)
        // user.profilePicture = `profile-pictures/${file.filename}`;
        // or (B) Store an absolute URL if you know it here (requires base URL or CDN)
        // const baseUrl = this.configService.get<string>('FILES_BASE_URL'); // e.g. https://cdn.example.com/uploads
        // user.profile_picture_url = `${baseUrl}/profile-pictures/${file.filename}`;
      }

      const saved = await this.userRepository.save(user);
      // const { password: _pw, ...safe } = saved;
      return this.toSubmissionResponse(saved);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Could not update profile');
    }
  }

  async googleLogin(googleUser: any) {
    let user = await this.userRepository.findByEmail(googleUser.email_address);

    if (!user) {
      // Auto-create user if not exists
      const newUser = new UserEntity();
      newUser.email_address = googleUser.email_address;
      newUser.first_name = googleUser.first_name;
      newUser.last_name = googleUser.last_name;
      newUser.profilePicture = googleUser.profilePicture;
      newUser.is_email_verified = true; // Google verifies emails
      newUser.password = ''; // no password needed for Google users

      user = await this.userRepository.save(newUser);
    }

    // Issue JWT like normal
    return this.getJwtTokens(this.toSubmissionResponse(user));
  }

  async generateAcccountVerificationOTP(email: string) {
    try {
      const user: UserEntity | null =
        await this.userRepository.findByEmail(email);

      if (user) {
        const resetToken = Helper.randomRange(100000, 999999);
        const tokenExpiration = new Date();
        tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 3);

        //save token
        user.ResetCode = resetToken.toString();
        user.resetTokenExpiration = tokenExpiration;

        await this.userRepository.save(user);

        // console.log(user);

        const data = {
          first_name: user.first_name,
          otp: user.ResetCode,
        };

        //send email
        this.emailService
          .sendMail({
            to: email,
            subject: 'Account Verification',
            template: 'account-verification',
            data: data,
          })
          .then((res) => {
            this.logger.log(res);
          })
          .catch((err) => this.logger.error(err));
      }
    } catch (e) {
      this.logger.error(e.stack);
      throw e;
    }
  }

  async generateSampleEmail() {
    try {
      const data = {
        first_name: 'Mubarak',
        otp: '12345',
      };

      this.emailService
        .sendUsingResend({
          to: 'bmubarak88@gmail.com',
          subject: 'Account Verification',
          template: 'account-verification',
          data: data,
        })
        .catch((err) => this.logger.error(err));
    } catch (e) {
      this.logger.error(e.stack);
      throw e;
    }
  }
}
