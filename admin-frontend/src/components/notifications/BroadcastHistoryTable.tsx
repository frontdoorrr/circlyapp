import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BroadcastLog } from '@/types/notifications';

interface BroadcastHistoryTableProps {
  logs: BroadcastLog[];
  isLoading?: boolean;
}

export function BroadcastHistoryTable({ logs, isLoading }: BroadcastHistoryTableProps) {
  if (isLoading) {
    return <BroadcastHistoryTableSkeleton />;
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>발송 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead className="w-[200px]">내용</TableHead>
            <TableHead className="w-[100px]">대상</TableHead>
            <TableHead className="w-[100px]">발송</TableHead>
            <TableHead className="w-[150px]">발송자</TableHead>
            <TableHead className="w-[150px]">발송일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.title}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {log.body}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{log.target_count}명</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={log.sent_count > 0 ? 'default' : 'secondary'}
                >
                  {log.sent_count}건
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {log.admin_email || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BroadcastHistoryTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead className="w-[200px]">내용</TableHead>
            <TableHead className="w-[100px]">대상</TableHead>
            <TableHead className="w-[100px]">발송</TableHead>
            <TableHead className="w-[150px]">발송자</TableHead>
            <TableHead className="w-[150px]">발송일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
