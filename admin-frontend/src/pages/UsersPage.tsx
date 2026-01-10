import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { UsersTable } from '@/components/users/UsersTable';
import { UserRoleDialog } from '@/components/users/UserRoleDialog';
import { useUsers, useUpdateUserStatus, useUpdateUserRole } from '@/hooks/useUsers';
import type { User, UserRole, UserFilters } from '@/types/users';

const ITEMS_PER_PAGE = 20;

export function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useUsers(filters);
  const updateStatusMutation = useUpdateUserStatus();
  const updateRoleMutation = useUpdateUserRole();

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      offset: 0,
    }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      is_active: value === 'ALL' ? undefined : value === 'ACTIVE',
      offset: 0,
    }));
  };

  const handleRoleFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      role: value === 'ALL' ? undefined : (value as UserRole),
      offset: 0,
    }));
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    await updateStatusMutation.mutateAsync({
      userId: user.id,
      data: { is_active: !user.is_active },
    });
  };

  const handleConfirmRole = async (userId: string, role: UserRole) => {
    await updateRoleMutation.mutateAsync({
      userId,
      data: { role },
    });
    setIsRoleDialogOpen(false);
    setSelectedUser(null);
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - ITEMS_PER_PAGE),
    }));
  };

  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + ITEMS_PER_PAGE,
    }));
  };

  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;
  const hasNextPage = data ? (filters.offset || 0) + ITEMS_PER_PAGE < data.total : false;
  const hasPrevPage = (filters.offset || 0) > 0;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          사용자 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>사용자 관리</CardTitle>
              <CardDescription>
                사용자 목록을 조회하고 역할/상태를 관리합니다.
                {data && ` (총 ${data.total}명)`}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <Input
                placeholder="이메일, 닉네임으로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-[150px]">
              <Select
                value={filters.is_active === undefined ? 'ALL' : filters.is_active ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 상태</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="INACTIVE">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select
                value={filters.role || 'ALL'}
                onValueChange={handleRoleFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 역할</SelectItem>
                  <SelectItem value="USER">일반 사용자</SelectItem>
                  <SelectItem value="ADMIN">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <UsersTable
            users={data?.items || []}
            isLoading={isLoading}
            onEditRole={handleEditRole}
            onToggleStatus={handleToggleStatus}
          />

          {/* Pagination */}
          {data && data.total > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total}명 중 {(filters.offset || 0) + 1} -{' '}
                {Math.min((filters.offset || 0) + ITEMS_PER_PAGE, data.total)}명
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <UserRoleDialog
        user={selectedUser}
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        onConfirm={handleConfirmRole}
        isLoading={updateRoleMutation.isPending}
      />
    </div>
  );
}
