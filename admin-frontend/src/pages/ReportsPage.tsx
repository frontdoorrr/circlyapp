import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { ReviewDialog } from '@/components/reports/ReviewDialog';
import { useReports, useReviewReport } from '@/hooks/useReports';
import type { Report, ReportStatus, ReportTargetType, ReportFilters } from '@/types/reports';

const ITEMS_PER_PAGE = 20;

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useReports(filters);
  const reviewMutation = useReviewReport();

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'ALL' ? undefined : (value as ReportStatus),
      offset: 0, // Reset to first page
    }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      target_type: value === 'ALL' ? undefined : (value as ReportTargetType),
      offset: 0, // Reset to first page
    }));
  };

  const handleReview = (report: Report) => {
    setSelectedReport(report);
    setIsReviewDialogOpen(true);
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsReviewDialogOpen(true);
  };

  const handleConfirmReview = async (reportId: string, status: ReportStatus) => {
    await reviewMutation.mutateAsync({
      reportId,
      data: { status },
    });
    setIsReviewDialogOpen(false);
    setSelectedReport(null);
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
          신고 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
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
              <CardTitle>신고 관리</CardTitle>
              <CardDescription>
                사용자 신고를 검토하고 처리합니다.
                {data && ` (총 ${data.total}건)`}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="w-[180px]">
              <Select
                value={filters.status || 'ALL'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 상태</SelectItem>
                  <SelectItem value="PENDING">대기 중</SelectItem>
                  <SelectItem value="REVIEWED">검토 완료</SelectItem>
                  <SelectItem value="RESOLVED">해결됨</SelectItem>
                  <SelectItem value="DISMISSED">기각됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select
                value={filters.target_type || 'ALL'}
                onValueChange={handleTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="유형 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 유형</SelectItem>
                  <SelectItem value="USER">사용자</SelectItem>
                  <SelectItem value="CIRCLE">Circle</SelectItem>
                  <SelectItem value="POLL">투표</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <ReportsTable
            reports={data?.items || []}
            isLoading={isLoading}
            onReview={handleReview}
            onViewDetails={handleViewDetails}
          />

          {/* Pagination */}
          {data && data.total > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total}건 중 {(filters.offset || 0) + 1} -{' '}
                {Math.min((filters.offset || 0) + ITEMS_PER_PAGE, data.total)}건
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

      {/* Review Dialog */}
      <ReviewDialog
        report={selectedReport}
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onConfirm={handleConfirmReview}
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}
