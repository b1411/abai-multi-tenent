import { Body, Controller, Get, Post as HttpPost, Put, Delete, Param, Req, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PostService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { Request } from 'express';

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Posts')
@UseGuards(AuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService) { }

  @HttpPost()
  @Roles("ADMIN", 'TEACHER', 'HR', 'FINANCIST')
  @ApiOperation({ summary: 'Создать пост' })
  @ApiResponse({ status: 201, description: 'Пост создан' })
  create(@Body() body: any, @Req() req: any) {
    // body.content, body.visibility, images, body.fileIds
    return this.postService.create({
      content: body.content,
      visibility: body.visibility,
      fileIds: body.fileIds ? Array.isArray(body.fileIds) ? body.fileIds.map(Number) : [Number(body.fileIds)] : [],
      images: body.images ? Array.isArray(body.images) ? body.images : [body.images] : [],
    }, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все посты' })
  @ApiResponse({ status: 200, description: 'Список постов' })
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пост по id' })
  @ApiResponse({ status: 200, description: 'Пост найден' })
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Put(':id')
  @Roles("ADMIN", 'TEACHER', 'HR', 'FINANCIST')
  @ApiOperation({ summary: 'Обновить пост' })
  @ApiResponse({ status: 200, description: 'Пост обновлен' })
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Req() req: any) {
    return this.postService.update(id, updatePostDto, req.user);
  }

  @Delete(':id')
  @Roles("ADMIN", 'TEACHER', 'HR', 'FINANCIST')
  @ApiOperation({ summary: 'Удалить пост' })
  @ApiResponse({ status: 200, description: 'Пост удален' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.postService.remove(id, req.user);
  }

  // --- Реакции ---
  @HttpPost(':id/reactions')
  @ApiOperation({ summary: 'Добавить реакцию к посту' })
  @ApiBody({ schema: { properties: { type: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Реакция добавлена' })
  addReaction(@Param('id') id: string, @Body('type') type: string, @Req() req: any) {
    return this.postService.addReaction(id, type, req.user);
  }

  @Delete(':id/reactions')
  @ApiOperation({ summary: 'Удалить свою реакцию с поста' })
  @ApiResponse({ status: 200, description: 'Реакция удалена' })
  removeReaction(@Param('id') id: string, @Req() req: any) {
    return this.postService.removeReaction(id, req.user);
  }

  // --- Комментарии ---
  @HttpPost(':id/comments')
  @ApiOperation({ summary: 'Добавить комментарий к посту' })
  @ApiBody({ schema: { properties: { content: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Комментарий добавлен' })
  addComment(@Param('id') id: string, @Body('content') content: string, @Req() req: any) {
    return this.postService.addComment(id, content, req.user);
  }
}
