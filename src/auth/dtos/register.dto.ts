import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ArrayMaxSize,
  IsArray,
  IsIn,
  ArrayNotEmpty,
  IsNotEmpty,
  Matches,
  MinLength,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaritalStatus,
  CommunityTag,
  UserGender,
} from 'src/database/entities/user.entity';
import { Type, Transform } from 'class-transformer';
import { NoFutureDate, IsYYYYMMDDDate } from 'src/utils/date.validators';

@ValidatorConstraint({ name: 'MaritalExclusive', async: false })
export class MaritalExclusiveConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any) {
    if (!Array.isArray(value)) return false;
    const set = new Set(value);
    const hasSingle = set.has('SINGLE');
    const hasMarried = set.has('MARRIED');
    // valid if not both at the same time
    return !(hasSingle && hasMarried);
  }
  defaultMessage() {
    return 'community cannot contain both SINGLE and MARRIED';
  }
}

export function MaritalExclusive(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'MaritalExclusive',
      target: object.constructor,
      propertyName,
      options,
      validator: MaritalExclusiveConstraint,
    });
  };
}

export class RegisterDto {
  @ApiProperty({ example: 'sample@email.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email_address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    example: '+2348080183735',
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

  @ApiProperty()
  @IsNotEmpty({ message: 'First Name is required' })
  first_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Last Name is required' })
  last_name: string;

  @ApiProperty({ example: '1995-06-23', description: 'YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Birth Date is required' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'Birth date must be in YYYY-MM-DD format',
  })
  @IsYYYYMMDDDate()
  @NoFutureDate() // optional
  birth_date: string;

  @ApiProperty({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'Must be one of MALE, FEMALE, OTHER',
  })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  // @ApiPropertyOptional({
  //   type: [String],
  //   enum: CommunityTag,
  //   example: [MaritalStatus.MARRIED, CommunityTag.PARENT],
  //   description: 'Up to 2 values; must be one of SINGLE, MARRIED, PARENT',
  //   maxItems: 2,
  // })
  // @IsArray()
  // @ArrayNotEmpty()
  // @ArrayMaxSize(2)
  // @IsIn(Object.values(CommunityTag), { each: true })
  // @Type(() => String) // ensures transformation if input is not already array of strings
  // community: string[];

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
