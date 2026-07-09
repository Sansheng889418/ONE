import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
// 注册 axios 拦截器（自动添加 Authorization header、401 跳转登录）
import '@client/src/utils/request';

export * as auth from './auth';
export * as todo from './todo';
export * as user from './user';
export * as siteConfig from './site-config';

export { logger, axiosForBackend };
