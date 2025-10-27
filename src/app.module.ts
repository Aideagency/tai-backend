import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoryModule } from './repository/repository.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
// import { PaymentModule } from './payment/payment.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { NuggetsModule } from './nuggets/nuggets.module';
import { PrayerWallModule } from './prayer-wall/prayer-wall.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BibleModule } from './bible/bible.module';
import { ConnectionsModule } from './connections/connections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    InfrastructureModule,
    AuthModule,
    RepositoryModule,
    LoggerModule,
    UserModule,
    NuggetsModule,
    PrayerWallModule,
    ChallengesModule,
    CommonModule,
    BibleModule,
    ConnectionsModule,
    // AdminModule,
    // PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
