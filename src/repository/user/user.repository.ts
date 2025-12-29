// src/repository/user/user.repository.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  CommunityTag,
  MaritalStatus,
  UserEntity,
} from 'src/database/entities/user.entity';

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
      .orWhere('LOWER(u.user_name) = :id', { id: normalized })
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

  private baseQB(
    params: UserSearchParams & { excludeId?: number },
  ): SelectQueryBuilder<UserEntity> {
    const qb = this.query('u');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        `(
        LOWER(u.first_name) ILIKE :q OR
        LOWER(u.last_name)  ILIKE :q OR
        LOWER(u.email_address) ILIKE :q OR
        u.phone_no ILIKE :q
      )`,
        { q },
      );
    }

    if (typeof params.suspended === 'boolean') {
      qb.andWhere('u.suspended = :s', { s: params.suspended });
    }

    // 🧩 exclude the searching user
    if (params.excludeId) {
      qb.andWhere('u.id <> :excludeId', { excludeId: params.excludeId });
    }

    const orderBy = params.orderBy || 'id';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`u.${orderBy}`, orderDir);

    return qb;
  }

  async searchPaginated(params: UserSearchParams & { excludeId?: number }) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    const result = await this.paginate(
      { page, limit: pageSize },
      {}, // no static filter
      { id: 'DESC' },
      {}, // no relations
      qb,
    );

    // Transform every user through toSubmissionResponse
    return {
      ...result,
      items: result.items.map((u) => this.toSubmissionResponse(u)),
    };
  }

  // async searchPaginated(params: UserSearchParams) {
  //   const page = Math.max(params.page || 1, 1);
  //   const pageSize = Math.max(params.pageSize || 20, 1);
  //   const qb = this.baseQB(params);

  //   return this.paginate(
  //     { page, limit: pageSize },
  //     {}, // filter already in qb
  //     { id: 'DESC' }, // ignored when qb present
  //     {}, // relations
  //     qb,
  //   );
  // }

  async restoreUser(userId: number): Promise<boolean> {
    try {
      await this.repository.restore(userId);
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }

  async searchUsersPaginated(params: UserSearchParams) {
    const qb = this.baseQB(params);
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  async findOneSafe(where: Partial<UserEntity>) {
    const user = await this.repository.findOne({ where });
    return this.toSubmissionResponse(user);
  }

  async findManySafe(where?: Partial<UserEntity>) {
    const users = await this.repository.find({ where });
    return users.map((u) => this.toSubmissionResponse(u));
  }

  toSubmissionResponse(user: UserEntity) {
    if (!user) return null;

    // Strip sensitive fields
    const {
      is_parent,
      marital_status,
      email_address,
      // is_email_verified,
      middle_name,
      first_name,
      last_name,
      gender,
      birth_date,
      phone_no,
      profilePictureUrl,
      id,
    } = user;

    // Rebuild community field from stored flags
    const community: string[] = [];
    if (is_parent) {
      community.push(CommunityTag.PARENT);
    }
    if (marital_status === MaritalStatus.SINGLE) {
      community.push(CommunityTag.SINGLE);
    }
    if (marital_status === MaritalStatus.MARRIED) {
      community.push(CommunityTag.MARRIED);
    }

    return {
      first_name,
      last_name,
      middle_name,
      email_address,
      // is_email_verified,
      gender,
      birth_date,
      phone_no,
      profilePictureUrl,
      community,
      id,
    };
  }
}
