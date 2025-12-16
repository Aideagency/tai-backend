import { Controller, Get, Param, Query } from '@nestjs/common';
import { WordpressService } from './word-press.service';
import { ArticlesQueryDto } from './dtos/article-query.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly wordPressService: WordpressService) {}

  @Get()
  async getPosts(@Query() query: ArticlesQueryDto) {
    if (query.slug) {
      return this.wordPressService.fetchPostBySlug(query.slug);
    }

    return this.wordPressService.fetchPosts({
      page: query.page,
      perPage: query.perPage,
      search: query.search,
      order: query.order,
      orderBy: query.orderBy,
    });
  }

  @Get(':slug')
  async getPost(@Param('slug') slug: string) {
    return this.wordPressService.fetchPostBySlug(slug);
  }
}
