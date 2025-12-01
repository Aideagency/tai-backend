import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoryModule } from './repository/repository.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentModule } from './payment/payment.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { NuggetsModule } from './nuggets/nuggets.module';
import { PrayerWallModule } from './prayer-wall/prayer-wall.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BibleModule } from './bible/bible.module';
import { ConnectionsModule } from './connections/connections.module';
import { PostService } from './post/post.service';
import { PostController } from './post/post.controller';
import { PostModule } from './post/post.module';
import { ZohoModule } from './zoho/zoho.module';
import { EventModule } from './event/event.module';
import { AdminViewsController } from './admin-views/admin-views.controller';
import { AdminViewsModule } from './admin-views/admin-views.module';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { CounsellingModule } from './counselling/counselling.module';
import { RefundRequestModule } from './refund-request/refund-request.module';

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
    PostModule,
    EventModule,
    PaymentModule,
    AdminViewsModule,
    // ZohoModule,
    AdminModule,
    AdminAuthModule,
    CounsellingModule,
    RefundRequestModule,
    // PaymentModule,
  ],
  controllers: [AppController, PostController, AdminViewsController],
  providers: [AppService, PostService],
})
export class AppModule {}
