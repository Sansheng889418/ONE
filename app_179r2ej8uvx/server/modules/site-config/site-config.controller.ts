import { Controller, Get, Put, Body } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { Public } from '@server/common/auth/public.decorator';
import { CurrentUser } from '@server/common/auth/current-user.decorator';
import type { JwtPayload } from '@server/common/auth/jwt.service';
import type {
  SiteConfig,
  UpdateSiteConfigRequest,
  ApiResponse,
} from '@shared/api.interface';

@Controller('api/site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Public()
  @Get()
  async getConfig(): Promise<SiteConfig> {
    return this.siteConfigService.getConfig();
  }

  @Put()
  async updateConfig(
    @Body() dto: UpdateSiteConfigRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SiteConfig>> {
    const data = await this.siteConfigService.updateConfig(dto, user.role);
    return { success: true, data, message: '配置已更新' };
  }
}
