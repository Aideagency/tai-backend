import { Module } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TransactionRepository } from './transaction/transaction.repository';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { AdminRepository } from './admin/admin.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TransactionEntity, AdminEntity]),
  ],
  providers: [UserRepository, TransactionRepository, AdminRepository],
  exports: [UserRepository, TransactionRepository, AdminRepository],
})
export class RepositoryModule {}
