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
} from '@nestjs/common';
import { NuggetService } from './nuggets.service';
import { CreateNuggetDto } from './dtos/create-nugget.dto';
import { CommentDto } from './dtos/comment.dto';
import { ListCommentsQuery } from './dtos/list-comments.query';
import { NuggetType } from 'src/database/entities/nugget.entity';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

/**
 * NOTE:
 * - Replace all `req.user?.id` with your actual auth user extractor (e.g. @CurrentUser() deco).
 * - Add guards/roles where appropriate (e.g. only admins can create nuggets).
 */

@Controller('nuggets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NuggetController {
  constructor(private readonly nuggetService: NuggetService) {}

  // Admin-only (add Guard/Role decorator as needed)
  @Post()
  create(@Body() dto: CreateNuggetDto, @Req() req: any) {
    const adminId = req.user?.id ?? undefined;
    return this.nuggetService.createNugget(dto, adminId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  // Daily nugget (fallback to latest). Optional type filter.
  @Get('daily')
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
  // Nugget details + engagement
  @Get(':id')
  getInfo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.getNuggetInfo(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  // Likes
  @Post(':id/like')
  like(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.likeNugget(id, userId);
  }

  @Delete(':id/like')
  unlike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.unlikeNugget(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  // Comments
  @Post(':id/comments')
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

  // Delete a comment (owner or admin)
  //   @Delete('comments/:commentId')
  //   deleteComment(
  //     @Param('commentId', ParseIntPipe) commentId: number,
  //     @Req() req: any,
  //   ) {
  //     const userId = req.user?.id;
  //     const isAdmin = !!req.user?.isAdmin; // adapt to your roles system
  //     return this.nuggetService.deleteComment(commentId, { userId, isAdmin });
  //   }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  // Share
  @Post(':id/share')
  share(@Param('id', ParseIntPipe) id: number) {
    return this.nuggetService.shareNugget(id);
  }
}
