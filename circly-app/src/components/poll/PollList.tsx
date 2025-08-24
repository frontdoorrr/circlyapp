/**
 * 투표 목록 컴포넌트
 * PRD 01-anonymous-voting-detailed.md의 투표 목록 UI 구현
 */

import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { PollCard } from './PollCard';
import type { PollResponse } from '../../types/poll';

interface PollListProps {
  polls: PollResponse[];
  loading?: boolean;
  error?: string | null;
  onPollPress: (poll: PollResponse) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
  showStatus?: boolean;
}

export const PollList: React.FC<PollListProps> = ({
  polls,
  loading = false,
  error,
  onPollPress,
  onRefresh,
  refreshing = false,
  emptyMessage = '진행 중인 투표가 없습니다.',
  showStatus = true
}) => {
  // 투표 카드 렌더링
  const renderPollCard = useCallback(({ item }: { item: PollResponse }) => (
    <PollCard
      poll={item}
      onPress={onPollPress}
      showStatus={showStatus}
    />
  ), [onPollPress, showStatus]);

  // 키 추출 함수
  const keyExtractor = useCallback((item: PollResponse) => item.id, []);

  // 구분자 렌더링
  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // 로딩 표시
  const renderFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#6C757D" />
      </View>
    );
  }, [loading]);

  // 빈 상태 표시
  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C757D" />
          <Text style={styles.loadingText}>투표를 불러오는 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>투표를 불러오는 중 오류가 발생했습니다.</Text>
          <Text style={styles.retryText}>아래로 당겨서 다시 시도해보세요.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>📊</Text>
        </View>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubText}>
          새로운 투표가 생성되면 알림을 받을 수 있습니다.
        </Text>
      </View>
    );
  }, [loading, error, emptyMessage]);

  // 헤더 렌더링 (투표 개수 표시)
  const renderHeader = useCallback(() => {
    if (loading || polls.length === 0) return null;
    
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>
          총 {polls.length}개의 투표
        </Text>
      </View>
    );
  }, [loading, polls.length]);

  return (
    <FlatList
      data={polls}
      keyExtractor={keyExtractor}
      renderItem={renderPollCard}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C757D']}
            tintColor="#6C757D"
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        polls.length === 0 && styles.emptyListContainer
      ]}
      bounces={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 16,
    fontWeight: '500',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
});