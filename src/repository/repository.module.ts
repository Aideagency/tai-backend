import { Module } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TransactionRepository } from './transaction/transaction.repository';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { AdminRepository } from './admin/admin.repository';
import { NuggetEntity } from 'src/database/entities/nugget.entity';
import { NuggetCommentEntity } from 'src/database/entities/nugget-comment.entity';
import { NuggetLikeEntity } from 'src/database/entities/nugget-like.entity';
import { NuggetRepository } from './nuggets/nugget.repository';
import { PrayerAmenEntity } from 'src/database/entities/prayer-amen.entity';
import { PrayerCommentEntity } from 'src/database/entities/prayer-comment.entity';
import { PrayerWallEntity } from 'src/database/entities/prayer-wall.entity';
import { PrayerWallRepository } from './prayer/prayer-wall.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TransactionEntity,
      AdminEntity,
      NuggetEntity,
      NuggetCommentEntity,
      NuggetLikeEntity,
      PrayerWallEntity,
      PrayerCommentEntity,
      PrayerAmenEntity,
    ]),
  ],
  providers: [
    UserRepository,
    TransactionRepository,
    AdminRepository,
    NuggetRepository,
    PrayerWallRepository,
  ],
  exports: [
    UserRepository,
    TransactionRepository,
    AdminRepository,
    NuggetRepository,
    PrayerWallRepository,
  ],
})
export class RepositoryModule {}
