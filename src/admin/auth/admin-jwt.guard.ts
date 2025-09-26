// src/admin/auth/admin-jwt.guard.ts
import { AuthGuard } from '@nestjs/passport';
export class AdminJwtGuard extends AuthGuard('admin-jwt') {}
