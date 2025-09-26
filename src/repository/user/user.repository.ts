// src/repository/user/user.repository.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserEntity } from 'src/database/entities/user.entity';

export interface UserSearchParams {
  page?: number;
  pageSize?: number;
  q?: string; // name/email/phone
  suspended?: boolean; // if you store it on User/CustomEntity
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class UserRepository extends BaseRepository<
  UserEntity,
  Repository<UserEntity>
> {
  protected logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(UserEntity) repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    const normalized = (email || '').toLowerCase();
    return this.findOne({ email_address: normalized });
  }

  async findByResetToken(resetToken: string): Promise<UserEntity | undefined> {
    return this.findOne({ ResetCode: resetToken });
  }

  // returns true if this is the user's first login
  async isFirstLogin(identifier: string): Promise<boolean> {
    const normalized = (identifier || '').toLowerCase();
    const user = await this.query('u')
      .where('LOWER(u.email_address) = :id', { id: normalized })
      .orWhere('LOWER(u.userName) = :id', { id: normalized })
      .getOne();

    if (!user) throw new BadRequestException('Wrong username or password');

    // First login if there's NO lastLogonDate yet
    return user.lastLogonDate == null;
  }

  async emailExists(
    email: string,
    exceptId?: number | string,
  ): Promise<boolean> {
    const normalized = (email || '').toLowerCase();
    const qb = this.query('u').where('LOWER(u.email_address) = :email', {
      email: normalized,
    });
    if (exceptId) qb.andWhere('u.id <> :id', { id: exceptId });
    const found = await qb.getOne();
    return !!found;
  }

  async phoneExists(
    phone: string,
    exceptId?: number | string,
  ): Promise<boolean> {
    const qb = this.query('u').where('u.phone_no = :phone', { phone });
    if (exceptId) qb.andWhere('u.id <> :id', { id: exceptId });
    const found = await qb.getOne();
    return !!found;
  }

  private baseQB(params: UserSearchParams): SelectQueryBuilder<UserEntity> {
    const qb = this.query('u');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.first_name) ILIKE :q OR LOWER(u.last_name) ILIKE :q OR LOWER(u.email_address) ILIKE :q OR u.phone_no ILIKE :q)',
        { q },
      );
    }

    if (typeof params.suspended === 'boolean') {
      // If `suspended` is a real column on User/CustomEntity:
      qb.andWhere('u.suspended = :s', { s: params.suspended });
    }

    const orderBy = params.orderBy || 'id';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`u.${orderBy}`, orderDir);

    return qb;
  }

  async searchPaginated(params: UserSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    return this.paginate(
      { page, limit: pageSize },
      {}, // filter already in qb
      { id: 'DESC' }, // ignored when qb present
      {}, // relations
      qb,
    );
  }

  async restoreUser(userId: number): Promise<boolean> {
    try {
      await this.repository.restore(userId);
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }
}
