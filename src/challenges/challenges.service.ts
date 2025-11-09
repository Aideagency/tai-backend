import { Injectable } from '@nestjs/common';
import {
  ChallengeRepository,
  ChallengeSearchParams,
} from 'src/repository/challenge/challenge.repository';
import { CreateChallengeDto } from './dtos/create-challenge.dto';
import {
  ChallengeEntity,
  ChallengeFrequency,
} from 'src/database/entities/challenge.entity';
import {
  ChallengeTaskEntity,
  TaskCadence,
} from 'src/database/entities/challenge-task.entity';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateChallengeDto } from './dtos/update-challenge.dto';
import { ChallengeTaskRepository } from 'src/repository/challenge/challenge-task.repository';
import {
  UserChallengesRepository,
  EnrollmentSearchParams,
} from 'src/repository/challenge/user-challenge.repository';
import { CommunityTag } from 'src/database/entities/user.entity';

@Injectable()
export class ChallengesService {
  constructor(
    // private jwtService: JwtService,
    // private readonly userRepository: UserRepository,
    // private readonly logger: TracerLogger,
    // private readonly emailService: EmailService,
    private readonly challengeRepo: ChallengeRepository,
    private readonly challengeTaskRepo: ChallengeTaskRepository,
    private readonly userChallengeRepo: UserChallengesRepository,
  ) {}

  async createChallenge(dto: CreateChallengeDto) {
    try {
      // Create the main Challenge entity and assign properties
      const challenge = new ChallengeEntity();
      challenge.community = dto.community;
      challenge.title = dto.title;
      challenge.durationDays = dto.durationDays;
      challenge.frequency = dto.frequency;
      challenge.visibility = dto.visibility;
      challenge.description = dto.description;

      // Assign optional properties
      if (dto.bookAuthor) {
        challenge.bookAuthor = dto.bookAuthor;
      }
      if (dto.bookTitle) {
        challenge.bookTitle = dto.bookTitle;
      }
      if (dto.status) {
        challenge.status = dto.status;
      }
      if (dto.requireDualConfirmation) {
        challenge.requireDualConfirmation = dto.requireDualConfirmation;
      }

      challenge.tasks = dto.tasks.map((taskDto) => {
        const taskEntity = new ChallengeTaskEntity();
        taskEntity.cadence = taskDto.frequency;
        taskEntity.instructions = taskDto.instructions;
        taskEntity.title = taskDto.title;

        if (taskDto.dayNumber) {
          taskEntity.dayNumber = taskDto.dayNumber;
        }
        if (taskDto.weekNumber) {
          taskEntity.weekNumber = taskDto.weekNumber;
        }
        if (taskDto.isMilestone) {
          taskEntity.isMilestone = taskDto.isMilestone;
        }
        taskEntity.challenge = challenge;
        return taskEntity;
      });
      //   const saved =
      await this.challengeRepo.save(challenge);
      //   return plainToInstance(ChallengeEntity, saved, {
      //     excludeExtraneousValues: true,
      //   });
    } catch (error) {
      // Handle error if saving fails
      console.error('Error creating challenge:', error);
      throw new Error('Failed to create challenge');
    }
  }

  async removeTasksFromChallenge(
    challenge: ChallengeEntity,
    taskIds: number[],
  ) {
    // Find tasks that are marked for deletion
    const tasksToRemove = challenge.tasks.filter((task) =>
      taskIds.includes(task.id),
    );

    if (tasksToRemove.length > 0) {
      // Remove tasks from the database
      await this.challengeTaskRepo.removeAll(tasksToRemove);
    }
  }

  async addNewTasksToChallenge(
    challenge: ChallengeEntity,
    taskDtos: Array<any>,
  ) {
    const newTasks = taskDtos.map((taskDto) => {
      const taskEntity = new ChallengeTaskEntity();

      // Assign properties to the new task
      taskEntity.cadence = taskDto.frequency;
      taskEntity.instructions = taskDto.instructions;
      taskEntity.title = taskDto.title;
      if (taskDto.dayNumber) taskEntity.dayNumber = taskDto.dayNumber;
      if (taskDto.weekNumber) taskEntity.weekNumber = taskDto.weekNumber;
      if (taskDto.isMilestone !== undefined)
        taskEntity.isMilestone = taskDto.isMilestone;

      // Associate the task with the current challenge
      taskEntity.challenge = challenge;

      return taskEntity;
    });

    // Save the new tasks to the database
    return await this.challengeTaskRepo.saveAll(newTasks);
  }

