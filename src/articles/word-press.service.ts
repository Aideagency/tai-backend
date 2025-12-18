import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ArticlesQueryDto } from './dtos/article-query.dto';

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').trim();
}

function mapPost(post: any) {
  const featuredUrl =
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;

  return {
    id: post.id,
    slug: post.slug,
    link: post.link,
    date: post.date,
    titleHtml: post.title?.rendered ?? '',
    titleText: stripHtml(post.title?.rendered ?? ''),
    excerptHtml: post.excerpt?.rendered ?? '',
    excerptText: stripHtml(post.excerpt?.rendered ?? ''),
    featuredImage: featuredUrl,
  };
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

@Injectable()
export class WordpressService {
  private readonly baseUrl = 'https://theagudahinstitute.com/wp-json/wp/v2';

  constructor(private readonly http: HttpService) {}

  async fetchPosts(
    query: ArticlesQueryDto = {},
  ): Promise<PaginatedResponse<ReturnType<typeof mapPost>>> {
    const url = `${this.baseUrl}/posts`;

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;

    const params: Record<string, any> = {
      page,
      per_page: perPage,
      _embed: true,
    };

    if (query.search) params.search = query.search;
    if (query.order) params.order = query.order;
    if (query.orderBy) params.orderby = query.orderBy;

    const res = await firstValueFrom(this.http.get(url, { params }));

    // WordPress pagination headers (string values)
    const total = Number(res.headers?.['x-wp-total'] ?? 0);
    const totalPages = Number(res.headers?.['x-wp-totalpages'] ?? 0);

    const data = (res.data ?? []).map(mapPost);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: totalPages ? page < totalPages : data.length === perPage,
        hasPrev: page > 1,
      },
    };
  }

  async fetchPostBySlug(slug: string) {
    const url = `${this.baseUrl}/posts`;

    const res = await firstValueFrom(
      this.http.get(url, { params: { slug, _embed: true } }),
    );

    const post = res.data?.[0];
    return post ? mapPost(post) : null;
  }

  async fetchPostsOrSingle(query: ArticlesQueryDto = {}) {
    return this.fetchPosts(query);
  }
}
