// src/admin/auth/admin-auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminRepository } from 'src/repository/admin/admin.repository';
import { AdminEntity, AdminRole } from 'src/database/entities/admin.entity';
import { AdminCreateDto } from './dtos/admin-create.dto';
import { AdminSuperSignupDto } from './dtos/admin-signup.dto';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { Helper } from 'src/utils/helper';

@Injectable()
export class AdminAuthService {
  private readonly JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '30m';
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly jwt: JwtService,
  ) {}

  private toAdminResponse(admin: AdminEntity) {
    const { password, ...safe } = admin as any;
    return safe;
  }

  async signupSuperAdmin(dto: AdminSuperSignupDto) {
    if (await this.adminRepo.existsSuperAdmin()) {
      throw new BadRequestException('Super admin already exists');
    }
    if (await this.adminRepo.findByEmail(dto.email_address)) {
      throw new BadRequestException('Email already in use');
    }

    const admin = new AdminEntity();
    admin.first_name = dto.first_name;
    admin.last_name = dto.last_name;
    admin.email_address = dto.email_address.toLowerCase();
    admin.password = await Helper.hashPassword(dto.password);
    admin.role = AdminRole.SUPER_ADMIN;
    admin.is_active = true;

    const saved = await this.adminRepo.save(admin);
    return this.toAdminResponse(saved);
  }

  async createAdmin(_byAdminId: string, dto: AdminCreateDto) {
    if (await this.adminRepo.findByEmail(dto.email_address)) {
      throw new BadRequestException('Email already in use');
    }

    const admin = new AdminEntity();
    admin.first_name = dto.first_name;
    admin.last_name = dto.last_name;
    admin.email_address = dto.email_address.toLowerCase();
    admin.password = await Helper.hashPassword(dto.password);
    admin.role = dto.role ?? AdminRole.ADMIN;
    admin.is_active = true;

    const saved = await this.adminRepo.save(admin);
    return this.toAdminResponse(saved);
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.adminRepo.findByEmail(dto.email_address);
    if (!admin || !admin.is_active)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, admin.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: admin.id,
      role: admin.role,
      email: admin.email_address,
    };
    const token = await this.jwt.signAsync(payload, {
      secret: process.env.ADMIN_JWT_SECRET,
      expiresIn: this.JWT_EXPIRES_IN,
      audience: 'admin-api',
      issuer: 'your-app',
    });

    admin.last_login_at = new Date();
    await this.adminRepo.save(admin);

    return { admin: this.toAdminResponse(admin), token };
  }
}
