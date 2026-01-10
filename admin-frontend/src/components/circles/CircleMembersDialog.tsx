import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserMinus, Loader2 } from 'lucide-react';
import { useCircleDetail, useRemoveCircleMember } from '@/hooks/useCircles';
import type { Circle, MemberInfo } from '@/types/circles';
import { MEMBER_ROLE_LABELS, MEMBER_ROLE_COLORS } from '@/types/circles';

interface CircleMembersDialogProps {
  circle: Circle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CircleMembersDialog({
  circle,
  open,
  onOpenChange,
}: CircleMembersDialogProps) {
  const { data: circleDetail, isLoading } = useCircleDetail(open ? circle?.id || null : null);
  const removeMemberMutation = useRemoveCircleMember();

  const handleRemoveMember = async (member: MemberInfo) => {
    if (!circle || member.role === 'OWNER') return;

    if (confirm(`${member.display_name || member.username || '이 멤버'}를 Circle에서 추방하시겠습니까?`)) {
      await removeMemberMutation.mutateAsync({
        circleId: circle.id,
        userId: member.user_id,
      });
    }
  };

  if (!circle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{circle.name} 멤버</DialogTitle>
          <DialogDescription>
            {circle.member_count}명의 멤버가 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <MembersTableSkeleton />
          ) : circleDetail?.members.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              멤버가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className="w-[100px]">역할</TableHead>
                  <TableHead className="w-[130px]">가입일</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {circleDetail?.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <span className="text-2xl">{member.profile_emoji}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {member.display_name || member.username || '이름 없음'}
                        </p>
                        {member.nickname && (
                          <p className="text-sm text-muted-foreground">
                            별명: {member.nickname}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={MEMBER_ROLE_COLORS[member.role]}>
                        {MEMBER_ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </TableCell>
                    <TableCell>
                      {member.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member)}
                          disabled={removeMemberMutation.isPending}
                          title="멤버 추방"
                        >
                          {removeMemberMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MembersTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>이름</TableHead>
          <TableHead className="w-[100px]">역할</TableHead>
          <TableHead className="w-[130px]">가입일</TableHead>
          <TableHead className="w-[80px]">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
