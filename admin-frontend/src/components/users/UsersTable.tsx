import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Shield, Ban, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types/users';
import { USER_ROLE_LABELS, USER_ROLE_COLORS } from '@/types/users';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onEditRole: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export function UsersTable({
  users,
  isLoading,
  onEditRole,
  onToggleStatus,
}: UsersTableProps) {
  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>사용자가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>이메일</TableHead>
            <TableHead className="w-[120px]">닉네임</TableHead>
            <TableHead className="w-[100px]">역할</TableHead>
            <TableHead className="w-[80px]">상태</TableHead>
            <TableHead className="w-[150px]">가입일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
              <TableCell>
                <span className="text-2xl">{user.profile_emoji}</span>
              </TableCell>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                {user.display_name || user.username || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={USER_ROLE_COLORS[user.role]}>
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                {user.is_active ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    활성
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    비활성
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRole(user)}>
                      <Shield className="mr-2 h-4 w-4" />
                      역할 변경
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                      {user.is_active ? (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          비활성화
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          활성화
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>이메일</TableHead>
            <TableHead className="w-[120px]">닉네임</TableHead>
            <TableHead className="w-[100px]">역할</TableHead>
            <TableHead className="w-[80px]">상태</TableHead>
            <TableHead className="w-[150px]">가입일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
