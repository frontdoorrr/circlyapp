/**
 * 투표 관련 React Query hooks
 * TRD 01-frontend-architecture.md의 데이터 페칭 전략 기반
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { pollApi } from '../services/api/poll';
import type { 
  PollResponse, 
  VoteCreate, 
  PollParticipation, 
  VoteResult 
} from '../types/poll';

// Query keys for React Query
export const POLL_QUERY_KEYS = {
  polls: 'polls',
  poll: (id: string) => ['poll', id],
  circlePolls: (circleId: number) => ['polls', 'circle', circleId],
  activePolls: (circleId: number) => ['polls', 'active', circleId],
  participation: (pollId: string) => ['polls', 'participation', pollId],
  results: (pollId: string) => ['polls', 'results', pollId],
} as const;

/**
 * Get active polls for a circle
 */
export const useActivePolls = (
  circleId: number,
  enabled: boolean = true
): UseQueryResult<PollResponse[], Error> => {
  return useQuery({
    queryKey: POLL_QUERY_KEYS.activePolls(circleId),
    queryFn: async () => {
      console.log('🔄 [useActivePolls] Fetching active polls for circleId:', circleId);
      try {
        const result = await pollApi.getActivePolls(circleId);
        console.log('✅ [useActivePolls] Success:', result);
        return result;
      } catch (error) {
        console.error('❌ [useActivePolls] Error:', error);
        throw error;
      }
    },
    enabled: enabled && circleId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get specific poll details
 */
export const usePoll = (
  pollId: string,
  enabled: boolean = true
): UseQueryResult<PollResponse | null, Error> => {
  return useQuery({
    queryKey: POLL_QUERY_KEYS.poll(pollId),
    queryFn: () => pollApi.getPoll(pollId),
    enabled: enabled && Boolean(pollId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Get user's participation status for a poll
 */
export const usePollParticipation = (
  pollId: string,
  enabled: boolean = true
): UseQueryResult<PollParticipation | null, Error> => {
  return useQuery({
    queryKey: POLL_QUERY_KEYS.participation(pollId),
    queryFn: () => pollApi.getPollParticipation(pollId),
    enabled: enabled && Boolean(pollId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get detailed vote results for a poll
 */
export const useVoteResults = (
  pollId: string,
  enabled: boolean = true
): UseQueryResult<VoteResult[], Error> => {
  return useQuery({
    queryKey: POLL_QUERY_KEYS.results(pollId),
    queryFn: () => pollApi.getVoteResults(pollId),
    enabled: enabled && Boolean(pollId),
    staleTime: 15 * 1000, // 15 seconds (for real-time feel)
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for real-time updates
  });
};

/**
 * Submit a vote for a poll
 */
export const useVotePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, voteData }: { pollId: string; voteData: VoteCreate }) => 
      pollApi.votePoll(pollId, voteData),
    onSuccess: (_, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.poll(variables.pollId)
      });
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.participation(variables.pollId)
      });
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.results(variables.pollId)
      });
      
      // Also invalidate active polls list to update vote counts
      queryClient.invalidateQueries({
        queryKey: [POLL_QUERY_KEYS.polls]
      });
    },
  });
};

/**
 * Remove user's vote from a poll
 */
export const useRemoveVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => pollApi.removeVote(pollId),
    onSuccess: (_, pollId) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.poll(pollId)
      });
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.participation(pollId)
      });
      queryClient.invalidateQueries({
        queryKey: POLL_QUERY_KEYS.results(pollId)
      });
      
      // Also invalidate active polls list
      queryClient.invalidateQueries({
        queryKey: [POLL_QUERY_KEYS.polls]
      });
    },
  });
};

/**
 * Get all polls for a circle (including inactive)
 */
export const useCirclePolls = (
  circleId: number,
  enabled: boolean = true
): UseQueryResult<PollResponse[], Error> => {
  return useQuery({
    queryKey: POLL_QUERY_KEYS.circlePolls(circleId),
    queryFn: () => pollApi.getCirclePolls(circleId),
    enabled: enabled && circleId > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};