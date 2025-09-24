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

  async validate(email: string, password: string): Promise<any> {
    try {
      const loginEmail = (email || '').trim().toLowerCase();
      const user: UserEntity | null =
        await this.userRepository.findByEmail(loginEmail);

      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          if (user.suspended) return 'Account is suspended';
        }
        return user;
      }

      return 'Invalid username or password';
    } catch (e) {
      //   this.logger.error(e.stack);
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
      user: user,
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
    }
  }

  async createUser(body: RegisterDto) {
    try {
      const {
        password,
        first_name,
        last_name,
        phone_no,
        community,
        email_address,
        birth_date,
        gender,
      } = body;

      const exists = await this.userRepository.findByEmail(email_address);
      if (exists) {
        throw new BadRequestException('Email already in use');
      }

      const hashedPassword = await Helper.hashPassword(password);
      const newUser = new UserEntity();
      newUser.password = hashedPassword;
      newUser.first_name = first_name;
      newUser.last_name = last_name;
      newUser.phone_no = phone_no;
      newUser.is_parent = community?.includes(CommunityTag.PARENT) ?? false;
      newUser.marital_status =
        (community?.find(
          (v) => v === CommunityTag.SINGLE || v === CommunityTag.MARRIED,
        ) as unknown as MaritalStatus | undefined) ?? null;
      newUser.email_address = email_address;
      newUser.birth_date = birth_date;
      newUser.gender = gender;

      const saved = await this.userRepository.save(newUser);
      return saved;
      // const { password: _, ...safe } = saved;
      // return safe;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Could not create user');
    }
  }

  async verifyEmail(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        user.is_email_verified = true;
        await this.userRepository.save(user);
      }
    } catch (err) {
      this.logger.error(err.stack);
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

      // Log the failed attempt
      //   if (error instanceof NotFoundException) {
      //     await this.logPasswordReset(null, false, 'User not found');
      //   } else {
      //     await this.logPasswordReset(null, false, error.message);
      //   }

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
    }
  }

  async changePassword(
    email: string,
    dto: ChangePasswordDto,
    ipAddress: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      console.log({ user, dto });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (
        !user.ResetCode ||
        !user.resetTokenExpiration ||
        dto.otp !== user.ResetCode ||
        user.resetTokenExpiration < new Date()
      ) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      const checkOldPassword = await bcrypt.compare(
        dto.old_password,
        user.password,
      );
      if (!checkOldPassword) {
        throw new BadRequestException('Incorrect old password provided');
      }

      user.password = await Helper.hashPassword(dto.new_password);
      user.ResetCode = null;
      user.resetTokenExpiration = null;

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
    }
  }

  async getProfileInformation(email) {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async updateProfileInformation(email, dto: UpdateProfileDto) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) throw new BadRequestException('User not found');
      user.first_name = dto.first_name || user.first_name;
      user.last_name = dto.last_name || user.last_name;
      user.birth_date = dto.birth_date || user.birth_date;
      user.marital_status = dto.marital_status || user.marital_status;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
