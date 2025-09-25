import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RepositoryModule, InfrastructureModule, AuthModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
