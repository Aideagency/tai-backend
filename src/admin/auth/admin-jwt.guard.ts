import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const res = context.switchToHttp().getResponse();

    try {
      const canActivate = (await super.canActivate(context)) as boolean;
      return canActivate;
    } catch (err) {
      res.clearCookie('admin_token');
      res.redirect('/admin-views/login');
      return false;
    }
  }

  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // Read Authorization from cookie
    if (req.cookies?.admin_token) {
      req.headers.authorization = `Bearer ${req.cookies.admin_token}`;
    }

    return req;
  }

  // ⭐ This handles expired token, invalid token, etc.
  handleRequest(err: any, user: any) {
    // If passport throws Unauthorized OR user is missing…
    if (err || !user) {
      throw err || new UnauthorizedException('Admin authentication required');
    }

    return user;
  }
}
