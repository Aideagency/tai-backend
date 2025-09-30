// src/nugget/dto/comment.dto.ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/** Trim, collapse whitespace, and (lightly) strip HTML tags */
function sanitizeComment() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const noHtml = value.replace(/<[^>]*>/g, ''); // strip tags
    return noHtml.replace(/\s+/g, ' ').trim(); // collapse spaces
  });
}

export class CommentDto {
  @ApiProperty({
    description:
      'Public comment text shown under a nugget. Plain text only; be concise and respectful.',
    example: 'This really spoke to me today — thank you!',
    maxLength: 500,
  })
  @IsString({ message: 'comment must be a string.' })
  @IsNotEmpty({ message: 'comment cannot be empty.' })
  @MinLength(1, { message: 'comment should be at least 2 characters long.' })
  @MaxLength(500, { message: 'comment should not exceed 500 characters.' })
  @sanitizeComment()
  comment: string;
}
