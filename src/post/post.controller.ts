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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AddCommentDto } from './dtos/add-comment.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { GetPostsDto } from './dtos/get-post.dto';
import { JwtGuards } from 'src/auth/jwt.guards';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetPostCommentsDto } from './dtos/get-post-comment.dto';
import { CommunityTag } from 'src/database/entities/user.entity';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
@UseGuards(JwtGuards)
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Create a new post
  @ApiOperation({
    summary: 'Create a post',
    description:
      'Creates a post. Accepts multipart/form-data and uploads up to 4 attachment files to Cloudinary.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['body'],
      properties: {
        body: {
          type: 'string',
          example: 'This is an example of a post body.',
        },
        title: {
          type: 'string',
          example: 'Rejuvenating family values',
        },
        community: {
          type: 'string',
          enum: Object.values(CommunityTag),
          example: CommunityTag.MARRIED,
        },
        attachments: {
          type: 'array',
          maxItems: 4,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @Post('create')
  @UseInterceptors(
    FilesInterceptor('attachments', 4, {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  async createPost(
    @Req() req: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    const userId = req.user['id'];
    await this.postService.createPost(userId, createPostDto, attachments);

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

  @ApiOperation({
    summary: 'List post communities',
    description:
      'Returns the available community values that can be assigned to a post.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post communities fetched successfully.',
    schema: {
      example: {
        status: 200,
        message: 'Communities fetched successfully',
        data: ['SINGLE', 'MARRIED', 'PARENT'],
      },
    },
  })
  @Get('communities')
  async getPostCommunities() {
    return {
      status: 200,
      message: 'Communities fetched successfully',
      data: Object.values(CommunityTag),
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
  @ApiOperation({
    summary: 'Update a post',
    description:
      'Updates a post. When attachment files are provided, they replace the existing post attachments.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['body'],
      properties: {
        body: {
          type: 'string',
          example: 'This is an updated post body.',
        },
        title: {
          type: 'string',
          example: 'Updated family values note',
        },
        community: {
          type: 'string',
          enum: Object.values(CommunityTag),
          example: CommunityTag.PARENT,
        },
        attachments: {
          type: 'array',
          maxItems: 4,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @Put(':postId/update')
  @ApiExcludeEndpoint()
  @UseInterceptors(
    FilesInterceptor('attachments', 4, {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
    @Body() updatePostDto: CreatePostDto,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    const userId = req.user['id'];
    await this.postService.updatePost(
      postId,
      userId,
      updatePostDto,
      attachments,
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
