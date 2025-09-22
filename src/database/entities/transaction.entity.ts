import { Entity, Column, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failure = 'failure',
  Abandoned = 'abandoned',
}

export enum WithdrawRequestStatus {
  Pending = 'pending',
  Success = 'success',
  Failure = 'failure',
  Abandoned = 'abandoned',
  Rejected = 'rejected',
}

export enum TransactionProductType {
  SecuritiesTrading = 'Securities Trading',
  NGNWallet = 'NGN Wallet',
  FixedIncomeNGN = 'Fixed Income NGN',
  AlphaFund = 'Alpha Fund',
  EquityFund = 'Equity Fund',
  MMFFund = 'MMF Fund',
  SMANGN = 'SMA NGN',
}

export enum MutaulFundType {
  ALPHA_FUND = 'alpha_fund',
  EQUITY_FUND = 'equity_fund',
  MONEY_MARKET_FUND = 'money_market_fund',
}

export enum CbaPostingStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

@Entity('Transactions')
export class TransactionEntity extends CustomEntity {
  @Column()
  transaction_ref: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  pay_comment: string;

  @Column({ nullable: true })
  client_id: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email_address: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  channel: string;

  @Column({ nullable: true })
  product_type: string;

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

  @Column({ type: 'timestamp', nullable: true })
  transaction_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  Fincon_date: Date;

  @Column({ nullable: true, default: 'NGN' })
  currency_code: string;

  @Column({ nullable: true })
  product_description: string;

  @Column({ nullable: true })
  hash: string;

  @Column({ nullable: true })
  paystack_id: string;

  @Column({ nullable: true })
  paystack_ref: string;

  @ManyToOne(() => UserEntity, (user) => user.transactions, { nullable: true })
  user: UserEntity;
}
