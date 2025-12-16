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

@Injectable()
export class WordpressService {
  private readonly baseUrl = 'https://theagudahinstitute.com/wp-json/wp/v2';

  constructor(private readonly http: HttpService) {}

  /**
   * Fetch posts using the same options as the ArticlesQueryDto.
   * - maps perPage -> per_page
   * - orderBy -> orderby (WP expects "orderby")
   * - always uses _embed for featured image
   */
  async fetchPosts(query: ArticlesQueryDto = {}) {
    const url = `${this.baseUrl}/posts`;

    const params: Record<string, any> = {
      page: query.page ?? 1,
      per_page: query.perPage ?? 10,
      _embed: true,
    };

    // Only include optional params when present
    if (query.search) params.search = query.search;
    if (query.order) params.order = query.order; // 'asc' | 'desc'
    if (query.orderBy) params.orderby = query.orderBy; // 'date' | 'title' | 'slug'

    const res = await firstValueFrom(this.http.get(url, { params }));

    return (res.data ?? []).map(mapPost);
  }

  /**
   * Fetch a single post by slug (still mapped)
   */
  async fetchPostBySlug(slug: string) {
    const url = `${this.baseUrl}/posts`;

    const res = await firstValueFrom(
      this.http.get(url, {
        params: { slug, _embed: true },
      }),
    );

    const post = res.data?.[0];
    return post ? mapPost(post) : null;
  }

  /**
   * Optional convenience method:
   * If slug exists, return single post; otherwise return list.
   */
  async fetchPostsOrSingle(query: ArticlesQueryDto = {}) {
    if (query.slug) return this.fetchPostBySlug(query.slug);
    return this.fetchPosts(query);
  }
}
