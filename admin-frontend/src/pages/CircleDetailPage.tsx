import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Calendar, Vote, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCircleDetail, useUpdateCircleStatus, useRemoveCircleMember } from '@/hooks/useCircles';
import { usePolls } from '@/hooks/usePolls';
import { MEMBER_ROLE_LABELS, MEMBER_ROLE_COLORS } from '@/types/circles';

export function CircleDetailPage() {
  const { circleId } = useParams<{ circleId: string }>();
  const navigate = useNavigate();

  const { data: circle, isLoading } = useCircleDetail(circleId || null);
  const { data: pollsData } = usePolls({ circle_id: circleId, limit: 100 });
  const updateStatus = useUpdateCircleStatus();
  const removeMember = useRemoveCircleMember();

  const pollCount = pollsData?.total || 0;

  const handleCopyInviteCode = () => {
    if (circle) {
      navigator.clipboard.writeText(circle.invite_code);
      toast.success('초대 코드가 복사되었습니다.');
    }
  };

  const handleToggleStatus = async () => {
    if (circle) {
      await updateStatus.mutateAsync({
        circleId: circle.id,
        data: { is_active: !circle.is_active },
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (circle) {
      await removeMember.mutateAsync({
        circleId: circle.id,
        userId,
      });
    }
  };

  if (isLoading) {
    return <CircleDetailSkeleton />;
  }

  if (!circle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Circle을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로가기
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{circle.name}</h1>
            {circle.is_active ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                활성
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                비활성
              </Badge>
            )}
          </div>
          {circle.description && (
            <p className="text-muted-foreground mt-1">{circle.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleToggleStatus}
          disabled={updateStatus.isPending}
        >
          {circle.is_active ? (
            <>
              <Ban className="mr-2 h-4 w-4" />
              비활성화
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              활성화
            </>
          )}
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              멤버
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {circle.member_count}
              <span className="text-sm font-normal text-muted-foreground">
                /{circle.max_members}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Copy className="h-4 w-4" />
              초대 코드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={handleCopyInviteCode}
              className="text-2xl font-bold font-mono hover:text-primary transition-colors"
              title="클릭하여 복사"
            >
              {circle.invite_code}
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              생성일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date(circle.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Vote className="h-4 w-4" />
              총 투표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pollCount}개</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            멤버 목록 ({circle.members?.length || 0}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {circle.members && circle.members.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>멤버</TableHead>
                    <TableHead className="w-[100px]">역할</TableHead>
                    <TableHead className="w-[150px]">가입일</TableHead>
                    <TableHead className="w-[80px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circle.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{member.profile_emoji}</span>
                          <div>
                            <p className="font-medium">
                              {member.display_name || member.username || '이름 없음'}
                            </p>
                            {member.nickname && (
                              <p className="text-sm text-muted-foreground">
                                닉네임: {member.nickname}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={MEMBER_ROLE_COLORS[member.role]}>
                          {MEMBER_ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {member.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={removeMember.isPending}
                          >
                            제거
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              멤버가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CircleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-24" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
