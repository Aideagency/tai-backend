import { PartialType } from '@nestjs/swagger';
import { CreateCounsellingDto } from './create-counselling.dto';

export class UpdateCounsellingDto extends PartialType(CreateCounsellingDto) {}
