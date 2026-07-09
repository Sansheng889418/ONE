import { useState } from 'react';
import {
  Calendar,
  User as UserIcon,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
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
import type { TodoItem } from '@shared/api.interface';
import type { AttachmentItem } from '@client/src/components/business-ui/image-uploader';

interface TodoInfoCardProps {
  todoData: TodoItem;
  isEditing: boolean;
  title: string;
  remark: string;
  deadline: Date | undefined;
  assignees: string[];
  titleError: string;
  onTitleChange: (v: string) => void;
  onRemarkChange: (v: string) => void;
  onDeadlineChange: (d: Date | undefined) => void;
  onAssigneesChange: (v: string[]) => void;
  onTitleErrorClear: () => void;
}

export function TodoInfoCard({
  todoData,
  isEditing,
  title,
  remark,
  deadline,
  assignees,
  titleError,
  onTitleChange,
  onRemarkChange,
  onDeadlineChange,
  onAssigneesChange,
  onTitleErrorClear,
}: TodoInfoCardProps) {
  const isCompleted = todoData.status === 'completed';

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div
        className={`h-1 w-full ${
          isCompleted ? 'bg-completed' : 'bg-pending'
        }`}
      />
      <div className="p-5 space-y-4">
        {isEditing ? (
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">
              标题 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => {
                onTitleChange(e.target.value);
                if (titleError) onTitleErrorClear();
              }}
              className={titleError ? 'border-destructive' : ''}
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
          </div>
        ) : (
          <h1
            className={`text-lg font-semibold ${
              isCompleted
                ? 'text-muted-foreground line-through'
                : 'text-foreground'
            }`}
          >
            {todoData.title}
          </h1>
        )}

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-0.5 rounded-full ${
              isCompleted
                ? 'bg-completed-bg text-completed border-transparent'
                : 'bg-pending-bg text-pending border-transparent'
            }`}
          >
            {isCompleted ? '已完成' : '待办'}
          </Badge>
        </div>

        {/* 信息行 */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">创建人：</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {todoData.creator.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground">
                {todoData.creator.username}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <UserIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground shrink-0">负责人：</span>
            {isEditing ? (
              <div className="flex-1">
                <UserSelect
                  multiple
                  value={assignees}
                  onChange={onAssigneesChange}
                  placeholder="选择负责人"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {todoData.assignees.length > 0 ? (
                  todoData.assignees.map((a) => (
                    <span
                      key={a.userId}
                      className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full"
                    >
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {a.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {a.username}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">未设置</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">截止时间：</span>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 font-normal"
                  >
                    {deadline ? format(deadline, 'yyyy-MM-dd') : '选择日期'}
                    {deadline && (
                      <X
                        className="w-3 h-3 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeadlineChange(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComp
                    mode="single"
                    selected={deadline}
                    onSelect={onDeadlineChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <span className="text-foreground">
                {todoData.deadline
                  ? format(new Date(todoData.deadline), 'yyyy年MM月dd日', {
                      locale: zhCN,
                    })
                  : '未设置'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <ClockIcon />
            <span className="text-muted-foreground shrink-0">创建时间：</span>
            <span className="text-foreground">
              {format(new Date(todoData.createdAt), 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
        </div>

        {/* 备注 */}
        <div className="pt-2 border-t border-border">
          {isEditing ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-remark">备注</Label>
              <Textarea
                id="edit-remark"
                value={remark}
                onChange={(e) => onRemarkChange(e.target.value)}
                rows={4}
                placeholder="补充说明（可选）"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                备注
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {todoData.remark || '暂无备注'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default TodoInfoCard;
