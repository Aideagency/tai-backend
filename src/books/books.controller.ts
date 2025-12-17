// src/modules/books/books.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { BooksQueryDto } from './dtos/books-query.dto';

@ApiTags('Books')
@ApiBearerAuth()
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({
    summary: 'List books (includes isDownloaded for current user)',
  })
  async list(@Query() query: BooksQueryDto, @Req() req: any) {
    const userId = req.user?.id; // adapt to your auth
    return this.booksService.listBooks(query, userId);
  }

  @Get('me/downloads')
  @ApiOperation({ summary: 'List books downloaded by current user' })
  async myDownloads(@Req() req: any) {
    const userId = req.user?.id;
    return this.booksService.myDownloads(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single book (with owned/download flag)' })
  async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.booksService.getBook(id, userId);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Record download and return pdfUrl if allowed' })
  async download(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.booksService.downloadBook(id, userId);
  }
}
