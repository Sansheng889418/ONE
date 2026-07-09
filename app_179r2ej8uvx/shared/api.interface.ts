export interface UserInfo {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
  message?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface AssigneeInfo {
  userId: string;
  username: string;
}

export interface TodoItem {
  id: string;
  title: string;
  remark: string;
  deadline: string | null;
  status: TodoStatus;
  assignees: AssigneeInfo[];
  creator: AssigneeInfo;
  attachments: TodoAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type TodoStatus = 'pending' | 'completed';

export interface TodoAttachment {
  id: string;
  url: string;
  fileName: string;
}

export interface TodoListRequest {
  status?: TodoStatus;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
}

export interface TodoListResponse {
  items: TodoItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTodoRequest {
  title: string;
  remark?: string;
  deadline?: string;
  assignees: string[];
  attachments?: string[];
}

export interface UpdateTodoRequest {
  title: string;
  remark?: string;
  deadline?: string;
  assignees: string[];
  attachments?: string[];
}

export interface UpdateTodoStatusRequest {
  status: TodoStatus;
}

export interface TodoDetailResponse {
  success: boolean;
  data: TodoItem;
}

export interface UserListRequest {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: UserStatus;
}

export interface UserListResponse {
  items: UserInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuditUserRequest {
  status: 'active' | 'rejected';
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface SiteConfig {
  siteTitle: string;
  siteSubtitle: string;
}

export interface UpdateSiteConfigRequest {
  siteTitle: string;
  siteSubtitle: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}
