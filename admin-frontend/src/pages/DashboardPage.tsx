import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Circle, Flag, Bell, TrendingUp, Activity } from 'lucide-react';

// 임시 통계 데이터 (Phase 2에서 실제 API 연동)
const stats = [
  { title: '전체 사용자', value: '-', icon: Users, description: 'API 연동 필요' },
  { title: '활성 Circle', value: '-', icon: Circle, description: 'API 연동 필요' },
  { title: '대기 중 신고', value: '-', icon: Flag, description: 'API 연동 필요' },
  { title: '오늘 알림 발송', value: '-', icon: Bell, description: 'API 연동 필요' },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 차트 영역 (Phase 2에서 구현) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              사용자 추이
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2에서 차트 구현 예정
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              투표 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2에서 차트 구현 예정
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
