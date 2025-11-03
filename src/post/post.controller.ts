import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Put,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AddCommentDto } from './dtos/add-comment.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { GetPostsDto } from './dtos/get-post.dto';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetPostCommentsDto } from './dtos/get-post-comment.dto';

@Controller('posts')
@UseGuards(JwtGuards)
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Create a new post
  @Post('create')
  async createPost(@Req() req: any, @Body() createPostDto: CreatePostDto) {
    const userId = req.user['id'];
    await this.postService.createPost(
      userId,
      createPostDto.body,
      createPostDto.title,
    );

    return {
      status: 201,
      message: 'Post created successfully',
    };
  }

  // Get all posts (paginated)
  @Get('fetch-posts')
  async getPosts(@Query() query: GetPostsDto, @Req() req: any) {
    const userId = req.user['id'];

    return {
      status: 200,
      message: 'Post fetched successfully',
      data: await this.postService.getPosts(query, userId),
    };
  }

  // Get a single post by ID
  @Get(':postId/post-detail')
  async getPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
  ) {
    const userId = req.user['id'];

    return {
      status: 200,
      message: 'Post fetched successfully',
      data: await this.postService.getPost(postId, userId),
    };
  }

  // Update a post (only allowed by post owner or admin)
  @Put(':postId/update')
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
    @Body() updatePostDto: CreatePostDto,
  ) {
    const userId = req.user['id'];
    await this.postService.updatePost(
      postId,
      userId,
      updatePostDto.body,
      updatePostDto.title,
    );

    return {
      status: 201,
      message: 'Post updated successfully',
    };
  }

  // Delete a post (only allowed by post owner or admin)
  @Delete(':postId/delete')
  //   @UseGuards(AuthGuard, RolesGuard)
  //   @Roles(Role.Admin) // Only admin can delete
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
  ) {
    const userId = req.user['id'];
    // const isAdmin = req.user['role'] === Role.Admin;
    await this.postService.deletePost(postId, userId, false);

    return {
      status: 200,
      message: 'Post deleted successfully',
    };
  }

  // Like a post
  @Post(':postId/like')
  async likePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
  ) {
    const userId = req.user['id'];
    await this.postService.likePost(postId, userId);
    return {
      status: 200,
      message: 'Post liked successfully',
    };
  }

  @Post(':postId/unlike')
  async unlikePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
  ) {
    const userId = req.user['id'];
    await this.postService.unlikePost(postId, userId);

    return {
      status: 200,
      message: 'Post unliked successfully',
    };
  }

  // Add a comment to a post
  @Post(':postId/comment')
  async addComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
    @Body() addCommentDto: AddCommentDto,
  ) {
    const userId = req.user['id'];
    await this.postService.addComment(postId, userId, addCommentDto.comment);
    return {
      status: 201,
      message: 'Comment added successfully',
    };
  }

  @Get(':postId/comments')
  async getPostcomments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() addCommentDto: GetPostCommentsDto,
  ) {
    return {
      status: 200,
      message: 'Comment fetched successfully',
      data: await this.postService.getPostComments({
        postId,
        page: addCommentDto.page,
        pageSize: addCommentDto.pageSize,
      }),
    };
  }
}
