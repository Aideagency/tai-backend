import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  CounsellingBookingEntity,
  CounsellingBookingStatus,
} from 'src/database/entities/counselling-booking.entity';
import { CounsellingEntity } from 'src/database/entities/counselling.entity';

export interface CounsellingBookingSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  userId?: number;
  counsellingId?: number;
  status?: CounsellingBookingStatus | CounsellingBookingStatus[];
  q?: string; // search by counselling title or user email/name
  createdFrom?: Date;
  createdTo?: Date;

  // sorting
  orderBy?: 'createdAt' | 'id' | 'startsAt' | 'paidAt';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class CounsellingBookingRepository extends BaseRepository<
  CounsellingBookingEntity,
  Repository<CounsellingBookingEntity>
> {
  protected logger = new Logger(CounsellingBookingRepository.name);

  constructor(
    @InjectRepository(CounsellingBookingEntity)
    repository: Repository<CounsellingBookingEntity>,
  ) {
    super(repository);
  }

  /** ---------- Base QB with common filters ---------- */
  private baseQB(
    params: CounsellingBookingSearchParams = {},
  ): SelectQueryBuilder<CounsellingBookingEntity> {
    const qb = this.query('r')
      .leftJoinAndSelect('r.counselling', 'c')
      .leftJoinAndSelect('r.user', 'u');

    if (params.userId) {
      qb.andWhere('r.user.id = :uid', { uid: params.userId });
      // or: qb.andWhere('u.id = :uid', { uid: params.userId });
    }
    if (params.counsellingId) {
      qb.andWhere('r.counselling.id = :cid', { cid: params.counsellingId });
      // or: qb.andWhere('c.id = :cid', { cid: params.counsellingId });
    }

    if (params.status) {
      const list = Array.isArray(params.status)
        ? params.status
        : [params.status];
      if (list.length) qb.andWhere('r.status IN (:...st)', { st: list });
    }

    if (params.createdFrom) {
      qb.andWhere('r.createdAt >= :cf', { cf: params.createdFrom });
    }
    if (params.createdTo) {
      qb.andWhere('r.createdAt <= :ct', { ct: params.createdTo });
    }

    // Simple text search against counselling title OR user email/name
    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(c.title) ILIKE :q OR LOWER(u.email_address) ILIKE :q OR LOWER(u.first_name) ILIKE :q OR LOWER(u.last_name) ILIKE :q)',
        { q },
      );
    }

    const orderBy = params.orderBy || 'createdAt';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`r.${orderBy}`, orderDir);

    return qb;
  }

  /** Paginated search (user dashboard or admin) */
  async searchPaginated(params: CounsellingBookingSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  /** Find a user’s booking for a counselling offer (if any) */
  async findUserBooking(userId: number, counsellingId: number) {
    return this.repository.findOne({
      where: {
        user: { id: userId } as any,
        counselling: { id: counsellingId } as any,
      },
      relations: ['counselling'],
    });
  }

  /** Create booking (PENDING_PAYMENT or CONFIRMED) */
  async createBooking(params: {
    userId: number;
    counsellingId: number;
    status: CounsellingBookingStatus; // PENDING_PAYMENT | CONFIRMED | ...
    priceAtBooking: number; // snapshot
    durationMinutes: number;
    startsAt: Date;
    endsAt?: Date | null;
    reference?: string | null;
    paidAt?: Date | null;
    clientNotes?: string | null;
  }) {
    const counselling = await this.findCounsellingById(params.counsellingId);

    // If counselling is paid and booking is already confirmed, ensure only one confirmed booking per user+counselling
    if (
      counselling.price &&
      Number(counselling.price) > 0 &&
      params.status === CounsellingBookingStatus.CONFIRMED
    ) {
      const existingBooking = await this.findUserBooking(
        params.userId,
        params.counsellingId,
      );
      if (existingBooking) {
        throw new BadRequestException(
          'You already have a confirmed booking for this counselling offer',
        );
      }
    }

    const booking = this.repository.create({
      user: { id: params.userId } as any,
      counselling: { id: counselling.id } as any,
      status: params.status,
      priceAtBooking: params.priceAtBooking,
      durationMinutes: params.durationMinutes,
      startsAt: params.startsAt,
      endsAt: params.endsAt ?? null,
      reference: params.reference ?? null,
      clientNotes: params.clientNotes ?? null,
      paidAt:
        params.paidAt ??
        (params.status === CounsellingBookingStatus.CONFIRMED
          ? new Date()
          : null),
    });

    return this.repository.save(booking);
  }

  /** Find booking by transaction reference */
  async findBookingByTransactionRef(transactionRef: string) {
    const booking = await this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.counselling', 'c')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.transaction_ref = :transactionRef', { transactionRef })
      .getOne();

    if (!booking) {
      throw new NotFoundException(
        'Counselling booking not found for the given transaction reference',
      );
    }

    return booking;
  }

  /** Confirm a pending booking (after successful payment) */
  async confirmPayment(bookingId: number, transactionRef: string) {
    const booking = await this.repository.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.repository.update(
      { id: bookingId },
      {
        status: CounsellingBookingStatus.CONFIRMED,
        paidAt: new Date(),
        transaction_ref: transactionRef,
      },
    );
    return this.repository.findOne({
      where: { id: bookingId },
      relations: ['counselling', 'user'],
    });
  }

  /** Cancel a booking (service should enforce policy: time window, etc.) */
  async cancel(bookingId: number, userId: number) {
    const booking = await this.repository.findOne({
      where: { id: bookingId, user: { id: userId } as any },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.repository.update(
      { id: booking.id },
      { status: CounsellingBookingStatus.CANCELLED },
    );
    return true;
  }

  /** Quick counts (e.g. for maxClientsPerSession or analytics) */
  async countReservedByCounselling(
    counsellingId: number,
    statuses: CounsellingBookingStatus[] = [
      CounsellingBookingStatus.CONFIRMED,
      CounsellingBookingStatus.PENDING_PAYMENT,
    ],
  ) {
    const { qty } = await this.repository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'qty')
      .where('r.counsellingId = :cid', { cid: counsellingId })
      .andWhere('r.status IN (:...st)', { st: statuses })
      .getRawOne<{ qty: string }>();

    return Number(qty || 0);
  }

  // Helper method to check if a counselling offer exists
  private async findCounsellingById(
    counsellingId: number,
  ): Promise<CounsellingEntity> {
    const counselling = await this.repository.manager
      .getRepository(CounsellingEntity)
      .findOne({
        where: { id: counsellingId },
      });
    if (!counselling) {
      throw new NotFoundException('Counselling offer not found');
    }
    return counselling;
  }
}
