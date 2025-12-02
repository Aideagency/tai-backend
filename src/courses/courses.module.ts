import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ZohoService } from './zoho.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  providers: [CoursesService, ZohoService],
  controllers: [CoursesController],
  imports: [CommonModule],
})
export class CoursesModule {}
