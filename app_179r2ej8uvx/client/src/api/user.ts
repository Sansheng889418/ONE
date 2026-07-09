import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserListRequest,
  UserListResponse,
  CreateUserRequest,
  AuditUserRequest,
  UpdateUserRoleRequest,
  ApiResponse,
} from '@shared/api.interface';

export async function getUserList(params: UserListRequest): Promise<UserListResponse> {
  const res = await axiosForBackend.get('/api/users', { params });
  return res.data;
}

export async function getPendingUsers(): Promise<UserListResponse> {
  const res = await axiosForBackend.get('/api/users/pending');
  return res.data;
}

export async function createUser(body: CreateUserRequest): Promise<ApiResponse<{ id: string }>> {
  const res = await axiosForBackend.post('/api/users', body);
  return res.data;
}

export async function auditUser(id: string, body: AuditUserRequest): Promise<ApiResponse> {
  const res = await axiosForBackend.patch(`/api/users/${id}/audit`, body);
  return res.data;
}

export async function updateUserRole(
  id: string,
  body: UpdateUserRoleRequest,
): Promise<ApiResponse> {
  const res = await axiosForBackend.patch(`/api/users/${id}/role`, body);
  return res.data;
}

export async function deleteUser(id: string): Promise<ApiResponse> {
  const res = await axiosForBackend.delete(`/api/users/${id}`);
  return res.data;
}
