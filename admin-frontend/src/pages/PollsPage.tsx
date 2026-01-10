import { useState, useMemo } from 'react';
import { Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PollsTable } from '@/components/polls/PollsTable';
import { usePolls } from '@/hooks/usePolls';
import { useCircles } from '@/hooks/useCircles';
import type { PollStatus } from '@/types/polls';
import { POLL_STATUS_LABELS } from '@/types/polls';

const PAGE_SIZE = 20;

export function PollsPage() {
  const [statusFilter, setStatusFilter] = useState<PollStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading } = usePolls({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Fetch all circles for name mapping
  const { data: circlesData } = useCircles({ limit: 1000 });

  const polls = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Create circle id -> name map
  const circleMap = useMemo(() => {
    const map = new Map<string, string>();
    circlesData?.items.forEach((circle) => {
      map.set(circle.id, circle.name);
    });
    return map;
  }, [circlesData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vote className="h-6 w-6" />
            투표 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            전체 {total}개의 투표
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as PollStatus | 'ALL');
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 상태</SelectItem>
            {Object.entries(POLL_STATUS_LABELS).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <PollsTable polls={polls} isLoading={isLoading} circleMap={circleMap} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, total)} / {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
