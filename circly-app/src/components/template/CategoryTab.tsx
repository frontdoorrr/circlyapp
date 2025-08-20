/**
 * 카테고리 탭 컴포넌트
 * PRD 01-anonymous-voting-detailed.md의 카테고리별 분류 UI 구현
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TemplateCategory, CategoryInfo } from '../../types/template';
import { TEMPLATE_CATEGORIES } from '../../types/template';

interface CategoryTabProps {
  selectedCategory: TemplateCategory | null;
  onCategorySelect: (category: TemplateCategory) => void;
  templateCounts?: Record<TemplateCategory, number>;
}

export const CategoryTab: React.FC<CategoryTabProps> = ({
  selectedCategory,
  onCategorySelect,
  templateCounts = {}
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TEMPLATE_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.key;
          const count = templateCounts[category.key] || 0;
          
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => onCategorySelect(category.key)}
              style={styles.tabContainer}
              activeOpacity={0.7}
            >
              {isSelected ? (
                <LinearGradient
                  colors={[category.color, `${category.color}CC`]}
                  style={[styles.tab, styles.selectedTab]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <TabContent category={category} count={count} isSelected={true} />
                </LinearGradient>
              ) : (
                <View style={[styles.tab, styles.unselectedTab]}>
                  <TabContent category={category} count={count} isSelected={false} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

interface TabContentProps {
  category: CategoryInfo;
  count: number;
  isSelected: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ category, count, isSelected }) => (
  <>
    <Text style={styles.icon}>{category.icon}</Text>
    <Text style={[
      styles.categoryName, 
      isSelected && styles.selectedCategoryName
    ]}>
      {category.name}
    </Text>
    {count > 0 && (
      <Text style={[
        styles.count,
        isSelected && styles.selectedCount
      ]}>
        {count}개
      </Text>
    )}
  </>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tabContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  unselectedTab: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  selectedCategoryName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  count: {
    fontSize: 11,
    color: '#6C757D',
    fontWeight: '500',
  },
  selectedCount: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});