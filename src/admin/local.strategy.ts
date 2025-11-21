import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AdminService } from './admin.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'admin-local') {
  constructor(private adminService: AdminService) {
    super({
      usernameField: 'email_address', // 👈 must match your incoming JSON
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.adminService.validate(email, password);
    return user;
  }
}
