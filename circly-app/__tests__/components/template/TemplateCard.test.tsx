/**
 * TemplateCard 컴포넌트 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TemplateCard } from '../../../src/components/template/TemplateCard';
import type { QuestionTemplate } from '../../../src/types/template';

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

describe('TemplateCard', () => {
  const mockTemplate: QuestionTemplate = {
    id: '1',
    question_text: '누가 가장 패션 센스가 좋나요?',
    category: '외모',
    usage_count: 125,
    is_popular: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders template information correctly', () => {
    const { getByText } = render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 질문 텍스트 표시 확인
    expect(getByText('누가 가장 패션 센스가 좋나요?')).toBeTruthy();
    
    // 사용 횟수 표시 확인
    expect(getByText('125회 사용됨')).toBeTruthy();
    
    // 인기 배지 표시 확인
    expect(getByText('인기')).toBeTruthy();
    
    // 카테고리 아이콘 표시 확인 (외모 카테고리)
    expect(getByText('✨')).toBeTruthy();
  });

  it('calls onSelect when pressed', () => {
    const { getByText } = render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    fireEvent.press(getByText('누가 가장 패션 센스가 좋나요?'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockTemplate);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('shows selected state correctly', () => {
    const { getByTestId } = render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        isSelected={true}
      />
    );

    // 선택 상태에서는 체크마크 아이콘이 표시되어야 함
    const checkmarkIcon = getByTestId('icon-checkmark-circle');
    expect(checkmarkIcon).toBeTruthy();
  });

  it('hides usage count when showUsageCount is false', () => {
    const { queryByText } = render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
        showUsageCount={false}
      />
    );

    // 사용 횟수가 표시되지 않아야 함
    expect(queryByText('125회 사용됨')).toBeNull();
  });

  it('does not show popular badge when template is not popular', () => {
    const unpopularTemplate: QuestionTemplate = {
      ...mockTemplate,
      is_popular: false,
    };

    const { queryByText } = render(
      <TemplateCard
        template={unpopularTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 인기 배지가 표시되지 않아야 함
    expect(queryByText('인기')).toBeNull();
  });

  it('handles different categories correctly', () => {
    const personalityTemplate: QuestionTemplate = {
      ...mockTemplate,
      category: '성격',
      question_text: '누가 가장 친근한 성격인가요?',
    };

    const { getByText } = render(
      <TemplateCard
        template={personalityTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 성격 카테고리 아이콘 확인
    expect(getByText('💝')).toBeTruthy();
    expect(getByText('누가 가장 친근한 성격인가요?')).toBeTruthy();
  });

  it('displays zero usage count correctly', () => {
    const newTemplate: QuestionTemplate = {
      ...mockTemplate,
      usage_count: 0,
    };

    const { getByText } = render(
      <TemplateCard
        template={newTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 0회도 정상적으로 표시되어야 함
    expect(getByText('0회 사용됨')).toBeTruthy();
  });

  it('formats large usage count correctly', () => {
    const popularTemplate: QuestionTemplate = {
      ...mockTemplate,
      usage_count: 12345,
    };

    const { getByText } = render(
      <TemplateCard
        template={popularTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 큰 숫자는 천 단위 구분자로 표시되어야 함
    expect(getByText('12,345회 사용됨')).toBeTruthy();
  });

  it('handles long question text correctly', () => {
    const longQuestionTemplate: QuestionTemplate = {
      ...mockTemplate,
      question_text: '누가 가장 멋진 패션 센스를 가지고 있고, 항상 스타일리시한 옷을 입고 다니며, 다른 사람들에게 패션 영감을 주는 사람인가요?',
    };

    const { getByText } = render(
      <TemplateCard
        template={longQuestionTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 긴 질문 텍스트도 정상적으로 표시되어야 함
    expect(getByText(longQuestionTemplate.question_text)).toBeTruthy();
  });

  it('handles unknown category gracefully', () => {
    const unknownCategoryTemplate: QuestionTemplate = {
      ...mockTemplate,
      category: 'unknown' as any,
    };

    const { getByText } = render(
      <TemplateCard
        template={unknownCategoryTemplate}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // 알 수 없는 카테고리의 경우 기본 아이콘이 표시되어야 함
    expect(getByText('📝')).toBeTruthy();
  });
});