import { Module } from '@nestjs/common';
import { AdminViewsController } from './admin-views.controller';
import { AdminAuthModule } from 'src/admin/auth/admin-auth.module';
import { AdminModule } from 'src/admin/admin.module';
import { AdminViewsService } from './admin-views-service';
import { EventModule } from 'src/event/event.module';
import { ChallengesModule } from 'src/challenges/challenges.module';

@Module({
  imports: [AdminAuthModule, AdminModule, EventModule, ChallengesModule],
  controllers: [AdminViewsController],
  providers: [AdminViewsService],
  exports: [AdminViewsService],
})
export class AdminViewsModule {}
