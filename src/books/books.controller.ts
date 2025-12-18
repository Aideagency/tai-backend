// src/modules/books/books.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { BooksQueryDto } from './dtos/books-query.dto';
import { JwtGuards } from 'src/auth/jwt.guards';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

@ApiTags('Books')
@UseGuards(JwtGuards)
@ApiBearerAuth()
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({
    summary: 'List books (includes isDownloaded for current user)',
  })
  async list(
    @Query() query: BooksQueryDto,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const userId = req.user?.id; // adapt to your auth
    const data = await this.booksService.listBooks(query, userId);

    return {
      success: true,
      message: 'Books fetched successfully',
      data,
    };
  }

  @Get('me/downloads')
  @ApiOperation({ summary: 'List books downloaded by current user' })
  async myDownloads(@Req() req: any): Promise<ApiResponse<any>> {
    const userId = req.user?.id;
    const data = await this.booksService.myDownloads(userId);

    return {
      success: true,
      message: 'Downloaded books fetched successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single book (with owned/download flag)' })
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const userId = req.user?.id;
    const data = await this.booksService.getBook(id, userId);

    return {
      success: true,
      message: 'Book fetched successfully',
      data,
    };
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Record download and return pdfUrl if allowed' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const data = await this.booksService.downloadBook(id, req);

    return {
      success: true,
      message: 'Download recorded successfully',
      data,
    };
  }

  @Get('by-ref/:ref')
  @ApiOperation({ summary: 'Get a single book details by ref' })
  async getOneByRef(
    @Param('ref') ref: string,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const data = await this.booksService.getBookByRef(ref);

    return {
      success: true,
      message: 'Book fetched successfully',
      data,
    };
  }
}
