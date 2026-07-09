import { Inject, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { inArray } from 'drizzle-orm';
import { siteConfig } from '@server/database/schema';
import type { SiteConfig, UpdateSiteConfigRequest } from '@shared/api.interface';

const SITE_TITLE_KEY = 'site_title';
const SITE_SUBTITLE_KEY = 'site_subtitle';

@Injectable()
export class SiteConfigService {
  private readonly logger = new Logger(SiteConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getConfig(): Promise<SiteConfig> {
    const rows = await this.db
      .select({ key: siteConfig.key, value: siteConfig.value })
      .from(siteConfig)
      .where(inArray(siteConfig.key, [SITE_TITLE_KEY, SITE_SUBTITLE_KEY]));

    const configMap: Record<string, string> = {};
    rows.forEach((row: { key: string; value: string }) => {
      configMap[row.key] = row.value;
    });

    return {
      siteTitle: configMap[SITE_TITLE_KEY] ?? '',
      siteSubtitle: configMap[SITE_SUBTITLE_KEY] ?? '',
    };
  }

  async updateConfig(
    dto: UpdateSiteConfigRequest,
    role: string,
  ): Promise<SiteConfig> {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可修改站点配置');
    }

    const now = new Date();

    const entries = [
      { key: SITE_TITLE_KEY, value: dto.siteTitle, updatedAt: now },
      { key: SITE_SUBTITLE_KEY, value: dto.siteSubtitle, updatedAt: now },
    ];

    for (const entry of entries) {
      await this.db
        .insert(siteConfig)
        .values(entry)
        .onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: entry.value, updatedAt: now },
        });
    }

    this.logger.log(`站点配置已更新`);

    return {
      siteTitle: dto.siteTitle,
      siteSubtitle: dto.siteSubtitle,
    };
  }
}
