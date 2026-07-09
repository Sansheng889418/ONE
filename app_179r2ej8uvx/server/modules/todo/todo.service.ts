import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, inArray, sql } from 'drizzle-orm';
import { todo, todoAttachment, appUser } from '@server/database/schema';
import type {
  TodoItem,
  TodoStatus,
  AssigneeInfo,
  TodoAttachment,
  TodoListRequest,
  TodoListResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
} from '@shared/api.interface';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getList(params: TodoListRequest): Promise<TodoListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.status) {
      conditions.push(eq(todo.status, params.status));
    }
    if (params.assigneeId) {
      conditions.push(
        sql`${todo.assignees}::jsonb @> ${JSON.stringify([{ userId: params.assigneeId }])}::jsonb`,
      );
    }

    const baseQuery =
      conditions.length > 0
        ? this.db.select().from(todo).where(and(...conditions))
        : this.db.select().from(todo);

    const rows = await baseQuery
      .orderBy(desc(todo.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countResult = await this.db
      .select({ count: count() })
      .from(todo)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count ?? 0);

    const items: TodoItem[] = await Promise.all(
      rows.map(async (row) => this.mapTodoRow(row)),
    );

    return { items, total, page, pageSize };
  }

  async getDetail(id: string): Promise<TodoItem> {
    const rows = await this.db.select().from(todo).where(eq(todo.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('待办不存在');
    }
    return this.mapTodoRow(rows[0], true);
  }

  async create(
    userId: string,
    username: string,
    dto: CreateTodoRequest,
  ): Promise<{ id: string }> {
    const assigneeInfos: AssigneeInfo[] = await this.resolveAssignees(dto.assignees || []);

    const result = await this.db
      .insert(todo)
      .values({
        title: dto.title,
        remark: dto.remark ?? '',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: 'pending',
        creator: userId,
        assignees: assigneeInfos as unknown as typeof todo.$inferInsert.assignees,
      })
      .returning({ id: todo.id });

    const todoId = result[0].id;

    if (dto.attachments && dto.attachments.length > 0) {
      await this.db.insert(todoAttachment).values(
        dto.attachments.map((url: string) => ({
          todoId,
          url,
          fileName: this.extractFileName(url),
        })),
      );
    }

    this.logger.log(`创建待办成功: id=${todoId}, title=${dto.title}, creator=${username}`);
    return { id: todoId };
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateTodoRequest,
  ): Promise<void> {
    const existing = await this.getDetail(id);
    this.ensureCanModify(existing, userId, role);

    const assigneeInfos: AssigneeInfo[] = await this.resolveAssignees(dto.assignees || []);

    await this.db
      .update(todo)
      .set({
        title: dto.title,
        remark: dto.remark ?? '',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        assignees: assigneeInfos as unknown as typeof todo.$inferInsert.assignees,
      })
      .where(eq(todo.id, id));

    if (dto.attachments) {
      await this.db.delete(todoAttachment).where(eq(todoAttachment.todoId, id));
      if (dto.attachments.length > 0) {
        await this.db.insert(todoAttachment).values(
          dto.attachments.map((url: string) => ({
            todoId: id,
            url,
            fileName: this.extractFileName(url),
          })),
        );
      }
    }

    this.logger.log(`更新待办成功: id=${id}, userId=${userId}`);
  }

  async updateStatus(
    id: string,
    userId: string,
    role: string,
    status: TodoStatus,
  ): Promise<void> {
    const existing = await this.getDetail(id);
    this.ensureCanModify(existing, userId, role);

    await this.db.update(todo).set({ status }).where(eq(todo.id, id));
    this.logger.log(`更新待办状态: id=${id}, status=${status}, userId=${userId}`);
  }

  async delete(id: string, userId: string, role: string): Promise<void> {
    const existing = await this.getDetail(id);
    this.ensureCanModify(existing, userId, role);

    await this.db.delete(todo).where(eq(todo.id, id));
    this.logger.log(`删除待办: id=${id}, userId=${userId}`);
  }

  async deleteAttachment(
    todoId: string,
    attachmentId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const existing = await this.getDetail(todoId);
    this.ensureCanModify(existing, userId, role);

    const attachments = await this.db
      .select()
      .from(todoAttachment)
      .where(and(eq(todoAttachment.id, attachmentId), eq(todoAttachment.todoId, todoId)))
      .limit(1);

    if (attachments.length === 0) {
      throw new NotFoundException('附件不存在');
    }

    await this.db.delete(todoAttachment).where(eq(todoAttachment.id, attachmentId));
    this.logger.log(`删除附件: todoId=${todoId}, attachmentId=${attachmentId}`);
  }

  private async mapTodoRow(
    row: typeof todo.$inferSelect,
    withAttachments = false,
  ): Promise<TodoItem> {
    const assignees = (row.assignees as unknown as AssigneeInfo[]) || [];

    let creatorInfo: AssigneeInfo = { userId: row.creator || '', username: '' };
    if (row.creator) {
      const users = await this.db
        .select({ id: appUser.id, username: appUser.username })
        .from(appUser)
        .where(eq(appUser.id, row.creator))
        .limit(1);
      if (users.length > 0) {
        creatorInfo = { userId: users[0].id, username: users[0].username };
      }
    }

    let attachments: TodoAttachment[] = [];
    if (withAttachments) {
      const attRows = await this.db
        .select()
        .from(todoAttachment)
        .where(eq(todoAttachment.todoId, row.id))
        .orderBy(desc(todoAttachment.createdAt));
      attachments = attRows.map((att) => ({
        id: att.id,
        url: att.url,
        fileName: att.fileName,
      }));
    }

    return {
      id: row.id,
      title: row.title,
      remark: row.remark,
      deadline: row.deadline ? row.deadline.toISOString() : null,
      status: row.status as TodoStatus,
      assignees,
      creator: creatorInfo,
      attachments,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async resolveAssignees(userIds: string[]): Promise<AssigneeInfo[]> {
    if (userIds.length === 0) return [];
    const users = await this.db
      .select({ id: appUser.id, username: appUser.username })
      .from(appUser)
      .where(inArray(appUser.id, userIds));
    return users.map((u) => ({ userId: u.id, username: u.username }));
  }

  private ensureCanModify(todoItem: TodoItem, userId: string, role: string): void {
    if (role === 'admin') return;
    if (todoItem.creator.userId === userId) return;
    throw new ForbiddenException('无权限操作此待办');
  }

  private extractFileName(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'attachment';
    } catch {
      return 'attachment';
    }
  }
}
