/**
 * PollCard 컴포넌트 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PollCard } from '../../../src/components/poll/PollCard';
import type { PollResponse } from '../../../src/types/poll';

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

describe('PollCard', () => {
  const mockPoll: PollResponse = {
    id: 1,
    title: '좋아하는 색깔은?',
    description: '가장 좋아하는 색깔을 선택해주세요.',
    question_template: '누가 가장 패션 센스가 좋나요?',
    circle_id: 1,
    creator_id: 1,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후
    is_active: true,
    is_anonymous: true,
    created_at: '2024-01-15T10:30:00Z',
    options: [
      { id: 1, poll_id: 1, text: '빨간색', order_index: 0, vote_count: 5 },
      { id: 2, poll_id: 1, text: '파란색', order_index: 1, vote_count: 3 },
    ],
    total_votes: 8,
    user_voted: false,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders poll information correctly', () => {
    const { getByText } = render(
      <PollCard poll={mockPoll} onPress={mockOnPress} />
    );

    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('가장 좋아하는 색깔을 선택해주세요.')).toBeTruthy();
    expect(getByText('누가 가장 패션 센스가 좋나요?')).toBeTruthy();
    expect(getByText('8표')).toBeTruthy();
    expect(getByText('2개 선택지')).toBeTruthy();
    expect(getByText('익명')).toBeTruthy();
  });

  it('shows participation status correctly', () => {
    const { getByText } = render(
      <PollCard poll={mockPoll} onPress={mockOnPress} showStatus={true} />
    );

    expect(getByText('참여 가능')).toBeTruthy();
  });

  it('shows completed status when user has voted', () => {
    const votedPoll = { ...mockPoll, user_voted: true };
    const { getByText } = render(
      <PollCard poll={votedPoll} onPress={mockOnPress} />
    );

    expect(getByText('참여 완료')).toBeTruthy();
  });

  it('shows expired status when poll is expired', () => {
    const expiredPoll = {
      ...mockPoll,
      expires_at: new Date(Date.now() - 1000).toISOString(), // 1초 전에 만료
    };
    const { getAllByText } = render(
      <PollCard poll={expiredPoll} onPress={mockOnPress} />
    );

    // 상태 배지와 시간 정보에 모두 '마감됨'이 표시될 수 있음
    const expiredTexts = getAllByText('마감됨');
    expect(expiredTexts.length).toBeGreaterThan(0);
  });

  it('shows inactive status when poll is not active', () => {
    const inactivePoll = { ...mockPoll, is_active: false };
    const { getByText } = render(
      <PollCard poll={inactivePoll} onPress={mockOnPress} />
    );

    expect(getByText('비활성')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <PollCard poll={mockPoll} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('좋아하는 색깔은?'));
    expect(mockOnPress).toHaveBeenCalledWith(mockPoll);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not show status badge when showStatus is false', () => {
    const { queryByText } = render(
      <PollCard poll={mockPoll} onPress={mockOnPress} showStatus={false} />
    );

    expect(queryByText('참여 가능')).toBeNull();
  });

  it('displays time remaining correctly', () => {
    // 2시간 후 만료되는 투표
    const pollWith2Hours = {
      ...mockPoll,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };
    const { getByText } = render(
      <PollCard poll={pollWith2Hours} onPress={mockOnPress} />
    );

    // 시간 표시는 정확한 시간에 따라 달라질 수 있으므로 "남음"이 포함된 텍스트 확인
    const timeText = getByText(/남음/);
    expect(timeText).toBeTruthy();
  });

  it('handles poll without expiry date', () => {
    const noExpiryPoll = { ...mockPoll, expires_at: undefined };
    const { getByText } = render(
      <PollCard poll={noExpiryPoll} onPress={mockOnPress} />
    );

    // 시간 관련 텍스트가 없어야 함
    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('참여 가능')).toBeTruthy();
  });

  it('handles poll without description', () => {
    const noDescPoll = { ...mockPoll, description: undefined };
    const { getByText, queryByText } = render(
      <PollCard poll={noDescPoll} onPress={mockOnPress} />
    );

    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(queryByText('가장 좋아하는 색깔을 선택해주세요.')).toBeNull();
  });

  it('displays non-anonymous poll correctly', () => {
    const publicPoll = { ...mockPoll, is_anonymous: false };
    const { queryByText } = render(
      <PollCard poll={publicPoll} onPress={mockOnPress} />
    );

    expect(queryByText('익명')).toBeNull();
  });

  it('shows zero votes correctly', () => {
    const noVotesPoll = { ...mockPoll, total_votes: 0 };
    const { getByText } = render(
      <PollCard poll={noVotesPoll} onPress={mockOnPress} />
    );

    expect(getByText('0표')).toBeTruthy();
  });

  it('formats large vote counts correctly', () => {
    const popularPoll = { ...mockPoll, total_votes: 1234 };
    const { getByText } = render(
      <PollCard poll={popularPoll} onPress={mockOnPress} />
    );

    expect(getByText('1234표')).toBeTruthy();
  });

  it('handles single option poll', () => {
    const singleOptionPoll = {
      ...mockPoll,
      options: [{ id: 1, poll_id: 1, text: '유일한 선택', order_index: 0, vote_count: 5 }],
    };
    const { getByText } = render(
      <PollCard poll={singleOptionPoll} onPress={mockOnPress} />
    );

    expect(getByText('1개 선택지')).toBeTruthy();
  });
});