import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый чат' })
  @ApiResponse({ status: 201, description: 'Чат создан успешно' })
  async createChat(@Req() req: any, @Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(req.user.id, createChatDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список чатов пользователя' })
  @ApiResponse({ status: 200, description: 'Список чатов получен успешно' })
  async getUserChats(@Req() req: any) {
    return this.chatService.getUserChats(req.user.id);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Получить сообщения чата' })
  @ApiResponse({ status: 200, description: 'Сообщения получены успешно' })
  async getChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getChatMessages(
      chatId,
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Отправить сообщение' })
  @ApiResponse({ status: 201, description: 'Сообщение отправлено успешно' })
  async sendMessage(@Req() req: any, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.sendMessage(req.user.id, createMessageDto);
  }

  @Put(':chatId/read')
  @ApiOperation({ summary: 'Отметить сообщения как прочитанные' })
  @ApiResponse({ status: 200, description: 'Сообщения отмечены как прочитанные' })
  async markMessagesAsRead(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: any,
  ) {
    return this.chatService.markMessagesAsRead(chatId, req.user.id);
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Редактировать сообщение' })
  @ApiResponse({ status: 200, description: 'Сообщение отредактировано успешно' })
  async editMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Req() req: any,
    @Body('content') content: string,
  ) {
    return this.chatService.editMessage(messageId, req.user.id, content);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Удалить сообщение' })
  @ApiResponse({ status: 200, description: 'Сообщение удалено успешно' })
  async deleteMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Req() req: any,
  ) {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }

  // Админские эндпоинты
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Получить все чаты сотрудников (админ)' })
  @ApiResponse({ status: 200, description: 'Список всех чатов получен успешно' })
  async getAllEmployeeChats(@Req() req: any) {
    return this.chatService.getAllEmployeeChats();
  }

  @Get('admin/:chatId/messages')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Просмотр сообщений чата (админ)' })
  @ApiResponse({ status: 200, description: 'Сообщения чата получены успешно' })
  async getAdminChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getAdminChatMessages(
      chatId,
      Number(page),
      Number(limit),
    );
  }

  @Get('admin/:chatId/info')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Получить информацию о чате (админ)' })
  @ApiResponse({ status: 200, description: 'Информация о чате получена успешно' })
  async getAdminChatInfo(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatService.getChatInfo(chatId);
  }
}
