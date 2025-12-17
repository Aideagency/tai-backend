// src/modules/books/admin-books.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { AdminBooksService } from './books.admin.service';

@ApiTags('Admin Books')
@Controller('admin/books')
export class AdminBooksController {
  constructor(private readonly adminBooksService: AdminBooksService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'pdfFile', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateBookDto,
    @UploadedFiles()
    files: {
      coverImage?: Express.Multer.File[];
      pdfFile?: Express.Multer.File[];
    },
  ) {
    return this.adminBooksService.createBook(dto, {
      coverImage: files.coverImage?.[0],
      pdfFile: files.pdfFile?.[0],
    });
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'pdfFile', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @UploadedFiles()
    files: {
      coverImage?: Express.Multer.File[];
      pdfFile?: Express.Multer.File[];
    },
  ) {
    return this.adminBooksService.updateBook(+id, dto, {
      coverImage: files.coverImage?.[0],
      pdfFile: files.pdfFile?.[0],
    });
  }

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('publishedOnly') publishedOnly?: string,
  ) {
    return this.adminBooksService.listBooksAdmin({
      q,
      publishedOnly: publishedOnly === 'true',
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.adminBooksService.getBookAdmin(+id, true);
  }
}
