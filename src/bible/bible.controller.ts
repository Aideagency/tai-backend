import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BibleService } from './bible.service';

// DTOs
import { ListBooksDto } from './dto/get-books.dto';
import { GetBookChapterDto, ContentType } from './dto/get-book-chapter.dto';
import { SearchBibleQueryDto } from './dto/search-bible.dto';
import { JwtGuards } from 'src/auth/jwt.guards';

@ApiTags('Bible')
@UseGuards(JwtGuards)
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('get-books')
  @ApiOperation({ summary: 'List all books in KJV bible' })
  async getBooks(@Req() _req: any, @Query() query: ListBooksDto) {
    const params = {
      bibleId: 'de4e12af7f28f599-01',
      includeChapters: query.includeChapters ?? false,
      includeSections: query.includeSections ?? false,
    };
    const data = await this.bibleService.getBooks(params);
    return { status: 200, data, message: 'Books fetched successfully' };
  }

  @Get('get-book-chapters/:bookId')
  @ApiOperation({ summary: 'List all chapters in a book (KJV)' })
  async getBookChapters(
    @Param('bookId') bookId: string,
    // @Query('bibleId') bibleId?: string,
  ) {
    const data = await this.bibleService.getBookChapters({
      bibleId: 'de4e12af7f28f599-01',
      bookId,
    });
    return { status: 200, data, message: 'Chapters fetched successfully' };
  }

  @Get('get-book-chapter-details')
  @ApiOperation({ summary: 'Get chapter details in a book (KJV)' })
  async getBookChapterInformation(@Query() query: GetBookChapterDto) {
    const params = {
      bibleId: 'de4e12af7f28f599-01',
      chapterId: query.chapterId,
      contentType: (query.contentType ?? ContentType.JSON) as ContentType,
      includeNotes: query.includeNotes ?? false,
      includeTitles: query.includeTitles ?? true,
      includeChapterNumbers: query.includeChapterNumbers ?? false,
      includeVerseNumbers: query.includeVerseNumbers ?? true,
      includeVerseSpans: query.includeVerseSpans ?? true, // fixed: was using includeVerseNumbers
    };
    const data = await this.bibleService.getChapterDetails(params);
    return { status: 200, data, message: 'Chapter fetched successfully' };
  }

  @Get('get-chapter-verses/:chapterId')
  @ApiOperation({ summary: 'Get chapter verses in a book (KJV)' })
  async getChapterVerses(@Param('chapterId') chapterId: string) {
    const params = {
      bibleId: 'de4e12af7f28f599-01',
      chapterId,
    };
    const data = await this.bibleService.getChapterVerses(params);
    return { status: 200, data, message: 'Chapter fetched successfully' };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search verses/chapters in a Bible' })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: 'Search term',
    example: 'paul',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Pagination offset',
    example: 10,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order',
    example: 'relevance',
    enum: ['relevance', 'canonical', 'reverse-canonical'],
  })
  @ApiQuery({
    name: 'fuzziness',
    required: false,
    description: 'AUTO or 0–2',
    examples: {
      auto: { value: 'AUTO' },
      one: { value: 1 },
      two: { value: 2 },
      three: { value: 3 },
    },
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Search range',
    example: 'gen.1.1-gen.3.5',
  })
  async searchBible(
    @Query() query: SearchBibleQueryDto & { bibleId?: string; range?: string },
  ) {
    const params = {
      bibleId: 'de4e12af7f28f599-01',
      query: query.keyword ?? '',
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
      sort: (query.sort as 'relevance' | 'canonical') ?? 'relevance',
      fuzziness: (query.fuzziness as 'AUTO' | 0 | 1 | 2) ?? 'AUTO',
      range: (query as any).range, // optional passthrough
    };
    const data = await this.bibleService.searchBible(params);
    return { status: 200, data, message: 'Search completed successfully' };
  }
}
