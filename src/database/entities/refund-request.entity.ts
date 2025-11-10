import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { EventRegistrationEntity } from './event-registration.entity';
import { RefundStatus } from './event.entity';

@Entity({ name: 'RefundRequests' })
@Index(['status'])
export class RefundRequestEntity extends CustomEntity {
  @ManyToOne(() => EventRegistrationEntity, (r) => r.refunds, {
    onDelete: 'CASCADE',
  })
  registration: EventRegistrationEntity;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.REQUESTED })
  status: RefundStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  processorNote: string | null; // txn reference, etc.
}
