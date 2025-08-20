/**
 * 템플릿 선택 화면
 * PRD 01-anonymous-voting-detailed.md의 투표 생성 플로우 구현
 * - 미리 정의된 칭찬 질문 리스트에서 선택
 * - 카테고리별 분류 (외모, 성격, 패션, 재능 등)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CategoryTab } from '../../components/template/CategoryTab';
import { TemplateList } from '../../components/template/TemplateList';
import type { 
  TemplateCategory, 
  QuestionTemplate 
} from '../../types/template';
import { TEMPLATE_CATEGORIES } from '../../types/template';
import { useTemplatesByCategory } from '../../hooks/useTemplates';

interface RouteParams {
  circleId: string;
  circleName: string;
}

export const TemplateSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { circleId, circleName } = route.params as RouteParams;

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('외모');
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 각 카테고리별 템플릿 수 조회 (탭에 표시용)
  const templateCounts: Record<TemplateCategory, number> = {};
  TEMPLATE_CATEGORIES.forEach(category => {
    const { data } = useTemplatesByCategory(category.key, 1, 0);
    templateCounts[category.key] = data?.total || 0;
  });

  // 키보드 이벤트 처리
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (searchQuery.trim() === '') {
        setShowSearch(false);
      }
    });

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, [searchQuery]);

  // 카테고리 선택 처리
  const handleCategorySelect = useCallback((category: TemplateCategory) => {
    setSelectedCategory(category);
    setSelectedTemplate(null); // 카테고리 변경 시 선택 초기화
  }, []);

  // 템플릿 선택 처리
  const handleTemplateSelect = useCallback((template: QuestionTemplate) => {
    setSelectedTemplate(template);
  }, []);

  // 검색 토글
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => {
      if (prev) {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  // 다음 단계로 이동 (투표 생성 화면)
  const handleNextStep = useCallback(() => {
    if (!selectedTemplate) return;

    navigation.navigate('CreatePoll', {
      circleId,
      circleName,
      template: selectedTemplate,
    });
  }, [navigation, circleId, circleName, selectedTemplate]);

  // 뒤로 가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
          <Text style={styles.title}>질문 템플릿 선택</Text>
          <Text style={styles.subtitle}>{circleName}</Text>
        </View>

        <TouchableOpacity 
          onPress={toggleSearch}
          style={styles.searchButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name={showSearch ? "close" : "search"} 
            size={22} 
            color="#495057" 
          />
        </TouchableOpacity>
      </View>

      {/* 검색창 */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6C757D" />
            <TextInput
              style={styles.searchInput}
              placeholder="질문 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#ADB5BD"
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 카테고리 탭 */}
        {!showSearch && (
          <CategoryTab
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            templateCounts={templateCounts}
          />
        )}

        {/* 템플릿 목록 */}
        <View style={styles.listContainer}>
          <TemplateList
            category={selectedCategory}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            searchQuery={searchQuery}
          />
        </View>
      </KeyboardAvoidingView>

      {/* 하단 액션 버튼 */}
      {selectedTemplate && (
        <View style={styles.bottomAction}>
          <View style={styles.selectedTemplateInfo}>
            <Text style={styles.selectedLabel}>선택된 질문</Text>
            <Text style={styles.selectedText} numberOfLines={2}>
              {selectedTemplate.question_text}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>투표 만들기</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  bottomAction: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedTemplateInfo: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    lineHeight: 22,
  },
  nextButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
});