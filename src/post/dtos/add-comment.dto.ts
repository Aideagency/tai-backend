// src/dto/add-comment.dto.ts
import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';
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

export class AddCommentDto {
  @ApiProperty({
    description:
      'The content of the comment that will be added to the post. Keep it concise and respectful. No HTML tags allowed.',
    example: 'This is a great post! Thanks for sharing.',
    maxLength: 500,
  })
  @IsString({ message: 'Comment must be a string.' })
  @IsNotEmpty({ message: 'Comment cannot be empty.' })
  @MaxLength(500, { message: 'Comment should not exceed 500 characters.' })
  @sanitizeComment()
  comment: string;
}
