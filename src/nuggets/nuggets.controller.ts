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
import { ApiBearerAuth, ApiExcludeEndpoint, ApiQuery } from '@nestjs/swagger';
import { AdminJwtGuard } from 'src/admin/auth/admin-jwt.guard';
import { UpdateNuggetDto } from './dtos/update-nugget.dto';

@Controller('nuggets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NuggetController {
  constructor(private readonly nuggetService: NuggetService) {}

  @ApiExcludeEndpoint()
  @Post()
  @UseGuards(AdminJwtGuard)
  create(@Body() dto: CreateNuggetDto, @Req() req: any) {
    const adminId = req.user?.id ?? undefined;
    return this.nuggetService.createNugget(dto, adminId);
  }

  @ApiExcludeEndpoint()
  @Put(':id')
  @UseGuards(AdminJwtGuard)
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
  //   const data = await this.nuggetService.getNuggetWithEngagementStats(3);
  //   return {
  //     status: 200,
  //     message: 'Nuggets added successfully from JSON file',
  //     data,
  //   };
  // }

  @ApiExcludeEndpoint()
  @Get('details/:id')
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
  getInfo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.nuggetService.getNuggetInfo(id, userId);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
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
  @Post(':id/share')
  share(@Param('id', ParseIntPipe) id: number) {
    return this.nuggetService.shareNugget(id);
  }

  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Delete(':id/delete')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.nuggetService.deleteComment(id, { userId: req.user.id });
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id/delete-nugget')
  deleteNugget(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.nuggetService.deleteNugget(id);
  }

  // @UseGuards(JwtGuards)
  // @ApiBearerAuth()
}
