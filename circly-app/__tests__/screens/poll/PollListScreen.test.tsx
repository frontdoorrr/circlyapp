/**
 * PollListScreen 테스트
 * TRD 01-frontend-architecture.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PollListScreen } from '../../../src/screens/poll/PollListScreen';
import type { PollResponse } from '../../../src/types/poll';
import * as usePollsHook from '../../../src/hooks/usePolls';

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
      circleId: 123,
      circleName: '테스트 서클',
    },
  }),
}));

// Mock hooks
jest.mock('../../../src/hooks/usePolls');

// Mock PollList component
jest.mock('../../../src/components/poll/PollList', () => ({
  PollList: ({ polls, onPollPress, emptyMessage }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="poll-list">
        <Text testID="empty-message">{emptyMessage}</Text>
        <Text testID="poll-count">{polls.length}</Text>
        {polls.map((poll: any) => (
          <TouchableOpacity
            key={poll.id}
            onPress={() => onPollPress(poll)}
            testID={`poll-item-${poll.id}`}
          >
            <Text>{poll.title}</Text>
            <Text testID={`poll-voted-${poll.id}`}>{poll.user_voted ? 'voted' : 'not-voted'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

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

describe('PollListScreen', () => {
  const mockPolls: PollResponse[] = [
    {
      id: 1,
      title: '활성 투표',
      question_template: '누가 가장 패션 센스가 좋나요?',
      circle_id: 123,
      creator_id: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T10:30:00Z',
      options: [],
      total_votes: 5,
      user_voted: false,
    },
    {
      id: 2,
      title: '참여한 투표',
      question_template: '누가 가장 요리를 잘하나요?',
      circle_id: 123,
      creator_id: 1,
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T11:00:00Z',
      options: [],
      total_votes: 10,
      user_voted: true,
    },
    {
      id: 3,
      title: '만료된 투표',
      question_template: '누가 가장 친절한가요?',
      circle_id: 123,
      creator_id: 1,
      expires_at: new Date(Date.now() - 1000).toISOString(), // 만료됨
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T09:00:00Z',
      options: [],
      total_votes: 3,
      user_voted: false,
    },
  ];

  const mockUseActivePolls = usePollsHook.useActivePolls as jest.MockedFunction<typeof usePollsHook.useActivePolls>;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockUseActivePolls.mockReturnValue({
      data: mockPolls,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders header correctly', () => {
    const { getByText } = renderWithQueryClient(<PollListScreen />);

    expect(getByText('투표')).toBeTruthy();
    expect(getByText('테스트 서클')).toBeTruthy();
  });

  it('renders filter tabs with correct counts', () => {
    const { getByText, getAllByText } = renderWithQueryClient(<PollListScreen />);

    // 활성 투표: 1개 (만료되지 않고, 참여하지 않은 투표)
    expect(getByText('참여 가능')).toBeTruthy();
    // 활성 투표 개수는 배지로 표시됨 (여러 '1'이 있을 수 있음)
    const activeCountElements = getAllByText('1');
    expect(activeCountElements.length).toBeGreaterThan(0);

    // 참여한 투표: 1개
    expect(getByText('참여 완료')).toBeTruthy();

    // 전체 투표: 3개
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('3')).toBeTruthy(); // 전체 투표 개수
  });

  it('filters polls correctly for active tab', () => {
    const { getByText, getByTestId } = renderWithQueryClient(<PollListScreen />);

    // 기본적으로 '참여 가능' 탭이 선택됨
    expect(getByTestId('poll-count')).toHaveTextContent('1');
    expect(getByText('참여할 수 있는 투표가 없습니다.')).toBeTruthy();
  });

  it('filters polls correctly for participated tab', () => {
    const { getByText, getByTestId, queryByTestId } = renderWithQueryClient(<PollListScreen />);

    // '참여 완료' 탭 클릭
    fireEvent.press(getByText('참여 완료'));

    expect(getByTestId('poll-count')).toHaveTextContent('1');
    expect(getByText('참여한 투표가 없습니다.')).toBeTruthy();
    expect(queryByTestId('poll-item-2')).toBeTruthy();
  });

  it('shows all polls in all tab', () => {
    const { getByText, getByTestId } = renderWithQueryClient(<PollListScreen />);

    // '전체' 탭 클릭
    fireEvent.press(getByText('전체'));

    expect(getByTestId('poll-count')).toHaveTextContent('3');
    expect(getByText('진행 중인 투표가 없습니다.')).toBeTruthy();
  });

  it('navigates to poll participation when poll is pressed', () => {
    const { getByText, getByTestId } = renderWithQueryClient(<PollListScreen />);

    // '전체' 탭으로 이동해서 투표 항목 찾기
    fireEvent.press(getByText('전체'));
    
    // 투표 항목 클릭 (실제로는 PollList 컴포넌트가 mock되어 있음)
    const pollItem = getByTestId('poll-item-1');
    if (pollItem) {
      fireEvent.press(pollItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('PollParticipation', {
        pollId: 1,
        circleId: 123,
        circleName: '테스트 서클',
      });
    }
  });

  it('handles back navigation correctly', () => {
    const { getByTestId } = renderWithQueryClient(<PollListScreen />);

    const backButton = getByTestId('icon-arrow-back') || 
                      document.querySelector('[name="arrow-back"]');
    if (backButton) {
      fireEvent.press(backButton);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    }
  });

  it('handles refresh correctly', () => {
    const mockRefetch = jest.fn();
    mockUseActivePolls.mockReturnValue({
      data: mockPolls,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const { getByTestId } = renderWithQueryClient(<PollListScreen />);

    const refreshButton = getByTestId('icon-refresh') || 
                         document.querySelector('[name="refresh"]');
    if (refreshButton) {
      fireEvent.press(refreshButton);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    }
  });

  it('shows loading state correctly', () => {
    mockUseActivePolls.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByTestId } = renderWithQueryClient(<PollListScreen />);
    
    expect(getByTestId('poll-list')).toBeTruthy();
  });

  it('shows error state correctly', () => {
    const mockError = new Error('Network error');
    mockUseActivePolls.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByTestId } = renderWithQueryClient(<PollListScreen />);
    
    expect(getByTestId('poll-list')).toBeTruthy();
  });

  it('updates filter badge counts when data changes', () => {
    const { getByText, getAllByText, rerender } = renderWithQueryClient(<PollListScreen />);

    // 초기 상태 확인
    const initialCounts = getAllByText('1');
    expect(initialCounts.length).toBeGreaterThan(0); // 활성 투표 개수
    expect(getByText('3')).toBeTruthy(); // 전체 투표 개수

    // 데이터 업데이트
    const newPolls = [...mockPolls, {
      id: 4,
      title: '새로운 활성 투표',
      question_template: '누가 가장 웃기나요?',
      circle_id: 123,
      creator_id: 1,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      is_anonymous: true,
      created_at: '2024-01-15T12:00:00Z',
      options: [],
      total_votes: 0,
      user_voted: false,
    }];

    mockUseActivePolls.mockReturnValue({
      data: newPolls,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    rerender(
      <QueryClientProvider client={createQueryClient()}>
        <PollListScreen />
      </QueryClientProvider>
    );

    // 업데이트된 개수 확인 (2개 활성, 4개 전체)
    expect(getByText('4')).toBeTruthy(); // 전체 투표 개수
  });
});