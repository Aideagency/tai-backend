import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  // Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  // ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BibleService } from './bible.service';

// DTOs
// import { ListBooksDto } from './dto/get-books.dto';
// import { GetBookChapterDto, ContentType } from './dto/get-book-chapter.dto';
// import { SearchBibleQueryDto } from './dto/search-bible.dto';
import { JwtGuards } from 'src/auth/jwt.guards';

@ApiTags('Bible')
@ApiBearerAuth()
@UseGuards(JwtGuards)
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  // @Get('get-books')
  // @ApiOperation({ summary: 'List all books in KJV bible' })
  // async getBooks(@Query() query: ListBooksDto) {
  //   const params = {
  //     bibleId: this.bibleService.bibleId,
  //     includeChapters: query.includeChapters ?? false,
  //     includeSections: query.includeSections ?? false,
  //   };
  //   const data = await this.bibleService.getBooks(params);
  //   return { status: 200, data, message: 'Books fetched successfully' };
  // }

  @Get('get-new-books')
  @ApiOperation({ summary: 'List all books in KJV bible' })
  async getNewBooks() {
    const data = await this.bibleService.getNewBooks();
    return { status: 200, data, message: 'Books fetched successfully' };
  }

  @Get('get-new-book-chapters/:bookId/:chapterId')
  @ApiOperation({ summary: 'List all the verses in a chapter of the book' })
  async getNewBookChatperInformation(
    @Param('chapterId') chapterNumber: number,
    @Param('bookId') bookId: string,
  ) {
    const data = await this.bibleService.getBookChapterInformation({
      chapter: chapterNumber,
      bookId,
    });
    return { status: 200, data, message: 'Chapters fetched successfully' };
  }

  // @Get('get-book-chapters/:bookId')
  // @ApiOperation({ summary: 'List all chapters in a book (KJV)' })
  // async getBookChapters(
  //   @Param('bookId') bookId: string,
  //   // @Query('bibleId') bibleId?: string,
  // ) {
  //   const data = await this.bibleService.getBookChapters({
  //     bibleId: this.bibleService.bibleId,
  //     bookId,
  //   });
  //   return { status: 200, data, message: 'Chapters fetched successfully' };
  // }

  // @Get('get-book-chapter-details')
  // @ApiOperation({ summary: 'Get chapter details in a book (KJV)' })
  // async getBookChapterInformation(@Query() query: GetBookChapterDto) {
  //   const params = {
  //     bibleId: this.bibleService.bibleId,
  //     chapterId: query.chapterId,
  //     contentType: (query.contentType ?? ContentType.JSON) as ContentType,
  //     includeNotes: query.includeNotes ?? false,
  //     includeTitles: query.includeTitles ?? true,
  //     includeChapterNumbers: query.includeChapterNumbers ?? false,
  //     includeVerseNumbers: query.includeVerseNumbers ?? true,
  //     includeVerseSpans: query.includeVerseSpans ?? true, // fixed: was using includeVerseNumbers
  //   };
  //   const data = await this.bibleService.getChapterDetails(params);
  //   return { status: 200, data, message: 'Chapter fetched successfully' };
  // }

  // @Get('get-chapter-verses/:chapterId')
  // @ApiOperation({ summary: 'Get chapter verses in a book (KJV)' })
  // async getChapterVerses(@Param('chapterId') chapterId: string) {
  //   const params = {
  //     bibleId: this.bibleService.bibleId,
  //     chapterId,
  //   };
  //   const data = await this.bibleService.getChapterVerses(params);
  //   return { status: 200, data, message: 'Chapter fetched successfully' };
  // }

  // @Get('search')
  // @ApiOperation({ summary: 'Search verses/chapters in a Bible' })
  // @ApiQuery({
  //   name: 'keyword',
  //   required: false,
  //   description: 'Search term',
  //   example: 'paul',
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   required: false,
  //   description: 'Max results',
  //   example: 10,
  // })
  // @ApiQuery({
  //   name: 'offset',
  //   required: false,
  //   description: 'Pagination offset',
  //   example: 1,
  // })
  // @ApiQuery({
  //   name: 'sort',
  //   required: false,
  //   description: 'Sort order',
  //   example: 'relevance',
  //   enum: ['relevance', 'canonical', 'reverse-canonical'],
  // })
  // @ApiQuery({
  //   name: 'fuzziness',
  //   required: false,
  //   description: 'AUTO or 0–2',
  //   examples: {
  //     auto: { value: 'AUTO' },
  //     one: { value: 1 },
  //     two: { value: 2 },
  //     three: { value: 3 },
  //   },
  // })
  // @ApiQuery({
  //   name: 'range',
  //   required: false,
  //   description: 'Search range',
  //   example: 'gen.1.1-gen.4.5',
  // })
  // async searchBible(
  //   @Query() query: SearchBibleQueryDto & { bibleId?: string; range?: string },
  // ) {
  //   const params = {
  //     bibleId: this.bibleService.bibleId,
  //     query: query.keyword ?? '',
  //     limit: query.limit ?? 10,
  //     offset: query.offset ?? 0,
  //     sort: (query.sort as 'relevance' | 'canonical') ?? 'relevance',
  //     fuzziness: (query.fuzziness as 'AUTO' | 0 | 1 | 2) ?? 'AUTO',
  //     range: (query as any).range, // optional passthrough
  //   };
  //   const data = await this.bibleService.searchBible(params);
  //   return { status: 200, data, message: 'Search completed successfully' };
  // }
}
