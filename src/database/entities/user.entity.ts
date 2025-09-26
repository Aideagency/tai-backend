import { Column, Entity, OneToMany } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { TransactionEntity } from './transaction.entity';

export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
}

export enum CommunityTag {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  PARENT = 'PARENT',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity({ name: 'Users' })
export class UserEntity extends CustomEntity {
  @Column({ nullable: false })
  last_name: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  auth_provider: AuthProvider;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column({ nullable: true, enum: UserGender, type: 'enum' })
  gender: string | null;

  @Column({ nullable: true })
  birth_date: string | null;

  @Column({ nullable: false, unique: true })
  email_address: string;

  @Column({ unique: true, nullable: true })
  phone_no: string | null;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'enum', enum: MaritalStatus, nullable: true })
  marital_status: MaritalStatus | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_parent: boolean;

  @Column({ nullable: true })
  ResetCode: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetTokenExpiration: Date | null;

  @Column({ default: false })
  is_email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogonDate: Date | null;

  @Column({ nullable: true, unique: true })
  userName: string;

  @Column({ type: 'text', nullable: true })
  profilePicture: string;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
  transactions: TransactionEntity[];
}

//   @OneToMany(() => Document, (document) => document.user)
//   documents: Document[];

//   @OneToMany(() => Account, (account) => account.user)
//   accounts: Account[];

//   @OneToMany(() => NubanAccount, (nubanAccount) => nubanAccount.user)
//   nubanAccounts: NubanAccount[];

//   @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
//   transactions: TransactionEntity[];

//   @OneToMany(() => FavoriteStocks, (favoriteStock) => favoriteStock.user)
//   favoriteStocks: FavoriteStocks[];

//   @OneToMany(() => WatchListEntity, (watchlist) => watchlist.user)
//   watchlists: WatchListEntity[];

//   @OneToMany(() => KycEntity, (kyc) => kyc.user)
//   kyc: KycEntity[];

//   @OneToMany(() => UserBank, (bank) => bank.user)
//   banks: UserBank[];

//   @OneToMany(() => NextOfKin, (nextOfKin) => nextOfKin.user)
//   nextOfKin: NextOfKin[];

//   @OneToOne(() => Employer, (employer) => employer.user)
//   employer: Employer;

//   @OneToMany(() => Beneficiary, (beneficiary) => beneficiary.user)
//   beneficiaries: Beneficiary[];

//   @OneToMany(() => Contact, (contact) => contact.user)
//   contacts: Contact[];

//   @OneToMany(() => Address, (address) => address.user)
//   addresses: Address[];

//   @OneToMany(() => Identity, (identity) => identity.user)
//   identities: Identity[];

//   @OneToMany(() => WalletLimit, (walletLimit) => walletLimit.user)
//   walletLimits: WalletLimit[];

//   @OneToMany(
//     () => TransferRecipient,
//     (transferRecipient) => transferRecipient.user,
//   )
//   transferRecipients: TransferRecipient[];

//   @OneToMany(
//     () => WalletTransaction,
//     (WalletTransaction) => WalletTransaction.user,
//   )
//   walletTransactions: WalletTransaction[];

//   @OneToMany(() => WithdrawRequest, (withdrawRequest) => withdrawRequest.user)
//   withdrawRequests: WithdrawRequest[];

//   @ManyToOne(() => AccountOfficerEntity, (acctOfficer) => acctOfficer.users, {
//     nullable: true,
//   })
//   account_officer: AccountOfficerEntity;

//   @ManyToOne(() => CustomerCatgoryEntity, (category) => category.users, {
//     nullable: true,
//   })
//   category: CustomerCatgoryEntity;

//   @OneToMany(() => FeedbackEntity, (feedback) => feedback.user)
//   feedback: FeedbackEntity[];

//   @OneToMany(
//     () => MutualFundsSubscriptionEntity,
//     (subscription) => subscription.user,
//   )
//   fundsSubscriptions: MutualFundsSubscriptionEntity[];

//   @OneToMany(() => MutualFundsRedemptionEntity, (redemption) => redemption.user)
//   fundsRedemptions: MutualFundsRedemptionEntity[];

//   @OneToMany(() => CSCSAccountEntity, (cscsAccount) => cscsAccount.user)
//   cscsAccount: CSCSAccountEntity[];

//   @OneToMany(() => KycRequestEntity, (kyc_request) => kyc_request.user)
//   kycRequests: KycRequestEntity[];

//   @OneToMany(() => InvestmentEntity, (subscription) => subscription.user)
//   assetManagementInvestments: InvestmentEntity[];

//   @OneToMany(() => AdminUpdateRequestEntity, (request) => request.user)
//   updateRequests: AdminUpdateRequestEntity[];

// import { Document } from './docment.entity';
// import { Account } from './account.entity';
// import { TransactionEntity } from './transaction.entity';
// import { FavoriteStocks } from './favorite-stocks.entity';
// import { WatchListEntity } from './watchlist.entity';
// import { KycEntity } from './kyc.entity';
// import { UserBank } from './user-banks.entity';
// import { NextOfKin } from './nextOfKin.entity';
// import { Employer } from './employer.entity';
// import { Beneficiary } from './beneficiary.entity';
// import { Contact } from './user-contact.entity';
// import { Address } from './address.entity';
// import { Identity } from './identity.entity';
// import { AccountOfficerEntity } from './account-officer.entity';
// import { WalletLimit } from './wallet_limit.entity';
// import { TransferRecipient } from './transfer-recipient.entity';
// import { WithdrawRequest } from './withdraw_request.entity';
// import { WalletTransaction } from './wallet-transaction.entity';
// import { NubanAccount } from './nuban-account.entity';
// import { CustomerCatgoryEntity } from './cutomer-category.entity';
// import { FeedbackEntity } from './feedback.entity';
// import { MutualFundsRedemptionEntity } from './mutual-fund-redemption.entity';
// import { MutualFundsSubscriptionEntity } from './mutual-fund-subscription.entity';
// import { CSCSAccountEntity } from './cscs-account.entity';
// import { KycRequestEntity } from './kyc-request.entity';
// import { AgencyEntity } from './agency.entity';
// import { RecurringChargeEntity } from './recurring-charge.entity';
// import { PartnerEntity } from './partner.entity';
// import { InvestmentEntity } from './asset-management-investments.entity';
// import { AdminUpdateRequestEntity } from './admin-update-request.entity';
