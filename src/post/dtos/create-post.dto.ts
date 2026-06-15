// src/dto/create-post.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEnum,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CommunityTag } from 'src/database/entities/user.entity';
import { PostAttachmentType } from 'src/database/entities/post-attachment.entity';

/** Trim, collapse whitespace, and (lightly) strip HTML tags */
function sanitizeText() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const noHtml = value.replace(/<[^>]*>/g, ''); // strip tags
    return noHtml.replace(/\s+/g, ' ').trim(); // collapse spaces
  });
}

export class PostAttachmentDto {
  @ApiProperty({
    description: 'Attachment type.',
    enum: PostAttachmentType,
    example: PostAttachmentType.IMAGE,
  })
  @IsEnum(PostAttachmentType)
  type: PostAttachmentType;

  @ApiProperty({
    description: 'Public URL for the attachment.',
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    maxLength: 2000,
  })
  @IsString({ message: 'Attachment URL must be a string.' })
  @IsNotEmpty({ message: 'Attachment URL cannot be empty.' })
  @MaxLength(2000, {
    message: 'Attachment URL should not exceed 2000 characters.',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'Optional attachment title or display name.',
    example: 'Family values worksheet',
    maxLength: 255,
  })
  @IsString({ message: 'Attachment title must be a string.' })
  @IsOptional()
  @MaxLength(255, {
    message: 'Attachment title should not exceed 255 characters.',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional provider public ID, useful for Cloudinary cleanup.',
    example: 'posts/family-values/sample',
    maxLength: 500,
  })
  @IsString({ message: 'Attachment public ID must be a string.' })
  @IsOptional()
  @MaxLength(500, {
    message: 'Attachment public ID should not exceed 500 characters.',
  })
  publicId?: string;

  @ApiPropertyOptional({
    description: 'Optional MIME type.',
    example: 'image/jpeg',
    maxLength: 100,
  })
  @IsString({ message: 'Attachment MIME type must be a string.' })
  @IsOptional()
  @MaxLength(100, {
    message: 'Attachment MIME type should not exceed 100 characters.',
  })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Optional attachment size in bytes.',
    example: 245760,
  })
  @Type(() => Number)
  @IsInt({ message: 'Attachment size must be an integer.' })
  @Min(0, { message: 'Attachment size cannot be negative.' })
  @IsOptional()
  sizeBytes?: number;
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

  @ApiPropertyOptional({
    description: 'Community segment this post targets.',
    enum: CommunityTag,
    example: CommunityTag.MARRIED,
  })
  @IsEnum(CommunityTag)
  @IsOptional()
  community?: CommunityTag;

  @ApiPropertyOptional({
    description: 'Optional post attachments. A post can have at most 4.',
    type: [PostAttachmentDto],
    maxItems: 4,
  })
  @IsArray({ message: 'Attachments must be an array.' })
  @ArrayMaxSize(4, { message: 'A post can have at most 4 attachments.' })
  @ValidateNested({ each: true })
  @Type(() => PostAttachmentDto)
  @IsOptional()
  attachments?: PostAttachmentDto[];
}
