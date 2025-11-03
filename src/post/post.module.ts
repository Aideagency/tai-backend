import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
