import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Clock, Check, X } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import type { UserInfo } from '@shared/api.interface';

interface PendingListProps {
  items: UserInfo[];
  loading: boolean;
  auditLoadingId: string | null;
  onAudit: (id: string, status: 'active' | 'rejected') => Promise<void>;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const PendingList = ({
  items,
  loading,
  auditLoadingId,
  onAudit,
}: PendingListProps) => {
  const handleAudit = async (id: string, status: 'active' | 'rejected') => {
    try {
      await onAudit(id, status);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '操作失败';
      logger.error('审核用户失败', msg);
      toast.error(msg);
    }
  };

  return (
    <section data-ai-section-type="card-list">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">
            待审核
            {items.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {items.length}
              </span>
            )}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center text-muted-foreground text-sm">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center text-muted-foreground text-sm">
          暂无待审核用户
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-review-bg border border-warning/30 rounded-xl p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {item.username}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-warning/20 text-warning-foreground border-0"
                    >
                      待审核
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    注册时间：{formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAudit(item.id, 'active')}
                    disabled={auditLoadingId === item.id}
                    className="bg-success hover:bg-success/90 text-success-foreground border-0"
                  >
                    <Check className="w-4 h-4" />
                    通过
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAudit(item.id, 'rejected')}
                    disabled={auditLoadingId === item.id}
                  >
                    <X className="w-4 h-4" />
                    拒绝
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PendingList;
