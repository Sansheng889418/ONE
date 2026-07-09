import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ListTodo,
  X,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { todo } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@client/src/components/ui/empty';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import { Calendar as CalendarComp } from '@client/src/components/ui/calendar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import UserSelect from '@client/src/components/business-ui/user-select';
import ImageUploader, {
  type AttachmentItem,
} from '@client/src/components/business-ui/image-uploader';
import type {
  TodoItem,
  TodoStatus,
  TodoListResponse,
} from '@shared/api.interface';

const statusTabs: { key: 'all' | 'pending' | 'completed'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待办' },
  { key: 'completed', label: '已完成' },
];

const TodoListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCompletedPage = location.pathname === '/completed';
  const initialStatus: 'all' | 'pending' | 'completed' = isCompletedPage
    ? 'completed'
    : 'all';

  const [statusTab, setStatusTab] = useState<'all' | 'pending' | 'completed'>(
    initialStatus,
  );
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [list, setList] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [remark, setRemark] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        status?: TodoStatus;
        assigneeId?: string;
        page: number;
        pageSize: number;
      } = {
        page,
        pageSize,
      };
      if (statusTab !== 'all') params.status = statusTab;
      if (assigneeId) params.assigneeId = assigneeId;

      const res: TodoListResponse = await todo.getTodoList(params);
      setList(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('获取待办列表失败', String(err));
    } finally {
      setLoading(false);
    }
  }, [statusTab, assigneeId, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggleStatus = async (item: TodoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: TodoStatus = item.status === 'pending' ? 'completed' : 'pending';
    try {
      await todo.updateTodoStatus(item.id, { status: newStatus });
      setList((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t)),
      );
    } catch (err) {
      logger.error('更新状态失败', String(err));
    }
  };

  const resetForm = () => {
    setTitle('');
    setRemark('');
    setDeadline(undefined);
    setAssignees([]);
    setAttachments([]);
    setTitleError('');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setTitleError('请输入标题');
      return;
    }
    setSubmitting(true);
    try {
      await todo.createTodo({
        title: title.trim(),
        remark: remark.trim() || undefined,
        deadline: deadline ? deadline.toISOString() : undefined,
        assignees,
        attachments: attachments.map((a) => a.url),
      });
      setCreateOpen(false);
      resetForm();
      setPage(1);
      fetchList();
    } catch (err) {
      logger.error('创建待办失败', String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/todo/${id}`);
  };

  return (
    <div className="space-y-4" data-ai-section-type="card-list">
      {/* 筛选栏 */}
      <div className="sticky top-0 -mx-4 px-4 py-3 bg-background/95 backdrop-blur z-30 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex bg-muted rounded-lg p-[3px]">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
                  statusTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-40 shrink-0">
            <UserSelect
              value={assigneeId}
              onChange={(v) => {
                setAssigneeId(v);
                setPage(1);
              }}
              placeholder="负责人"
            />
          </div>
        </div>
      </div>

      {/* 列表 */}
      {loading && list.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          加载中...
        </div>
      ) : list.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodo className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无待办</EmptyTitle>
            <EmptyDescription>
              点击右下角按钮创建你的第一个待办
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>新建待办</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((item) => (
            <TodoCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item.id)}
              onToggleStatus={(e) => handleToggleStatus(item, e)}
            />
          ))}
        </div>
      )}

      {total > page * pageSize && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
            加载更多
          </Button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="新建待办"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 新建弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建待办</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                标题 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                placeholder="请输入待办标题"
                className={titleError ? 'border-destructive' : ''}
              />
              {titleError && (
                <p className="text-xs text-destructive">{titleError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="补充说明（可选）"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>截止时间</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    {deadline
                      ? format(deadline, 'yyyy年MM月dd日', { locale: zhCN })
                      : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComp
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>负责人</Label>
              <UserSelect
                multiple
                value={assignees}
                onChange={setAssignees}
                placeholder="选择负责人"
              />
            </div>
            <div className="space-y-1.5">
              <Label>附件图片</Label>
              <ImageUploader value={attachments} onChange={setAttachments} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TodoCardProps {
  item: TodoItem;
  onClick: () => void;
  onToggleStatus: (e: React.MouseEvent) => void;
}

function TodoCard({ item, onClick, onToggleStatus }: TodoCardProps) {
  const isCompleted = item.status === 'completed';
  const colorClass = isCompleted
    ? 'bg-completed'
    : 'bg-pending';

  return (
    <div
      onClick={onClick}
      className="relative bg-card rounded-xl border border-border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      data-ai-section-type="card-list"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}
      />
      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm font-medium flex-1 line-clamp-2 ${
              isCompleted
                ? 'text-muted-foreground line-through'
                : 'text-foreground'
            }`}
          >
            {item.title}
          </h3>
          <button
            onClick={onToggleStatus}
            className={`shrink-0 transition-colors ${
              isCompleted
                ? 'text-completed'
                : 'text-muted-foreground hover:text-pending'
            }`}
            aria-label={isCompleted ? '取消完成' : '标记完成'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 fill-current" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
        </div>

        {item.remark && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {item.remark}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {item.assignees.slice(0, 3).map((a) => (
                  <Avatar
                    key={a.userId}
                    className="w-6 h-6 border-2 border-card"
                  >
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {a.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            {item.assignees.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{item.assignees.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {item.deadline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(item.deadline), 'MM-dd')}
              </div>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0 rounded-full ${
                isCompleted
                  ? 'bg-completed-bg text-completed border-transparent'
                  : 'bg-pending-bg text-pending border-transparent'
              }`}
            >
              {isCompleted ? '已完成' : '待办'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodoListPage;
