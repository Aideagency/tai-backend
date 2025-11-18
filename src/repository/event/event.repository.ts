// src/repository/event/event.repository.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';

import {
  EventEntity,
  EventStatus,
  EventType,
} from 'src/database/entities/event.entity'; // adjust import if enums live elsewhere
import { EventTicketTypeEntity } from 'src/database/entities/event-ticket-type.entity';
import { EventRegistrationEntity } from 'src/database/entities/event-registration.entity';
import { EventTicketEntity } from 'src/database/entities/event-ticket.entity';
import { RefundRequestEntity } from 'src/database/entities/refund-request.entity';
import { TransactionEntity } from 'src/database/entities/transaction.entity';

export interface EventSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  q?: string; // title/description/location
  type?: EventType | EventType[]; // COMMUNITY | CONFERENCE | RETREAT
  status?: EventStatus; // PUBLISHED, CANCELLED, etc.
  onlyPublished?: boolean; // shorthand for status=PUBLISHED
  startsFrom?: Date; // events starting from this date
  startsTo?: Date; // events starting until this date
  freeOnly?: boolean; // any zero-price ticket type
  paidOnly?: boolean; // any > 0 ticket type
  upcomingOnly?: boolean; // startsAt >= today
  pastOnly?: boolean; // endsAt < now

  // sorting
  orderBy?: 'createdAt' | 'id' | 'startsAt' | 'title';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class EventRepository extends BaseRepository<
  EventEntity,
  Repository<EventEntity>
