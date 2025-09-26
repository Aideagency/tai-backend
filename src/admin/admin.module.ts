// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserRepository } from 'src/repository/user/user.repository'; // if you prefer custom repo
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { AdminAuthModule } from './auth/admin-auth.module';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule, AdminAuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
