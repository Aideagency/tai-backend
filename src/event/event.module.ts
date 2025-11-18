import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  providers: [EventService],
  controllers: [EventController],
  imports: [RepositoryModule],
})
export class EventModule {}
