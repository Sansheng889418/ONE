import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '@server/common/auth/current-user.decorator';
import type { JwtPayload } from '@server/common/auth/jwt.service';
import type {
  UserListRequest,
  UserListResponse,
  UserInfo,
  CreateUserRequest,
  AuditUserRequest,
  UpdateUserRoleRequest,
  ApiResponse,
} from '@shared/api.interface';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('pending')
  async getPendingList(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ items: UserInfo[] }> {
    const items = await this.userService.getPendingList(currentUser);
    return { items };
  }

  @Get()
  async getList(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: UserListRequest,
  ): Promise<UserListResponse> {
    const params: UserListRequest = {
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      keyword: query.keyword,
      status: query.status,
    };
    return this.userService.getList(currentUser, params);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateUserRequest,
  ): Promise<ApiResponse<{ id: string }>> {
    const result = await this.userService.create(currentUser, dto);
    return { success: true, data: result };
  }

  @Patch(':id/audit')
  async audit(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: AuditUserRequest,
  ): Promise<ApiResponse> {
    await this.userService.audit(currentUser, id, body.status);
    return { success: true, message: '审核成功' };
  }

  @Patch(':id/role')
  async updateRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateUserRoleRequest,
  ): Promise<ApiResponse> {
    await this.userService.updateRole(currentUser, id, body.role);
    return { success: true, message: '角色更新成功' };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.userService.delete(currentUser, id);
    return { success: true, message: '删除成功' };
  }
}
