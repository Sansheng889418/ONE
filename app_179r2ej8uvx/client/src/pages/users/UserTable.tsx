import { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  Trash2,
  Shield,
  ShieldOff,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@client/src/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import type { UserInfo, UserRole, UserStatus } from '@shared/api.interface';

interface UserTableProps {
  items: UserInfo[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  currentUserId: string | undefined;
  searchKeyword: string;
  roleLoadingId: string | null;
  deleteLoadingId: string | null;
  onSearch: (keyword: string) => void;
  onPageChange: (page: number) => void;
  onRoleToggle: (user: UserInfo) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (data: {
    username: string;
    password: string;
    role: UserRole;
  }) => Promise<boolean>;
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

const roleLabel: Record<UserRole, string> = {
  user: '普通用户',
  admin: '管理员',
};

const statusLabel: Record<UserStatus, string> = {
  pending: '待审核',
  active: '已激活',
  rejected: '已拒绝',
};

const statusVariant: Record<
  UserStatus,
  'default' | 'secondary' | 'destructive'
> = {
  pending: 'secondary',
  active: 'default',
  rejected: 'destructive',
};

const UserTable = ({
  items,
  total,
  page,
  pageSize,
  loading,
  currentUserId,
  searchKeyword,
  roleLoadingId,
  deleteLoadingId,
  onSearch,
  onPageChange,
  onRoleToggle,
  onDelete,
  onCreate,
}: UserTableProps) => {
  const [searchInput, setSearchInput] = useState(searchKeyword);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newUsername.trim()) {
      setCreateError('请输入用户名');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setCreateError('密码至少 6 位');
      return;
    }

    setCreating(true);
    try {
      const success = await onCreate({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      if (success) {
        toast.success('用户创建成功');
        setCreateDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '创建失败';
      logger.error('创建用户失败', msg);
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleToggle = async (u: UserInfo) => {
    try {
      await onRoleToggle(u);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '操作失败';
      logger.error('修改角色失败', msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '删除失败';
      logger.error('删除用户失败', msg);
      toast.error(msg);
    }
  };

  const isSelf = (id: string): boolean => currentUserId === id;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <section data-ai-section-type="card-list">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-base font-semibold text-foreground">
          全部用户
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            共 {total} 人
          </span>
        </h2>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索用户名"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-full sm:w-56"
              />
            </div>
          </form>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4" />
                新增用户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增用户</DialogTitle>
                <DialogDescription>
                  创建新用户账号，创建后默认为激活状态
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {createError && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    {createError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-username">用户名</Label>
                  <Input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="请输入用户名"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 6 位"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">角色</Label>
                  <Select
                    value={newRole}
                    onValueChange={(v) => setNewRole(v as UserRole)}
                  >
                    <SelectTrigger id="new-role" className="w-full">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      取消
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={creating}>
                    {creating ? '创建中...' : '创建'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center text-muted-foreground text-sm">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center text-muted-foreground text-sm">
          暂无用户
        </div>
      ) : (
        <>
          {/* 桌面端表格视图 */}
          <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground font-medium">
                  <th className="px-4 py-3">用户名</th>
                  <th className="px-4 py-3">角色</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">注册时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-b-0 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.username}
                      {isSelf(u.id) && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          （我）
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === 'admin' ? 'default' : 'secondary'}
                      >
                        {roleLabel[u.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[u.status]}>
                        {statusLabel[u.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleToggle(u)}
                          disabled={isSelf(u.id) || roleLoadingId === u.id}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ShieldOff className="w-4 h-4" />
                              取消管理员
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              设为管理员
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                isSelf(u.id) || deleteLoadingId === u.id
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                确认删除
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除用户「{u.username}」吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(u.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                确认删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片列表 */}
          <div className="md:hidden space-y-2">
            {items.map((u) => (
              <div
                key={u.id}
                className="bg-card rounded-xl border border-border shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {u.username}
                      {isSelf(u.id) && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          （我）
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={u.role === 'admin' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {roleLabel[u.role]}
                      </Badge>
                      <Badge
                        variant={statusVariant[u.status]}
                        className="text-[10px]"
                      >
                        {statusLabel[u.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  注册时间：{formatDate(u.createdAt)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRoleToggle(u)}
                    disabled={isSelf(u.id) || roleLoadingId === u.id}
                  >
                    {u.role === 'admin' ? (
                      <>
                        <ShieldOff className="w-4 h-4" />
                        取消管理员
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        设为管理员
                      </>
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={isSelf(u.id) || deleteLoadingId === u.id}
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          确认删除
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除用户「{u.username}」吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(u.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                第 {page} / {totalPages} 页
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default UserTable;
