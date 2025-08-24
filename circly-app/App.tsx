import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthNavigator from './src/navigation/AuthNavigator';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 10, // 10분 (v5에서 cacheTime이 gcTime으로 변경됨)
    },
  },
});

export default function App() {
  console.log('🚀 [App] Component rendering started');
  
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthNavigator />
      </QueryClientProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}