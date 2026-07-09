import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, ilike, desc, count } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { appUser } from '@server/database/schema';
import type {
  UserInfo,
  UserListRequest,
  UserListResponse,
  UserRole,
  UserStatus,
  CreateUserRequest,
} from '@shared/api.interface';
import type { JwtPayload } from '@server/common/auth/jwt.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private ensureAdmin(currentUser: JwtPayload): void {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('无权限访问');
    }
  }

  private toUserInfo(row: typeof appUser.$inferSelect): UserInfo {
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getPendingList(currentUser: JwtPayload): Promise<UserInfo[]> {
    this.ensureAdmin(currentUser);

    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.status, 'pending'))
      .orderBy(desc(appUser.createdAt));

    return rows.map((row) => this.toUserInfo(row));
  }

  async getList(
    currentUser: JwtPayload,
    params: UserListRequest,
  ): Promise<UserListResponse> {
    this.ensureAdmin(currentUser);

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 20;

    const conditions = [];
    if (params.keyword) {
      conditions.push(ilike(appUser.username, `%${params.keyword}%`));
    }
    if (params.status) {
      conditions.push(eq(appUser.status, params.status));
    }

    const baseQuery =
      conditions.length > 0
        ? this.db.select().from(appUser).where(and(...conditions))
        : this.db.select().from(appUser);

    const [countResult] = await this.db
      .select({ count: count() })
      .from(appUser)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult.count);

    const rows = await baseQuery
      .orderBy(desc(appUser.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      items: rows.map((row) => this.toUserInfo(row)),
      total,
      page,
      pageSize,
    };
  }

  async audit(
    currentUser: JwtPayload,
    id: string,
    status: 'active' | 'rejected',
  ): Promise<void> {
    this.ensureAdmin(currentUser);

    if (status !== 'active' && status !== 'rejected') {
      throw new BadRequestException('无效的审核状态');
    }

    const [existing] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    await this.db.update(appUser).set({ status }).where(eq(appUser.id, id));

    this.logger.log(
      `用户 ${currentUser.username} 审核用户 ${existing.username} 为 ${status}`,
    );
  }

  async create(
    currentUser: JwtPayload,
    dto: CreateUserRequest,
  ): Promise<{ id: string }> {
    this.ensureAdmin(currentUser);

    if (!dto.username || !dto.password) {
      throw new BadRequestException('用户名和密码不能为空');
    }
    if (dto.role !== 'user' && dto.role !== 'admin') {
      throw new BadRequestException('无效的角色');
    }

    const [existing] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.username, dto.username))
      .limit(1);

    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [created] = await this.db
      .insert(appUser)
      .values({
        username: dto.username,
        passwordHash,
        role: dto.role,
        status: 'active',
      })
      .returning();

    this.logger.log(
      `管理员 ${currentUser.username} 创建用户 ${dto.username}`,
    );

    return { id: created.id };
  }

  async updateRole(
    currentUser: JwtPayload,
    id: string,
    role: UserRole,
  ): Promise<void> {
    this.ensureAdmin(currentUser);

    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('无效的角色');
    }

    const [existing] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    await this.db.update(appUser).set({ role }).where(eq(appUser.id, id));

    this.logger.log(
      `管理员 ${currentUser.username} 将用户 ${existing.username} 角色改为 ${role}`,
    );
  }

  async delete(currentUser: JwtPayload, id: string): Promise<void> {
    this.ensureAdmin(currentUser);

    if (id === currentUser.userId) {
      throw new BadRequestException('不能删除自己');
    }

    const [existing] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    await this.db.delete(appUser).where(eq(appUser.id, id));

    this.logger.log(
      `管理员 ${currentUser.username} 删除用户 ${existing.username}`,
    );
  }
}
