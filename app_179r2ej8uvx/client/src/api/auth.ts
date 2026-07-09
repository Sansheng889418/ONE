import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@shared/api.interface';

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await axiosForBackend.post('/api/auth/login', body);
  return res.data;
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await axiosForBackend.post('/api/auth/register', body);
  return res.data;
}
