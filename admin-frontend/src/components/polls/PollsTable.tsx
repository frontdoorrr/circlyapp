import { useState } from 'react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MoreHorizontal, XCircle } from 'lucide-react';
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
  const updateStatus = useUpdatePollStatus();

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
              <TableHead>Circle</TableHead>
              <TableHead>질문</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>투표 수</TableHead>
              <TableHead>종료 시간</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : polls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  투표가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              polls.map((poll) => {
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
