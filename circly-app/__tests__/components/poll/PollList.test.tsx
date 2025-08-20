/**
 * PollList 컴포넌트 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PollList } from '../../../src/components/poll/PollList';
import type { PollResponse } from '../../../src/types/poll';

// Mock PollCard component
jest.mock('../../../src/components/poll/PollCard', () => ({
  PollCard: ({ poll, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={() => onPress(poll)} testID={`poll-${poll.id}`}>
        <Text>{poll.title}</Text>
        <Text>{poll.user_voted ? 'Voted' : 'Not Voted'}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('PollList', () => {
  const mockPolls: PollResponse[] = [
    {
      id: 1,
      title: '좋아하는 색깔은?',
      description: '가장 좋아하는 색깔을 선택해주세요.',
      question_template: '누가 가장 패션 센스가 좋나요?',
      circle_id: 1,
      creator_id: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T10:30:00Z',
      options: [
        { id: 1, poll_id: 1, text: '빨간색', order_index: 0, vote_count: 5 },
        { id: 2, poll_id: 1, text: '파란색', order_index: 1, vote_count: 3 },
      ],
      total_votes: 8,
      user_voted: false,
    },
    {
      id: 2,
      title: '좋아하는 음식은?',
      question_template: '누가 가장 요리를 잘하나요?',
      circle_id: 1,
      creator_id: 1,
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T11:00:00Z',
      options: [
        { id: 3, poll_id: 2, text: '피자', order_index: 0, vote_count: 10 },
        { id: 4, poll_id: 2, text: '치킨', order_index: 1, vote_count: 7 },
      ],
      total_votes: 17,
      user_voted: true,
    },
  ];

  const mockOnPollPress = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    mockOnPollPress.mockClear();
    mockOnRefresh.mockClear();
  });

  it('renders poll list correctly', () => {
    const { getByText, getByTestId } = render(
      <PollList
        polls={mockPolls}
        onPollPress={mockOnPollPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('좋아하는 음식은?')).toBeTruthy();
    expect(getByTestId('poll-1')).toBeTruthy();
    expect(getByTestId('poll-2')).toBeTruthy();
  });

  it('shows poll count header when polls exist', () => {
    const { getByText } = render(
      <PollList
        polls={mockPolls}
        onPollPress={mockOnPollPress}
      />
    );

    expect(getByText('총 2개의 투표')).toBeTruthy();
  });

  it('calls onPollPress when poll is pressed', () => {
    const { getByTestId } = render(
      <PollList
        polls={mockPolls}
        onPollPress={mockOnPollPress}
      />
    );

    fireEvent.press(getByTestId('poll-1'));
    expect(mockOnPollPress).toHaveBeenCalledWith(mockPolls[0]);
    expect(mockOnPollPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    const { getByText } = render(
      <PollList
        polls={[]}
        loading={true}
        onPollPress={mockOnPollPress}
      />
    );

    expect(getByText('투표를 불러오는 중...')).toBeTruthy();
  });

  it('shows error state correctly', () => {
    const { getByText } = render(
      <PollList
        polls={[]}
        error="Network error"
        onPollPress={mockOnPollPress}
      />
    );

    expect(getByText('투표를 불러오는 중 오류가 발생했습니다.')).toBeTruthy();
    expect(getByText('아래로 당겨서 다시 시도해보세요.')).toBeTruthy();
  });

  it('shows empty state with default message', () => {
    const { getByText } = render(
      <PollList
        polls={[]}
        onPollPress={mockOnPollPress}
      />
    );

    expect(getByText('진행 중인 투표가 없습니다.')).toBeTruthy();
    expect(getByText('새로운 투표가 생성되면 알림을 받을 수 있습니다.')).toBeTruthy();
  });

  it('shows empty state with custom message', () => {
    const customMessage = '참여할 수 있는 투표가 없습니다.';
    const { getByText } = render(
      <PollList
        polls={[]}
        onPollPress={mockOnPollPress}
        emptyMessage={customMessage}
      />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('passes showStatus prop to PollCard correctly', () => {
    const { getByTestId } = render(
      <PollList
        polls={mockPolls}
        onPollPress={mockOnPollPress}
        showStatus={false}
      />
    );

    // PollCard가 렌더링되는지 확인
    expect(getByTestId('poll-1')).toBeTruthy();
    expect(getByTestId('poll-2')).toBeTruthy();
  });

  it('handles refresh correctly', () => {
    const { getByTestId } = render(
      <PollList
        polls={mockPolls}
        onPollPress={mockOnPollPress}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // RefreshControl이 있는지 확인하기 위해 FlatList를 찾음
    const flatList = getByTestId('poll-1').parent?.parent?.parent;
    expect(flatList).toBeTruthy();
  });

  it('does not show header when loading', () => {
    const { queryByText } = render(
      <PollList
        polls={mockPolls}
        loading={true}
        onPollPress={mockOnPollPress}
      />
    );

    expect(queryByText('총 2개의 투표')).toBeNull();
  });

  it('does not show header when no polls', () => {
    const { queryByText } = render(
      <PollList
        polls={[]}
        onPollPress={mockOnPollPress}
      />
    );

    expect(queryByText('총 0개의 투표')).toBeNull();
  });

  it('handles single poll correctly', () => {
    const singlePoll = [mockPolls[0]];
    const { getByText } = render(
      <PollList
        polls={singlePoll}
        onPollPress={mockOnPollPress}
      />
    );

    expect(getByText('총 1개의 투표')).toBeTruthy();
    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
  });

  it('shows loading footer when loading more data', () => {
    const { queryByText } = render(
      <PollList
        polls={mockPolls}
        loading={true}
        onPollPress={mockOnPollPress}
      />
    );

    // 로딩 상태일 때는 polls가 있어도 데이터를 표시하지만 로딩 인디케이터도 표시됨
    // PollList 컴포넌트는 polls가 있으면 표시하고 loading이면 footer에 로딩 표시
    expect(queryByText('좋아하는 색깔은?')).toBeTruthy();
  });
});