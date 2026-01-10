import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CirclesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Circle 목록</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          Phase 5에서 구현 예정
        </CardContent>
      </Card>
    </div>
  );
}
