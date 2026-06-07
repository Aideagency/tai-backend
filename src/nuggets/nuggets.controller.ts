import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Put,
} from '@nestjs/common';
import { NuggetService } from './nuggets.service';
import { CreateNuggetDto } from './dtos/create-nugget.dto';
import { CommentDto } from './dtos/comment.dto';
import { ListCommentsQuery } from './dtos/list-comments.query';
import { NuggetType } from 'src/database/entities/nugget.entity';
import { JwtGuards } from 'src/auth/jwt.guards';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from 'src/admin/auth/admin-jwt.guard';
import { UpdateNuggetDto } from './dtos/update-nugget.dto';

@ApiTags('Nuggets')
@Controller('nuggets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NuggetController {
  constructor(private readonly nuggetService: NuggetService) {}

  @ApiExcludeEndpoint()
  @Post()
  @UseGuards(AdminJwtGuard)
  @ApiOperation({
    summary: 'Create a nugget',
    description:
      'Creates a new nugget. This is restricted to authenticated admins.',
  })
  create(@Body() dto: CreateNuggetDto, @Req() req: any) {
    const adminId = req.user?.id ?? undefined;
    return this.nuggetService.createNugget(dto, adminId);
  }

  @ApiExcludeEndpoint()
  @Get('samples/daily')
  @ApiOperation({
    summary: 'Get sample daily nuggets',
    description:
      'Returns sample daily nugget payloads that can be used for local testing or seeding.',
  })
  getDailySamples() {
    return {
      items: this.nuggetService.getDailyNuggetSamples(),
    };
  }

  @ApiExcludeEndpoint()
  @Post('seed/daily-samples')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({
    summary: 'Seed sample daily nuggets',
    description:
      'Creates the built-in sample daily nuggets for testing. This is restricted to authenticated admins.',
  })
  seedDailySamples(@Req() req: any) {
    const adminId = req.user?.id ?? undefined;
    return this.nuggetService.seedDailyNuggetSamples(adminId);
  }

  @ApiExcludeEndpoint()
  @Put(':id')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({
    summary: 'Update a nugget',
    description:
      'Updates an existing nugget by ID. This is restricted to authenticated admins.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to update.',
  })
  update(
    @Body() dto: UpdateNuggetDto,
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const adminId = req.user?.id ?? undefined;
    return this.nuggetService.updateNugget(id, dto, adminId);
  }

  // @Get('all-nuggets-json')
  // async addAllNuggetsFromJson() {
  //   // console.log('Adding nuggets from JSON file...');
  //   const data = await this.nuggetService.addNuggetsFromJson();
  //   return {
  //     status: 200,
  //     message: 'Nuggets added successfully from JSON file',
  //     data,
  //   };
  // }

  @ApiExcludeEndpoint()
  @Get('details/:id')
  @ApiOperation({
    summary: 'Get nugget details with engagement stats',
    description:
      'Returns a nugget and its engagement details, including like and comment counts.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to fetch.',
  })
  async nuggetInfo(@Param('id', ParseIntPipe) id: number) {
    const data = await this.nuggetService.getNuggetWithEngagementStats(id);
    return {
      status: 200,
      message: 'Nuggets added successfully from JSON file',
      data,
    };
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Get('daily')
  @ApiOperation({
    summary: 'Get the current daily nugget',
    description:
      'Returns the daily nugget for the logged-in user. If a type is provided, the nugget is selected for that audience type; otherwise the latest fallback is used.',
  })
  @ApiQuery({
    name: 'type',
    required: false, // optional query parameter
    enum: NuggetType, // Assuming NuggetType is an enum
    description: 'Type of the nugget (optional, fallback to latest)',
  })
  getDaily(@Query('type') type?: NuggetType, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.nuggetService.getDailyNugget(
      type as NuggetType | undefined,
      userId,
    );
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Get a nugget',
    description:
      'Returns a single nugget with engagement context for the logged-in user, such as whether they have liked it.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to fetch.',
  })
  getInfo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.getNuggetInfo(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post(':id/like')
  @ApiOperation({
    summary: 'Like a nugget',
    description:
      'Adds a like from the logged-in user to the selected nugget. The operation is safe to call more than once.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to like.',
  })
  @ApiOkResponse({
    description: 'The nugget was liked successfully.',
  })
  like(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.likeNugget(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Delete(':id/like')
  @ApiOperation({
    summary: 'Unlike a nugget',
    description:
      "Removes the logged-in user's like from the selected nugget. The operation is idempotent.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to unlike.',
  })
  @ApiOkResponse({
    description: 'The nugget like was removed successfully.',
  })
  unlike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.unlikeNugget(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post(':id/comments')
  @ApiOperation({
    summary: 'Add a comment to a nugget',
    description:
      'Creates a public comment under the selected nugget for the logged-in user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to comment on.',
  })
  @ApiOkResponse({
    description: 'The comment was created successfully.',
  })
  comment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.nuggetService.addComment(id, userId, dto.comment);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Get(':id/comments')
  @ApiOperation({
    summary: 'List nugget comments',
    description:
      'Returns paginated comments for the selected nugget. Supports page, pageSize, orderBy, and orderDir query parameters.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number to fetch. Defaults to 1.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of comments per page. Defaults to 20.',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['createdAt', 'id'],
    description: 'Field used to sort comments. Defaults to id.',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction for comments. Defaults to DESC.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID whose comments should be listed.',
  })
  @ApiOkResponse({
    description: 'Comments were fetched successfully.',
  })
  listComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() q: ListCommentsQuery,
  ) {
    return this.nuggetService.listComments(
      id,
      q.page,
      q.pageSize,
      q.orderBy,
      q.orderDir,
    );
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post(':id/share')
  @ApiOperation({
    summary: 'Share a nugget',
    description:
      'Records a share action for the selected nugget and increments its share engagement.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to share.',
  })
  @ApiOkResponse({
    description: 'The share was recorded successfully.',
  })
  share(@Param('id', ParseIntPipe) id: number) {
    return this.nuggetService.shareNugget(id);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Delete('comments/:commentId')
  @ApiOperation({
    summary: 'Delete a nugget comment',
    description:
      'Deletes a nugget comment by comment ID. Regular users can delete only their own comments.',
  })
  @ApiParam({
    name: 'commentId',
    type: Number,
    description: 'The ID of the nugget comment to delete.',
  })
  @ApiOkResponse({
    description: 'The comment was deleted successfully.',
  })
  deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    return this.nuggetService.deleteComment(commentId, { userId: req.user.id });
  }

  @ApiExcludeEndpoint()
  @UseGuards(JwtGuards)
  @Delete(':id/delete')
  deleteCommentLegacy(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.nuggetService.deleteComment(id, { userId: req.user.id });
  }

  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @Delete(':id/delete-nugget')
  @ApiOperation({
    summary: 'Delete a nugget',
    description:
      'Soft-deletes a nugget by ID. This is restricted to authenticated admins.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The nugget ID to delete.',
  })
  @ApiOkResponse({
    description: 'The nugget was deleted successfully.',
  })
  deleteNugget(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.nuggetService.deleteNugget(id);
  }

  // @UseGuards(JwtGuards)
  // @ApiBearerAuth()
}
