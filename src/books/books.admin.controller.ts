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
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiExcludeController,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { AdminBooksService } from './books.admin.service';
import { AdminBooksQueryDto } from './dtos/admin-books-query.dto';

type ApiOk<T> = {
  success: true;
  message: string;
  data: T;
};

@ApiTags('Admin Books')
@Controller('admin/books')
@ApiExcludeController()
export class AdminBooksController {
  constructor(private readonly adminBooksService: AdminBooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a book (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Book created successfully' })
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
  ): Promise<ApiOk<any>> {
    const book = await this.adminBooksService.createBook(dto, {
      coverImage: files?.coverImage?.[0],
      pdfFile: files?.pdfFile?.[0],
    });

    return {
      success: true,
      message: 'Book created successfully',
      data: book,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'pdfFile', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
    @UploadedFiles()
    files: {
      coverImage?: Express.Multer.File[];
      pdfFile?: Express.Multer.File[];
    },
  ): Promise<ApiOk<any>> {
    const book = await this.adminBooksService.updateBook(id, dto, {
      coverImage: files?.coverImage?.[0],
      pdfFile: files?.pdfFile?.[0],
    });

    return {
      success: true,
      message: 'Book updated successfully',
      data: book,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List books (Admin)' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search by title/author/slug',
    example: 'marriage',
  })
  @ApiQuery({
    name: 'publishedOnly',
    required: false,
    description: 'Filter to only published books',
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'Books fetched successfully' })
  async list(
    @Query('q') q?: string,
    // @Query('publishedOnly') publishedOnly?: string,
  ): Promise<ApiOk<any>> {
    const normalizedQ = (q ?? '').trim();
    // const published =
    //   publishedOnly === undefined ? undefined : publishedOnly === 'true';

    const books = await this.adminBooksService.listBooksAdmin({
      q: normalizedQ.length ? normalizedQ : undefined, // ✅ optional now
      // publishedOnly: published,
    });

    return {
      success: true,
      message: 'Books fetched successfully',
      data: books,
    };
  }

  @Get('paginated')
  @ApiOperation({
    summary: 'Admin: paginated list of books (with filters + stats)',
  })
  async listPaginated(@Query() query: AdminBooksQueryDto) {
    const data = await this.adminBooksService.listBooksAdminPaginated(query);

    return {
      success: true,
      message: 'Books fetched successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single book (Admin)' })
  @ApiResponse({ status: 200, description: 'Book fetched successfully' })
  async get(@Param('id', ParseIntPipe) id: number): Promise<ApiOk<any>> {
    const book = await this.adminBooksService.getBookAdmin(id);

    return {
      success: true,
      message: 'Book fetched successfully',
      data: book,
    };
  }

  @Delete('/archive/:id')
  @ApiOperation({ summary: 'Get a single book (Admin)' })
  @ApiResponse({ status: 200, description: 'Book fetched successfully' })
  async archive(@Param('id', ParseIntPipe) id: number): Promise<ApiOk<any>> {
    const book = await this.adminBooksService.archiveBook(id);

    return {
      success: true,
      message: 'Book fetched successfully',
      data: book,
    };
  }
}
