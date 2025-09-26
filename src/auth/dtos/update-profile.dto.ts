import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ArrayUnique,
  IsIn,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserGender, CommunityTag } from 'src/database/entities/user.entity';
import { MaritalExclusive } from './register.dto';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '2000-10-12',
  })
  birth_date: string;

  @ApiProperty({
    example: '+2348089186735',
    description:
      'Phone number in E.164 format. If no country code is provided, defaults to Nigeria (+234).',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    // Strip spaces, dashes, parentheses
    let phone = value.replace(/\s|[-().]/g, '');

    // If user didn’t provide a +country code, assume Nigeria
    if (!phone.startsWith('+')) {
      if (phone.startsWith('0')) {
        // strip leading zero if given like "0808..."
        phone = phone.substring(1);
      }
      phone = `+234${phone}`;
    }

    return phone;
  })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone must be in E.164 format (e.g., +2348080183735)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone_no!: string;

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
