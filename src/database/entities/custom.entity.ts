import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class CustomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column({ default: false })
  suspended: boolean;
}
