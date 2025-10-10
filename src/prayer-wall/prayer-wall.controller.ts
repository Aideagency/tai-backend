import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrayerWallService } from './prayer-wall.service';
import { CreatePrayerDto } from './dto/create-prayer.dto';
import { UpdatePrayerDto } from './dto/update-prayer.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AmenDto } from './dto/amen.dto';
import { PrayerSearchParams } from 'src/repository/prayer/prayer-wall.repository';
import {
  ListPrayersQueryDto,
  LatestPrayersQueryDto,
} from './dto/list-prayers.query.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtGuards } from 'src/auth/jwt.guards';

function toBool(v: any): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

@Controller('prayers')
@UseGuards(JwtGuards)
@ApiBearerAuth()
export class PrayerWallController {
  constructor(private readonly service: PrayerWallService) {}

  // req.user?.id is assumed set by your auth guard/strategy
  private getUserId(req: any): number | undefined {
    return req?.user?.id ?? undefined;
  }

  // --- Create ---
  @Post('create')
  @ApiOperation({ summary: 'Create a new prayer' })
  create(@Body() dto: CreatePrayerDto, @Req() req: any) {
    return this.service.createPrayer(dto, this.getUserId(req));
  }

  // --- List / feeds ---
  @Get('my-prayers')
  @ApiOperation({
    summary:
      'List all user prayers (supports search, filters, sorting, and pagination)',
  })
  list(@Req() req: any, @Query() query: ListPrayersQueryDto) {
    const params: PrayerSearchParams = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      q: query.q || undefined,
      userId: req?.user?.id,
      isAnswered: query.isAnswered,
      isVisible: query.isVisible,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      orderBy: query.orderBy ?? 'id',
      orderDir: query.orderDir ?? 'DESC',
    };

    return this.service.listPrayers(params);
  }

  // Handy feeds
  @Get('latest')
  @ApiOperation({
    summary:
      'Get the most recent prayers (supports search, filters, sorting, and pagination)',
  })
  latest(@Query() query: LatestPrayersQueryDto) {
    const params: PrayerSearchParams = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      q: query.q || undefined,
      isAnswered: query.isAnswered,
      isVisible: query.isVisible,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    return this.service.getLatest(params);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get prayers with the highest recent activity' })
  active() {
    return this.service.getActive();
  }

  // --- Single ---
  @Get(':id')
  @ApiOperation({ summary: 'Get a single prayer by ID' })
  getOne(@Param('id') id: string) {
    return this.service.getPrayer(parseInt(id, 10));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prayer by ID' })
  update(@Param('id') id: string, @Body() dto: UpdatePrayerDto) {
    return this.service.updatePrayer(parseInt(id, 10), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prayer by ID' })
  remove(@Param('id') id: string) {
    return this.service.deletePrayer(parseInt(id, 10));
  }

  // --- Lifecycle/visibility ---
  @Post(':id/answered')
  @ApiOperation({ summary: 'Mark a prayer as answered or not answered' })
  markAnswered(
    @Param('id') id: string,
    @Body('isAnswered') isAnswered: boolean,
  ) {
    return this.service.markAnswered(parseInt(id, 10), !!isAnswered);
  }

  @Post(':id/visibility')
  @ApiOperation({ summary: 'Set a prayer’s visibility (public/private)' })
  setVisibility(
    @Param('id') id: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.service.setVisibility(parseInt(id, 10), !!isVisible);
  }

  // --- Share / report / counts ---
  @Post(':id/share')
  @ApiOperation({ summary: 'Increment share count for a prayer' })
  share(@Param('id') id: string) {
    return this.service.incrementShare(parseInt(id, 10));
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a prayer for moderation' })
  report(@Param('id') id: string) {
    return this.service.report(parseInt(id, 10));
  }

  @Get(':id/engagement')
  @ApiOperation({ summary: 'Get engagement counts (amens, comments, shares)' })
  engagement(@Param('id') id: string, @Req() req: any) {
    return this.service.getEngagementCounts(
      parseInt(id, 10),
      this.getUserId(req),
    );
  }

  // --- Amen ---
  @Post(':id/amen')
  @ApiOperation({ summary: 'Say “Amen” to a prayer' })
  amen(@Param('id') id: string, @Body() dto: AmenDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.service.amen(parseInt(id, 10), Number(userId), dto);
  }

  @Delete(':id/amen')
  @ApiOperation({ summary: 'Remove your “Amen” from a prayer' })
  unAmen(@Param('id') id: string, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.service.unAmen(parseInt(id, 10), Number(userId));
  }

  // --- Comments ---
  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a prayer (with pagination)' })
  listComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'id',
    @Query('orderDir') orderDir?: 'ASC' | 'DESC',
  ) {
    return this.service.listComments({
      prayerId: parseInt(id, 10),
      page: page ? Math.max(parseInt(page, 10) || 1, 1) : 1,
      pageSize: pageSize ? Math.max(parseInt(pageSize, 10) || 20, 1) : 20,
      orderBy: orderBy || 'id',
      orderDir: orderDir || 'DESC',
    });
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a prayer' })
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.service.addComment(parseInt(id, 10), Number(userId), dto);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment from a prayer' })
  deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.service.deleteComment(
      parseInt(id, 10),
      parseInt(commentId, 10),
      {
        userId,
        isAdmin: !!req?.user?.isAdmin,
      },
    );
  }
}
