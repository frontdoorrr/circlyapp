import { Users, Circle, Flag, Vote, TrendingUp, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  ChartCard,
  StatsLineChart,
  StatsBarChart,
  StatsPieChart,
} from '@/components/dashboard/ChartCard';
import {
  useStatsOverview,
  useUserStats,
  usePollStats,
  useReportStats,
} from '@/hooks/useStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export function DashboardPage() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useStatsOverview();
  const { data: userStats, isLoading: userStatsLoading } = useUserStats(30);
  const { data: pollStats, isLoading: pollStatsLoading } = usePollStats(30);
  const { data: reportStats, isLoading: reportStatsLoading } = useReportStats();

  if (overviewError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          통계 데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const userChartData = userStats
    ? userStats.new_users.map((item, index) => ({
        date: item.date,
        new_users: item.count,
        active_users: userStats.active_users[index]?.count || 0,
      }))
    : [];

  const pollChartData = pollStats
    ? pollStats.created.map((item, index) => ({
        date: item.date,
        created: item.count,
        votes: pollStats.votes[index]?.count || 0,
      }))
    : [];

  const reportStatusData = reportStats?.by_status.map((item) => ({
    name: getStatusLabel(item.status),
    value: item.count,
  })) || [];

  const reportTypeData = reportStats?.by_type.map((item) => ({
    name: getTypeLabel(item.target_type),
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="전체 사용자"
              value={overview?.total_users || 0}
              description={`오늘 신규: ${overview?.today_new_users || 0}명`}
              icon={Users}
              href="/users"
            />
            <StatCard
              title="활성 Circle"
              value={overview?.total_circles || 0}
              description="전체 Circle 수"
              icon={Circle}
              href="/circles"
            />
            <StatCard
              title="진행 중 투표"
              value={overview?.active_polls || 0}
              description={`오늘 생성: ${overview?.today_new_polls || 0}개`}
              icon={Vote}
            />
            <StatCard
              title="대기 중 신고"
              value={overview?.pending_reports || 0}
              description="검토 필요"
              icon={Flag}
              href="/reports"
              className={overview?.pending_reports && overview.pending_reports > 0 ? 'border-red-200 bg-red-50' : ''}
            />
          </>
        )}
      </div>

      {/* 사용자/투표 추이 차트 */}
      <div className="grid gap-4 md:grid-cols-2">
        {userStatsLoading ? (
          <ChartSkeleton />
        ) : (
          <ChartCard
            title="사용자 추이"
            description="최근 30일 신규/활성 사용자 수"
            href="/users"
          >
            {userChartData.length > 0 ? (
              <StatsLineChart
                data={userChartData}
                lines={[
                  { key: 'new_users', name: '신규 가입', color: '#6366f1' },
                  { key: 'active_users', name: '활성 사용자', color: '#22c55e' },
                ]}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>아직 데이터가 없습니다</p>
                </div>
              </div>
            )}
          </ChartCard>
        )}

        {pollStatsLoading ? (
          <ChartSkeleton />
        ) : (
          <ChartCard
            title="투표 활동"
            description="최근 30일 투표 생성/참여 수"
          >
            {pollChartData.length > 0 ? (
              <StatsLineChart
                data={pollChartData}
                lines={[
                  { key: 'created', name: '생성된 투표', color: '#f59e0b' },
                  { key: 'votes', name: '투표 참여', color: '#8b5cf6' },
                ]}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>아직 데이터가 없습니다</p>
                </div>
              </div>
            )}
          </ChartCard>
        )}
      </div>

      {/* 신고 통계 */}
      <div className="grid gap-4 md:grid-cols-2">
        {reportStatsLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              title="신고 상태별 현황"
              description={`총 ${reportStats?.total || 0}건`}
              href="/reports"
            >
              {reportStatusData.length > 0 ? (
                <StatsPieChart
                  data={reportStatusData}
                  colors={['#f59e0b', '#22c55e', '#6366f1', '#9ca3af']}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>신고 내역이 없습니다</p>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="신고 유형별 현황"
              description="대상 유형별 분포"
              href="/reports"
            >
              {reportTypeData.length > 0 ? (
                <StatsBarChart
                  data={reportTypeData}
                  color="#6366f1"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>신고 내역이 없습니다</p>
                  </div>
                </div>
              )}
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions to translate status/type labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '대기 중',
    REVIEWED: '검토 완료',
    RESOLVED: '해결됨',
    DISMISSED: '기각됨',
  };
  return labels[status] || status;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    USER: '사용자',
    CIRCLE: 'Circle',
    POLL: '투표',
  };
  return labels[type] || type;
}
