// src/admin/admin.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UserRepository,
  UserSearchParams,
} from 'src/repository/user/user.repository';
import { CommunityTag, MaritalStatus } from 'src/database/entities/user.entity';
import { UpdateUserByAdminDto } from './dtos/update-user-by-admin.dto';
import { Helper } from 'src/utils/helper';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { TracerLogger } from 'src/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { AdminRepository } from 'src/repository/admin/admin.repository';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '1d';

  constructor(
    private readonly userRepo: UserRepository,
    private readonly logger: TracerLogger,
    private readonly adminRepo: AdminRepository,
    private jwtService: JwtService,
  ) {}

  async listUsers(params: UserSearchParams) {
    return this.userRepo.searchPaginated(params);
  }

  async getUserById(id: string | number) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');
    return this.userRepo.toSubmissionResponse(user);
  }

  async updateUserByAdmin(id: string | number, dto: UpdateUserByAdminDto) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');

    if (
      dto.email_address &&
      (await this.userRepo.emailExists(dto.email_address, user.id))
    ) {
      throw new BadRequestException('Email already in use');
    }
    if (
      dto.phone_no &&
      (await this.userRepo.phoneExists(dto.phone_no, user.id))
    ) {
      throw new BadRequestException('Phone number already in use');
    }

    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.middle_name !== undefined) user.middle_name = dto.middle_name;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.birth_date !== undefined) user.birth_date = dto.birth_date;
    if (dto.email_address !== undefined)
      user.email_address = dto.email_address.toLowerCase();
    if (dto.phone_no !== undefined) user.phone_no = dto.phone_no;

    if (dto.community !== undefined) {
      const hasSingle = dto.community.includes(CommunityTag.SINGLE);
      const hasMarried = dto.community.includes(CommunityTag.MARRIED);
      if (hasSingle && hasMarried) {
        throw new BadRequestException(
          'community cannot contain both SINGLE and MARRIED',
        );
      }
      user.is_parent = dto.community.includes(CommunityTag.PARENT);
      user.marital_status = hasSingle
        ? MaritalStatus.SINGLE
        : hasMarried
          ? MaritalStatus.MARRIED
          : null;
    }

    const saved = await this.userRepo.save(user);
    return this.userRepo.toSubmissionResponse(saved);
  }

  async suspendUser(id: string | number, reason: string) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');

    (user as any).suspended = true;
    user.suspensionReason = reason;
    await this.userRepo.save(user);
    return { success: true, message: 'User suspended' };
  }

  async unsuspendUser(id: string | number) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');

    (user as any).suspended = false;
    user.suspensionReason = null;
    await this.userRepo.save(user);
    return { success: true, message: 'User unsuspended' };
  }

  async deleteUser(id: string | number) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');

    if ('deletedAt' in user) {
      await this.userRepo.softDelete(user.id);
      return { success: true, message: 'User soft-deleted' };
    }
    await this.userRepo.hardDelete(user.id);
    return { success: true, message: 'User deleted' };
  }

  async restoreUser(id: string | number) {
    const restored = await this.userRepo.restoreUser(Number(id));
    if (!restored) {
      throw new NotFoundException('User not found or could not be restored');
    }
    return { success: true, message: 'User restored' };
  }

  async resetUserPassword(id: string | number, newPassword: string) {
    const user = await this.userRepo.findByUserId(Number(id));
    if (!user) throw new NotFoundException('User not found');

    user.password = await Helper.hashPassword(newPassword);
    await this.userRepo.save(user);
    return { success: true, message: 'Password updated' };
  }

  async validate(
    email: string,
    password: string,
  ): Promise<AdminEntity | string> {
    try {
      const loginEmail = (email || '').trim().toLowerCase();
      const user: AdminEntity | null =
        await this.adminRepo.findByEmail(loginEmail);

      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          if (user.suspended) return 'Account is suspended';
        }
        return user;
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
}
