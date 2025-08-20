/**
 * 템플릿 목록 컴포넌트
 * PRD 01-anonymous-voting-detailed.md의 질문 템플릿 리스트 UI 구현
 */

import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { TemplateCard } from './TemplateCard';
import type { QuestionTemplate, TemplateCategory } from '../../types/template';
import { useTemplatesByCategory } from '../../hooks/useTemplates';

interface TemplateListProps {
  category: TemplateCategory;
  selectedTemplate: QuestionTemplate | null;
  onTemplateSelect: (template: QuestionTemplate) => void;
  searchQuery?: string;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  category,
  selectedTemplate,
  onTemplateSelect,
  searchQuery = ''
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const {
    data: templatesData,
    isLoading,
    error,
    refetch
  } = useTemplatesByCategory(category, ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // 검색 필터링
  const filteredTemplates = templatesData?.templates.filter(template =>
    template.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // 새로고침 처리
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // 무한 스크롤 처리
  const onEndReached = useCallback(() => {
    if (templatesData && templatesData.templates.length < templatesData.total) {
      setPage(prev => prev + 1);
    }
  }, [templatesData]);

  // 템플릿 선택 처리
  const handleTemplateSelect = useCallback((template: QuestionTemplate) => {
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  // 템플릿 카드 렌더링
  const renderTemplateCard = useCallback(({ item }: { item: QuestionTemplate }) => (
    <TemplateCard
      template={item}
      onSelect={handleTemplateSelect}
      isSelected={selectedTemplate?.id === item.id}
      showUsageCount={true}
    />
  ), [selectedTemplate, handleTemplateSelect]);

  // 로딩 표시
  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#6C757D" />
      </View>
    );
  }, [isLoading]);

  // 빈 상태 표시
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C757D" />
          <Text style={styles.loadingText}>템플릿을 불러오는 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>템플릿을 불러오는 중 오류가 발생했습니다.</Text>
          <Text style={styles.retryText}>아래로 당겨서 다시 시도해보세요.</Text>
        </View>
      );
    }

    if (searchQuery && filteredTemplates.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>'{searchQuery}' 검색 결과가 없습니다.</Text>
          <Text style={styles.emptySubText}>다른 검색어로 시도해보세요.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아직 등록된 템플릿이 없습니다.</Text>
        <Text style={styles.emptySubText}>곧 다양한 질문 템플릿이 추가될 예정입니다!</Text>
      </View>
    );
  }, [isLoading, error, searchQuery, filteredTemplates.length]);

  // 구분자 렌더링
  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // 키 추출 함수
  const keyExtractor = useCallback((item: QuestionTemplate) => item.id, []);

  return (
    <FlatList
      data={filteredTemplates}
      keyExtractor={keyExtractor}
      renderItem={renderTemplateCard}
      ItemSeparatorComponent={renderSeparator}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6C757D']}
          tintColor="#6C757D"
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        filteredTemplates.length === 0 && styles.emptyListContainer
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
  emptyText: {
    fontSize: 16,
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