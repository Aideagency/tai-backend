import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PrayerAmenReaction } from 'src/database/entities/prayer-amen.entity';

export class AmenDto {
  @ApiPropertyOptional({ enum: PrayerAmenReaction })
  @IsOptional()
  @IsEnum(PrayerAmenReaction)
  reaction?: PrayerAmenReaction;
}
