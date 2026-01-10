import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, History } from 'lucide-react';
import { BroadcastForm } from '@/components/notifications/BroadcastForm';
import { BroadcastHistoryTable } from '@/components/notifications/BroadcastHistoryTable';
import { useBroadcastHistory } from '@/hooks/useNotifications';

const ITEMS_PER_PAGE = 20;

export function NotificationsPage() {
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error, refetch } = useBroadcastHistory(ITEMS_PER_PAGE, offset);

  const handlePrevPage = () => {
    setOffset((prev) => Math.max(0, prev - ITEMS_PER_PAGE));
  };

  const handleNextPage = () => {
    setOffset((prev) => prev + ITEMS_PER_PAGE);
  };

  const currentPage = Math.floor(offset / ITEMS_PER_PAGE) + 1;
  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;
  const hasNextPage = data ? offset + ITEMS_PER_PAGE < data.total : false;
  const hasPrevPage = offset > 0;

  return (
    <div className="space-y-6">
      {/* Broadcast Form */}
      <BroadcastForm />

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                발송 이력
              </CardTitle>
              <CardDescription>
                전체 알림 발송 이력을 조회합니다.
                {data && ` (총 ${data.total}건)`}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                발송 이력을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <BroadcastHistoryTable
                logs={data?.items || []}
                isLoading={isLoading}
              />

              {/* Pagination */}
              {data && data.total > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {data.total}건 중 {offset + 1} -{' '}
                    {Math.min(offset + ITEMS_PER_PAGE, data.total)}건
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
