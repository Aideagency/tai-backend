import {
  Controller,
  Get,
  Post,
  Render,
  Body,
  Res,
  Req,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminAuthService } from 'src/admin/auth/admin-auth.service';
import { AdminJwtGuard } from 'src/admin/auth/admin-jwt.guard';
import { AdminViewsService } from './admin-views-service';
import { ApiExcludeController } from '@nestjs/swagger';
import { GetEventsFilterDto } from 'src/event/dtos/get-events-query.dto';
import { Helper } from 'src/utils/helper';
import { GetChallengesQueryDto } from 'src/challenges/dtos/get-challenges-query.dto';
import { GetCounsellingsFilterDto } from 'src/counselling/dtos/get-counselling-filter.dto';
import { GetCounsellingBookingsFilterDto } from 'src/counselling/dtos/get-counselling-booking-filter.dto';
import { AdminBooksQueryDto } from 'src/books/dtos/admin-books-query.dto';

@Controller('admin-views')
@ApiExcludeController()
export class AdminViewsController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly viewsService: AdminViewsService,
  ) {}

  @Get('login')
  @Render('login')
  getLoginPage() {
    return { error: null, email: '' };
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const { token } = await this.adminAuthService.login({
        email_address: email,
        password,
      });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: false, // change to true when using HTTPS
        maxAge: 1000 * 60 * 60, // 1 hour
      });

      return res.redirect('/admin-views/dashboard');
    } catch (err) {
      return res.status(401).render('login', {
        error: 'Invalid email or password',
        email,
      });
    }
  }

  // 🔐 Protected admin dashboard
  @Get('dashboard')
  @UseGuards(AdminJwtGuard)
  @Render('dashboard')
  getDashboard(@Req() req: any) {
    return { admin: req.user };
  }

  @Get('users')
  @UseGuards(AdminJwtGuard)
  @Render('users')
  async getUsers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('q') q?: string,
  ) {
    const pageNumber = Number(page) || 1;

    const response = await this.viewsService.listUsers({
      page: pageNumber,
      q: q || '',
      pageSize: 20,
    });

    return {
      admin: req.user,
      items: response.items,
      meta: response.meta,
      q: q || '',
      currentPath: req.originalUrl,
    };
  }

  @Get('events')
  @UseGuards(AdminJwtGuard)
  @Render('events')
  async getEvents(@Req() req: any, @Query() query: GetEventsFilterDto) {
    const response = await this.viewsService.listEvents(query);
    return {
      admin: req.user,
      items: response.items,
      meta: response.meta,
      filters: {
        q: query.q || '',
        type: query.type || '',
        upcomingOnly: !!query.upcomingOnly,
      },
      q: '',
      currentPath: req.originalUrl,
      formatDate: Helper.formatDateTime,
    };
  }

  @Get('challenges')
  @UseGuards(AdminJwtGuard)
  @Render('challenges')
  async getChallenges(@Req() req: any, @Query() query: GetChallengesQueryDto) {
    const response = await this.viewsService.listChallengess(query);

    return {
      admin: req.user,
      items: response.items,
      meta: response.meta,
      filters: query,
      currentPath: req.originalUrl,
    };
  }

  @Get('counsellings')
  @UseGuards(AdminJwtGuard)
  @Render('counselling')
  async getCounsellings(
    @Req() req: any,
    @Query() query: GetCounsellingsFilterDto,
  ) {
    const response = await this.viewsService.listCounselling(query);

    return {
      admin: req.user,
      items: response.items,
      meta: response.meta,
      filters: {
        q: query.q || '',
        mode: query.mode || '',
        // minPrice: query.minPrice ?? '',
        // maxPrice: query.maxPrice ?? '',
        isActive: query.isActive ?? '',
        isFeatured: query.isFeatured ?? '',
      },
      q: query.q || '',
      currentPath: req.originalUrl,
    };
  }

  @Get('counselling/:counsellingId/bookings')
  @UseGuards(AdminJwtGuard)
  @Render('bookings')
  async getCounsellingBookings(
    @Req() req: any,
    @Param('counsellingId', ParseIntPipe) counsellingId: number,
    @Query() query: GetCounsellingBookingsFilterDto,
  ) {
    // Expect viewsService to return:
    // { counselling, items, meta }
    const response = await this.viewsService.listCounsellingBookings(
      counsellingId,
      query,
    );

    return {
      admin: req.user,
      counselling: response.counselling, // the counselling offer
      items: response.items, // bookings array
      meta: response.meta, // pagination
      filters: query, // for keeping filter state in the UI
      currentPath: req.originalUrl,
    };
  }

  @Get('books')
  @UseGuards(AdminJwtGuard)
  @Render('books')
  async getBooks(@Req() req: any, @Query() query: AdminBooksQueryDto) {
    const response = await this.viewsService.listBooks(query);

    const data = response; // supports either wrapped or raw
    const page = Number(data?.page ?? query.page ?? 1);
    const pageSize = Number(data?.pageSize ?? query.pageSize ?? 20);

    const items = data?.items ?? [];
    const totalItems = Number(data?.totalItems ?? 0);
    const totalPages = Number(data?.totalPages ?? 1);

    return {
      admin: req.user,

      items,

      // match what your EJS pagination expects (same as your Events page)
      meta: {
        currentPage: page,
        itemsPerPage: pageSize,
        totalItems,
        totalPages,
      },

      // correct filters for Books page
      filters: {
        q: query.q || '',
        ownershipType: query.ownershipType || '',
        accessType: query.accessType || '',
        publishedOnly: query.publishedOnly ? true : false,
        orderBy: query.orderBy || 'createdAt',
        orderDir: query.orderDir || 'DESC',
      },

      q: query.q || '',
      currentPath: req.originalUrl,
    };
  }

  @Get('logout')
  @UseGuards(AdminJwtGuard)
  logout(@Res() res: Response) {
    res.clearCookie('admin_token');
    return res.redirect('/admin-views/login');
  }
}
