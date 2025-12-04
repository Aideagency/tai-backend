import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { RepositoryModule } from 'src/repository/repository.module';
import { PrayerWallModule } from 'src/prayer-wall/prayer-wall.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RepositoryModule, PrayerWallModule, AuthModule],
  providers: [ConnectionsService],
  controllers: [ConnectionsController],
})
export class ConnectionsModule {}
