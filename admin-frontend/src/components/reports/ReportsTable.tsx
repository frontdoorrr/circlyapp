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
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Report } from '@/types/reports';
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_TYPE_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_COLORS,
} from '@/types/reports';

interface ReportsTableProps {
  reports: Report[];
  isLoading?: boolean;
  onReview: (report: Report) => void;
  onViewDetails: (report: Report) => void;
}

export function ReportsTable({
  reports,
  isLoading,
  onReview,
  onViewDetails,
}: ReportsTableProps) {
  if (isLoading) {
    return <ReportsTableSkeleton />;
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>신고 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[100px]">유형</TableHead>
            <TableHead className="w-[120px]">사유</TableHead>
            <TableHead>설명</TableHead>
            <TableHead className="w-[150px]">신고일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Badge variant={REPORT_STATUS_COLORS[report.status]}>
                  {REPORT_STATUS_LABELS[report.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {REPORT_TARGET_TYPE_LABELS[report.target_type]}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {REPORT_REASON_LABELS[report.reason]}
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {report.description || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(report.created_at)}
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
                    <DropdownMenuItem onClick={() => onViewDetails(report)}>
                      <Eye className="mr-2 h-4 w-4" />
                      상세 보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReview(report)}>
                      상태 변경
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

function ReportsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[100px]">유형</TableHead>
            <TableHead className="w-[120px]">사유</TableHead>
            <TableHead>설명</TableHead>
            <TableHead className="w-[150px]">신고일</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
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
    hour: '2-digit',
    minute: '2-digit',
  });
}
