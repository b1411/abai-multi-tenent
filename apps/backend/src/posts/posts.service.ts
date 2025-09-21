import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) { }

  create(createPostDto: CreatePostDto, user: any) {
    // TODO: обработка images, если требуется (например, сохранить в БД)
    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        visibility: createPostDto.visibility,
        authorId: user.id,
        files: {
          connect: [...(createPostDto.fileIds || []).map(id => ({ id }))],
        },
        images: [...(createPostDto.images || [])]
      },
    });
  }

  async addReaction(postId: string, type: string, user: any) {
    return await this.prisma.reaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
      update: { type },
      create: { postId, userId: user.id, type },
    });
  }

  async removeReaction(postId: string, user: any) {
    return await this.prisma.reaction.deleteMany({
      where: { postId, userId: user.id },
    });
  }

  async addComment(postId: string, content: string, user: any) {
    return await this.prisma.comment.create({
      data: {
        postId,
        content,
        authorId: user.id,
      },
    });
  }

  async findAll() {
    const posts = await this.prisma.post.findMany({
      include: {
        author: true,
        files: true,
        reactions: true,
        comments: { include: { author: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map(post => ({
      ...post,
      reactions: post.reactions ?? [],
      comments: post.comments ?? [],
      images: post.images ?? [],
      files: post.files ?? [],
      _count: {
        reactions: post.reactions ? post.reactions.length : 0,
        comments: post.comments ? post.comments.length : 0,
      },
    }));
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        files: true,
        reactions: true,
        comments: { include: { author: true } },
      },
    });
    if (!post) return null;
    return {
      ...post,
      reactions: post.reactions ?? [],
      comments: post.comments ?? [],
      images: post.images ?? [],
      files: post.files ?? [],
      _count: {
        reactions: post.reactions ? post.reactions.length : 0,
        comments: post.comments ? post.comments.length : 0,
      },
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: any) {
    // Можно добавить проверку авторства
    return await this.prisma.post.update({
      where: { id },
      data: {
        ...updatePostDto,
      },
    });
  }

  async remove(id: string, user: any) {
    // Можно добавить проверку авторства
    return await this.prisma.post.delete({
      where: { id },
    });
  }
}
