import { BadRequestException, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/repository/user/user.repository';
import { TracerLogger } from 'src/logger/logger.service';
import { RegisterDto } from './dtos/register.dto';
import { Helper } from 'src/utils/helper';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '60d';

  constructor(
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly logger: TracerLogger,
  ) {}
  async validate(email: string, password: string): Promise<any> {
    try {
      const loginEmail = (email || '').trim().toLowerCase();
      const user: UserEntity | null =
        await this.userRepository.findByEmail(loginEmail);

      console.log({ user });

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

    const at = await this.jwtService.signAsync(payload, {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_EXPIRES_IN,
    });

    return {
      user: user,
      token: at,
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
      const { password, first_name, last_name, middle_name, phone_no } = body;
      const hashedPassword = await Helper.hashPassword(password);
      const newUser = new UserEntity();
      newUser.password = hashedPassword;
      newUser.first_name = first_name;
      newUser.last_name = last_name;
      newUser.middle_name = middle_name;
      newUser.phone_no = phone_no;

      await this.userRepository.save(newUser);
      return newUser;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }
}
