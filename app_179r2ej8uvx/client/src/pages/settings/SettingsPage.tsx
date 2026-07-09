import { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Save, Eye, Settings as SettingsIcon } from 'lucide-react';
import { siteConfig } from '@client/src/api';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Button } from '@client/src/components/ui/button';
import { Label } from '@client/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@client/src/components/ui/card';
import type { SiteConfig as SiteConfigType } from '@shared/api.interface';

const SettingsPage = () => {
  const [siteTitle, setSiteTitle] = useState('');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data: SiteConfigType = await siteConfig.getSiteConfig();
      setSiteTitle(data.siteTitle);
      setSiteSubtitle(data.siteSubtitle);
    } catch (err) {
      logger.warn('加载站点配置失败', String(err));
      setError('加载配置失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await siteConfig.updateSiteConfig({ siteTitle, siteSubtitle });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      // 刷新全局站点标题
      window.location.reload();
    } catch (err) {
      logger.warn('保存站点配置失败', String(err));
      setError('保存失败，请检查权限后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">站点设置</h2>
          <p className="text-sm text-muted-foreground">自定义站点标题与描述</p>
        </div>
      </div>

      <Card className="bg-slate-50/60 border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base">基础信息</CardTitle>
          <CardDescription>修改站点的展示标题和副标题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="site-title">网站标题</Label>
            <Input
              id="site-title"
              value={siteTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteTitle(e.target.value)}
              placeholder="请输入网站标题"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {siteTitle.length}/50 字符
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-subtitle">站点副标题</Label>
            <Textarea
              id="site-subtitle"
              value={siteSubtitle}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSiteSubtitle(e.target.value)}
              placeholder="请输入站点副标题或描述"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {siteSubtitle.length}/200 字符
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saved ? (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.8} />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.8} />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" strokeWidth={1.8} />
            实时预览
          </CardTitle>
          <CardDescription>预览修改后的页面头部效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {siteTitle || '网站标题'}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {siteSubtitle || '站点副标题将显示在这里'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
