/**
 * React Query Provider
 *
 * 전역 서버 상태 관리 설정
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// QueryClient 싱글톤 인스턴스
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // 실패 시 2번까지 재시도
      staleTime: 30 * 1000, // 30초 (기본값)
      gcTime: 5 * 60 * 1000, // 5분 (garbage collection)
      refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 안함 (모바일에서는 불필요)
      refetchOnMount: true, // 마운트 시 재요청
      refetchOnReconnect: true, // 네트워크 재연결 시 재요청
    },
    mutations: {
      retry: 1, // 실패 시 1번만 재시도
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { queryClient };
