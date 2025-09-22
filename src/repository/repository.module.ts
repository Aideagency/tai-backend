import { Module } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TransactionRepository } from './transaction/transaction.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TransactionEntity])],
  providers: [UserRepository, TransactionRepository],
  exports: [UserRepository, TransactionRepository],
})
export class RepositoryModule {}
