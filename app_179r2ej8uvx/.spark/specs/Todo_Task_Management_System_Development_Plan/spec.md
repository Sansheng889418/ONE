# 技术方案

## 开发元信息

- 开发模式: 全栈应用
- 涉及层级: [数据库, 服务端, 前端]

## 页面路由与导航

### 页面路由

| 页面名称 | 路由路径 | 说明 |
|---------|---------|------|
| 登录注册页 | /login | 未登录用户默认跳转页 |
| 待办事项列表页 | / | 登录后首页 |
| 待办详情页 | /todo/:id | 单个待办的详情与操作页 |
| 人员管理页 | /users | 管理员专属用户管理页 |
| 站点设置页 | /settings | 管理员专属站点配置页 |

### 导航设计

- 导航机制：页面路由
- 导航项：
  - 待办列表（所有登录用户可见）
  - 人员管理（仅管理员可见）
  - 站点设置（仅管理员可见）

## 业务组件

| 组件 | 来源 | 关联页面 | 对应功能点 |
|------|------|---------|-----------|
| Table | `@lark-apaas/client-toolkit/antd-table` | 人员管理页 | 全量用户列表展示、待审核用户列表展示 |
| Form | shadcn/ui | 所有页面 | 登录/注册表单、待办新增/编辑表单、站点配置表单 |
| Upload | shadcn/ui | 待办详情页 | 待办附图上传 |
| Dialog | shadcn/ui | 待办列表页/人员管理页 | 新增待办弹窗、新增用户弹窗 |

## 数据模型

### 数据库设计

#### 用户表（user）
用途：存储系统用户账号、状态与角色信息。
核心字段：
- username: varchar (255) 用户名，唯一约束
- password: varchar (255) 加密存储的密码
- status: varchar ['pending', 'active', 'rejected'] 账号状态：待审核/正常/已拒绝
- role: varchar ['user', 'admin'] 用户角色：普通用户/管理员
预置数据：系统初始化自动创建管理员账号 `username: qhzd, password: bcrypt加密后的qhzd43490, status: active, role: admin`

#### 待办表（todo）
用途：存储待办事项核心业务数据。
核心字段：
- title: varchar (255) 待办标题
- remark: text 备注说明
- deadline: timestamptz 截止时间（可选）
- status: varchar ['pending', 'completed'] 待办状态：待办/已完成
- creator: user_profile 创建人
- assignees: jsonb 负责人列表，存储多个用户ID数组

#### 待办附件表（todo_attachment）
用途：存储待办事项关联的图片附件信息。
核心字段：
- todo_id: uuid (关联 -> todo.id)
- url: text 图片下载链接（来自文件服务）
关联关系：与待办表是多对一关系

#### 站点配置表（site_config）
用途：存储站点全局配置信息。
核心字段：
- key: varchar (255) 配置键，唯一约束
- value: text 配置值
预置数据：`{key: 'site_title', value: '团队协作看板'}, {key: 'site_subtitle', value: '高效管理每一件事'}`

## 业务模型

### API 设计

#### 登录注册页 相关

**页面路径**: /login

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 用户登录 | API | POST /api/auth/login |
| 用户注册 | API | POST /api/auth/register |

**所需 API**:
```typescript
// 用户登录 [领域模型: User] [对应页面功能: 账号登录]
POST /api/auth/login
Request Body: {
  username: string;
  password: string;
}
Response: {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// 用户注册 [领域模型: User] [对应页面功能: 新用户注册]
POST /api/auth/register
Request Body: {
  username: string;
  password: string;
}
Response: {
  success: boolean;
  message: string;
}
```

#### 待办事项列表页 相关

**页面路径**: /

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取待办列表 | API | GET /api/todos |
| 新增待办 | API | POST /api/todos |
| 标记待办完成/取消完成 | API | PATCH /api/todos/:id/status |
| 获取所有用户列表（负责人选择） | 平台能力 | 内置用户服务 |
| 获取站点配置 | API | GET /api/site-config |

**所需 API**:
```typescript
// 获取待办列表（支持筛选） [领域模型: Todo] [对应页面功能: 待办列表展示与筛选]
@NeedLogin()
GET /api/todos?status=xxx&assigneeId=xxx&page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    title: string;
    deadline: string;
    status: string;
    assignees: Array<{userId: string, username: string}>;
    creator: {userId: string, username: string};
    createdAt: string;
  }>;
  total: number;
}

// 新增待办事项 [领域模型: Todo] [对应页面功能: 创建待办]
@NeedLogin()
POST /api/todos
Request Body: {
  title: string;
  remark?: string;
  deadline?: string;
  assignees: string[]; // 负责人用户ID数组
}
Response: {
  success: boolean;
  data: {
    id: string;
  };
}

// 更新待办状态 [领域模型: Todo] [对应页面功能: 标记完成/取消完成]
@NeedLogin()
PATCH /api/todos/:id/status
Request Body: {
  status: string; // pending / completed
}
Response: {
  success: boolean;
}

// 获取站点全局配置 [领域模型: SiteConfig] [对应页面功能: 顶部标题展示]
GET /api/site-config
Response: {
  siteTitle: string;
  siteSubtitle: string;
}
```

