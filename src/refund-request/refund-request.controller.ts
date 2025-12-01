import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RefundRequestService } from './refund-request.service';
import { CreateRefundRequestDto } from './dtos/create-refund-request.dto';
import { UpdateRefundStatusDto } from './dtos/update-refund-request.dto';
import { RefundRequestSearchQueryDto } from './dtos/refund-search-query.dto';

@Controller('refund-requests')
export class RefundRequestController {
  constructor(private readonly refundRequestService: RefundRequestService) {}

  /** User creates a refund request */
  @Post()
  async createRefundRequest(
    @Body() dto: CreateRefundRequestDto,
    @Req() req: any, // replace with your AuthUser decorator/type
  ) {
    const userId = req.user?.id; // assuming auth middleware
    return this.refundRequestService.createRefundRequest(dto, userId);
  }

  /** Get single refund request (with relations) */
  @Get(':id')
  async getRefundRequest(@Param('id', ParseIntPipe) id: number) {
    return this.refundRequestService.getRefundRequestById(id);
  }

  /** Search refund requests (admin / dashboard) */
  @Get()
  async searchRefundRequests(@Query() query: RefundRequestSearchQueryDto) {
    const { page = 1, pageSize = 20, createdFrom, createdTo, ...rest } = query;

    const params: any = {
      ...rest,
      page: Number(page),
      pageSize: Number(pageSize),
    };

    if (createdFrom) {
      params.createdFrom = new Date(createdFrom);
    }
    if (createdTo) {
      params.createdTo = new Date(createdTo);
    }

    return this.refundRequestService.searchRefundRequests(params);
  }

  /** Logged-in user: my refund requests (paginated) */
  @Get('me/list')
  async getMyRefundRequests(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const userId = req.user?.id;
    return this.refundRequestService.getUserRefundRequests(
      userId,
      Number(page),
      Number(pageSize),
    );
  }

  /** Admin: update refund status (approve/decline, processed etc.) */
  @Patch(':id/status')
  async updateRefundStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.refundRequestService.updateRefundStatus(id, dto);
  }
}
