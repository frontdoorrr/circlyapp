import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBroadcast } from '@/hooks/useNotifications';
import type { BroadcastResponse } from '@/types/notifications';

export function BroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lastResult, setLastResult] = useState<BroadcastResponse | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const broadcastMutation = useBroadcast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    const result = await broadcastMutation.mutateAsync({ title, body });
    setLastResult(result);
    setTitle('');
    setBody('');
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          전체 알림 발송
        </CardTitle>
        <CardDescription>
          모든 활성 사용자에게 푸시 알림을 발송합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="알림 제목 (최대 100자)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={broadcastMutation.isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">내용</Label>
            <Textarea
              id="body"
              placeholder="알림 내용 (최대 1000자)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              disabled={broadcastMutation.isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {body.length}/1000
            </p>
          </div>

          {showConfirm && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>모든 사용자에게 알림을 발송하시겠습니까?</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={broadcastMutation.isPending}
                  >
                    {broadcastMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    확인
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {lastResult && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {lastResult.message}
              </AlertDescription>
            </Alert>
          )}

          {broadcastMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                알림 발송에 실패했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!title.trim() || !body.trim() || broadcastMutation.isPending || showConfirm}
            className="w-full"
          >
            {broadcastMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Send className="mr-2 h-4 w-4" />
            알림 발송
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
