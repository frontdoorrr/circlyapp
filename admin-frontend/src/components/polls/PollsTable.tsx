import { useState, useMemo } from 'react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MoreHorizontal, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdatePollStatus } from '@/hooks/usePolls';
import type { Poll, PollStatus } from '@/types/polls';
import { POLL_STATUS_LABELS } from '@/types/polls';

interface PollsTableProps {
  polls: Poll[];
  isLoading?: boolean;
  circleMap: Map<string, string>;
}

type SortKey = 'circle' | 'question' | 'status' | 'vote_count' | 'ends_at' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface SortState {
  key: SortKey | null;
  direction: SortDirection;
}

function getStatusBadgeVariant(status: PollStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function PollsTable({ polls, isLoading, circleMap }: PollsTableProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'desc' });
  const updateStatus = useUpdatePollStatus();

  // 정렬된 데이터
  const sortedPolls = useMemo(() => {
    if (!sort.key) return polls;

    return [...polls].sort((a, b) => {
      let comparison = 0;

      switch (sort.key) {
        case 'circle':
          const circleA = circleMap.get(a.circle_id) || '';
          const circleB = circleMap.get(b.circle_id) || '';
          comparison = circleA.localeCompare(circleB, 'ko');
          break;
        case 'question':
          comparison = a.question_text.localeCompare(b.question_text, 'ko');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'vote_count':
          comparison = a.vote_count - b.vote_count;
          break;
        case 'ends_at':
          comparison = new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [polls, sort, circleMap]);

  // 더블클릭 정렬 핸들러
  const handleSort = (key: SortKey) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 정렬 아이콘 렌더링
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sort.key !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const handleCancelClick = (poll: Poll) => {
    setSelectedPoll(poll);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPoll) return;

    await updateStatus.mutateAsync({
      pollId: selectedPoll.id,
      data: { status: 'CANCELLED' },
    });

    setCancelDialogOpen(false);
    setSelectedPoll(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('circle')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  Circle
                  <SortIcon columnKey="circle" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('question')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  질문
                  <SortIcon columnKey="question" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('status')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  상태
                  <SortIcon columnKey="status" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('vote_count')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  투표 수
                  <SortIcon columnKey="vote_count" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('ends_at')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  종료 시간
                  <SortIcon columnKey="ends_at" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onDoubleClick={() => handleSort('created_at')}
                title="더블클릭하여 정렬"
              >
                <span className="flex items-center">
                  생성일
                  <SortIcon columnKey="created_at" />
                </span>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : sortedPolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  투표가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              sortedPolls.map((poll) => {
                const endsAt = new Date(poll.ends_at);
                const isEnded = isPast(endsAt);

                return (
                  <TableRow key={poll.id}>
                    <TableCell className="font-medium">
                      {circleMap.get(poll.circle_id) || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {poll.question_text}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(poll.status)}>
                        {POLL_STATUS_LABELS[poll.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{poll.vote_count}</TableCell>
                    <TableCell>
                      {isEnded ? (
                        <span className="text-muted-foreground">
                          {format(endsAt, 'MM/dd HH:mm')}
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          {formatDistanceToNow(endsAt, { addSuffix: true, locale: ko })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(poll.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      {poll.status === 'ACTIVE' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleCancelClick(poll)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              투표 취소
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>투표 취소</DialogTitle>
            <DialogDescription>
              이 투표를 취소하시겠습니까? 취소된 투표는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {selectedPoll && (
            <div className="py-4">
              <p className="text-sm font-medium">{selectedPoll.question_text}</p>
              <p className="text-sm text-muted-foreground mt-1">
                현재 {selectedPoll.vote_count}명이 투표함
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              아니오
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? '처리 중...' : '취소하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
