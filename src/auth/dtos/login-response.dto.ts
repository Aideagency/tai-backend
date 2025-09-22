import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({
    example: 'result@email.com',
  })
  email_address: string;

  @ApiProperty({
    example: 1,
  })
  id: number;

  @ApiProperty({
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    example: 'Smith',
  })
  last_name: string;

  @ApiProperty({
    example: 'Single',
  })
  user_type: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1bWl3YXplYXJlQ',
  })
  token: string;

  @ApiProperty()
  user: UserDto;
}
