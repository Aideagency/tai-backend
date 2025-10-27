import { Injectable, HttpException } from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
import { ContentType } from './dto/get-book-chapter.dto'; // enum: 'html' | 'json' | 'text'

@Injectable()
export class BibleService {
  private readonly apiKey = process.env.BIBLE_KEY;
  private readonly bibleURL = 'https://api.scripture.api.bible/v1';
  readonly bibleId = process.env.BIBLE_ID;

  constructor(private httpService: CommonHttpService) {}

  async getBooks({
    bibleId = this.bibleId,
    includeChapters = false,
    includeSections = false,
  }: {
    bibleId?: string;
    includeChapters?: boolean;
    includeSections?: boolean;
  }) {
    try {
      const url = `${this.bibleURL}/bibles/${bibleId}/books?include-chapters=${includeChapters}&include-chapters-and-sections=${includeSections}`;
      const res = await this.httpService.get(url, {
        'api-key': this.apiKey,
        accept: 'application/json',
      });
      return res?.data ?? [];
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        error?.response?.data ?? error?.message ?? 'Failed to fetch books',
        error?.response?.status ?? 500,
      );
    }
  }

  async getBookChapters({
    bibleId = this.bibleId,
    bookId,
  }: {
    bibleId?: string;
    bookId: string;
  }) {
    try {
      const url = `${this.bibleURL}/bibles/${bibleId}/books/${encodeURIComponent(bookId)}/chapters`;
      const res = await this.httpService.get(url, {
        'api-key': this.apiKey,
        accept: 'application/json',
      });
      return res?.data ?? {};
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data ?? error?.message ?? 'Failed to fetch chapters',
        error?.response?.status ?? 500,
      );
    }
  }

  async getChapterDetails({
    bibleId = this.bibleId,
    chapterId,
    contentType,
    includeNotes,
    includeTitles,
    includeChapterNumbers,
    includeVerseNumbers,
    includeVerseSpans,
  }: {
    bibleId?: string;
    chapterId: string;
    contentType: ContentType; // 'html' | 'json' | 'text'
    includeNotes: boolean;
    includeTitles: boolean;
    includeChapterNumbers: boolean;
    includeVerseNumbers: boolean;
    includeVerseSpans: boolean;
  }) {
    try {
      const url =
        `${this.bibleURL}/bibles/${bibleId}/chapters/${encodeURIComponent(chapterId)}` +
        `?content-type=${contentType}` +
        `&include-notes=${includeNotes}` +
        `&include-titles=${includeTitles}` +
        `&include-chapter-numbers=${includeChapterNumbers}` +
        `&include-verse-numbers=${includeVerseNumbers}` +
        `&include-verse-spans=${includeVerseSpans}`;

      const res = await this.httpService.get(url, {
        'api-key': this.apiKey,
        accept: 'application/json',
      });
      return res?.data ?? {};
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data ??
          error?.message ??
          'Failed to fetch chapter details',
        error?.response?.status ?? 500,
      );
    }
  }

  async getChapterVerses({
    bibleId = this.bibleId,
    chapterId,
  }: {
    bibleId?: string;
    chapterId: string;
  }) {
    try {
      const url = `${this.bibleURL}/bibles/${bibleId}/chapters/${encodeURIComponent(chapterId)}/verses`;

      const res = await this.httpService.get(url, {
        'api-key': this.apiKey,
        accept: 'application/json',
      });
      return res?.data ?? {};
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data ??
          error?.message ??
          'Failed to fetch chapter details',
        error?.response?.status ?? 500,
      );
    }
  }

  async searchBible({
    bibleId = this.bibleId,
    query,
    limit = 10,
    offset = 0,
    sort = 'relevance',
    fuzziness = 'AUTO',
    range,
  }: {
    bibleId?: string;
    query: string;
    limit?: number;
    offset?: number;
    sort?: 'relevance' | 'canonical';
    fuzziness?: 'AUTO' | 0 | 1 | 2;
    range?: string; // e.g., 'gen.1.1-gen.3.5'
  }) {
    try {
      const params = new URLSearchParams({
        query,
        limit: String(limit),
        offset: String(offset),
        sort,
        fuzziness: String(fuzziness),
      });
      if (range) params.set('range', range);

      const url = `${this.bibleURL}/bibles/${bibleId}/search?${params.toString()}`;

      const res = await this.httpService.get(url, {
        'api-key': this.apiKey,
        accept: 'application/json',
      });
      return res?.data ?? {};
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data ?? error?.message ?? 'Failed to search bible',
        error?.response?.status ?? 500,
      );
    }
  }
}
