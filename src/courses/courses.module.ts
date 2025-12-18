import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ZohoService } from './zoho.service';
import { CommonModule } from 'src/common/common.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { ZohoSyncService } from './zoho-sync.service';

@Module({
  providers: [CoursesService, ZohoService, ZohoSyncService],
  controllers: [CoursesController],
  imports: [CommonModule, RepositoryModule],
})
export class CoursesModule {}
