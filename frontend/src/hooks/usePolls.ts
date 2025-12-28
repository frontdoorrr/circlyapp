/**
 * Poll Hooks (React Query)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pollApi from '../api/poll';
import { PollCreate, TemplateCategory, VoteRequest } from '../types/poll';

/**
 * 투표 템플릿 조회
 */
export function usePollTemplates(category?: TemplateCategory) {
  return useQuery({
    queryKey: ['polls', 'templates', category],
    queryFn: () => pollApi.getPollTemplates(category),
    staleTime: 10 * 60 * 1000, // 10분 (템플릿은 자주 변경되지 않음)
  });
}

/**
 * Circle의 진행 중인 투표 목록
 */
export function useActivePolls(circleId: string) {
  return useQuery({
    queryKey: ['polls', 'circle', circleId, 'active'],
    queryFn: () => pollApi.getActivePolls(circleId),
    enabled: !!circleId,
    staleTime: 30 * 1000, // 30초 (진행 중 투표는 자주 업데이트)
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침
  });
}

/**
 * 투표 상세 조회
 */
export function usePollDetail(pollId: string) {
  return useQuery({
    queryKey: ['polls', pollId],
    queryFn: () => pollApi.getPollDetail(pollId),
    enabled: !!pollId,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침 (실시간 결과)
  });
}

/**
 * 투표 생성
 */
export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, data }: { circleId: string; data: PollCreate }) =>
      pollApi.createPoll(circleId, data),
    onSuccess: (_, { circleId }) => {
      // Circle의 투표 목록 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ['polls', 'circle', circleId] });
    },
  });
}

/**
 * 투표하기
 */
export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: VoteRequest }) =>
      pollApi.vote(pollId, data),
    onSuccess: (_, { pollId }) => {
      // 투표 상세 정보 다시 불러오기 (결과 업데이트)
      queryClient.invalidateQueries({ queryKey: ['polls', pollId] });
    },
  });
}
