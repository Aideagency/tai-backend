import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { UserEntity } from '../../database/entities/user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<
  UserEntity,
  Repository<UserEntity>
> {
  protected logger = new Logger(BaseRepository.name);
  constructor(
    @InjectRepository(UserEntity) repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    try {
      return await this.repository.findOne({
        where: {
          email_address: email?.toLowerCase(),
        },
      });
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async findAllByEmailWithRelations(email: string): Promise<UserEntity[]> {
    const normalized = (email || '').toLowerCase();
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.kyc', 'kyc')
      .where('LOWER(user.primary_email_address) = :email', {
        email: normalized,
      })
      .getMany();
  }

  async findOneByUsernameWithRelations(
    username: string,
  ): Promise<UserEntity | null> {
    const normalized = (username || '').toLowerCase();
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.kyc', 'kyc')
      .where('LOWER(user.userName) = :u', { u: normalized })
      .getOne();
  }

  async findOneByCustIdWithRelations(
    custId: string,
  ): Promise<UserEntity | null> {
    const normalized = (custId || '').toLowerCase();
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.kyc', 'kyc')
      .where('LOWER(user.custId) = :cid', { cid: normalized })
      .getOne();
  }

  async findByResetToken(resetToken: string): Promise<UserEntity | undefined> {
    try {
      return await this.repository.findOne({
        where: {
          ResetCode: resetToken,
        },
      });
    } catch (e) {
      this.logger.error(e.stack);
    }
    return undefined;
  }
  async findUserWithAccountOfficer(
    userId: string,
  ): Promise<UserEntity | undefined> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    const userWithAccountOfficer = await queryBuilder
      .leftJoinAndSelect('user.account_officer', 'accountOfficer')
      .where('user.id = :userId', { userId })
      .getOne();

    return userWithAccountOfficer;
  }

  async isFirstLogin(identifier: string): Promise<boolean> {
    const normalizedIdentifier = (identifier || '').toLocaleLowerCase();

    const user = await this.repository
      .createQueryBuilder('user')
      .where('LOWER(user.primary_email_address) = :identifier', {
        identifier: normalizedIdentifier,
      })
      .orWhere('LOWER(user.userName) = :identifier', {
        identifier: normalizedIdentifier,
      })
      .orWhere('LOWER(user.custId) = :identifier', {
        identifier: normalizedIdentifier,
      })
      .getOne();

    if (!user) {
      throw new BadRequestException('Wrong username or password');
    }

    return user.lastLogonDate !== null;
  }
}