#### 待办详情页 相关

**页面路径**: /todo/:id

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取待办详情 | API | GET /api/todos/:id |
| 更新待办信息 | API | PUT /api/todos/:id |
| 删除待办 | API | DELETE /api/todos/:id |
| 上传待办附图 | 平台能力 | 内置文件存储服务 |
| 删除待办附图 | API | DELETE /api/todos/:id/attachments/:attachmentId |

**所需 API**:
```typescript
// 获取待办详情 [领域模型: Todo, TodoAttachment] [对应页面功能: 待办详情展示]
@NeedLogin()
GET /api/todos/:id
Response: {
  id: string;
  title: string;
  remark: string;
  deadline: string;
  status: string;
  assignees: Array<{userId: string, username: string}>;
  creator: {userId: string, username: string};
  attachments: Array<{id: string, url: string}>;
  createdAt: string;
  updatedAt: string;
}

// 更新待办信息 [领域模型: Todo] [对应页面功能: 编辑待办]
@NeedLogin()
PUT /api/todos/:id
Request Body: {
  title: string;
  remark?: string;
  deadline?: string;
  assignees: string[];
  attachments: string[]; // 现有附件URL数组，新增附件已上传到文件服务
}
Response: {
  success: boolean;
}

// 删除待办事项 [领域模型: Todo] [对应页面功能: 删除待办]
@NeedLogin()
DELETE /api/todos/:id
Response: {
  success: boolean;
}

// 删除待办附件 [领域模型: TodoAttachment] [对应页面功能: 删除附图]
@NeedLogin()
DELETE /api/todos/:id/attachments/:attachmentId
Response: {
  success: boolean;
}
```

#### 人员管理页 相关

**页面路径**: /users

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取待审核用户列表 | API | GET /api/users/pending |
| 获取全量用户列表 | API | GET /api/users |
| 审核用户注册申请 | API | PATCH /api/users/:id/audit |
| 新增用户 | API | POST /api/users |
| 删除用户 | API | DELETE /api/users/:id |
| 修改用户角色 | API | PATCH /api/users/:id/role |

**所需 API**:
```typescript
// 获取待审核用户列表 [领域模型: User] [对应页面功能: 待审核用户展示]
@NeedLogin()
@CanRole(['admin'])
GET /api/users/pending
Response: {
  items: Array<{
    id: string;
    username: string;
    createdAt: string;
  }>;
}

// 获取全量用户列表 [领域模型: User] [对应页面功能: 用户列表展示]
@NeedLogin()
@CanRole(['admin'])
GET /api/users?page=1&pageSize=20&keyword=xxx
Response: {
  items: Array<{
    id: string;
    username: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
  total: number;
}

// 审核用户注册申请 [领域模型: User] [对应页面功能: 通过/拒绝注册]
@NeedLogin()
@CanRole(['admin'])
PATCH /api/users/:id/audit
Request Body: {
  status: string; // active / rejected
}
Response: {
  success: boolean;
}

// 新增用户账号 [领域模型: User] [对应页面功能: 手动创建用户]
@NeedLogin()
@CanRole(['admin'])
POST /api/users
Request Body: {
  username: string;
  password: string;
  role: string; // user / admin
}
Response: {
  success: boolean;
  data: {
    id: string;
  };
}

// 删除用户 [领域模型: User] [对应页面功能: 删除用户账号]
@NeedLogin()
@CanRole(['admin'])
DELETE /api/users/:id
Response: {
  success: boolean;
}

// 修改用户角色 [领域模型: User] [对应页面功能: 设置/取消管理员]
@NeedLogin()
@CanRole(['admin'])
PATCH /api/users/:id/role
Request Body: {
  role: string; // user / admin
}
Response: {
  success: boolean;
}
```

#### 站点设置页 相关

**页面路径**: /settings

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取站点配置 | API | GET /api/site-config |
| 更新站点配置 | API | PUT /api/site-config |

**所需 API**:
```typescript
// 更新站点配置 [领域模型: SiteConfig] [对应页面功能: 编辑站点标题与副标题]
@NeedLogin()
@CanRole(['admin'])
PUT /api/site-config
Request Body: {
  siteTitle: string;
  siteSubtitle: string;
}
Response: {
  success: boolean;
}