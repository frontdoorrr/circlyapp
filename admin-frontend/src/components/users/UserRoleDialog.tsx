import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User, UserRole } from '@/types/users';
import { USER_ROLE_LABELS, USER_ROLE_COLORS } from '@/types/users';

interface UserRoleDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, role: UserRole) => void;
  isLoading?: boolean;
}

export function UserRoleDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  // Reset selection when dialog opens with a new user
  useEffect(() => {
    if (open && user) {
      setSelectedRole(user.role);
    } else {
      setSelectedRole('');
    }
  }, [open, user]);

  const handleConfirm = () => {
    if (user && selectedRole) {
      onConfirm(user.id, selectedRole);
    }
  };

  if (!user) return null;

  const isChangingToAdmin = selectedRole === 'ADMIN' && user.role !== 'ADMIN';
  const isRemovingAdmin = selectedRole === 'USER' && user.role === 'ADMIN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>역할 변경</DialogTitle>
          <DialogDescription>
            사용자의 역할을 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{user.profile_emoji}</span>
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.display_name || user.username || '이름 없음'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">현재 역할:</span>
              <Badge variant={USER_ROLE_COLORS[user.role]}>
                {USER_ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">새 역할 선택</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="역할을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">일반 사용자</SelectItem>
                <SelectItem value="ADMIN">관리자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning Messages */}
          {isChangingToAdmin && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                관리자 권한을 부여하면 이 사용자가 Admin 대시보드에 접근할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
          {isRemovingAdmin && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                관리자 권한을 제거하면 이 사용자는 더 이상 Admin 대시보드에 접근할 수 없습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRole || selectedRole === user.role || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            역할 변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
