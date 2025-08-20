/**
 * 투표 목록 화면
 * PRD 01-anonymous-voting-detailed.md의 투표 목록 표시 UI 구현
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PollList } from '../../components/poll/PollList';
import { useActivePolls } from '../../hooks/usePolls';
import type { PollResponse } from '../../types/poll';

interface RouteParams {
  circleId: number;
  circleName: string;
}

type FilterType = 'active' | 'participated' | 'all';

export const PollListScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { circleId, circleName } = route.params as RouteParams;

  // 상태 관리
  const [filter, setFilter] = useState<FilterType>('active');

  // 데이터 페칭
  const { 
    data: polls = [], 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useActivePolls(circleId);

  // 필터링된 투표 목록
  const filteredPolls = polls.filter(poll => {
    switch (filter) {
      case 'active':
        const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
        return poll.is_active && !isExpired && !poll.user_voted;
      case 'participated':
        return poll.user_voted;
      case 'all':
      default:
        return true;
    }
  });

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 투표 선택 처리
  const handlePollPress = useCallback((poll: PollResponse) => {
    navigation.navigate('PollParticipation', {
      pollId: poll.id,
      circleId,
      circleName
    });
  }, [navigation, circleId, circleName]);

  // 새로고침 처리
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // 필터 변경
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  // 필터 버튼 렌더링
  const renderFilterButton = (filterType: FilterType, label: string, count: number) => {
    const isActive = filter === filterType;
    return (
      <TouchableOpacity
        key={filterType}
        style={[
          styles.filterButton,
          isActive && styles.activeFilterButton
        ]}
        onPress={() => handleFilterChange(filterType)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText
        ]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[
            styles.filterBadge,
            isActive && styles.activeFilterBadge
          ]}>
            <Text style={[
              styles.filterBadgeText,
              isActive && styles.activeFilterBadgeText
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 각 필터별 개수 계산
  const activePollsCount = polls.filter(poll => {
    const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
    return poll.is_active && !isExpired && !poll.user_voted;
  }).length;
  
  const participatedPollsCount = polls.filter(poll => poll.user_voted).length;

  // 필터별 빈 메시지
  const getEmptyMessage = () => {
    switch (filter) {
      case 'active':
        return '참여할 수 있는 투표가 없습니다.';
      case 'participated':
        return '참여한 투표가 없습니다.';
      case 'all':
      default:
        return '진행 중인 투표가 없습니다.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>투표</Text>
          <Text style={styles.subtitle}>{circleName}</Text>
        </View>

        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isRefetching}
        >
          <Ionicons 
            name="refresh" 
            size={22} 
            color={isRefetching ? '#ADB5BD' : '#495057'} 
          />
        </TouchableOpacity>
      </View>

      {/* 필터 탭 */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {renderFilterButton('active', '참여 가능', activePollsCount)}
          {renderFilterButton('participated', '참여 완료', participatedPollsCount)}
          {renderFilterButton('all', '전체', polls.length)}
        </View>
      </View>

      {/* 투표 목록 */}
      <View style={styles.listContainer}>
        <PollList
          polls={filteredPolls}
          loading={isLoading}
          error={error?.message || null}
          onPollPress={handlePollPress}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
          emptyMessage={getEmptyMessage()}
          showStatus={filter === 'all'}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
});