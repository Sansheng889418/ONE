import { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';

import { useAuth } from '@client/src/hooks/useAuth';
import { user } from '@client/src/api';
import PendingList from './PendingList';
import UserTable from './UserTable';
import type { UserInfo, UserRole } from '@shared/api.interface';

const UsersPage = () => {
  const { user: currentUser } = useAuth();

  const [pendingList, setPendingList] = useState<UserInfo[]>([]);
  const [userList, setUserList] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [keyword, setKeyword] = useState('');

  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [auditLoadingId, setAuditLoadingId] = useState<string | null>(null);
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await user.getPendingUsers();
      setPendingList(res.items);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '加载待审核列表失败';
      logger.error('加载待审核用户失败', msg);
      toast.error(msg);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await user.getUserList({
        page,
        pageSize,
        keyword: keyword || undefined,
      });
      setUserList(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || '加载用户列表失败';
      logger.error('加载用户列表失败', msg);
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchPending();
    fetchList();
  }, [fetchPending, fetchList]);

  const handleAudit = async (id: string, status: 'active' | 'rejected') => {
    setAuditLoadingId(id);
    try {
      const res = await user.auditUser(id, { status });
      if (res.success) {
        toast.success(status === 'active' ? '已通过审核' : '已拒绝该用户');
        fetchPending();
        fetchList();
      }
    } finally {
      setAuditLoadingId(null);
    }
  };

  const handleRoleToggle = async (u: UserInfo) => {
    const newRoleValue: UserRole = u.role === 'admin' ? 'user' : 'admin';
    setRoleLoadingId(u.id);
    try {
      const res = await user.updateUserRole(u.id, { role: newRoleValue });
      if (res.success) {
        toast.success(
          newRoleValue === 'admin' ? '已设为管理员' : '已取消管理员',
        );
        fetchList();
      }
    } finally {
      setRoleLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoadingId(id);
    try {
      const res = await user.deleteUser(id);
      if (res.success) {
        toast.success('删除成功');
        fetchList();
      }
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleCreate = async (data: {
    username: string;
    password: string;
    role: UserRole;
  }): Promise<boolean> => {
    const res = await user.createUser(data);
    if (res.success) {
      fetchList();
      return true;
    }
    return false;
  };

  const handleSearch = (kw: string) => {
    setPage(1);
    setKeyword(kw);
  };

  return (
    <div className="space-y-6">
      <PendingList
        items={pendingList}
        loading={loadingPending}
        auditLoadingId={auditLoadingId}
        onAudit={handleAudit}
      />
      <UserTable
        items={userList}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loadingList}
        currentUserId={currentUser?.id}
        searchKeyword={keyword}
        roleLoadingId={roleLoadingId}
        deleteLoadingId={deleteLoadingId}
        onSearch={handleSearch}
        onPageChange={setPage}
        onRoleToggle={handleRoleToggle}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default UsersPage;
