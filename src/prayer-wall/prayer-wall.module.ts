import { Module } from '@nestjs/common';
import { PrayerWallService } from './prayer-wall.service';
import { PrayerWallController } from './prayer-wall.controller';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  providers: [PrayerWallService],
  controllers: [PrayerWallController],
  exports: [PrayerWallService],
})
export class PrayerWallModule {}
