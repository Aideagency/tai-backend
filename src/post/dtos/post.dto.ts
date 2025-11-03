// import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
// import { Type } from 'class-transformer';

// // DTO for creating a post
// export class CreatePostDto {
//   @IsString()
//   @IsNotEmpty()
//   body: string;

//   @IsString()
//   @IsOptional()
//   title?: string;
// }

// // DTO for updating a post
// export class UpdatePostDto {
//   @IsString()
//   @IsNotEmpty()
//   body: string;

//   @IsString()
//   @IsOptional()
//   title?: string;
// }

// // DTO for liking a post
// export class LikePostDto {
//   @IsInt()
//   postId: number;
// }

// // DTO for adding a comment
// export class AddCommentDto {
//   @IsString()
//   @IsNotEmpty()
//   comment: string;

//   @IsInt()
//   postId: number;
// }

// // DTO for pagination of posts
// export class GetPostsDto {
//   @IsInt()
//   @IsOptional()
//   page: number;

//   @IsInt()
//   @IsOptional()
//   pageSize: number;

//   @IsString()
//   @IsOptional()
//   q: string;
// }
