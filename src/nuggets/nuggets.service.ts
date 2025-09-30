import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NuggetEntity, NuggetType } from 'src/database/entities/nugget.entity';
import { CreateNuggetDto } from './dtos/create-nugget.dto';
import { NuggetRepository } from 'src/repository/nuggets/nugget.repository';

@Injectable()
export class NuggetService {
  constructor(private readonly nuggets: NuggetRepository) {}

  // ---------- Create ----------
  async createNugget(
    dto: CreateNuggetDto,
    adminId?: number | null,
  ): Promise<NuggetEntity | undefined> {
    return this.nuggets.createNugget({
      body: dto.body,
      nuggetType: dto.nuggetType,
      publishAt: dto.publishAt ?? null,
      adminId: adminId ?? null,
      title: dto.title ?? null,
    });
  }

  // ---------- Daily (or latest fallback) ----------
  async getDailyNugget(
    type?: NuggetType,
    currentUserId?: number,
  ): Promise<{
    nugget: NuggetEntity | null;
    // engagement: {
    //   likesCount: number;
    //   commentsCount: number;
    //   likedByMe: boolean;
    // };
  }> {
    let nugget = await this.nuggets.getTodayNugget(type);
    console.log(nugget);
    if (!nugget) nugget = await this.nuggets.getLatestNugget(type);
    if (!nugget) {
      return {
        nugget: null,
        // engagement: { likesCount: 0, commentsCount: 0, likedByMe: false },
      };
    }

    // const engagement = await this.nuggets.getEngagementCounts(
    //   nugget.id,
    //   currentUserId,
    // );

    return { nugget };
  }

  // ---------- Details / info with engagement ----------
  async getNuggetInfo(nuggetId: number, currentUserId?: number) {
    const nugget = await this.nuggets.getNuggetWithAdmin(nuggetId);
    if (!nugget) throw new NotFoundException('Nugget not found');

    const engagement = await this.nuggets.getEngagementCounts(
      nugget.id,
      currentUserId,
    );

    return { nugget, engagement };
  }

  // ---------- Likes ----------
  async likeNugget(nuggetId: number, userId: number) {
    const exists = await this.nuggets.likeExists(nuggetId, userId);
    if (exists) throw new BadRequestException('Already liked');

    // ensure nugget exists
    const n = await this.nuggets.findOne({ id: nuggetId });
    if (!n) throw new NotFoundException('Nugget not found');

    await this.nuggets.addLike(nuggetId, userId);
    return { success: true };
  }

  async unlikeNugget(nuggetId: number, userId: number) {
    // no error if not liked — idempotent
    await this.nuggets.removeLike(nuggetId, userId);
    return { success: true };
  }

  // ---------- Comments ----------
  async addComment(nuggetId: number, userId: number, comment: string) {
    // ensure nugget exists
    const n = await this.nuggets.findOne({ id: nuggetId });
    if (!n) throw new NotFoundException('Nugget not found');

    const saved = await this.nuggets.addComment(nuggetId, userId, comment);
    return { success: true, comment: saved };
  }

  async deleteComment(
    commentId: number,
    options: { userId?: number; isAdmin?: boolean },
  ) {
    const ok = await this.nuggets.deleteComment(commentId, options);
    if (!ok) throw new NotFoundException('Comment not found');
    return { success: true };
  }

  async listComments(
    nuggetId: number,
    page = 1,
    pageSize = 20,
    orderBy: 'createdAt' | 'id' = 'id',
    orderDir: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.nuggets.listCommentsPaginated({
      nuggetId,
      page,
      pageSize,
      orderBy,
      orderDir,
    });
  }

  // ---------- Share ----------
  /**
   * Increments a share counter (if you added one) and returns a
   * preformatted share text ensuring attribution.
   */
  async shareNugget(nuggetId: number) {
    const nugget = await this.nuggets.findOne({ id: nuggetId });
    if (!nugget) throw new NotFoundException('Nugget not found');

    // Increment counter (no-op if your entity lacks shareCount)
    await this.nuggets.incrementShareCount(nuggetId).catch(() => void 0);

    const shareText = `${nugget.body}\n\n— via Agudah App`;
    return { success: true, shareText };
  }
}
