import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UsersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          Phase 4에서 구현 예정
        </CardContent>
      </Card>
    </div>
  );
}
