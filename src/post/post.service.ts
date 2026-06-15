import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PostRepository,
  CommentSearchParams,
} from 'src/repository/post/post.repository';
import { PostEntity } from 'src/database/entities/post.entity';
import { PostLikeEntity } from 'src/database/entities/post-like.entity';
import { PostCommentEntity } from 'src/database/entities/post-comment.entity';
import { PostShareEntity } from 'src/database/entities/post-share.entity';
import {
  CommunityTag,
  MaritalStatus,
  UserEntity,
} from 'src/database/entities/user.entity';
import { CreatePostDto } from './dtos/create-post.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { PostAttachmentType } from 'src/database/entities/post-attachment.entity';
import { UserRepository } from 'src/repository/user/user.repository';

@Injectable()
export class PostService {
  private readonly maxAttachmentSizeBytes = 1024 * 1024;

  constructor(
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // Create a post
  async createPost(
    userId: number,
    payload: CreatePostDto,
    attachmentFiles: Express.Multer.File[] = [],
  ) {
    await this.assertUserCanPostToCommunity(userId, payload.community);

    const attachments = await this.uploadPostAttachments(attachmentFiles);

    return this.postRepository.createPost({
      ...payload,
      attachments: attachments.length ? attachments : payload.attachments,
      userId,
    });
  }

  // Get a post with like status
  async getPost(postId: number, currentUserId?: number) {
    return this.postRepository.getPost(postId, currentUserId);
  }

  // Get a list of posts (paginated)
  async getPosts(params: any, currentUserId?: number) {
    return this.postRepository.getPosts(params, currentUserId);
  }

  // Update a post
  async updatePost(
    postId: number,
    userId: number,
    payload: CreatePostDto,
    attachmentFiles: Express.Multer.File[] = [],
  ) {
    const post = await this.postRepository.findOne(
      { id: postId, user: { id: userId } }, // ← where
      { user: true }, // ← relations
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this post');
    }

    await this.assertUserCanPostToCommunity(userId, payload.community);

    const attachments = await this.uploadPostAttachments(attachmentFiles);

    return this.postRepository.updatePost(postId, {
      ...payload,
      attachments: attachments.length ? attachments : payload.attachments,
    });
  }

  // Delete a post (only allowed by the post owner or admin)
  async deletePost(postId: number, userId: number, isAdmin: boolean) {
    const post = await this.postRepository.findOne(
      { id: postId, user: { id: userId } }, // ← where
      { user: true }, // ← relations
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    return this.postRepository.softDelete(postId);
  }

  // Like a post
  async likePost(postId: number, userId: number) {
    const likeExists = await this.postRepository.likeExists(postId, userId);

    if (!likeExists) {
      await this.postRepository.addLike(postId, userId);
    } else {
      throw new ForbiddenException('You have already liked this post');
    }
  }

  // Unlike a post
  async unlikePost(postId: number, userId: number) {
    const likeExists = await this.postRepository.likeExists(postId, userId);

    if (likeExists) {
      await this.postRepository.removeLike({ postId, userId });
    } else {
      throw new NotFoundException('Like not found');
    }
  }

  // Add a comment to a post
  async addComment(postId: number, userId: number, comment: string) {
    return this.postRepository.addComment({ postId, userId, comment });
  }

  // Delete a comment (only allowed by the comment owner or admin)
  async deleteComment(commentId: number, userId: number, isAdmin: boolean) {
    return this.postRepository.deleteComment(commentId, { userId, isAdmin });
  }

  // Share a post
  async sharePost(postId: number, userId: number) {
    return this.postRepository.addShare(postId, userId);
  }

  async getPostComments(params: CommentSearchParams) {
    return this.postRepository.listCommentsPaginated(params);
  }

  private async assertUserCanPostToCommunity(
    userId: number,
    community?: CommunityTag,
  ) {
    if (!community) return;

    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userCommunities = this.getUserCommunities(user);
    if (!userCommunities.includes(community)) {
      throw new ForbiddenException(
        'You cannot create or update a post for a community you do not belong to.',
      );
    }
  }

  private getUserCommunities(user: UserEntity): CommunityTag[] {
    const communities: CommunityTag[] = [];

    if (user.is_parent) {
      communities.push(CommunityTag.PARENT);
    }
    if (user.marital_status === MaritalStatus.SINGLE) {
      communities.push(CommunityTag.SINGLE);
    }
    if (user.marital_status === MaritalStatus.MARRIED) {
      communities.push(CommunityTag.MARRIED);
    }

    return communities;
  }

  private async uploadPostAttachments(files: Express.Multer.File[] = []) {
    if (files.length > 4) {
      throw new BadRequestException('A post can have at most 4 attachments.');
    }

    const oversizedFile = files.find(
      (file) => file.size > this.maxAttachmentSizeBytes,
    );
    if (oversizedFile) {
      throw new BadRequestException(
        'Each post attachment must be 1MB or smaller.',
      );
    }

    return Promise.all(
      files.map(async (file) => {
        const upload = await this.cloudinary.uploadFile(file, {
          folder: 'posts/attachments',
        });

        return {
          type: this.getAttachmentType(file.mimetype),
          url: upload.url,
          title: file.originalname,
          publicId: upload.publicId,
          mimeType: file.mimetype,
          resourceType: upload.resourceType,
          sizeBytes: file.size,
        };
      }),
    );
  }

  private getAttachmentType(mimeType: string): PostAttachmentType {
    if (mimeType.startsWith('image/')) return PostAttachmentType.IMAGE;
    if (mimeType.startsWith('video/')) return PostAttachmentType.VIDEO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('presentation') ||
      mimeType.includes('spreadsheet')
    ) {
      return PostAttachmentType.DOCUMENT;
    }

    return PostAttachmentType.OTHER;
  }
}
