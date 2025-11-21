import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { EventEntity, EventStatus } from 'src/database/entities/event.entity';
import { RegistrationStatus } from 'src/database/entities/event-registration.entity';
import { GetEventsFilterDto } from 'src/event/dtos/get-events-query.dto';

@Injectable()
export class EventRepository extends BaseRepository<
  EventEntity,
  Repository<EventEntity>
> {
  protected logger = new Logger(EventRepository.name);

  constructor(
    @InjectRepository(EventEntity) repository: Repository<EventEntity>,
  ) {
    super(repository);
  }

  // Method to create a new event
  async createEvent(eventData: Partial<EventEntity>): Promise<EventEntity> {
    const event = this.repository.create(eventData);
    return this.repository.save(event);
  }

  // Method to update an event, ensuring the price can't be updated if registrations exist
  async updateEvent(
    id: number,
    eventData: Partial<EventEntity>,
  ): Promise<EventEntity> {
    const event = await this.repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.registrations', 'registration')
      .where('event.id = :id', { id })
      .getOne();
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    // Prevent updating price if event has registrations
    if (eventData.price !== undefined && event.registrations.length > 0) {
      throw new BadRequestException(
        'Event price cannot be updated after registrations',
      );
    }

    // Update event data
    Object.assign(event, eventData);
    return this.repository.save(event);
  }

  // Find an event by ID
  async findEventById(id: number): Promise<EventEntity> {
    const event = await this.repository.findOne({ where: { id } });
    if (!event) {
      throw new BadRequestException('Event not found');
    }
    return event;
  }

  async findDetailedEventById(id: number) {
    const event = await this.repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.registrations', 'registration')
      .leftJoinAndSelect('registration.user', 'u') // 👈 change alias here
      .select([
        // Event fields
        'event.id',
        'event.updatedAt',
        'event.createdAt',
        'event.deleted',
        'event.suspended',
        'event.title',
        'event.description',
        'event.type',
        'event.status',
        'event.mode',
        'event.locationText',
        'event.locationUrl',
        'event.coverImageUrl',
        'event.startsAt',
        'event.endsAt',
        'event.capacity',
        'event.icsToken',
        'event.price',

        // Registration fields
        'registration.id',
        'registration.updatedAt',
        'registration.createdAt',
        'registration.deleted',
        'registration.suspended',
        'registration.status',
        'registration.quantity',
        'registration.unitPrice',
        'registration.paidAt',
        'registration.cancelledAt',

        // User – only minimal fields
        'u.id',
        'u.first_name',
        'u.last_name',
        'u.email_address',
        // 'u.community', // 👈 uncomment if this column actually exists
      ])
      .where('event.id = :id', { id })
      .getOne();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const registrations = event.registrations || [];

    const stats = {
      total: registrations.length,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      refunded: 0,
    };

    for (const reg of registrations) {
      switch (reg.status) {
        case RegistrationStatus.CONFIRMED:
          stats.confirmed++;
          break;
        case RegistrationStatus.PENDING_PAYMENT:
          stats.pending++;
          break;
        case RegistrationStatus.CANCELLED:
          stats.cancelled++;
          break;
        case RegistrationStatus.REFUNDED:
          stats.refunded++;
          break;
      }
    }

    return {
      event,
      registrations,
      stats,
    };
  }

  /**
   * Paginated + filtered events
   * Uses GetEventsFilterDto (type, upcomingOnly, freeOnly, paidOnly, q, page, pageSize)
   * Optionally still supports status if you want to pass it from service.
   */
  async searchEventsPaginated(
    params: GetEventsFilterDto & { status?: EventStatus },
  ) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.max(Number(params.pageSize) || 20, 1);

    const qb = this.baseQB(params);

    return this.paginate(
      { page, limit: pageSize },
      {},
      { startsAt: 'ASC' },
      {},
      qb,
    );
  }

  /**
   * Base query builder with all filters
   */
  private baseQB(
    params: GetEventsFilterDto & { status?: EventStatus },
  ): SelectQueryBuilder<EventEntity> {
    const qb = this.query('e');

    const { status, type, upcomingOnly, freeOnly, paidOnly, q } = params;

    // Filter by status (if provided)
    if (status) {
      qb.andWhere('e.status = :status', { status });
    }

    // Filter by type (enum)
    if (type) {
      qb.andWhere('e.type = :type', { type });
    }

    // Upcoming only: events that start in the future (or now)
    if (upcomingOnly) {
      qb.andWhere('e.startsAt >= :now', { now: new Date() });
    }

    // Free vs paid filters:
    // - freeOnly = true, paidOnly != true => price = 0 or NULL
    // - paidOnly = true, freeOnly != true => price > 0
    // - both true or both false => no price filter
    if (freeOnly && !paidOnly) {
      qb.andWhere('(e.price IS NULL OR e.price = 0)');
    } else if (paidOnly && !freeOnly) {
      qb.andWhere('e.price IS NOT NULL AND e.price > 0');
    }

    // Text search in title / description / locationText
    if (q && q.trim().length > 0) {
      const text = `%${q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(e.title) LIKE :text OR LOWER(e.description) LIKE :text OR LOWER(e.locationText) LIKE :text)',
        { text },
      );
    }

    qb.orderBy('e.startsAt', 'ASC');

    return qb;
  }

  // Find events with a specific filter (for example: location or type)
  async findEventsByFilter(filter: {
    locationText?: string;
    type?: string;
  }): Promise<EventEntity[]> {
    const qb = this.query('e');
    if (filter.locationText) {
      qb.andWhere('e.locationText = :locationText', {
        locationText: filter.locationText,
      });
    }
    if (filter.type) {
      qb.andWhere('e.type = :type', { type: filter.type });
    }
    return qb.getMany();
  }

  async deleteEvent(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Event not found');
    }
  }

  // Ensure that event price updates are not allowed if there are any existing registrations
  private async canUpdatePrice(eventId: number): Promise<boolean> {
    const event = await this.findOne({ id: eventId });
    if (event && event.registrations && event.registrations.length > 0) {
      return false;
    }
    return true;
  }
}
