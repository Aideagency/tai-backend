// src/dto/create-post.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/** Trim, collapse whitespace, and (lightly) strip HTML tags */
function sanitizeText() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const noHtml = value.replace(/<[^>]*>/g, ''); // strip tags
    return noHtml.replace(/\s+/g, ' ').trim(); // collapse spaces
  });
}

export class CreatePostDto {
  @ApiProperty({
    description:
      'Body of the post, which can be a rich text or plain text. Should provide meaningful content for your audience.',
    example: 'This is an example of a post body.',
    maxLength: 1000,
  })
  @IsString({ message: 'Post body must be a string.' })
  @IsNotEmpty({ message: 'Post body cannot be empty.' })
  @MinLength(10, {
    message: 'Post body should be at least 10 characters long.',
  })
  @MaxLength(1000, { message: 'Post body should not exceed 1000 characters.' })
  @sanitizeText()
  body: string;

  @ApiProperty({
    description:
      'Optional title for the post, which can provide additional context or a catchy headline.',
    example: 'Exciting News in the Tech World!',
    required: false,
  })
  @IsString({ message: 'Title must be a string.' })
  @IsOptional()
  @MaxLength(200, { message: 'Title should not exceed 200 characters.' })
  title?: string;
}
