import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { TransactionEntity } from 'src/database/entities/transaction.entity';

@Injectable()
export class TransactionRepository extends BaseRepository<
  TransactionEntity,
  Repository<TransactionEntity>
> {
  protected logger = new Logger(BaseRepository.name);
  constructor(
    @InjectRepository(TransactionEntity)
    repository: Repository<TransactionEntity>,
  ) {
    super(repository);
  }

  async findOneByReference(reference: string, relation: object = {}) {
    try {
      return await this.repository.findOne({
        where: {
          transaction_ref: reference,
        },
        relations: relation,
      });
    } catch (err) {
      this.logger.error(err.stack);
    }

    return undefined;
  }
}
