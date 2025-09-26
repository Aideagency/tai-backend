// src/admin/auth/admin-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADMIN_JWT_SECRET, // set in env
      audience: 'admin-api',
      issuer: 'your-app',
    });
  }
  async validate(payload: any) {
    // shape decided in service.getJwtTokens()
    return { adminId: payload.sub, role: payload.role, email: payload.email };
  }
}
