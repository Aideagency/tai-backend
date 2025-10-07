import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminRepository } from 'src/repository/admin/admin.repository';
import { UserRepository } from 'src/repository/user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly adminRepo: AdminRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const userId = payload.sub || payload.id;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.adminRepo.findOne({ id: userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.suspended) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const loginUserResponse: any = {
      first_name: user.first_name,
      last_name: user.last_name,
      id: user.id,
      email_address: user.email_address,
    };

    return {
      ...payload,
      ...loginUserResponse,
    };
  }
}
