// src/repository/courses/user-subscription.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  UserSubscriptionEntity,
  SubscriptionStatus,
} from 'src/database/entities/user-subscription.entity';

@Injectable()
export class UserSubscriptionRepository extends BaseRepository<
  UserSubscriptionEntity,
  Repository<UserSubscriptionEntity>
> {
  protected logger = new Logger(UserSubscriptionRepository.name);

  constructor(
    @InjectRepository(UserSubscriptionEntity)
    repo: Repository<UserSubscriptionEntity>,
  ) {
    super(repo);
  }

  async hasActiveSubscription(userId: number, courseId: number) {
    const now = new Date();

    const sub = await this.repository.findOne({
      where: { userId, courseId, status: SubscriptionStatus.ACTIVE } as any,
    });

    if (!sub) return false;
    if (sub.subscriptionEndDate && sub.subscriptionEndDate < now) return false;
    return true;
  }
}
