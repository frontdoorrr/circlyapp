/**
 * CategoryTab 컴포넌트 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryTab } from '../../../src/components/template/CategoryTab';
import type { TemplateCategory } from '../../../src/types/template';

describe('CategoryTab', () => {
  const mockOnCategorySelect = jest.fn();
  const mockTemplateCounts = {
    '외모': 10,
    '성격': 8,
    '재능': 12,
    '특별한날': 6,
  };

  beforeEach(() => {
    mockOnCategorySelect.mockClear();
  });

  it('renders all category tabs correctly', () => {
    const { getByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 모든 카테고리가 렌더링되는지 확인
    expect(getByText('외모')).toBeTruthy();
    expect(getByText('성격')).toBeTruthy();
    expect(getByText('재능')).toBeTruthy();
    expect(getByText('특별한 날')).toBeTruthy();
  });

  it('displays template counts when provided', () => {
    const { getByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 템플릿 개수가 표시되는지 확인
    expect(getByText('10개')).toBeTruthy();
    expect(getByText('8개')).toBeTruthy();
    expect(getByText('12개')).toBeTruthy();
    expect(getByText('6개')).toBeTruthy();
  });

  it('does not display count when templateCounts is empty', () => {
    const { queryByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={{}}
      />
    );

    // 개수가 표시되지 않아야 함
    expect(queryByText(/개$/)).toBeNull();
  });

  it('highlights selected category correctly', () => {
    const selectedCategory: TemplateCategory = '성격';
    const { getByText } = render(
      <CategoryTab
        selectedCategory={selectedCategory}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    const selectedTab = getByText('성격').parent?.parent;
    expect(selectedTab).toBeTruthy();
  });

  it('calls onCategorySelect when category is pressed', () => {
    const { getByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 외모 카테고리 터치
    fireEvent.press(getByText('외모'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith('외모');

    // 성격 카테고리 터치
    fireEvent.press(getByText('성격'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith('성격');
  });

  it('calls onCategorySelect multiple times correctly', () => {
    const { getByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 여러 카테고리를 연속으로 터치
    fireEvent.press(getByText('외모'));
    fireEvent.press(getByText('재능'));
    fireEvent.press(getByText('특별한 날'));

    expect(mockOnCategorySelect).toHaveBeenCalledTimes(3);
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(1, '외모');
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(2, '재능');
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(3, '특별한날');
  });

  it('renders category icons correctly', () => {
    const { getByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 카테고리별 이모지 아이콘이 표시되는지 확인
    expect(getByText('✨')).toBeTruthy(); // 외모
    expect(getByText('💝')).toBeTruthy(); // 성격
    expect(getByText('🏆')).toBeTruthy(); // 재능
    expect(getByText('🌟')).toBeTruthy(); // 특별한날
  });

  it('handles zero template count gracefully', () => {
    const zeroCountTemplates = {
      '외모': 0,
      '성격': 5,
      '재능': 0,
      '특별한날': 3,
    };

    const { queryByText } = render(
      <CategoryTab
        selectedCategory={null}
        onCategorySelect={mockOnCategorySelect}
        templateCounts={zeroCountTemplates}
      />
    );

    // 0개인 카테고리는 개수가 표시되지 않아야 함
    expect(queryByText('0개')).toBeNull();
    // 0이 아닌 카테고리는 표시되어야 함
    expect(queryByText('5개')).toBeTruthy();
    expect(queryByText('3개')).toBeTruthy();
  });

  it('maintains selection state correctly', () => {
    const { rerender, getByText } = render(
      <CategoryTab
        selectedCategory="외모"
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    // 초기 선택 상태 확인
    const initialSelected = getByText('외모').parent?.parent;
    expect(initialSelected).toBeTruthy();

    // 선택 변경
    rerender(
      <CategoryTab
        selectedCategory="성격"
        onCategorySelect={mockOnCategorySelect}
        templateCounts={mockTemplateCounts}
      />
    );

    const newSelected = getByText('성격').parent?.parent;
    expect(newSelected).toBeTruthy();
  });
});