> {
  protected logger = new Logger(EventRepository.name);

  constructor(
    @InjectRepository(EventEntity) repository: Repository<EventEntity>,
    @InjectRepository(EventTicketTypeEntity)
    private readonly ticketTypeRepo: Repository<EventTicketTypeEntity>,
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationRepo: Repository<EventRegistrationEntity>,
    @InjectRepository(EventTicketEntity)
    private readonly ticketRepo: Repository<EventTicketEntity>,
    @InjectRepository(RefundRequestEntity)
    private readonly refundRepo: Repository<RefundRequestEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txnRepo: Repository<TransactionEntity>,
  ) {
    super(repository);
  }

  /** ---------- Base QB with common filters ---------- */
  // private baseQB(
  //   params: EventSearchParams = {},
  // ): SelectQueryBuilder<EventEntity> {
  //   const qb = this.query('e');

  //   if (params.q) {
  //     const q = `%${params.q.toLowerCase()}%`;
  //     qb.andWhere(
  //       `(
  //         LOWER(e.title) ILIKE :q OR
  //         LOWER(e.description) ILIKE :q OR
  //         LOWER(e.locationText) ILIKE :q
  //       )`,
  //       { q },
  //     );
  //   }

  //   // Type filter (supports array)
  //   const types = Array.isArray(params.type)
  //     ? params.type.filter(Boolean)
  //     : params.type
  //       ? [params.type]
  //       : [];
  //   if (types.length > 0) {
  //     qb.andWhere('e.type IN (:...types)', { types });
  //   }

  //   if (params.onlyPublished) {
  //     qb.andWhere('e.status = :st', { st: EventStatus.PUBLISHED });
  //   } else if (params.status) {
  //     qb.andWhere('e.status = :st', { st: params.status });
  //   }

  //   // Date window (startsAt)
  //   if (params.startsFrom) {
  //     qb.andWhere('e.startsAt >= :sf', { sf: params.startsFrom });
  //   }
  //   if (params.startsTo) {
  //     qb.andWhere('e.startsAt <= :st', { st: params.startsTo });
  //   }

  //   // Upcoming / Past semantic filters
  //   const now = new Date();
  //   if (params.upcomingOnly) qb.andWhere('e.startsAt >= :now', { now });
  //   if (params.pastOnly) qb.andWhere('e.endsAt < :now', { now });

  //   // Price filters using EXISTS on ticket types
  //   if (params.freeOnly) {
  //     qb.andWhere((sub) =>
  //       sub
  //         .subQuery()
  //         .select('1')
  //         .from(EventTicketTypeEntity, 'tt')
  //         .where('tt.event.id = e.id')
  //         .andWhere('tt.isActive = true')
  //         .andWhere('tt.price = 0')
  //         .getQuery(),
  //     );
  //   }
  //   if (params.paidOnly) {
  //     qb.andWhere((sub) =>
  //       sub
  //         .subQuery()
  //         .select('1')
  //         .from(EventTicketTypeEntity, 'tt')
  //         .where('tt.event.id = e.id')
  //         .andWhere('tt.isActive = true')
  //         .andWhere('tt.price > 0')
  //         .getQuery(),
  //     );
  //   }

  //   // Handy counts
  //   qb.loadRelationCountAndMap('e.ticketTypeCount', 'e.ticketTypes');

  //   // participantsCount via subquery (no need for relation on EventEntity)
  //   qb.addSelect(
  //     (sub) =>
  //       sub
  //         .select('COUNT(r.id)')
  //         .from(EventRegistrationEntity, 'r')
  //         .where('r.event.id = e.id')
  //         .andWhere(`r.status IN ('CONFIRMED','PENDING_PAYMENT')`),
  //     'participantsCount',
  //   );

  //   const orderBy = params.orderBy || 'startsAt';
  //   const orderDir = params.orderDir || 'ASC';
  //   qb.orderBy(`e.${orderBy}`, orderDir);

  //   return qb;
  // }
  private baseQB(
    params: EventSearchParams = {},
  ): SelectQueryBuilder<EventEntity> {
    const qb = this.query('e');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(e.title) ILIKE :q OR
          LOWER(e.description) ILIKE :q OR
          LOWER(e.locationText) ILIKE :q
        )`,
        { q },
      );
    }

    // Type filter (supports array)
    const types = Array.isArray(params.type)
      ? params.type.filter(Boolean)
      : params.type
        ? [params.type]
        : [];
    if (types.length > 0) {
      qb.andWhere('e.type IN (:...types)', { types });
    }

    if (params.onlyPublished) {
      qb.andWhere('e.status = :st', { st: EventStatus.PUBLISHED });
    } else if (params.status) {
      qb.andWhere('e.status = :st', { st: params.status });
    }

    // Date window (startsAt)
    if (params.startsFrom) {
      qb.andWhere('e.startsAt >= :sf', { sf: params.startsFrom });
    }
    if (params.startsTo) {
      qb.andWhere('e.startsAt <= :st', { st: params.startsTo });
    }

    // Upcoming / Past semantic filters
    const now = new Date();
    if (params.upcomingOnly) qb.andWhere('e.startsAt >= :now', { now });
    if (params.pastOnly) qb.andWhere('e.endsAt < :now', { now });

    // Price filters using EXISTS on ticket types
    if (params.freeOnly) {
      qb.andWhere((sub) =>
        sub
          .subQuery()
          .select('1')
          .from(EventTicketTypeEntity, 'tt')
          .where('tt.event.id = e.id')
          .andWhere('tt.isActive = true')
          .andWhere('tt.price = 0')
          .getQuery(),
      );
    }
    if (params.paidOnly) {
      qb.andWhere((sub) =>
        sub
          .subQuery()
          .select('1')
          .from(EventTicketTypeEntity, 'tt')
          .where('tt.event.id = e.id')
          .andWhere('tt.isActive = true')
          .andWhere('tt.price > 0')
          .getQuery(),
      );
    }

    // Handy counts
    qb.loadRelationCountAndMap('e.ticketTypeCount', 'e.ticketTypes');

    // participantsCount via subquery (no need for relation on EventEntity)
    qb.addSelect(
      (sub) =>
        sub
          .select('COUNT(r.id)')
          .from(EventRegistrationEntity, 'r')
          .where('r.event.id = e.id')
          .andWhere(`r.status IN ('CONFIRMED','PENDING_PAYMENT')`),
      'participantsCount',
    );

    const orderBy = params.orderBy || 'startsAt';
    const orderDir = params.orderDir || 'ASC';
    qb.orderBy(`e.${orderBy}`, orderDir);

    return qb;
  }

  /** Paginated browse/search with filters */
  async getPaginatedEvents(params: EventSearchParams): Promise<any> {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    const pageResult = await this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' }, // ignored with qb
      {},
      qb,
    );

    // Attach raw participantsCount
    const { raw } = await qb.getRawAndEntities();
    const map = new Map<number, number>();
    raw.forEach((r) => {
      map.set(Number(r['e_id']), Number(r['participantsCount']) || 0);
    });

    const items = pageResult.items.map((e: any) => ({
      ...e,
      participantsCount: map.get(e.id) ?? 0,
    }));

    return { ...pageResult, items };
  }

  /** Paginated browse/search */
  async searchPaginated(params: EventSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    const pageResult = await this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' }, // ignored with qb
      {},
      qb,
    );

    // Attach raw participantsCount
    const { raw } = await qb.getRawAndEntities();
    const map = new Map<number, number>();
    raw.forEach((r) => {
      map.set(Number(r['e_id']), Number(r['participantsCount']) || 0);
    });

    const items = pageResult.items.map((e: any) => ({
      ...e,
      participantsCount: map.get(e.id) ?? 0,
    }));

    return { ...pageResult, items };
  }

  /** Get a detailed event (optionally with ticket types) */
  async findByIdWithDetails(
    id: number,
    opts: { withTicketTypes?: boolean; onlyPublished?: boolean } = {},
  ) {
    const { withTicketTypes = true, onlyPublished = true } = opts;

    const qb = this.query('e').where('e.id = :id', { id });

    if (onlyPublished)
      qb.andWhere('e.status = :st', { st: EventStatus.PUBLISHED });

    qb.loadRelationCountAndMap('e.ticketTypeCount', 'e.ticketTypes');

    qb.addSelect(
      (sub) =>
        sub
          .select('COUNT(r.id)')
          .from(EventRegistrationEntity, 'r')
          .where('r.event.id = e.id')
          .andWhere(`r.status IN ('CONFIRMED','PENDING_PAYMENT')`),
      'participantsCount',
    );

    if (withTicketTypes) {
      qb.leftJoinAndSelect('e.ticketTypes', 'tt');
      qb.addOrderBy('tt.price', 'ASC');
    }

    const { entities, raw } = await qb.getRawAndEntities();
    const event = entities[0];
    if (!event) return undefined;

    (event as any).participantsCount = Number(
      raw?.[0]?.['participantsCount'] || 0,
    );
    return event;
  }

  /** Upcoming published events (lightweight) */
  async listUpcoming(limit = 10) {
    return this.baseQB({ onlyPublished: true, upcomingOnly: true })
      .limit(limit)
      .getMany();
  }

  /** Past events (for archive listings) */
  async listPastPaginated(
    params: Omit<EventSearchParams, 'upcomingOnly' | 'onlyPublished'>,
  ) {
    return this.searchPaginated({ ...params, pastOnly: true });
  }

  /** Free-only (RSVP) browse */
  async listFreePaginated(
    params: Omit<EventSearchParams, 'freeOnly' | 'paidOnly'>,
  ) {
    return this.searchPaginated({
      ...params,
      freeOnly: true,
      onlyPublished: true,
    });
  }

  /** Paid-only (registration/payment) browse */
  async listPaidPaginated(
    params: Omit<EventSearchParams, 'freeOnly' | 'paidOnly'>,
  ) {
    return this.searchPaginated({
      ...params,
      paidOnly: true,
      onlyPublished: true,
    });
  }

  /** Check event/tier capacity quickly (service can enforce) */
  async getCapacitySnapshot(eventId: number) {
    const event = await this.findOne({ id: eventId });
    if (!event) throw new NotFoundException('Event not found');

    // participants (confirmed + pending_payment)
    const participants = await this.registrationRepo
      .createQueryBuilder('r')
      .where('r.event.id = :eventId', { eventId })
      .andWhere(`r.status IN ('CONFIRMED','PENDING_PAYMENT')`)
      .select('COALESCE(SUM(r.quantity), 0)', 'qty')
      .getRawOne<{ qty: string }>();

    return {
      capacity: event.capacity ?? null,
      reservedQty: Number(participants?.qty || 0),
      remaining:
        event.capacity != null
          ? Math.max(0, event.capacity - Number(participants?.qty || 0))
          : null,
    };
  }

  /** Lookup user’s registration for an event (if any) */
  async findUserRegistration(userId: number, eventId: number) {
    return this.registrationRepo.findOne({
      where: { user: { id: userId } as any, event: { id: eventId } as any },
      relations: ['event', 'ticketType', 'transaction'],
    });
  }

  /** Paginated registrations for a user (dashboard) */
  async listRegistrationsForUserPaginated(
    userId: number,
    page = 1,
    pageSize = 20,
  ) {
    const qb = this.registrationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.event', 'e')
      .leftJoinAndSelect('r.ticketType', 'tt')
      .where('r.user.id = :uid', { uid: userId })
      .orderBy('r.createdAt', 'DESC');

    return this.paginateRaw(qb, page, pageSize);
  }

  /** Paginated registrations for an event (admin/organizer) */
  async listRegistrationsForEventPaginated(
    eventId: number,
    page = 1,
    pageSize = 20,
  ) {
    const qb = this.registrationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.event.id = :eid', { eid: eventId })
      .orderBy('r.createdAt', 'DESC');

    return this.paginateRaw(qb, page, pageSize);
  }

  /** Create RSVP (free) or hold a paid slot (pending) – repositories should be light; business rules go in services */
  async createRegistration(params: {
    userId: number;
    eventId: number;
    ticketTypeId: number | null; // null allowed for “generic free RSVP” if you design it that way
    quantity: number;
    status: 'PENDING_PAYMENT' | 'CONFIRMED';
    unitPrice: string; // snapshot
    totalAmount: string; // snapshot
  }) {
    const reg = this.registrationRepo.create({
      user: { id: params.userId } as any,
      event: { id: params.eventId } as any,
      ticketType: params.ticketTypeId
        ? ({ id: params.ticketTypeId } as any)
        : null,
      quantity: params.quantity,
      status: params.status as any,
      unitPrice: params.unitPrice,
      totalAmount: params.totalAmount,
      paidAt: params.status === 'CONFIRMED' ? new Date() : null,
    });
    return this.registrationRepo.save(reg);
  }

  /** Attach transaction to a registration (after payment) */
  async attachTransaction(registrationId: number, transactionId: number) {
    await this.registrationRepo.update(
      { id: registrationId },
      {
        transaction: { id: transactionId } as any,
        paidAt: new Date(),
        status: 'CONFIRMED' as any,
      },
    );
    return this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: ['transaction'],
    });
  }

  /** Issue N tickets for a registration (typically after CONFIRMED) */
  async issueTickets(
    registrationId: number,
    codes: string[],
    payloads?: string[],
  ) {
    if (!codes?.length)
      throw new BadRequestException('No ticket codes provided');
    const reg = await this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: ['event'],
    });
    if (!reg) throw new NotFoundException('Registration not found');

    const rows = codes.map((code, i) =>
      this.ticketRepo.create({
        registration: { id: registrationId } as any,
        code,
        qrPayload: payloads?.[i] ?? null,
        status: 'ACTIVE' as any,
        issuedAt: new Date(),
      }),
    );
    await this.ticketRepo.save(rows);
    return rows;
  }

  /** Find a ticket by its code (for gate scanning) */
  async findTicketByCode(code: string) {
    return this.ticketRepo.findOne({
      where: { code },
      relations: ['registration', 'registration.event', 'registration.user'],
    });
  }

  /** Mark ticket as used (gate) */
  async markTicketUsed(ticketId: number) {
    await this.ticketRepo.update(
      { id: ticketId },
      { status: 'USED' as any, usedAt: new Date() },
    );
    return this.ticketRepo.findOne({ where: { id: ticketId } });
  }

  /** Create refund request */
  async createRefundRequest(params: {
    registrationId: number;
    amount: string;
    reason?: string;
  }) {
    const rr = this.refundRepo.create({
      registration: { id: params.registrationId } as any,
      amount: params.amount,
      reason: params.reason ?? null,
      status: 'REQUESTED' as any,
    });
    return this.refundRepo.save(rr);
  }

  /** Update refund status (approve/reject/process) */
  async updateRefundStatus(
    refundId: number,
    status: 'APPROVED' | 'REJECTED' | 'PROCESSED',
    processorNote?: string,
  ) {
    const patch: any = { status, processorNote: processorNote ?? null };
    if (status === 'APPROVED') patch.approvedAt = new Date();
    if (status === 'PROCESSED') patch.processedAt = new Date();
    await this.refundRepo.update({ id: refundId }, patch);
    return this.refundRepo.findOne({
      where: { id: refundId },
      relations: ['registration'],
    });
  }

  /** Find by ICS token (calendar) */
  async findByIcsToken(token: string) {
    return this.findOne({ icsToken: token });
  }

  /** Helper for raw pagination on arbitrary QBs (same pattern you might have in BaseRepository) */
  private async paginateRaw<T>(
    qb: SelectQueryBuilder<T>,
    page = 1,
    pageSize = 20,
  ) {
    const take = Math.max(pageSize, 1);
    const skip = Math.max(page - 1, 0) * take;
    const [items, total] = await qb.take(take).skip(skip).getManyAndCount();

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: take,
        totalPages: Math.ceil(total / take),
        currentPage: page,
      },
    };
  }
}
