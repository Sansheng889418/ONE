import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  SiteConfig,
  UpdateSiteConfigRequest,
  ApiResponse,
} from '@shared/api.interface';

export async function getSiteConfig(): Promise<SiteConfig> {
  const res = await axiosForBackend.get('/api/site-config');
  return res.data;
}

export async function updateSiteConfig(body: UpdateSiteConfigRequest): Promise<ApiResponse> {
  const res = await axiosForBackend.put('/api/site-config', body);
  return res.data;
}
