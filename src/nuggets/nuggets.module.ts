import { Module } from '@nestjs/common';
import { NuggetsService } from './nuggets.service';

@Module({
  providers: [NuggetsService]
})
export class NuggetsModule {}
