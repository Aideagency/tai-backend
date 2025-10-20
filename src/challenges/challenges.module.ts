import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RepositoryModule, AuthModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
