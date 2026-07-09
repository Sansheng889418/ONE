import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

import { appUser } from '@server/database/schema';
import { JwtAuthService } from '@server/common/auth/jwt.service';
import type { LoginResponse, RegisterResponse, UserRole } from '@shared/api.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async register(username: string, password: string): Promise<RegisterResponse> {
    const trimmedUsername = username.trim();

    const existing = await this.db
      .select({ id: appUser.id })
      .from(appUser)
      .where(eq(appUser.username, trimmedUsername));

    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash: string = await bcrypt.hash(password, 10);

    await this.db.insert(appUser).values({
      username: trimmedUsername,
      passwordHash,
      status: 'pending',
      role: 'user',
    });

    this.logger.log(`用户注册成功: ${trimmedUsername}`);

    return {
      success: true,
      message: '您的账号已提交，管理员审批后即可使用',
    };
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const trimmedUsername = username.trim();

    const users = await this.db
      .select({
        id: appUser.id,
        username: appUser.username,
        passwordHash: appUser.passwordHash,
        status: appUser.status,
        role: appUser.role,
      })
      .from(appUser)
      .where(eq(appUser.username, trimmedUsername));

    if (users.length === 0) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const user = users[0];

    const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === 'pending') {
      throw new UnauthorizedException('账号待审核，请等待管理员审批');
    }

    if (user.status === 'rejected') {
      throw new UnauthorizedException('账号已被拒绝，请联系管理员');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号状态异常，请联系管理员');
    }

    const token = this.jwtAuthService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
    });

    this.logger.log(`用户登录成功: ${user.username}`);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
      },
    };
  }
}
