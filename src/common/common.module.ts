import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommonHttpService } from './common.service';
// import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [HttpModule, CommonHttpService],
  providers: [CommonHttpService],
  exports: [CommonHttpService],
})
export class CommonModule {}
