// src/database/entities/admin.entity.ts
import { Column, Entity } from 'typeorm';
import { CustomEntity } from './custom.entity';

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

@Entity({ name: 'Admins' })
export class AdminEntity extends CustomEntity {
  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: false, unique: true })
  email_address: string;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;
}
