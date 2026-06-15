import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { RepositoryModule } from 'src/repository/repository.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  imports: [RepositoryModule, InfrastructureModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
