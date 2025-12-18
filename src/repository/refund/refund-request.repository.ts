import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  RefundRequestEntity,
  RefundStatus,
  RefundType,
} from 'src/database/entities/refund-request.entity';
import { PaidFor } from 'src/database/entities/transaction.entity';

export interface RefundRequestSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  userId?: number; // requestedBy
  status?: RefundStatus | RefundStatus[];
  type?: RefundType | RefundType[];
  paidFor?: PaidFor | PaidFor[];
  createdFrom?: Date;
  createdTo?: Date;
  q?: string; // search by event title, counselling title or user email/name

  // sorting
  orderBy?: 'createdAt' | 'id' | 'approvedAt' | 'processedAt';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class RefundRequestRepository extends BaseRepository<
  RefundRequestEntity,
  Repository<RefundRequestEntity>
> {
  protected logger = new Logger(RefundRequestRepository.name);

  constructor(
    @InjectRepository(RefundRequestEntity)
    repository: Repository<RefundRequestEntity>,
  ) {
    super(repository);
  }

  /** ---------- Base QB with common filters & left joins ---------- */
  private baseQB(
    params: RefundRequestSearchParams = {},
  ): SelectQueryBuilder<RefundRequestEntity> {
    const qb = this.query('r')
      .leftJoinAndSelect('r.requestedBy', 'u')
      .leftJoinAndSelect('r.registration', 'reg')
      .leftJoinAndSelect('reg.event', 'ev')
      .leftJoinAndSelect('r.counsellingBooking', 'cb')
      .leftJoinAndSelect('cb.counselling', 'c')
      .leftJoinAndSelect('r.transaction', 't');

    // Filter: user (requestedBy)
    if (params.userId) {
      qb.andWhere('u.id = :uid', { uid: params.userId });
    }

    // Filter: status (single or list)
    if (params.status) {
      const list = Array.isArray(params.status)
        ? params.status
        : [params.status];
      if (list.length) qb.andWhere('r.status IN (:...st)', { st: list });
    }

    // Filter: type (FULL / PARTIAL / OTHER)
    if (params.type) {
      const list = Array.isArray(params.type) ? params.type : [params.type];
      if (list.length) qb.andWhere('r.type IN (:...tp)', { tp: list });
    }

    // Filter: paidFor (EVENT / COUNSELLING / COURSE)
    if (params.paidFor) {
      const list = Array.isArray(params.paidFor)
        ? params.paidFor
        : [params.paidFor];
      if (list.length) qb.andWhere('r.paidFor IN (:...pf)', { pf: list });
    }

    // Filter: date range (createdAt)
    if (params.createdFrom) {
      qb.andWhere('r.createdAt >= :cf', { cf: params.createdFrom });
    }
    if (params.createdTo) {
      qb.andWhere('r.createdAt <= :ct', { ct: params.createdTo });
    }

    // Simple text search against:
    // - event title
    // - counselling title
    // - user email / first / last name
    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(ev.title) ILIKE :q ' +
          'OR LOWER(c.title) ILIKE :q ' +
          'OR LOWER(u.email_address) ILIKE :q ' +
          'OR LOWER(u.first_name) ILIKE :q ' +
          'OR LOWER(u.last_name) ILIKE :q)',
        { q },
      );
    }

    const orderBy = params.orderBy || 'createdAt';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`r.${orderBy}`, orderDir);

    return qb;
  }

  /** ---------- Generic paginated search (admin / dashboard) ---------- */
  async searchPaginated(params: RefundRequestSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    // Uses your BaseRepository.paginate helper, same style as CounsellingBookingRepository
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  /** ---------- Paginated refunds per user (user dashboard) ---------- */
  async getUserRefundRequestsPaginated(
    userId: number,
    page = 1,
    pageSize = 20,
  ) {
    return this.searchPaginated({
      userId,
      page,
      pageSize,
    });
  }

  /** ---------- Paginated refunds for a period (e.g. admin view, reports) ---------- */
  async getRefundRequestsByDateRangePaginated(
    createdFrom: Date,
    createdTo: Date,
    page = 1,
    pageSize = 20,
    extraFilters?: Omit<
      RefundRequestSearchParams,
      'page' | 'pageSize' | 'createdFrom' | 'createdTo'
    >,
  ) {
    return this.searchPaginated({
      ...extraFilters,
      createdFrom,
      createdTo,
      page,
      pageSize,
    });
  }

  /** ---------- Basic CRUD helpers (optional but handy) ---------- */

  // Create a new refund request
  async createRefundRequest(
    data: Partial<RefundRequestEntity>,
  ): Promise<RefundRequestEntity> {
    const refund = this.repository.create(data);
    try {
      return await this.repository.save(refund);
    } catch (err) {
      this.logger.error('Error creating refund request: ', err.stack);
      throw err;
    }
  }

  // Update refund (e.g. status, approvedAmount, approvedBy, processedAt)
  async updateRefundRequest(
    id: number,
    updateData: Partial<RefundRequestEntity>,
  ) {
    try {
      return await this.repository.update({ id }, updateData);
    } catch (err) {
      this.logger.error('Error updating refund request: ', err.stack);
      throw err;
    }
  }

  // Get single refund request with full relations
  async getRefundRequestById(id: number): Promise<RefundRequestEntity | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: [
          'requestedBy',
          'registration',
          'registration.event',
          'counsellingBooking',
          'counsellingBooking.counselling',
          'transaction',
        ],
      });
    } catch (err) {
      this.logger.error('Error fetching refund request by id: ', err.stack);
      throw err;
    }
  }
}
