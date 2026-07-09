import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { todo } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { TodoInfoCard } from './TodoInfoCard';
import { AttachmentSection } from './AttachmentSection';
import type { TodoItem } from '@shared/api.interface';
import type { AttachmentItem } from '@client/src/components/business-ui/image-uploader';

const TodoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [todoData, setTodoData] = useState<TodoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 编辑态
  const [title, setTitle] = useState('');
  const [remark, setRemark] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [titleError, setTitleError] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await todo.getTodoDetail(id);
      if (res.success && res.data) {
        setTodoData(res.data);
      }
    } catch (err) {
      logger.error('获取待办详情失败', String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const enterEditMode = () => {
    if (!todoData) return;
    setTitle(todoData.title);
    setRemark(todoData.remark);
    setDeadline(todoData.deadline ? new Date(todoData.deadline) : undefined);
    setAssignees(todoData.assignees.map((a) => a.userId));
    setAttachments(
      todoData.attachments.map((a) => ({ url: a.url, fileName: a.fileName })),
    );
    setTitleError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setTitleError('');
  };

  const handleSave = async () => {
    if (!id || !title.trim()) {
      setTitleError('请输入标题');
      return;
    }
    setSubmitting(true);
    try {
      await todo.updateTodo(id, {
        title: title.trim(),
        remark: remark.trim() || undefined,
        deadline: deadline ? deadline.toISOString() : undefined,
        assignees,
        attachments: attachments.map((a) => a.url),
      });
      setIsEditing(false);
      fetchDetail();
    } catch (err) {
      logger.error('更新待办失败', String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !todoData) return;
    const newStatus = todoData.status === 'pending' ? 'completed' : 'pending';
    try {
      await todo.updateTodoStatus(id, { status: newStatus });
      setTodoData({ ...todoData, status: newStatus });
    } catch (err) {
      logger.error('更新状态失败', String(err));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await todo.deleteTodo(id);
      navigate('/');
    } catch (err) {
      logger.error('删除待办失败', String(err));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        加载中...
      </div>
    );
  }

  if (!todoData) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        待办不存在
      </div>
    );
  }

  const isCompleted = todoData.status === 'completed';

  return (
    <div className="space-y-4 pb-24">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between -mx-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={enterEditMode}
              aria-label="编辑"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label="删除"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 主卡片 */}
      <TodoInfoCard
        todoData={todoData}
        isEditing={isEditing}
        title={title}
        remark={remark}
        deadline={deadline}
        assignees={assignees}
        titleError={titleError}
        onTitleChange={setTitle}
        onRemarkChange={setRemark}
        onDeadlineChange={setDeadline}
        onAssigneesChange={setAssignees}
        onTitleErrorClear={() => setTitleError('')}
      />

      {/* 附件区 */}
      <AttachmentSection
        todoId={id || ''}
        isEditing={isEditing}
        attachments={todoData.attachments}
        editAttachments={attachments}
        onEditChange={setAttachments}
        onDelete={(attId) =>
          setTodoData((prev) =>
            prev
              ? {
                  ...prev,
                  attachments: prev.attachments.filter(
                    (a) => a.id !== attId,
                  ),
                }
              : prev,
          )
        }
      />

      {/* 移动端底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 md:hidden safe-bottom">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={cancelEdit}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleToggleStatus}
            data-ai-section-type="button"
          >
            {isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                取消完成
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                标记完成
              </>
            )}
          </Button>
        )}
      </div>

      {/* 桌面端底部操作 */}
      <div className="hidden md:flex justify-end gap-2 pt-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={cancelEdit} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? '保存中...' : '保存修改'}
            </Button>
          </>
        ) : (
          <Button onClick={handleToggleStatus} data-ai-section-type="button">
            {isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                取消完成
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                标记完成
              </>
            )}
          </Button>
        )}
      </div>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条待办吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TodoDetailPage;
