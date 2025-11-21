// src/admin/auth/admin-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { AdminRepository } from 'src/repository/admin/admin.repository';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly adminRepo: AdminRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADMIN_JWT_SECRET, // set in env
      // audience: 'admin-api',
      // issuer: 'your-app',
    });
  }
  async validate(payload: any) {
    // shape decided in service.getJwtTokens()
    const userId = payload.sub || payload.id || payload.adminId;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user: AdminEntity = await this.adminRepo.findOne({ id: userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User account is deactivated');
    }
    return {
      ...payload,
      ...{
        adminId: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }
}
