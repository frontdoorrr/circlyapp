import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBroadcastPoll, useTemplates } from '@/hooks/usePolls';
import { useCircles } from '@/hooks/useCircles';
import type { PollDuration, TemplateCategory, AdminPollCreate } from '@/types/polls';
import { POLL_DURATION_LABELS, TEMPLATE_CATEGORY_LABELS } from '@/types/polls';

interface PollCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type QuestionType = 'template' | 'custom';
type ApplyMode = 'all' | 'selected';

const DURATIONS: PollDuration[] = ['1H', '3H', '6H', '24H'];
const CATEGORIES: TemplateCategory[] = ['PERSONALITY', 'APPEARANCE', 'SPECIAL', 'TALENT'];

export function PollCreateDialog({ open, onOpenChange }: PollCreateDialogProps) {
  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>('template');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('PERSONALITY');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [duration, setDuration] = useState<PollDuration>('1H');
  const [applyMode, setApplyMode] = useState<ApplyMode>('all');
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);

  // Data fetching
  const { data: templatesData } = useTemplates(selectedCategory);
  const { data: circlesData } = useCircles({ limit: 100, is_active: true });
  const broadcastMutation = useBroadcastPoll();

  const templates = templatesData?.items || [];
  const circles = circlesData?.items || [];

  // Reset template selection when category changes
  useEffect(() => {
    setSelectedTemplateId('');
  }, [selectedCategory]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setQuestionType('template');
      setSelectedCategory('PERSONALITY');
      setSelectedTemplateId('');
      setCustomQuestion('');
      setDuration('1H');
      setApplyMode('all');
      setSelectedCircleIds([]);
    }
  }, [open]);

  const handleCircleToggle = (circleId: string) => {
    setSelectedCircleIds((prev) =>
      prev.includes(circleId)
        ? prev.filter((id) => id !== circleId)
        : [...prev, circleId]
    );
  };

  const handleSelectAllCircles = () => {
    if (selectedCircleIds.length === circles.length) {
      setSelectedCircleIds([]);
    } else {
      setSelectedCircleIds(circles.map((c) => c.id));
    }
  };

  const handleSubmit = async () => {
    const data: AdminPollCreate = {
      duration,
      apply_to_all: applyMode === 'all',
    };

    if (questionType === 'template') {
      if (!selectedTemplateId) return;
      data.template_id = selectedTemplateId;
    } else {
      if (!customQuestion.trim()) return;
      data.custom_question = customQuestion.trim();
    }

    if (applyMode === 'selected') {
      if (selectedCircleIds.length === 0) return;
      data.circle_ids = selectedCircleIds;
    }

    await broadcastMutation.mutateAsync(data);
    onOpenChange(false);
  };

  const isValid = () => {
    if (questionType === 'template' && !selectedTemplateId) return false;
    if (questionType === 'custom' && !customQuestion.trim()) return false;
    if (applyMode === 'selected' && selectedCircleIds.length === 0) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>투표 생성</DialogTitle>
          <DialogDescription>
            여러 Circle에 동시에 투표를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Type Selection */}
          <div className="space-y-3">
            <Label>질문 선택</Label>
            <RadioGroup
              value={questionType}
              onValueChange={(v) => setQuestionType(v as QuestionType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template" className="font-normal cursor-pointer">
                  템플릿 사용
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  직접 입력
                </Label>
              </div>
            </RadioGroup>

            {questionType === 'template' ? (
              <div className="space-y-2 pl-6">
                <div className="flex gap-2">
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as TemplateCategory)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {TEMPLATE_CATEGORY_LABELS[cat].emoji} {TEMPLATE_CATEGORY_LABELS[cat].title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="템플릿 선택..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.emoji} {template.question_text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="pl-6">
                <Input
                  placeholder="질문을 입력하세요..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label>투표 시간</Label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={duration === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(d)}
                >
                  {POLL_DURATION_LABELS[d]}
                </Button>
              ))}
            </div>
          </div>

          {/* Apply Mode Selection */}
          <div className="space-y-3">
            <Label>적용 범위</Label>
            <RadioGroup
              value={applyMode}
              onValueChange={(v) => setApplyMode(v as ApplyMode)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  모든 Circle에 적용 ({circles.length}개)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="font-normal cursor-pointer">
                  선택한 Circle에만 적용
                </Label>
              </div>
            </RadioGroup>

            {applyMode === 'selected' && (
              <div className="pl-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedCircleIds.length}개 선택됨
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllCircles}
                  >
                    {selectedCircleIds.length === circles.length ? '전체 해제' : '전체 선택'}
                  </Button>
                </div>
                <ScrollArea className="h-[150px] border rounded-md p-2">
                  <div className="space-y-2">
                    {circles.map((circle) => (
                      <div
                        key={circle.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={circle.id}
                          checked={selectedCircleIds.includes(circle.id)}
                          onCheckedChange={() => handleCircleToggle(circle.id)}
                        />
                        <Label
                          htmlFor={circle.id}
                          className="font-normal cursor-pointer flex-1"
                        >
                          {circle.name}
                          <span className="text-muted-foreground ml-2">
                            ({circle.member_count}명)
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid() || broadcastMutation.isPending}
          >
            {broadcastMutation.isPending ? '생성 중...' : '생성하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
