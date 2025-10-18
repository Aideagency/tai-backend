// src/repository/challenge/user-task-progress.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserTaskProgressEntity } from 'src/database/entities/user-task-progress.entity';

@Injectable()
export class UserTaskProgressRepository extends BaseRepository<
  UserTaskProgressEntity,
  Repository<UserTaskProgressEntity>
> {
  protected logger = new Logger(UserTaskProgressRepository.name);

  constructor(
    @InjectRepository(UserTaskProgressEntity)
    repo: Repository<UserTaskProgressEntity>,
  ) {
    super(repo);
  }

  async findByEnrollment(userChallengeId: number) {
    return this.repository.find({
      where: { userChallenge: { id: userChallengeId } as any },
      relations: ['task'],
      order: { completedAt: 'ASC' },
    });
  }
}
