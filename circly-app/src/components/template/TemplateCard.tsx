/**
 * 템플릿 카드 컴포넌트
 * PRD 01-anonymous-voting-detailed.md의 질문 템플릿 선택 UI 구현
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { QuestionTemplate } from '../../types/template';
import { TEMPLATE_CATEGORIES } from '../../types/template';

interface TemplateCardProps {
  template: QuestionTemplate;
  onSelect: (template: QuestionTemplate) => void;
  isSelected?: boolean;
  showUsageCount?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  isSelected = false,
  showUsageCount = true
}) => {
  const categoryInfo = TEMPLATE_CATEGORIES.find(cat => cat.key === template.category);
  const categoryColor = categoryInfo?.color || '#6C757D';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={() => onSelect(template)}
      activeOpacity={0.7}
    >
      {isSelected && (
        <LinearGradient
          colors={[categoryColor, `${categoryColor}DD`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.content}>
        {/* 카테고리 배지 */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryIcon}>{categoryInfo?.icon || '📝'}</Text>
        </View>

        {/* 질문 텍스트 */}
        <Text style={[
          styles.questionText,
          isSelected && styles.selectedQuestionText
        ]}>
          {template.question_text}
        </Text>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          {showUsageCount && (
            <View style={styles.usageContainer}>
              <Ionicons 
                name="people-outline" 
                size={14} 
                color={isSelected ? '#FFFFFF' : '#6C757D'} 
              />
              <Text style={[
                styles.usageText,
                isSelected && styles.selectedUsageText
              ]}>
                {template.usage_count.toLocaleString()}회 사용됨
              </Text>
            </View>
          )}

          {template.is_popular && (
            <View style={[
              styles.popularBadge,
              isSelected && styles.selectedPopularBadge
            ]}>
              <Ionicons 
                name="trending-up" 
                size={12} 
                color={isSelected ? categoryColor : '#FF6B6B'} 
              />
              <Text style={[
                styles.popularText,
                isSelected && styles.selectedPopularText
              ]}>
                인기
              </Text>
            </View>
          )}
        </View>

        {/* 선택 표시 */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedContainer: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    transform: [{ scale: 1.02 }],
  },
  content: {
    padding: 20,
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    lineHeight: 26,
    marginRight: 40, // 카테고리 배지 공간 확보
    marginBottom: 16,
  },
  selectedQuestionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedUsageText: {
    color: '#FFFFFF',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedPopularBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  popularText: {
    fontSize: 10,
    color: '#FF6B6B',
    marginLeft: 2,
    fontWeight: '600',
  },
  selectedPopularText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
});