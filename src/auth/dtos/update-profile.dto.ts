import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsIn,
  ArrayMaxSize,
  Matches,
  ValidateIf,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserGender, CommunityTag } from 'src/database/entities/user.entity';
import { MaritalExclusive } from './register.dto';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    example: '2000-10-12',
  })
  birth_date?: string; // Made optional by adding `?`

  @IsOptional()
  @ApiPropertyOptional({
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
  phone_no?: string; // Made optional by adding `?`

  @IsOptional()
  @ApiPropertyOptional({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'Must be one of MALE, FEMALE, OTHER',
  })
  gender?: string; // Made optional by adding `?`

  // @IsOptional()
  // @ApiPropertyOptional({
  //   type: [String],
  //   enum: CommunityTag,
  //   example: [CommunityTag.MARRIED, CommunityTag.PARENT],
  //   description: 'Up to 2 values; must be one of SINGLE, MARRIED, PARENT',
  //   maxItems: 2,
  // })
  // @ValidateIf((o) => o.community !== undefined)
  // @IsArray()
  // @ArrayMaxSize(2)
  // @ArrayUnique({ message: 'community has duplicate values' })
  // @IsIn(Object.values(CommunityTag), { each: true })
  // @MaritalExclusive({
  //   message: 'community cannot contain both SINGLE and MARRIED',
  // })
  // community?: CommunityTag[]; // Made optional by adding `?`

  @IsOptional()
  @ApiPropertyOptional({
    type: [String],
    enum: CommunityTag,
    example: [CommunityTag.MARRIED, CommunityTag.PARENT],
    description: 'Up to 2 values; must be one of SINGLE, MARRIED, PARENT',
    maxItems: 2,
  })
  @Transform(({ value }) => {
    // treat undefined/empty as "not provided"
    if (value === undefined || value === null || value === '') return undefined;

    // already an array (e.g., sent as community[]=SINGLE&community[]=PARENT)
    if (Array.isArray(value)) return value;

    // try JSON array string: '["SINGLE","PARENT"]'
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fall through
      }
      // fallback: comma-separated "SINGLE,PARENT"
      return value.split(',').map((s) => s.trim());
    }

    // final fallback: wrap single value
    return [value];
  })
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique({ message: 'community has duplicate values' })
  @IsIn(Object.values(CommunityTag), { each: true })
  @MaritalExclusive({
    message: 'community cannot contain both SINGLE and MARRIED',
  })
  community?: CommunityTag[];

  @IsOptional()
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional profile picture upload (PNG/JPG/GIF).',
  })
  profilePicture?: any;

  @ApiProperty({ example: 'Biola' })
  @IsNotEmpty({ message: 'First Name is required' })
  first_name: string;

  @ApiProperty({ example: 'Chukwudi' })
  @IsNotEmpty({ message: 'Last Name is required' })
  last_name: string;

  @ApiProperty({ example: 'sample@email.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email_address: string;
}
