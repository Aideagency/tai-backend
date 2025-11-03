import {
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
import { UserEntity } from 'src/database/entities/user.entity';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  // Create a post
  async createPost(userId: number, body: string, title?: string) {
    return this.postRepository.createPost({ body, userId, title });
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
    body: string,
    title?: string,
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

    return this.postRepository.updatePost(postId, { body, title });
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
}
