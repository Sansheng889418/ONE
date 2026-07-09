import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TodoListRequest,
  TodoListResponse,
  TodoDetailResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  UpdateTodoStatusRequest,
  ApiResponse,
} from '@shared/api.interface';

export async function getTodoList(params: TodoListRequest): Promise<TodoListResponse> {
  const res = await axiosForBackend.get('/api/todos', { params });
  return res.data;
}

export async function getTodoDetail(id: string): Promise<TodoDetailResponse> {
  const res = await axiosForBackend.get(`/api/todos/${id}`);
  return res.data;
}

export async function createTodo(body: CreateTodoRequest): Promise<ApiResponse<{ id: string }>> {
  const res = await axiosForBackend.post('/api/todos', body);
  return res.data;
}

export async function updateTodo(id: string, body: UpdateTodoRequest): Promise<ApiResponse> {
  const res = await axiosForBackend.put(`/api/todos/${id}`, body);
  return res.data;
}

export async function updateTodoStatus(id: string, body: UpdateTodoStatusRequest): Promise<ApiResponse> {
  const res = await axiosForBackend.patch(`/api/todos/${id}/status`, body);
  return res.data;
}

export async function deleteTodo(id: string): Promise<ApiResponse> {
  const res = await axiosForBackend.delete(`/api/todos/${id}`);
  return res.data;
}

export async function deleteTodoAttachment(
  todoId: string,
  attachmentId: string,
): Promise<ApiResponse> {
  const res = await axiosForBackend.delete(
    `/api/todos/${todoId}/attachments/${attachmentId}`,
  );
  return res.data;
}
