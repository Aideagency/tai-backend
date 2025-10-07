import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment!: string;

  @ApiPropertyOptional({ description: 'Reply to (threaded) comment id' })
  @IsOptional()
  parentCommentId?: number;
}
