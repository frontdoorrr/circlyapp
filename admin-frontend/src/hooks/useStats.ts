import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/stats';

export const statsKeys = {
  all: ['stats'] as const,
  overview: () => [...statsKeys.all, 'overview'] as const,
  users: (days: number) => [...statsKeys.all, 'users', days] as const,
  polls: (days: number) => [...statsKeys.all, 'polls', days] as const,
  reports: () => [...statsKeys.all, 'reports'] as const,
};

/**
 * Hook to fetch overview statistics
 */
export function useStatsOverview() {
  return useQuery({
    queryKey: statsKeys.overview(),
    queryFn: statsApi.getOverview,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats(days: number = 30) {
  return useQuery({
    queryKey: statsKeys.users(days),
    queryFn: () => statsApi.getUserStats(days),
  });
}

/**
 * Hook to fetch poll statistics
 */
export function usePollStats(days: number = 30) {
  return useQuery({
    queryKey: statsKeys.polls(days),
    queryFn: () => statsApi.getPollStats(days),
  });
}

/**
 * Hook to fetch report statistics
 */
export function useReportStats() {
  return useQuery({
    queryKey: statsKeys.reports(),
    queryFn: statsApi.getReportStats,
  });
}
