/**
 * Poll Hooks (React Query)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pollApi from '../api/poll';
import { TemplateCategory, VoteRequest } from '../types/poll';

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
 * 템플릿 카테고리 조회
 */
export function useCategories() {
  return useQuery({
    queryKey: ['polls', 'templates', 'categories'],
    queryFn: () => pollApi.getCategories(),
    staleTime: 30 * 60 * 1000, // 30분 (카테고리는 거의 변경되지 않음)
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
 * 투표하기
 */
export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: VoteRequest }) =>
      pollApi.vote(pollId, data),
    // 투표는 재시도하면 안 됨 (이미 투표한 경우 재시도해도 실패)
    retry: false,
    onSuccess: (_, { pollId }) => {
      // 투표 상세 정보 다시 불러오기 (결과 업데이트)
      queryClient.invalidateQueries({ queryKey: ['polls', pollId] });
      // 내 투표 목록도 갱신 (투표 상태 변경)
      queryClient.invalidateQueries({ queryKey: ['polls', 'my'] });
    },
  });
}

/**
 * 현재 사용자의 진행 중인 투표 목록 (모든 Circle 통합)
 */
export function useMyActivePolls() {
  return useQuery({
    queryKey: ['polls', 'my', 'active'],
    queryFn: () => pollApi.getMyPolls('ACTIVE'),
    staleTime: 60 * 1000, // 1분
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침
  });
}

/**
 * 현재 사용자의 완료된 투표 목록 (모든 Circle 통합)
 */
export function useMyCompletedPolls() {
  return useQuery({
    queryKey: ['polls', 'my', 'completed'],
    queryFn: () => pollApi.getMyPolls('COMPLETED'),
    staleTime: 5 * 60 * 1000, // 5분 (완료된 투표는 자주 변경되지 않음)
  });
}

/**
 * 투표 목록 리프레시
 */
export function useRefreshPolls() {
  const queryClient = useQueryClient();

  return {
    refreshActivePolls: () => queryClient.invalidateQueries({ queryKey: ['polls', 'my', 'active'] }),
    refreshCompletedPolls: () => queryClient.invalidateQueries({ queryKey: ['polls', 'my', 'completed'] }),
    refreshAllPolls: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  };
}
