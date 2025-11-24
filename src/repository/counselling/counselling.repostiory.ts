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
  CounsellingEntity,
  CounsellingMode,
  CounsellingStatus,
  CounsellingType,
} from 'src/database/entities/counselling.entity';
import {
  CounsellingBookingEntity,
  CounsellingBookingStatus,
} from 'src/database/entities/counselling-booking.entity';

@Injectable()
export class CounsellingRepository extends BaseRepository<
  CounsellingEntity,
  Repository<CounsellingEntity>
> {
  protected logger = new Logger(CounsellingRepository.name);

  constructor(
    @InjectRepository(CounsellingEntity)
    repository: Repository<CounsellingEntity>,
  ) {
    super(repository);
  }

  // Create a new counselling offer
  async createCounselling(
    data: Partial<CounsellingEntity>,
  ): Promise<CounsellingEntity> {
    const counselling = this.repository.create(data);
    return this.repository.save(counselling);
  }

  /**
   * Update counselling.
   * Rule: prevent updating price if there are confirmed / completed / refunded bookings.
   */
  async updateCounselling(
    id: number,
    data: Partial<CounsellingEntity>,
  ): Promise<CounsellingEntity> {
    const counselling = await this.repository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.bookings', 'booking')
      .where('c.id = :id', { id })
      .getOne();

    if (!counselling) {
      throw new BadRequestException('Counselling offer not found');
    }

    // Prevent price update if we already have certain bookings
    if (
      data.price !== undefined &&
      counselling.bookings &&
      counselling.bookings.length > 0
    ) {
      const hasLockedBookings = counselling.bookings.some((b) =>
        [
          CounsellingBookingStatus.CONFIRMED,
          CounsellingBookingStatus.COMPLETED,
          CounsellingBookingStatus.REFUNDED,
        ].includes(b.status),
      );

      if (hasLockedBookings) {
        throw new BadRequestException(
          'Price cannot be updated after confirmed bookings exist',
        );
      }
    }

    Object.assign(counselling, data);
    return this.repository.save(counselling);
  }

  // Simple find by ID
  async findCounsellingById(id: number): Promise<CounsellingEntity> {
    const counselling = await this.repository.findOne({ where: { id } });
    if (!counselling) {
      throw new BadRequestException('Counselling offer not found');
    }
    return counselling;
  }

  /**
   * Detailed fetch:
   * - counselling
   * - bookings (with user)
   * - stats
   */
  async findDetailedCounsellingById(id: number) {
    const counselling = await this.repository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.bookings', 'booking')
      .leftJoinAndSelect('booking.user', 'u')
      .select([
        // Counselling fields
        'c.id',
        'c.createdAt',
        'c.updatedAt',
        'c.deleted',
        'c.suspended',
        'c.title',
        'c.description',
        'c.durationMinutes',
        'c.mode',
        'c.status',
        'c.type',
        'c.coverUrl',
        'c.price',
        'c.whatYouGet',
        'c.whoItsFor',
        'c.howItWorks',
        'c.counsellorNotes',
        'c.maxClientsPerSession',
        'c.isActive',
        'c.isFeatured',

        // Booking fields
        'booking.id',
        'booking.createdAt',
        'booking.updatedAt',
        'booking.deleted',
        'booking.suspended',
        'booking.startsAt',
        'booking.endsAt',
        'booking.durationMinutes',
        'booking.priceAtBooking',
        'booking.status',
        'booking.meetingLink',
        'booking.locationText',
        'booking.reference',
        'booking.clientNotes',
        'booking.counsellorNotes',
        'booking.attended',

        // Minimal user fields
        'u.id',
        'u.first_name',
        'u.last_name',
        'u.email_address',
      ])
      .where('c.id = :id', { id })
      .getOne();

    if (!counselling) {
      throw new NotFoundException('Counselling offer not found');
    }

    const bookings: CounsellingBookingEntity[] = counselling.bookings || [];

    const stats = {
      total: bookings.length,
      confirmed: 0,
      pendingPayment: 0,
      cancelled: 0,
      completed: 0,
      refunded: 0,
      noShow: 0,
    };

    for (const b of bookings) {
      switch (b.status) {
        case CounsellingBookingStatus.CONFIRMED:
          stats.confirmed++;
          break;
        case CounsellingBookingStatus.PENDING_PAYMENT:
          stats.pendingPayment++;
          break;
        case CounsellingBookingStatus.CANCELLED:
          stats.cancelled++;
          break;
        case CounsellingBookingStatus.COMPLETED:
          stats.completed++;
          break;
        case CounsellingBookingStatus.REFUNDED:
          stats.refunded++;
          break;
        case CounsellingBookingStatus.NO_SHOW:
          stats.noShow++;
          break;
      }
    }

    return {
      counselling,
      bookings,
      stats,
    };
  }

  /**
   * Paginated + filtered counselling offers
   * You can later extract params into a GetCounsellingsFilterDto.
   */
  async searchCounsellingsPaginated(params: {
    status?: CounsellingStatus;
    type?: CounsellingType;
    mode?: CounsellingMode;
    isActive?: boolean;
    isFeatured?: boolean;
    freeOnly?: boolean;
    paidOnly?: boolean;
    counsellorId?: number;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.max(Number(params.pageSize) || 20, 1);

    const qb = this.baseQB(params);

    return this.paginate(
      { page, limit: pageSize },
      {}, // filter is handled inside qb
      { createdAt: 'DESC' },
      {},
      qb,
    );
  }

  /**
   * Base QB with filters
   */
  private baseQB(params: {
    status?: CounsellingStatus;
    type?: CounsellingType;
    mode?: CounsellingMode;
    isActive?: boolean;
    isFeatured?: boolean;
    freeOnly?: boolean;
    paidOnly?: boolean;
    counsellorId?: number;
    q?: string;
  }): SelectQueryBuilder<CounsellingEntity> {
    const qb = this.query('c');

    const {
      status,
      type,
      mode,
      isActive,
      isFeatured,
      freeOnly,
      paidOnly,
      counsellorId,
      q,
    } = params;

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    if (typeof isActive === 'boolean') {
      qb.andWhere('c.isActive = :isActive', { isActive });
    }

    if (typeof isFeatured === 'boolean') {
      qb.andWhere('c.isFeatured = :isFeatured', { isFeatured });
    }

    if (type) {
      qb.andWhere('c.type = :type', { type });
    }

    if (mode) {
      qb.andWhere('c.mode = :mode', { mode });
    }

    if (counsellorId) {
      // assuming default FK column name `counsellorId`
      qb.andWhere('c.counsellorId = :counsellorId', { counsellorId });
    }

    // Free vs paid
    if (freeOnly && !paidOnly) {
      qb.andWhere('(c.price IS NULL OR c.price = 0)');
    } else if (paidOnly && !freeOnly) {
      qb.andWhere('c.price IS NOT NULL AND c.price > 0');
    }

    // Simple text search
    if (q && q.trim().length > 0) {
      const text = `%${q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(c.title) LIKE :text OR LOWER(c.description) LIKE :text OR LOWER(c.whoItsFor) LIKE :text)',
        { text },
      );
    }

    qb.orderBy('c.createdAt', 'DESC');
    return qb;
  }

  /**
   * Non-paginated helper
   */
  async findCounsellingsByFilter(filter: {
    mode?: CounsellingMode;
    type?: CounsellingType;
    counsellorId?: number;
  }): Promise<CounsellingEntity[]> {
    const qb = this.query('c');

    if (filter.mode) {
      qb.andWhere('c.mode = :mode', { mode: filter.mode });
    }
    if (filter.type) {
      qb.andWhere('c.type = :type', { type: filter.type });
    }
    if (filter.counsellorId) {
      qb.andWhere('c.counsellorId = :counsellorId', {
        counsellorId: filter.counsellorId,
      });
    }

    return qb.getMany();
  }

  async deleteCounselling(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Counselling offer not found');
    }
  }
}
