// src/admin/auth/admin-auth.module.ts
import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { RolesGuard } from './roles.guard';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [
    JwtModule.register({}), // strategy reads secret from env
    RepositoryModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy, RolesGuard],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
