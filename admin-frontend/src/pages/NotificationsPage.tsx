import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>알림 관리</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          Phase 6에서 구현 예정
        </CardContent>
      </Card>
    </div>
  );
}
