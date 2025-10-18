import { Column, Entity, OneToMany } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { TransactionEntity } from './transaction.entity';
import { PrayerWallEntity } from './prayer-wall.entity';

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

  @OneToMany(() => PrayerWallEntity, (prayer) => prayer.user)
  prayers: PrayerWallEntity[];
}
