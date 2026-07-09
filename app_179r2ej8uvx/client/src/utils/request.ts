import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin(): void {
  clearToken();
  const loginPath = '/login';
  if (window.location.pathname !== loginPath) {
    window.location.assign(loginPath);
  }
}

function isLoginRequest(config: unknown): boolean {
  const url = (config as { url?: string })?.url || '';
  return url.includes('/api/auth/login');
}

// 请求拦截器：自动添加 Authorization header
axiosForBackend.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    logger.error({ level: 'error', args: ['Request interceptor error', String(error)] });
    return Promise.reject(error);
  },
);

// 响应拦截器：401 时清除 token 并跳转登录页（登录接口的401不跳转，让页面显示错误提示）
axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !isLoginRequest(error?.config)) {
      logger.warn({ level: 'warn', args: ['401 Unauthorized, redirecting to login'] });
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export { axiosForBackend as request };
export default axiosForBackend;
