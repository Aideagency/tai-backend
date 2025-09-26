// src/admin/dtos/update-user-by-admin.dto.ts
import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ArrayUnique,
  ArrayMaxSize,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserGender, CommunityTag } from 'src/database/entities/user.entity';

export class UpdateUserByAdminDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Updated first name of the user',
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Updated last name of the user',
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  last_name?: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Updated middle name of the user (if applicable)',
  })
  @IsOptional()
  @IsString({ message: 'Middle name must be a string' })
  middle_name?: string;

  @ApiPropertyOptional({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'Updated gender of the user. Must be one of MALE or FEMALE',
  })
  @IsOptional()
  @IsEnum(UserGender, { message: 'Gender must be either MALE or FEMALE' })
  gender?: UserGender;

  @ApiPropertyOptional({
    example: '1995-06-23',
    description: 'Updated birth date of the user (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({
    message: 'Birth date must be a valid string in YYYY-MM-DD format',
  })
  birth_date?: string;

  @ApiPropertyOptional({
    example: 'johndoe@example.com',
    description: 'Updated email address of the user (must be unique)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email_address?: string;

  @ApiPropertyOptional({
    example: '+2348080183735',
    description: 'Updated phone number of the user in international format',
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone_no?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: CommunityTag,
    example: [CommunityTag.MARRIED, CommunityTag.PARENT],
    description:
      'Updated community tags. Up to 2 values allowed; must be one of SINGLE, MARRIED, or PARENT. Admin sets this directly, and it maps internally to marital_status/is_parent.',
  })
  @IsOptional()
  @IsArray({ message: 'Community must be an array' })
  @ArrayUnique({ message: 'Community values must be unique' })
  @ArrayMaxSize(2, { message: 'Community cannot have more than 2 values' })
  community?: CommunityTag[];
}
