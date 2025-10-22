import { Module } from '@nestjs/common';
import { BibleController } from './bible.controller';
import { BibleService } from './bible.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [BibleController],
  providers: [BibleService],
  imports: [CommonModule]
})
export class BibleModule {}
