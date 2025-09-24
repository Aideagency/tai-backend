import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from 'src/repository/user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
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

    const user = await this.userRepository.findOne({ id: userId });

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
      phone_no: user.phone_no,
      marital_status: user.marital_status as string,
    };

    return {
      ...payload,
      ...loginUserResponse,
    };
  }
}
