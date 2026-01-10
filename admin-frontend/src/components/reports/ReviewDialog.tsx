import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { Report, ReportStatus } from '@/types/reports';
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_TYPE_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_COLORS,
} from '@/types/reports';

interface ReviewDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reportId: string, status: ReportStatus) => void;
  isLoading?: boolean;
}

export function ReviewDialog({
  report,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: ReviewDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');

  // Reset selection when dialog opens with a new report
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && report) {
      setSelectedStatus(report.status);
    } else {
      setSelectedStatus('');
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    if (report && selectedStatus) {
      onConfirm(report.id, selectedStatus);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>신고 검토</DialogTitle>
          <DialogDescription>
            신고 내용을 확인하고 상태를 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 상태</span>
              <Badge variant={REPORT_STATUS_COLORS[report.status]}>
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">대상 유형</span>
              <Badge variant="outline">
                {REPORT_TARGET_TYPE_LABELS[report.target_type]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">신고 사유</span>
              <span className="text-sm font-medium">
                {REPORT_REASON_LABELS[report.reason]}
              </span>
            </div>
            {report.description && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground block mb-1">
                  상세 설명
                </span>
                <p className="text-sm">{report.description}</p>
              </div>
            )}
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground block mb-1">
                대상 ID
              </span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {report.target_id}
              </code>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">새 상태 선택</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ReportStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">대기 중</SelectItem>
                <SelectItem value="REVIEWED">검토 완료</SelectItem>
                <SelectItem value="RESOLVED">해결됨</SelectItem>
                <SelectItem value="DISMISSED">기각됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || selectedStatus === report.status || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            상태 변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
