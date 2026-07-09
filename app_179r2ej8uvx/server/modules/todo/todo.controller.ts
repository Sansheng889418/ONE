import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { CurrentUser } from '@server/common/auth/current-user.decorator';
import { TodoService } from './todo.service';
import type {
  CreateTodoRequest,
  UpdateTodoRequest,
  UpdateTodoStatusRequest,
  TodoListResponse,
  TodoDetailResponse,
  ApiResponse,
  TodoStatus,
} from '@shared/api.interface';
import type { JwtPayload } from '@server/common/auth/jwt.service';

@Controller('api/todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  async getList(
    @Query('status') status?: TodoStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<TodoListResponse> {
    return this.todoService.getList({
      status,
      assigneeId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<TodoDetailResponse> {
    const data = await this.todoService.getDetail(id);
    return { success: true, data };
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTodoRequest,
  ): Promise<ApiResponse<{ id: string }>> {
    const result = await this.todoService.create(user.userId, user.username, dto);
    return { success: true, data: result };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTodoRequest,
  ): Promise<ApiResponse> {
    await this.todoService.update(id, user.userId, user.role, dto);
    return { success: true, message: '更新成功' };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTodoStatusRequest,
  ): Promise<ApiResponse> {
    await this.todoService.updateStatus(id, user.userId, user.role, dto.status);
    return { success: true, message: '状态更新成功' };
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id') todoId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse> {
    await this.todoService.deleteAttachment(todoId, attachmentId, user.userId, user.role);
    return { success: true, message: '附件删除成功' };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse> {
    await this.todoService.delete(id, user.userId, user.role);
    return { success: true, message: '删除成功' };
  }
}
