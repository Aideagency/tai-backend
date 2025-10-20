// challenges.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  // ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  // EnrollChallengeDto,
  ListAvailableChallengesQueryDto,
  // PaginationQueryDto,
  PartnerConfirmDto,
  // ReflectionCreateDto,
  ToggleTaskCompletionDto,
} from './dtos/user-challenges.dtos';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ChallengesService } from './challenges.service';
// import { CreateChallengeDto } from './dtos/create-challenge.dto';
import { EnrollmentSearchParams } from 'src/repository/challenge/user-challenge.repository';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRepository } from 'src/repository/user/user.repository';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
// import { ChallengeSearchParams } from 'src/repository/challenge/challenge.repository';

// Import your services
// import { UserChallengesService } from './user-challenges.service';
// import { ReflectionsService } from './reflections.service';
// import { BadgesService } from './badges.service';
@Controller('challenges')
@UseGuards(JwtGuards)
@ApiBearerAuth()
export class ChallengesController {
  constructor(
    private challengeService: ChallengesService,
    private userRepo: UserRepository,
    private authService: AuthService,
  ) {} // private readonly badgesService: BadgesService, // private readonly reflectionsService: ReflectionsService, // private readonly userChallengesService: UserChallengesService, // private readonly challengesService: ChallengesService,
  // @Post('create-challenge')
  // @HttpCode(HttpStatus.CREATED)
  // async createChallenge(@Body(new ValidationPipe()) dto: CreateChallengeDto) {
  //   await this.challengeService.createChallenge(dto);
  //   return {
  //     message: 'Challenge Created Successfully!',
  //     status: 201,
  //   };
  // }

  @Get('available')
  async listAvailable(
    @Req() req,
    @Query() query: ListAvailableChallengesQueryDto,
  ) {
    console.log(req.user.community);
    const user = this.authService.toSubmissionResponse(
      await this.userRepo.findByEmail(req.user.email),
    );
    console.log(user);
    const challenges = await this.challengeService.listAllChallenges({
      community: user.community,
      params: query,
    });
    return {
      message: 'Available Challenge fetched Successfully!',
      data: challenges,
      status: 200,
    };
  }

  @Post(':challengeId/enroll/:startDate')
  @HttpCode(HttpStatus.CREATED)
  async enroll(
    @Req() req,
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Param('startDate', ParseIntPipe) date?: Date,
  ) {
    await this.challengeService.joinChallenge({
      userId: req.user.id,
      challengeId: challengeId,
      date,
    });
    return {
      message: 'Joined challenge succesfully',
      status: 200,
    };
  }

  @Get('my-challenges')
  async myChallenges(@Req() req, @Query() query: EnrollmentSearchParams) {
    const params: EnrollmentSearchParams = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      archived: query.archived,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    };
    const myChallenges = await this.challengeService.listMyChallenges({
      userId: req.user.id,
      params,
    });

    return {
      status: 200,
      data: myChallenges,
      message: 'Challenge details fetched successfully!',
    };
  }

  // @Get('me/active')
  // async myActive(
  //   // @CurrentUser() user: { id: number },
  //   @Query() query: PaginationQueryDto,
  // ) {
  //   // return this.userChallengesService.listActive(user.id, query);
  // }

  // @Get('me/archived')
  // async myArchived(
  //   // @CurrentUser() user: { id: number },
  //   @Query() query: PaginationQueryDto,
  // ) {
  //   // return this.userChallengesService.listArchived(user.id, query);
  // }

  @Get('me/:userChallengeId')
  async getMyEnrollment(
    @Req() req,
    @Param('userChallengeId', ParseIntPipe) userChallengeId: number,
    // @CurrentUser() user: { id: number },
  ) {
    const details = await this.challengeService.getMyChallengeDetails({
      userId: req.user.id,
      userChallengeId,
    });
    return {
      status: 200,
      data: details,
      message: 'Challenge details fetched successfully!',
    };
  }

  @Get('me/:userChallengeId/today')
  async todayTasks(
    @Req() req,
    @Param('userChallengeId', ParseIntPipe) userChallengeId: number,
  ) {
    const tasks = await this.challengeService.getTodayTask({
      userId: req.user.id,
      userChallengeId,
    });
    return {
      status: 200,
      data: tasks,
      message: 'Today"s tasks fetched successfully!',
    };
  }

  @Post('me/toggle-task-completion')
  async toggleTask(@Req() req, @Body() dto: ToggleTaskCompletionDto) {
    await this.challengeService.toggleChallengeTaskCompletion({
      userId: req.user.id,
      taskId: dto.taskId,
      userChallengeId: dto.challengeId,
      completed: dto.completed,
    });
    return { status: 200, message: 'Success' };
  }

  @Patch('me/tasks/partner-confirmation')
  async partnerConfirm(@Req() req, @Body() dto: PartnerConfirmDto) {
    await this.challengeService.partnerTaskConfirmation({
      userId: req.user.id,
      userChallengeId: dto.userChallengeId,
      taskId: dto.partnerUserId,
      partnerUserId: dto.partnerUserId,
    });
    return { status: 200, message: 'Success' };
  }

  @Post('me/:userChallengeId/complete')
  @HttpCode(HttpStatus.OK)
  async completeEnrollment(
    @Req() req,
    @Param('userChallengeId', ParseIntPipe) userChallengeId: number,
  ) {
    await this.challengeService.markChallengeAsCompleted({
      userId: req.user.id,
      userChallengeId,
    });

    return { status: 200, message: 'Challenge completed' };
    // return this.userChallengesService.complete(user.id, userChallengeId);
  }

  // @Patch('me/:userChallengeId/archive')
  // async archiveEnrollment(
  //   @Param('userChallengeId', ParseIntPipe) userChallengeId: number,
  //   // @CurrentUser() user: { id: number },
  // ) {
  //   // return this.userChallengesService.archive(user.id, userChallengeId);
  // }

  // @Post(':challengeId/reflections')
  // @HttpCode(HttpStatus.CREATED)
  // async createReflection(
  //   @Param('challengeId', ParseIntPipe) challengeId: number,
  //   // @CurrentUser() user: { id: number },
  //   @Body() dto: ReflectionCreateDto,
  // ) {
  //   // return this.reflectionsService.create(user.id, challengeId, dto);
  // }

  // @Get(':challengeId/reflections')
  // async listReflections(
  //   @Param('challengeId', ParseIntPipe) challengeId: number,
  //   @Query() query: PaginationQueryDto,
  //   // @CurrentUser() user: { id: number },
  // ) {
  //   // return this.reflectionsService.listForChallenge(
  //   //   user.id,
  //   //   challengeId,
  //   //   query,
  //   // );
  // }

  // @Get('me/badges')
  // async myBadges(
  //   // @CurrentUser() user: { id: number },
  //   @Query() query: PaginationQueryDto,
  // ) {
  //   // return this.badgesService.listForUser(user.id, query);
  // }
}
