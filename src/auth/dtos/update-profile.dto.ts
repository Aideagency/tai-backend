import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ArrayUnique,
  IsIn,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserGender, CommunityTag } from 'src/database/entities/user.entity';
import { MaritalExclusive } from './register.dto';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '2000-10-12',
  })
  birth_date: string;

  @ApiProperty({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'Must be one of MALE, FEMALE, OTHER',
  })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  @ApiPropertyOptional({
    type: [String],
    enum: CommunityTag,
    example: [CommunityTag.MARRIED, CommunityTag.PARENT],
    description: 'Up to 2 values; must be one of SINGLE, MARRIED, PARENT',
    maxItems: 2,
  })
  @IsOptional() // allow “none”
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique({ message: 'community has duplicate values' })
  @IsIn(Object.values(CommunityTag), { each: true })
  @MaritalExclusive({
    message: 'community cannot contain both SINGLE and MARRIED',
  })
  community?: CommunityTag[];
}
