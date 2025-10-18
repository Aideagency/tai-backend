import { Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomEntity } from '../database/entities/custom.entity';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseRepository<
  Entity extends CustomEntity,
  Repo extends Repository<Entity>,
> {
  protected logger = new Logger(BaseRepository.name);

  protected constructor(protected readonly repository: Repo) {}

  async findOne(
    filter: any,
    relation: object = {},
  ): Promise<Entity | undefined> {
    const allFilters = {
      where: filter,
      relations: relation,
    };

    try {
      return await this.repository.findOne(allFilters);
    } catch (e) {
      this.logger.error(e.stack);
    }
    return undefined;
  }

  async findAll(
    obj: any,
    relation: object = {},
    order: object = { id: 'ASC' },
  ) {
    try {
      return await this.repository.find({
        where: obj,
        relations: relation,
        order,
      });
    } catch (e) {
      this.logger.error(e.stack);
    }
  }

  async findAllBy(obj: any) {
    try {
      return await this.repository.findBy(obj);
    } catch (e) {
      this.logger.error(e.stack);
    }
  }

  async count(obj?: any, relation: object = {}) {
    try {
      if (!obj) {
        return await this.repository.count();
      }
      return await this.repository.count({
        where: obj,
        relations: relation,
      });
    } catch (e) {
      this.logger.error(e.stack);
    }
  }

  async save(model: Entity): Promise<Entity | undefined> {
    try {
      await this.repository.save(model);

      return model;
    } catch (e) {
      this.logger.error(e.stack);
      console.log({ error: e });
    }

    return undefined;
  }

  async saveAll(models: Entity[]): Promise<Entity[] | undefined> {
    try {
      return await this.repository.save(models);
    } catch (e) {
      this.logger.error(e.st);
    }

    return undefined;
  }

  async remove(model: Entity): Promise<Entity | undefined> {
    try {
      await this.repository.remove(model);

      return model;
    } catch (e) {
      this.logger.error(e.stack);
      console.log({ error: e });
    }

    return undefined;
  }

  async removeAll(models: Entity[]): Promise<Entity[] | undefined> {
    try {
      return await this.repository.remove(models);
    } catch (e) {
      this.logger.error(e.st);
    }

    return undefined;
  }

  async softDelete(modelId: number): Promise<boolean | undefined> {
    try {
      await this.repository.softDelete(modelId);

      return true;
    } catch (e) {
      this.logger.error(e.stack);
    }

    return undefined;
  }

  async hardDelete(modelId: number): Promise<boolean | undefined> {
    try {
      await this.repository.delete(modelId);

      return true;
    } catch (e) {
      this.logger.error(e.stack);
    }

    return undefined;
  }

  query(tbName: string = null): SelectQueryBuilder<Entity> {
    try {
      if (!tbName) {
        return this.repository.createQueryBuilder();
      }

      return this.repository.createQueryBuilder(tbName);
    } catch (e) {
      this.logger.error(e.stack);
    }

    return undefined;
  }

  async paginate(
    options: IPaginationOptions,
    filter: object,
    order: object,
    relation: object = {},
    query: any = null,
  ): Promise<Pagination<Entity>> {
    return paginate<Entity>(query != null ? query : this.repository, options, {
      where: filter,
      order: order,
      relations: relation,
    });
  }

  async create(model: Entity): Promise<Entity | undefined> {
    try {
      const entity = this.repository.create(model); // Creates an instance of the entity
      await this.repository.save(entity); // Saves the entity to the database
      return entity; // Return the saved entity
    } catch (e) {
      this.logger.error(e.stack);
      return undefined; // Return undefined if there's an error
    }
  }
  async findByUserId(userId: number): Promise<Entity | undefined> {
    return this.findOne({ user: { id: userId } }, { user: true });
  }

  async insert(
    values: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ) {
    return this.repository.insert(values as any);
  }

  async deleteAllEntries() {
    await this.repository.deleteAll();
  }

  /** Fire-and-forget insert (never await in request path). */
  insertFireAndForget(
    values: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ) {
    this.repository.insert(values as any).catch(() => {
      // Swallow errors: logging must not impact the request path
    });
  }
}
