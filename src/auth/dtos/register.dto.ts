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

  @ApiProperty({ example: 'P@ssword1' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'Biola' })
  @IsNotEmpty({ message: 'First Name is required' })
  first_name: string;

  @ApiProperty({ example: 'Chukwudi' })
  @IsNotEmpty({ message: 'Last Name is required' })
  last_name: string;
}
