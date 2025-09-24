import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatus } from 'src/database/entities/user.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Bola',
  })
  first_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Ige',
  })
  last_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '2000-10-12',
  })
  birth_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty({
    enum: MaritalStatus,
    example: MaritalStatus,
  })
  marital_status: MaritalStatus;
}
