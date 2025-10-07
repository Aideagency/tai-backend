import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PrayerWallRepository,
  PrayerSearchParams,
  PrayerCommentSearchParams,
} from 'src/repository/prayer/prayer-wall.repository';
import { CreatePrayerDto } from './dto/create-prayer.dto';
import { UpdatePrayerDto } from './dto/update-prayer.dto';
import { AmenDto } from './dto/amen.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PrayerWallEntity } from 'src/database/entities/prayer-wall.entity';

@Injectable()
export class PrayerWallService {
  constructor(private readonly prayerRepo: PrayerWallRepository) {}

  // --- Prayers ---
  async createPrayer(dto: CreatePrayerDto, userId?: number | null) {
    return this.prayerRepo.createPrayer({
      body: dto.body,
      title: dto.title ?? null,
      userId: userId ?? null,
    });
  }

  async listPrayers(params: PrayerSearchParams) {
    return this.prayerRepo.searchPaginated(params);
  }

  async getPrayer(id: number) {
    const item = await this.prayerRepo.getPrayerWithUser(id);
    if (!item) throw new NotFoundException('Prayer not found');
    return item;
  }

  async updatePrayer(id: number, dto: UpdatePrayerDto) {
    const entity = await this.prayerRepo.findOne({ id });
    if (!entity) throw new NotFoundException('Prayer not found');

    // Patch editable fields
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.body !== undefined) entity.body = dto.body;
    if (dto.isVisible !== undefined) entity.isVisible = dto.isVisible;

    // Keep lifecycle logic consistent
    if (dto.isAnswered !== undefined) {
      entity.isAnswered = dto.isAnswered;
      entity.answeredAt = dto.isAnswered ? new Date() : null;
    }

    entity.lastActivityAt = new Date();
    return this.prayerRepo.save(entity as PrayerWallEntity);
  }

  async deletePrayer(id: number) {
    const ok = await this.prayerRepo.softDelete(id);
    if (!ok) throw new NotFoundException('Prayer not found or already deleted');
    return { success: true };
  }

  async setVisibility(id: number, isVisible: boolean) {
    await this.prayerRepo.setVisibility(id, isVisible);
    return this.getPrayer(id);
  }

  async markAnswered(id: number, isAnswered: boolean) {
    await this.prayerRepo.markAnswered(id, isAnswered);
    return this.getPrayer(id);
  }

  async incrementShare(id: number) {
    await this.prayerRepo.incrementShareCount(id);
    return this.getPrayer(id);
  }

  async report(id: number) {
    await this.prayerRepo.report(id);
    return this.getPrayer(id);
  }

  async getLatest() {
    const item = await this.prayerRepo.getLatestPrayer();
    if (!item) throw new NotFoundException('No prayers yet');
    return item;
  }

  async getActive() {
    const item = await this.prayerRepo.getActivePrayer();
    if (!item) throw new NotFoundException('No prayers yet');
    return item;
  }

  async getEngagementCounts(id: number, currentUserId?: number) {
    return this.prayerRepo.getEngagementCounts(id, currentUserId);
  }

  // --- Amens ---
  async amen(prayerId: number, userId: number, dto?: AmenDto) {
    await this.prayerRepo.addAmen(prayerId, userId, dto?.reaction);
    return this.getEngagementCounts(prayerId, userId);
  }

  async unAmen(prayerId: number, userId: number) {
    await this.prayerRepo.removeAmen(prayerId, userId);
    return this.getEngagementCounts(prayerId, userId);
  }

  // --- Comments ---
  async listComments(params: PrayerCommentSearchParams) {
    return this.prayerRepo.listCommentsPaginated(params);
  }

  async addComment(prayerId: number, userId: number, dto: CreateCommentDto) {
    const saved = await this.prayerRepo.addComment(
      prayerId,
      userId,
      dto.comment,
      dto.parentCommentId,
    );
    return saved;
  }

  async deleteComment(
    prayerId: number,
    commentId: number,
    where?: { userId?: number; isAdmin?: boolean },
  ) {
    const ok = await this.prayerRepo.deleteComment(commentId, prayerId, where);
    if (!ok) throw new NotFoundException('Comment not found or no permission');
    return { success: true };
  }
}
