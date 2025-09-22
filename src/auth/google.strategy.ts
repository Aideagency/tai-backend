import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: `${process.env.G_CLIENT_ID}`,
      clientSecret: `${process.env.G_CLIENT_SECRET}`,
      callbackURL: `${process.env.G_CALL_BACK}`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    let user;

    try {
      const { name, emails, photos } = profile;
      user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        accessToken,
      };
    } catch (e) {}

    done(null, user);
  }
}
