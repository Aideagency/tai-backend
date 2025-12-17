import { Entity, Column, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failure = 'failure',
  Abandoned = 'abandoned',
}

export enum PaidFor {
  EVENT = 'EVENT',
  COUNSELLING = 'COUNSELLING',
  COURSE = 'COURSE',
  BOOK = 'BOOk',
}

@Entity('Transactions')
export class TransactionEntity extends CustomEntity {
  @Column({ nullable: true })
  transaction_ref: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
    nullable: false,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  email_address: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({
    type: 'enum',
    enum: PaidFor,
    nullable: false,
  })
  paid_for: PaidFor;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  charge: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  actualAmount: number;

  @Column({ nullable: true, default: 'NGN' })
  currency_code: string;

  @Column({ nullable: true })
  hash: string;

  @Column({ nullable: true })
  paystack_ref: string;

  @ManyToOne(() => UserEntity, (user) => user.transactions, { nullable: true })
  user: UserEntity;
}
