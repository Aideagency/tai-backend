// src/repository/admin/admin.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { AdminEntity, AdminRole } from 'src/database/entities/admin.entity';

export interface AdminSearchParams {
  page?: number;
  pageSize?: number;
  q?: string; // search by name/email
  is_active?: boolean; // filter
  role?: AdminRole; // filter
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminRepository extends BaseRepository<
  AdminEntity,
  Repository<AdminEntity>
> {
  protected logger = new Logger(AdminRepository.name);

  constructor(
    @InjectRepository(AdminEntity)
    repository: Repository<AdminEntity>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<AdminEntity | undefined> {
    const normalized = (email || '').toLowerCase();
    return this.findOne({ email_address: normalized });
  }

  async existsSuperAdmin(): Promise<boolean> {
    const count = await this.count({ role: AdminRole.SUPER_ADMIN });
    return !!count && count > 0;
  }

  private baseQB(params: AdminSearchParams): SelectQueryBuilder<AdminEntity> {
    const qb = this.query('a');

    // filters
    if (typeof params.is_active === 'boolean') {
      qb.andWhere('a.is_active = :active', { active: params.is_active });
    }
    if (params.role) {
      qb.andWhere('a.role = :role', { role: params.role });
    }

    // keyword search
    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(a.first_name) ILIKE :q OR LOWER(a.last_name) ILIKE :q OR LOWER(a.email_address) ILIKE :q)',
        { q },
      );
    }

    const orderBy = params.orderBy || 'id';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`a.${orderBy}`, orderDir);

    return qb;
  }

  async searchPaginated(params: AdminSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.baseQB(params);

    // use BaseRepository.paginate
    return this.paginate(
      { page, limit: pageSize },
      {}, // filter handled in qb
      { id: 'DESC' }, // ignored when using qb; required by signature
      {}, // relations
      qb, // query builder
    );
  }
}
