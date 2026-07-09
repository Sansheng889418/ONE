import { useState, useCallback, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { auth } from '@client/src/api';
import { setToken, clearToken, getToken } from '@client/src/utils/request';
import type { UserRole } from '@shared/api.interface';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

const USER_KEY = 'auth_user';

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => loadUserFromStorage());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getToken());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await auth.login({ username, password });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        logger.info({ level: 'info', args: [`用户登录成功: ${res.user.username}`] });
      }
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await auth.register({ username, password });
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    logger.info({ level: 'info', args: ['用户已登出'] });
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };
}

export default useAuth;
