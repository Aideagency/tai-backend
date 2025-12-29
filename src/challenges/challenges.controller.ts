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
  ValidationPipe,
  Req,
  BadRequestException,
  Delete,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ListAvailableChallengesQueryDto,
  PartnerConfirmDto,
  ToggleTaskCompletionDto,
  CombinedChallengesQueryDto,
} from './dtos/user-challenges.dtos';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dtos/create-challenge.dto';
import { EnrollmentSearchParams } from 'src/repository/challenge/user-challenge.repository';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { UserRepository } from 'src/repository/user/user.repository';
import { AuthService } from 'src/auth/auth.service';
import { UpdateChallengeDto } from './dtos/update-challenge.dto';
import {
  AddTasksDto,
  // CreateChallengeTaskDto,
  RemoveTasksDto,
} from './dtos/create-challenge-task.dto';
import { UpdateChallengeTaskDto } from './dtos/update-challenge-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
// import { ChallengeSearchParams } from 'src/repository/challenge/challenge.repository';

// Import your services
// import { UserChallengesService } from './user-challenges.service';
// import { ReflectionsService } from './reflections.service';
// import { BadgesService } from './badges.service';
@Controller('challenges')
export class ChallengesController {
  constructor(
    private challengeService: ChallengesService,
    private userRepo: UserRepository,
    private authService: AuthService,
  ) {} // private readonly badgesService: BadgesService, // private readonly reflectionsService: ReflectionsService, // private readonly userChallengesService: UserChallengesService, // private readonly challengesService: ChallengesService,
  @ApiExcludeEndpoint()
  @Post('create-challenge')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverUrl'))
  async createChallenge(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateChallengeDto,
    @UploadedFile() coverUrl?: Express.Multer.File,
  ) {
    await this.challengeService.createChallenge(dto, coverUrl);

    return {
      message: 'Challenge Created Successfully!',
      status: 201,
    };
  }

  @ApiExcludeEndpoint()
  @Put('update-challenge/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverUrl'))
  async updateChallenge(
    @Body(new ValidationPipe()) dto: UpdateChallengeDto,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() coverUrl?: Express.Multer.File,
  ) {
    await this.challengeService.updateChallenge(dto, id, coverUrl);
    return {
      message: 'Challenge Update Successfully!',
      status: 200,
    };
  }

  @Get('single/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiExcludeEndpoint()
  async getChallenge(@Param('id', ParseIntPipe) id: string) {
    // const user = this.authService.toSubmissionResponse(
    //   await this.userRepo.findByEmail(req.user.email),
    // );
    const challenges = await this.challengeService.getSingleChallenge(id);
    return {
      message: 'Challlenge details fetched Successfully!',
      data: challenges,
      status: 200,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.CREATED)
  @ApiExcludeEndpoint()
  async deleteChallenge(@Param('id', ParseIntPipe) id: string) {
    await this.challengeService.deleteChallange(id);
    return {
      message: 'Challlenge details deleted Successfully!',
      status: 200,
    };
  }

  @Post('/:challengeId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiExcludeEndpoint()
  async addTasksToChallenge(
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AddTasksDto,
  ) {
    const result = await this.challengeService.addNewTasksToChallenge(
      challengeId,
      dto.tasks,
    );

    return {
      message: 'Tasks added to challenge successfully!',
      status: 201,
      data: result,
    };
  }

  // Remove a single task from challenge (admin)
  @Delete(':challengeId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async removeTaskFromChallenge(
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    const result = await this.challengeService.removeTasksFromChallenge(
      challengeId,
      [taskId],
    );

    return {
      message: 'Task removed from challenge successfully!',
      status: 200,
      data: result,
    };
  }

  // Remove multiple tasks from challenge (admin)
  @Delete('/:challengeId/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async removeTasksFromChallenge(
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RemoveTasksDto,
  ) {
    const result = await this.challengeService.removeTasksFromChallenge(
      challengeId,
      dto.taskIds,
    );

    return {
      message: 'Tasks removed from challenge successfully!',
      status: 200,
      data: result,
    };
  }

  @Patch('/:challengeId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async editTaskForChallenge(
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateChallengeTaskDto,
  ) {
    const result = await this.challengeService.updateChallengeTask(
      challengeId,
      taskId,
      dto,
    );

    return {
      message: 'Task updated successfully!',
      status: 200,
      data: result,
    };
  }

  @Get('available')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  async listAvailable(
    @Req() req: any,
    @Query() query: ListAvailableChallengesQueryDto,
  ) {
    const user = this.authService.toSubmissionResponse(
      await this.userRepo.findByEmail(req.user.email),
    );
    const challenges = await this.challengeService.listAllChallenges(
      user.community,
      query,
    );
    return {
      message: 'Available Challenge fetched Successfully!',
      data: challenges,
      status: 200,
    };
  }

  // @Get('available')
  // @UseGuards(JwtGuards)
  // @ApiBearerAuth()
  // async listAvailable(
  //   @Req() req,
  //   @Query(new ValidationPipe({ transform: true, whitelist: true }))
  //   query: ListAvailableChallengesQueryDto,
  // ) {
  //   const user = this.authService.toSubmissionResponse(
  //     await this.userRepo.findByEmail(req.user.email),
  //   );
  //   const challenges = await this.challengeService.listAllChallenges(
  //     user.community,
  //     query,
  //   );
  //   return {
  //     message: 'Available Challenge fetched Successfully!',
  //     data: challenges,
  //     status: 200,
  //   };
  // }

  @Get('available/:id')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  async getSingleChallenge(@Param('id') id: string) {
    // const user = this.authService.toSubmissionResponse(
    //   await this.userRepo.findByEmail(req.user.email),
    // );
    const challenges = await this.challengeService.getSingleChallenge(id);
    return {
      message: 'Challlenge details fetched Successfully!',
      data: challenges,
      status: 200,
    };
  }

  @Get('combined-challenges')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  async combinedChallenges(
    @Req() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: CombinedChallengesQueryDto,
  ) {
    const params: any = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      archived: false,
      // orderBy: query.orderBy,
      // orderDir: query.orderDir,
    };
    const myChallenges = await this.challengeService.listCombinedForUser({
      userId: req.user.id,
      params,
    });

    return {
      status: 200,
      data: myChallenges,
      message: 'Challenge details fetched successfully!',
    };
  }

  @Get('combinedChallenge/:id')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getChallengeInformation(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const challenge = await this.challengeService.getSingleChallengeDetails({
      userId: req.user.id,
      challengeId: id,
    });

    return {
      status: 200,
      message: 'Challenge details fetched successfully',
      challenge,
    };
    // return this.userChallengesService.complete(user.id, userChallengeId);
  }

  @Post(':challengeId/enroll/:startDate')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async enroll(
    @Req() req,
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Param('startDate') startDate?: Date,
  ) {
    const date = startDate ? new Date(startDate) : undefined;
    if (startDate && isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid startDate (use ISO format e.g. 2025-11-09)',
      );
    }

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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  async myChallenges(@Req() req, @Query() query: EnrollmentSearchParams) {
    const params: any = {
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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