  async updateChallenge(dto: UpdateChallengeDto, challengeId: number) {
    try {
      // Fetch the existing challenge from the database
      const challenge = await this.getChallenge(challengeId);

      // Update the main Challenge entity (only fields provided in DTO)
      if (dto.community) challenge.community = dto.community;
      if (dto.title) challenge.title = dto.title;
      if (dto.durationDays) challenge.durationDays = dto.durationDays;
      if (dto.frequency) challenge.frequency = dto.frequency;
      if (dto.visibility) challenge.visibility = dto.visibility;
      if (dto.description) challenge.description = dto.description;
      if (dto.bookAuthor) challenge.bookAuthor = dto.bookAuthor;
      if (dto.bookTitle) challenge.bookTitle = dto.bookTitle;
      if (dto.status) challenge.status = dto.status;
      if (dto.requireDualConfirmation !== undefined) {
        challenge.requireDualConfirmation = dto.requireDualConfirmation;
      }

      // Step 1: Add new tasks to the challenge
      if (dto.tasks && dto.tasks.length > 0) {
        await this.addNewTasksToChallenge(challenge, dto.tasks);
      }

      // Save the challenge with updated tasks
      const saved = await this.challengeRepo.save(challenge);

      return saved;
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw new Error('Failed to update challenge');
    }
  }

  async getChallenge(challengeId: number) {
    const challenge = await this.challengeRepo.getDetailForUser(
      challengeId,
      true,
    );

    if (!challenge) {
      throw new Error('Challenge not found');
    }
    return challenge;
  }

  async joinChallenge({
    userId,
    challengeId,
    date,
  }: {
    userId: number;
    challengeId: number;
    date?: Date;
  }) {
    try {
      const enrollment = await this.userChallengeRepo.enroll(
        userId,
        challengeId,
        date,
      );
      return enrollment;
    } catch (err) {
      console.error('Error joining challenge:', err);
      throw new Error('Failed to join challenge');
    }
  }

  async listAllChallenges({
    community,
    params,
  }: {
    community: CommunityTag[];
    params: ChallengeSearchParams;
  }) {
    const challenges = await this.challengeRepo.listAvailableForCommunity(
      community,
      params,
    );
    return challenges;
  }

  async getSingleChallenge(id: string) {
    const challenge = await this.challengeRepo.findByIdWithDetails(
      parseInt(id),
      {
        withTasks: true,
      },
    );
    return challenge;
  }

  async listMyChallenges({
    userId,
    params,
  }: {
    userId: number;
    params: EnrollmentSearchParams;
  }) {
    try {
      const myChallenges = await this.userChallengeRepo.listForUser(
        userId,
        params,
      );
      return myChallenges;
    } catch (error) {
      console.error('Error fetching my challenges:', error);
      throw new Error('Failed to get challenges');
    }
  }

  async markChallengeAsCompleted({
    userId,
    userChallengeId,
  }: {
    userId: number;
    userChallengeId: number;
  }) {
    try {
      await this.userChallengeRepo.markCompleted(userId, userChallengeId);
    } catch (error) {
      console.error('Error completing challenges:', error);
      throw new Error('Failed to mark challenge as completed');
    }
  }

  async toggleChallengeTaskCompletion({
    userId,
    userChallengeId,
    completed,
    taskId,
  }: {
    userId: number;
    userChallengeId: number;
    completed: boolean;
    taskId: number;
  }) {
    try {
      await this.userChallengeRepo.toggleTaskCompletion(
        userId,
        userChallengeId,
        taskId,
        completed,
      );
    } catch (error) {
      console.error('Error toggling task:', error);
      throw new Error('Failed to toggle task');
    }
  }

  async partnerTaskConfirmation({
    userId,
    userChallengeId,
    taskId,
    partnerUserId,
  }: {
    userId: number;
    userChallengeId: number;
    taskId: number;
    partnerUserId: number;
  }) {
    try {
      await this.userChallengeRepo.partnerConfirm(
        userId,
        userChallengeId,
        taskId,
        true,
        partnerUserId,
      );
    } catch (error) {
      console.error('Error during partner confirmation:', error);
      throw new Error('Failed to mark task as completed by partner');
    }
  }

  async getTodayTask({
    userId,
    userChallengeId,
  }: {
    userId: number;
    userChallengeId: number;
  }) {
    try {
      const tasks = await this.userChallengeRepo.getTodayTasks(
        userId,
        userChallengeId,
      );
      return tasks;
    } catch (error) {
      console.error('Error getting today tasks for challenge:', error);
      throw new Error('Failed to get today tasks for challenge');
    }
  }

  async getMyChallengeDetails({
    userId,
    userChallengeId,
  }: {
    userId: number;
    userChallengeId: number;
  }) {
    try {
      const challenge = await this.userChallengeRepo.getOwnedEnrollmentOrFail(
        userId,
        userChallengeId,
      );

      return challenge;
    } catch (error) {
      console.error('Error getting challenge enrollment details:', error);
      throw new Error('Failed to get enrollment detail');
    }
  }

  async listCombinedForUser({
    userId,
    community,
    params,
    prioritizeEnrolled = true,
  }: {
    userId: number;
    community?: CommunityTag[]; // optional filter
    params: ChallengeSearchParams;
    prioritizeEnrolled?: boolean;
  }) {
    const mergedParams: ChallengeSearchParams = {
      ...params,
      ...(community ? { community } : {}),
      // Common for listing available
      visibility: params.visibility,
      activeOnly: params.activeOnly,
    };

    return this.challengeRepo.listCombinedForUser(userId, {
      ...mergedParams,
      prioritizeEnrolled,
    });
  }
}
