import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/repository/repository.module';
import { NuggetController } from './nuggets.controller';
import { NuggetService } from './nuggets.service';

@Module({
  imports: [RepositoryModule],
  providers: [NuggetService],
  controllers: [NuggetController],
})
export class NuggetsModule {}
