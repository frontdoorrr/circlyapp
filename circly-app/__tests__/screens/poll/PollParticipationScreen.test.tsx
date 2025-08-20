/**
 * PollParticipationScreen 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { PollParticipationScreen } from '../../../src/screens/poll/PollParticipationScreen';
import type { PollResponse, PollParticipation } from '../../../src/types/poll';
import * as usePollsHook from '../../../src/hooks/usePolls';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      pollId: 123,
      circleId: 456,
      circleName: '테스트 서클',
    },
  }),
}));

// Mock hooks
jest.mock('../../../src/hooks/usePolls');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('PollParticipationScreen', () => {
  const mockPoll: PollResponse = {
    id: 123,
    title: '좋아하는 색깔은?',
    description: '가장 좋아하는 색깔을 선택해주세요.',
    question_template: '누가 가장 패션 센스가 좋나요?',
    circle_id: 456,
    creator_id: 1,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_anonymous: true,
    created_at: '2024-01-15T10:30:00Z',
    options: [
      { id: 1, poll_id: 123, text: '빨간색', order_index: 0, vote_count: 5 },
      { id: 2, poll_id: 123, text: '파란색', order_index: 1, vote_count: 3 },
      { id: 3, poll_id: 123, text: '초록색', order_index: 2, vote_count: 2 },
    ],
    total_votes: 10,
    user_voted: false,
  };

  const mockParticipation: PollParticipation = {
    poll_id: 123,
    has_voted: false,
  };

  const mockUsePoll = usePollsHook.usePoll as jest.MockedFunction<typeof usePollsHook.usePoll>;
  const mockUsePollParticipation = usePollsHook.usePollParticipation as jest.MockedFunction<typeof usePollsHook.usePollParticipation>;
  const mockUseVotePoll = usePollsHook.useVotePoll as jest.MockedFunction<typeof usePollsHook.useVotePoll>;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    
    mockUsePoll.mockReturnValue({
      data: mockPoll,
      isLoading: false,
      error: null,
    } as any);

    mockUsePollParticipation.mockReturnValue({
      data: mockParticipation,
      isLoading: false,
    } as any);

    mockUseVotePoll.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders poll information correctly', () => {
    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('투표 참여')).toBeTruthy();
    expect(getByText('테스트 서클')).toBeTruthy();
    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('가장 좋아하는 색깔을 선택해주세요.')).toBeTruthy();
    expect(getByText('누가 가장 패션 센스가 좋나요?')).toBeTruthy();
  });

  it('renders poll options correctly', () => {
    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('빨간색')).toBeTruthy();
    expect(getByText('파란색')).toBeTruthy();
    expect(getByText('초록색')).toBeTruthy();
  });

  it('shows poll statistics correctly', () => {
    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('총 10표 · 3개 선택지')).toBeTruthy();
    expect(getByText('익명 투표')).toBeTruthy();
    // 시간이 남아있으면 "X시간 남음" 형태로 표시됨
    const timeText = getByText(/남음/) || getByText('진행 중');
    expect(timeText).toBeTruthy();
  });

  it('allows option selection when poll is active', () => {
    const { getByText, queryByText } = renderWithQueryClient(<PollParticipationScreen />);

    // 옵션 선택
    fireEvent.press(getByText('빨간색'));

    // 투표하기 버튼이 나타나야 함
    expect(queryByText('투표하기')).toBeTruthy();
  });

  it('submits vote successfully', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseVotePoll.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    // 옵션 선택
    fireEvent.press(getByText('빨간색'));

    // 투표하기 버튼 클릭
    fireEvent.press(getByText('투표하기'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        pollId: 123,
        voteData: { option_id: 1 }
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      '투표 완료',
      '투표가 성공적으로 제출되었습니다!',
      expect.arrayContaining([
        expect.objectContaining({
          text: '결과 보기',
        })
      ])
    );
  });

  it('handles vote submission error', async () => {
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
    mockUseVotePoll.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    // 옵션 선택
    fireEvent.press(getByText('빨간색'));

    // 투표하기 버튼 클릭
    fireEvent.press(getByText('투표하기'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '투표 실패',
        'Network error',
        [{ text: '확인' }]
      );
    });
  });

  it('shows completed state when user has voted', () => {
    const votedParticipation: PollParticipation = {
      poll_id: 123,
      has_voted: true,
      selected_option_id: 1,
      voted_at: '2024-01-15T12:00:00Z',
    };

    mockUsePollParticipation.mockReturnValue({
      data: votedParticipation,
      isLoading: false,
    } as any);

    const { getByText, queryByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('투표 완료')).toBeTruthy();
    expect(getByText('투표 결과 보기')).toBeTruthy();
    expect(queryByText('투표하기')).toBeNull();
  });

  it('shows expired state when poll is expired', () => {
    const expiredPoll = {
      ...mockPoll,
      expires_at: new Date(Date.now() - 1000).toISOString(), // 1초 전에 만료
    };

    mockUsePoll.mockReturnValue({
      data: expiredPoll,
      isLoading: false,
      error: null,
    } as any);

    const { getByText, queryByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('투표 마감')).toBeTruthy();
    expect(queryByText('투표하기')).toBeNull();
  });

  it('navigates to results when "투표 결과 보기" is pressed', () => {
    const votedParticipation: PollParticipation = {
      poll_id: 123,
      has_voted: true,
      selected_option_id: 1,
    };

    mockUsePollParticipation.mockReturnValue({
      data: votedParticipation,
      isLoading: false,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    fireEvent.press(getByText('투표 결과 보기'));

    expect(mockNavigate).toHaveBeenCalledWith('PollResults', {
      pollId: 123,
      circleId: 456,
      circleName: '테스트 서클',
    });
  });

  it('handles back navigation correctly', () => {
    const { getByTestId } = renderWithQueryClient(<PollParticipationScreen />);

    const backButton = getByTestId('icon-arrow-back') || 
                      document.querySelector('[name="arrow-back"]');
    if (backButton) {
      fireEvent.press(backButton);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    }
  });

  it('shows loading state correctly', () => {
    mockUsePoll.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('투표를 불러오는 중...')).toBeTruthy();
  });

  it('shows error state when poll fails to load', () => {
    mockUsePoll.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('투표를 불러올 수 없습니다.')).toBeTruthy();
    expect(getByText('돌아가기')).toBeTruthy();
  });

  it('formats time remaining correctly', () => {
    const pollWith2Hours = {
      ...mockPoll,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    mockUsePoll.mockReturnValue({
      data: pollWith2Hours,
      isLoading: false,
      error: null,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('2시간 남음')).toBeTruthy();
  });

  it('handles poll without description', () => {
    const pollWithoutDesc = {
      ...mockPoll,
      description: undefined,
    };

    mockUsePoll.mockReturnValue({
      data: pollWithoutDesc,
      isLoading: false,
      error: null,
    } as any);

    const { getByText, queryByText } = renderWithQueryClient(<PollParticipationScreen />);

    expect(getByText('좋아하는 색깔은?')).toBeTruthy();
    expect(queryByText('가장 좋아하는 색깔을 선택해주세요.')).toBeNull();
  });

  it('shows vote counts when user has voted', () => {
    const votedParticipation: PollParticipation = {
      poll_id: 123,
      has_voted: true,
      selected_option_id: 1,
    };

    mockUsePollParticipation.mockReturnValue({
      data: votedParticipation,
      isLoading: false,
    } as any);

    const { getByText } = renderWithQueryClient(<PollParticipationScreen />);

    // 각 옵션의 투표 수가 표시되어야 함
    expect(getByText('5표')).toBeTruthy(); // 빨간색
    expect(getByText('3표')).toBeTruthy(); // 파란색  
    expect(getByText('2표')).toBeTruthy(); // 초록색
  });

  it('disables options when poll cannot be voted on', () => {
    const expiredPoll = {
      ...mockPoll,
      is_active: false,
    };

    mockUsePoll.mockReturnValue({
      data: expiredPoll,
      isLoading: false,
      error: null,
    } as any);

    const { getByText, queryByText } = renderWithQueryClient(<PollParticipationScreen />);

    // 옵션을 눌러봐도 투표하기 버튼이 나타나지 않아야 함
    fireEvent.press(getByText('빨간색'));
    expect(queryByText('투표하기')).toBeNull();
  });
});