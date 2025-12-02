import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserSubscriptionEntity } from 'src/database/entities/user-subscription.entity';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from 'src/database/entities/user-subscription.entity';

@Injectable()
export class UserSubscriptionRepository extends BaseRepository<
  UserSubscriptionEntity,
  Repository<UserSubscriptionEntity>
> {
  protected logger = new Logger(UserSubscriptionRepository.name);

  constructor(
    @InjectRepository(UserSubscriptionEntity)
    repository: Repository<UserSubscriptionEntity>,
  ) {
    super(repository);
  }

  // Create or update a user's subscription to a course
  async createOrUpdateSubscription(
    userId: string,
    courseId: string,
    subscriptionPlan: SubscriptionPlan,
    subscriptionStatus: SubscriptionStatus,
  ): Promise<UserSubscriptionEntity> {
    const existingSubscription = await this.findOne({ userId, courseId });

    if (existingSubscription) {
      // Update the existing subscription if it exists
      existingSubscription.subscriptionPlan = subscriptionPlan;
      existingSubscription.status = subscriptionStatus;
      return this.repository.save(existingSubscription);
    }

    // Create a new subscription if none exists
    const newSubscription = this.repository.create({
      userId,
      courseId,
      subscriptionPlan,
      status: subscriptionStatus,
    });

    return this.repository.save(newSubscription);
  }

  // Find subscription by user and course ID
  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<UserSubscriptionEntity | undefined> {
    return this.findOne({ userId, courseId });
  }

  // Find subscriptions by user
  async findByUser(userId: string): Promise<UserSubscriptionEntity[]> {
    return this.findAll({ userId });
  }
}
