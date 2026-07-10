import { useState, useEffect, useRef } from 'react';
import { Search, X, User as UserIcon } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { user } from '@client/src/api';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@client/src/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Checkbox } from '@client/src/components/ui/checkbox';
import type { UserInfo } from '@shared/api.interface';

interface UserSelectBaseProps {
  placeholder?: string;
  disabled?: boolean;
}

interface UserSelectSingleProps extends UserSelectBaseProps {
  value: string | null;
  onChange: (value: string | null) => void;
  multiple?: false;
}

interface UserSelectMultipleProps extends UserSelectBaseProps {
  value: string[];
  onChange: (value: string[]) => void;
  multiple: true;
}

type UserSelectProps = UserSelectSingleProps | UserSelectMultipleProps;

export function UserSelect(props: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const isMultiple = props.multiple === true;

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await user.getUserList({ pageSize: 100 });
        setUsers(res.items);
        fetchedRef.current = true;
      } catch (err) {
        logger.warn('加载用户列表失败', String(err));
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [open]);

  const filteredUsers = keyword.trim()
    ? users.filter((u) =>
        u.username.toLowerCase().includes(keyword.toLowerCase()),
      )
    : users;

  const selectedUsers = isMultiple
    ? users.filter((u) => props.value.includes(u.id))
    : props.value
      ? users.filter((u) => u.id === props.value)
      : [];

  const handleToggle = (userId: string) => {
    if (isMultiple) {
      const current = props.value as string[];
      if (current.includes(userId)) {
        props.onChange(current.filter((id) => id !== userId));
      } else {
        props.onChange([...current, userId]);
      }
    } else {
      props.onChange(props.value === userId ? null : userId);
      setOpen(false);
    }
  };

  const removeSelected = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiple) {
      props.onChange((props.value as string[]).filter((id) => id !== userId));
    } else {
      props.onChange(null);
    }
  };

  const triggerContent = (() => {
    if (isMultiple) {
      const arr = props.value as string[];
      if (arr.length === 0) {
        return (
          <span className="text-muted-foreground text-sm">
            {props.placeholder || '请选择用户'}
          </span>
        );
      }
      return (
        <div className="flex flex-wrap gap-1.5 items-center min-h-[28px] flex-1">
          {selectedUsers.slice(0, 3).map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full"
            >
              <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                {u.username.charAt(0).toUpperCase()}
              </span>
              {u.username}
              {!props.disabled && (
                <button
                  type="button"
                  onClick={(e) => removeSelected(u.id, e)}
                  className="hover:bg-black/10 rounded-full p-0.5 -mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {selectedUsers.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{selectedUsers.length - 3}
            </span>
          )}
        </div>
      );
    }
    if (!props.value) {
      return (
        <span className="text-muted-foreground text-sm">
          {props.placeholder || '请选择用户'}
        </span>
      );
    }
    const u = selectedUsers[0];
    return (
      <span className="text-sm text-foreground flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
          {u?.username.charAt(0).toUpperCase() || '?'}
        </span>
        {u?.username || '未知用户'}
      </span>
    );
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={props.disabled}
          className="w-full justify-start font-normal h-auto min-h-9 py-1.5"
        >
          <UserIcon className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          {triggerContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索用户"
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-64">
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无用户
            </div>
          )}
          {!loading &&
            filteredUsers.map((u) => {
              const checked = isMultiple
                ? (props.value as string[]).includes(u.id)
                : props.value === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => handleToggle(u.id)}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                >
                  {isMultiple && <Checkbox checked={checked} />}
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {u.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{u.username}</span>
                </div>
              );
            })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default UserSelect;
