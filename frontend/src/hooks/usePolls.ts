/**
 * Poll Hooks (React Query)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pollApi from '../api/poll';
import { useAuthStore } from '../stores/auth';
import { TemplateCategory, VoteRequest, VoteSessionCreate } from '../types/poll';

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
 * 서버가 선정한 투표 후보 조회
 */
export function usePollCandidates(pollId: string, shuffleVersion = 0) {
  return useQuery({
    queryKey: ['polls', pollId, 'candidates', shuffleVersion],
    queryFn: () => pollApi.getPollCandidates(pollId, shuffleVersion > 0),
    enabled: !!pollId,
    staleTime: 0,
  });
}

/**
 * 서버 투표 세션 시작 가능 상태 조회
 */
export function useVoteSessionAvailability(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['polls', 'sessions', 'availability'],
    queryFn: () => pollApi.getVoteSessionAvailability(),
    enabled: enabled && isAuthenticated,
    staleTime: 15 * 1000,
  });
}

/**
 * 서버 투표 세션 시작
 */
export function useStartVoteSession() {
  return useMutation({
    mutationFn: (data: VoteSessionCreate) => pollApi.startVoteSession(data),
    retry: false,
  });
}

/**
 * 서버 투표 세션 현재 질문 건너뛰기
 */
export function useSkipVoteSessionPoll() {
  return useMutation({
    mutationFn: (sessionId: string) => pollApi.skipVoteSessionPoll(sessionId),
    retry: false,
  });
}

/**
 * 서버 투표 세션 현재 질문 완료 처리
 */
export function useAdvanceVoteSessionPoll() {
  return useMutation({
    mutationFn: (sessionId: string) => pollApi.advanceVoteSessionPoll(sessionId),
    retry: false,
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['polls', 'my', 'active'],
    queryFn: () => pollApi.getMyPolls('ACTIVE'),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1분
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침
  });
}

/**
 * 현재 사용자의 완료된 투표 목록 (모든 Circle 통합)
 */
export function useMyCompletedPolls() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['polls', 'my', 'completed'],
    queryFn: () => pollApi.getMyPolls('COMPLETED'),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5분 (완료된 투표는 자주 변경되지 않음)
  });
}

/**
 * 현재 사용자가 받은 하트/칭찬 목록
 */
export function useReceivedHearts() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['polls', 'me', 'received'],
    queryFn: () => pollApi.getReceivedHearts(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * 받은 하트 읽음 처리
 */
export function useMarkReceivedHeartAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => pollApi.markReceivedHeartAsRead(pollId),
    retry: false,
    onSuccess: ({ poll_id }) => {
      queryClient.setQueryData<Awaited<ReturnType<typeof pollApi.getReceivedHearts>>>(
        ['polls', 'me', 'received'],
        (old) =>
          old?.map((item) =>
            item.poll_id === poll_id ? { ...item, is_read: true } : item
          )
      );
    },
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

// ==================== Orb Mode Hooks ====================

/**
 * [Orb Mode] 나를 선택한 투표의 안전 힌트 조회
 */
export function useMyVoteHints(pollId: string, enabled = false) {
  return useQuery({
    queryKey: ['polls', pollId, 'hints'],
    queryFn: () => pollApi.getMyVoteHints(pollId),
    enabled: !!pollId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * [Orb Mode] 나를 선택한 투표자 목록 조회
 * - Orb Mode 구독자 전용
 * - enabled: false로 시작, 필요 시 수동 호출
 */
export function useMyVoters(pollId: string, enabled = false) {
  return useQuery({
    queryKey: ['polls', pollId, 'voters'],
    queryFn: () => pollApi.getMyVoters(pollId),
    enabled: !!pollId && enabled,
    staleTime: 5 * 60 * 1000, // 5분 (투표자 목록은 자주 변경되지 않음)
  });
}
