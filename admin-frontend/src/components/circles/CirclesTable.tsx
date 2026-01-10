import { useNavigate } from 'react-router-dom';
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
import { MoreHorizontal, Users, Ban, CheckCircle, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Circle } from '@/types/circles';

interface CirclesTableProps {
  circles: Circle[];
  isLoading?: boolean;
  onViewMembers: (circle: Circle) => void;
  onToggleStatus: (circle: Circle) => void;
  onCopyInviteCode: (circle: Circle) => void;
}

export function CirclesTable({
  circles,
  isLoading,
  onViewMembers,
  onToggleStatus,
  onCopyInviteCode,
}: CirclesTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <CirclesTableSkeleton />;
  }

  if (circles.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>Circle이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead className="w-[200px]">설명</TableHead>
            <TableHead className="w-[100px]">초대 코드</TableHead>
            <TableHead className="w-[100px]">멤버</TableHead>
            <TableHead className="w-[80px]">상태</TableHead>
            <TableHead className="w-[150px]">생성일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {circles.map((circle) => (
            <TableRow
              key={circle.id}
              className={`cursor-pointer hover:bg-muted/50 ${!circle.is_active ? 'opacity-50' : ''}`}
              onClick={() => navigate(`/circles/${circle.id}`)}
            >
              <TableCell className="font-medium">{circle.name}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {circle.description || '-'}
              </TableCell>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {circle.invite_code}
                </code>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {circle.member_count}/{circle.max_members}
                </span>
              </TableCell>
              <TableCell>
                {circle.is_active ? (
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
                {formatDate(circle.created_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewMembers(circle)}>
                      <Users className="mr-2 h-4 w-4" />
                      멤버 보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyInviteCode(circle)}>
                      <Copy className="mr-2 h-4 w-4" />
                      초대 코드 복사
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleStatus(circle)}>
                      {circle.is_active ? (
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

function CirclesTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead className="w-[200px]">설명</TableHead>
            <TableHead className="w-[100px]">초대 코드</TableHead>
            <TableHead className="w-[100px]">멤버</TableHead>
            <TableHead className="w-[80px]">상태</TableHead>
            <TableHead className="w-[150px]">생성일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
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
