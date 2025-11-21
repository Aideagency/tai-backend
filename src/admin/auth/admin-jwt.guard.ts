import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // Read Authorization from cookie
    if (req.cookies?.admin_token) {
      req.headers.authorization = `Bearer ${req.cookies.admin_token}`;
    }

    return req;
  }

  // ⭐ This handles expired token, invalid token, etc.
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const res = context.switchToHttp().getResponse();
    const req = context.switchToHttp().getRequest();

    // If passport throws Unauthorized OR user is missing…
    if (err || !user) {
      // Clear cookie (optional but recommended)
      res.clearCookie('admin_token');

      // Redirect to login page
      res.redirect('/admin-views/login');
      return null;
    }

    return user;
  }
}
