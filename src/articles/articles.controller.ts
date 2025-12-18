import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WordpressService } from './word-press.service';
import { ArticlesQueryDto } from './dtos/article-query.dto';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Articles')
@UseGuards(JwtGuards)
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly wordPressService: WordpressService) {}

  @Get()
  async getPosts(@Query() query: ArticlesQueryDto) {
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
