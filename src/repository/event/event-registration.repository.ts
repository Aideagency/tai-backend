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
  EventRegistrationEntity,
  RegistrationStatus,
} from 'src/database/entities/event-registration.entity';
import {
  EventEntity,
  // RegistrationStatus,
} from 'src/database/entities/event.entity';
// import { TransactionEntity } from 'src/database/entities/transaction.entity';

export interface RegistrationSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  userId?: number;
  eventId?: number;
  status?: RegistrationStatus | RegistrationStatus[];
  q?: string; // search by event title or user email/name (if joined)
  createdFrom?: Date;
  createdTo?: Date;

  // sorting
  orderBy?: 'createdAt' | 'id' | 'paidAt';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class EventRegistrationRepository extends BaseRepository<
  EventRegistrationEntity,
  Repository<EventRegistrationEntity>
> {
  protected logger = new Logger(EventRegistrationRepository.name);

  constructor(
    @InjectRepository(EventRegistrationEntity)
    repository: Repository<EventRegistrationEntity>,
  ) {
    super(repository);
  }

  /** ---------- Base QB with common filters ---------- */
  private baseQB(
    params: RegistrationSearchParams = {},
  ): SelectQueryBuilder<EventRegistrationEntity> {
    const qb = this.query('r').leftJoinAndSelect('r.event', 'e');

    if (params.userId) {
      qb.andWhere('r.user.id = :uid', { uid: params.userId });
    }
    if (params.eventId) {
      qb.andWhere('r.event.id = :eid', { eid: params.eventId });
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

    // Simple text search against event title (extend to user/email if needed)
    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere('LOWER(e.title) ILIKE :q', { q });
    }

    const orderBy = params.orderBy || 'createdAt';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`r.${orderBy}`, orderDir);

    return qb;
  }

  /** Paginated search (user dashboard or admin) */
  async searchPaginated(params: RegistrationSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  /** Find a user’s registration for an event (if any) */
  async findUserRegistration(userId: number, eventId: number) {
    return this.repository.findOne({
      where: { user: { id: userId } as any, event: { id: eventId } as any },
      relations: ['event', 'transaction'],
    });
  }

  /** Create registration (RSVP or pending payment) */
  async createRegistration(params: {
    userId: number;
    eventId: number;
    status: RegistrationStatus; // PENDING_PAYMENT | CONFIRMED
    unitPrice: string | null; // Can be null for free events
    paidAt?: Date | null;
    reference?: string | null;
  }) {
    const event = await this.findEventById(params.eventId);

    // If event is paid, ensure only one registration per user
    if (event.price && params.status === RegistrationStatus.CONFIRMED) {
      const existingRegistration = await this.findUserRegistration(
        params.userId,
        params.eventId,
      );
      if (existingRegistration) {
        throw new BadRequestException(
          'You can only register once for this paid event',
        );
      }
    }

    const reg = this.repository.create({
      user: { id: params.userId } as any,
      event: { id: event.id } as any,
      status: params.status,
      quantity: 1, // Always 1 since users can only register once
      unitPrice: params.unitPrice,
      transaction_ref: params.reference ?? null,
      paidAt:
        params.paidAt ?? (params.status === 'CONFIRMED' ? new Date() : null),
    });

    return this.repository.save(reg);
  }

  async findRegistrationByTransactionRef(transactionRef: string) {
    // Query the registration by joining with TransactionEntity on the transaction_ref field
    const registration = await this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.event', 'e')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.transaction_ref = :transactionRef', { transactionRef })
      .getOne(); // Returns the first matching result

    if (!registration) {
      throw new NotFoundException(
        'Event registration not found for the given transaction reference',
      );
    }

    return registration;
  }

  /** Confirm a pending registration (after successful payment) */
  async confirmPayment(registrationId: number, transactionId: number) {
    const reg = await this.repository.findOne({
      where: { id: registrationId },
    });
    if (!reg) throw new NotFoundException('Registration not found');

    await this.repository.update(
      { id: registrationId },
      {
        status: RegistrationStatus.CONFIRMED,
        paidAt: new Date(),
        transaction: { id: transactionId } as any,
      },
    );
    return this.repository.findOne({
      where: { id: registrationId },
      relations: ['transaction', 'event'],
    });
  }

  /** Cancel a registration (service should enforce policy) */
  async cancel(registrationId: number, userId: number) {
    const reg = await this.repository.findOne({
      where: { id: registrationId, user: { id: userId } },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    await this.repository.update(
      { id: reg.id },
      { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    );
    return true;
  }

  /** Quick counts (for capacity dashboards) */
  async countReservedByEvent(
    eventId: number,
    statuses: RegistrationStatus[] = [
      RegistrationStatus.CONFIRMED,
      RegistrationStatus.PENDING_PAYMENT,
    ],
  ) {
    const { qty } = await this.repository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.quantity), 0)', 'qty')
      .where('r.eventId = :eid', { eid: eventId })
      .andWhere('r.status IN (:...st)', { st: statuses })
      .getRawOne<{ qty: string }>();

    return Number(qty || 0);
  }

  // Helper method to check if an event exists
  private async findEventById(eventId: number): Promise<EventEntity> {
    const event = await this.repository.manager
      .getRepository(EventEntity)
      .findOne({
        where: { id: eventId },
      });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }
}
