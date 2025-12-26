// src/repository/resourses/section-attachment.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { SectionAttachmentEntity } from 'src/database/entities/section-attachment.entity';

@Injectable()
export class SectionAttachmentRepository extends BaseRepository<
  SectionAttachmentEntity,
  Repository<SectionAttachmentEntity>
> {
  protected logger = new Logger(SectionAttachmentRepository.name);

  constructor(
    @InjectRepository(SectionAttachmentEntity)
    repo: Repository<SectionAttachmentEntity>,
  ) {
    super(repo);
  }

  async listForSection(sectionId: number) {
    return this.repository.find({
      where: { sectionId } as any,
      order: { createdAt: 'ASC' } as any,
    });
  }
}
