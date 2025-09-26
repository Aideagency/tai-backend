// src/admin/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const roles: string[] =
      Reflect.getMetadata(ROLES_KEY, ctx.getHandler()) || [];
    if (!roles.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // from AdminJwtStrategy
    if (!user) throw new ForbiddenException('Not authenticated');
    const ok = roles.includes(user.role);
    if (!ok) throw new ForbiddenException('Insufficient role');
    return ok;
  }
}
