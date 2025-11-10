// src/repository/event/event-ticket.repository.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { EventTicketEntity } from 'src/database/entities/event-ticket.entity';
import { TicketStatus } from 'src/database/entities/event.entity';

export interface TicketSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  eventId?: number;
  registrationId?: number;
  userId?: number; // via registration.user
  status?: TicketStatus | TicketStatus[];
  codeLike?: string;

  // sorting
  orderBy?: 'createdAt' | 'id' | 'issuedAt' | 'usedAt';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class EventTicketRepository extends BaseRepository<
  EventTicketEntity,
  Repository<EventTicketEntity>
> {
  protected logger = new Logger(EventTicketRepository.name);

  constructor(
    @InjectRepository(EventTicketEntity)
    repository: Repository<EventTicketEntity>,
  ) {
    super(repository);
  }

  /** ---------- Base QB with common filters ---------- */
  private baseQB(
    params: TicketSearchParams = {},
  ): SelectQueryBuilder<EventTicketEntity> {
    const qb = this.query('t')
      .leftJoinAndSelect('t.registration', 'r')
      .leftJoinAndSelect('r.event', 'e')
      .leftJoinAndSelect('r.user', 'u');

    if (params.registrationId) {
      qb.andWhere('t.registration.id = :rid', { rid: params.registrationId });
    }
    if (params.eventId) {
      qb.andWhere('r.event.id = :eid', { eid: params.eventId });
    }
    if (params.userId) {
      qb.andWhere('r.user.id = :uid', { uid: params.userId });
    }

    if (params.status) {
      const list = Array.isArray(params.status)
        ? params.status
        : [params.status];
      if (list.length) qb.andWhere('t.status IN (:...st)', { st: list });
    }

    if (params.codeLike) {
      const q = `%${params.codeLike.toUpperCase()}%`;
      qb.andWhere('UPPER(t.code) LIKE :q', { q });
    }

    const orderBy = params.orderBy || 'issuedAt';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`t.${orderBy}`, orderDir);

    return qb;
  }

  /** Paginated search */
  async searchPaginated(params: TicketSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  /** Find by unique code (gate scan) */
  async findByCode(code: string) {
    return this.repository.findOne({
      where: { code },
      relations: ['registration', 'registration.event', 'registration.user'],
    });
  }

  /** Issue tickets (bulk) for a registration */
  async issueForRegistration(params: {
    registrationId: number;
    codes: string[]; // must be pre-generated unique codes
    payloads?: (string | null)[];
  }) {
    if (!params.codes?.length) {
      throw new BadRequestException('No ticket codes provided');
    }

    const rows = params.codes.map((code, i) =>
      this.repository.create({
        registration: { id: params.registrationId } as any,
        code,
        qrPayload: params.payloads?.[i] ?? null,
        status: TicketStatus.ACTIVE,
        issuedAt: new Date(),
      }),
    );

    return this.repository.save(rows);
  }

  /** Mark a ticket as used */
  async markUsed(ticketId: number) {
    const t = await this.repository.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Ticket not found');
    await this.repository.update(
      { id: ticketId },
      { status: TicketStatus.USED, usedAt: new Date() },
    );
    return this.repository.findOne({ where: { id: ticketId } });
  }

  /** Revoke / cancel a ticket (e.g., after refund or admin action) */
  async revoke(ticketId: number) {
    const t = await this.repository.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Ticket not found');
    await this.repository.update(
      { id: ticketId },
      { status: TicketStatus.CANCELLED },
    );
    return true;
  }

  /** Validate tickets exist and are ACTIVE (for gate/batch checks) */
  async validateActiveCodes(codes: string[]) {
    if (!codes?.length) return [];
    const tickets = await this.repository.find({
      where: { code: In(codes) },
      relations: ['registration', 'registration.event', 'registration.user'],
    });
    return tickets.filter((t) => t.status === TicketStatus.ACTIVE);
  }
}
