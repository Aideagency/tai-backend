import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { WordpressService } from './word-press.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [ArticlesService, WordpressService],
  controllers: [ArticlesController],
  imports: [HttpModule],
})
export class ArticlesModule {}
