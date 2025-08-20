/**
 * ResultCard 컴포넌트 테스트
 * TRD 07-sharing-system.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { ResultCard } from '../../../src/components/poll/ResultCard';
import type { PollResponse, VoteResult } from '../../../src/types/poll';

// Mock 설정
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: {
    share: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

const mockShare = Share as jest.Mocked<typeof Share>;
const mockMediaLibrary = MediaLibrary as jest.Mocked<typeof MediaLibrary>;
const mockCaptureRef = captureRef as jest.MockedFunction<typeof captureRef>;

const mockPoll: PollResponse = {
  id: 123,
  title: '가장 좋아하는 색깔은?',
  description: '당신이 가장 좋아하는 색깔을 선택해주세요',
  question_template: '누가 가장 패션 센스가 좋나요?',
  circle_id: 1,
  creator_id: 1,
  is_active: true,
  is_anonymous: true,
  created_at: '2024-01-15T10:30:00Z',
  options: [
    { id: 1, poll_id: 123, text: '빨간색', order_index: 0, vote_count: 15 },
    { id: 2, poll_id: 123, text: '파란색', order_index: 1, vote_count: 10 },
    { id: 3, poll_id: 123, text: '초록색', order_index: 2, vote_count: 5 },
  ],
  total_votes: 30,
  user_voted: true,
};

const mockResults: VoteResult[] = [
  { option_id: 1, vote_count: 15, percentage: 50.0 },
  { option_id: 2, vote_count: 10, percentage: 33.3 },
  { option_id: 3, vote_count: 5, percentage: 16.7 },
];

const circleName = '테스트 서클';

describe('ResultCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockShare.share.mockResolvedValue({ action: 'sharedAction' } as any);
    mockMediaLibrary.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockMediaLibrary.createAssetAsync.mockResolvedValue({ id: 'asset-id' } as any);
    mockMediaLibrary.createAlbumAsync.mockResolvedValue({ id: 'album-id' } as any);
    mockCaptureRef.mockResolvedValue('captured-image-uri');
  });

  it('renders poll information correctly', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('가장 좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('당신이 가장 좋아하는 색깔을 선택해주세요')).toBeTruthy();
    expect(getByText('테스트 서클')).toBeTruthy();
    expect(getByText('Circly')).toBeTruthy();
  });

  it('displays winner information correctly', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('1위')).toBeTruthy();
    expect(getByText('빨간색')).toBeTruthy();
    expect(getByText('15표 (50.0%)')).toBeTruthy();
  });

  it('displays all results correctly', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('전체 결과')).toBeTruthy();
    
    // Check all options are displayed
    expect(getByText('빨간색')).toBeTruthy();
    expect(getByText('파란색')).toBeTruthy();
    expect(getByText('초록색')).toBeTruthy();
    
    // Check vote counts
    expect(getByText('15표')).toBeTruthy();
    expect(getByText('10표')).toBeTruthy();
    expect(getByText('5표')).toBeTruthy();
    
    // Check percentages
    expect(getByText('50.0%')).toBeTruthy();
    expect(getByText('33.3%')).toBeTruthy();
    expect(getByText('16.7%')).toBeTruthy();
  });

  it('displays statistics correctly', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('총 30명 참여')).toBeTruthy();
    expect(getByText('2024. 1. 15.')).toBeTruthy();
    expect(getByText('익명 투표')).toBeTruthy();
  });

  it('shows action buttons', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('공유하기')).toBeTruthy();
    expect(getByText('저장하기')).toBeTruthy();
  });

  it('handles sharing on iOS', async () => {
    Platform.OS = 'ios';
    const mockOnShare = jest.fn();

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
        onShare={mockOnShare}
      />
    );

    fireEvent.press(getByText('공유하기'));

    await waitFor(() => {
      expect(mockCaptureRef).toHaveBeenCalled();
      expect(mockShare.share).toHaveBeenCalledWith({
        url: 'captured-image-uri',
        message: expect.stringContaining('가장 좋아하는 색깔은?'),
      });
      expect(mockOnShare).toHaveBeenCalled();
    });
  });

  it('handles sharing on Android', async () => {
    Platform.OS = 'android';
    const mockOnShare = jest.fn();

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
        onShare={mockOnShare}
      />
    );

    fireEvent.press(getByText('공유하기'));

    await waitFor(() => {
      expect(mockShare.share).toHaveBeenCalledWith({
        url: 'captured-image-uri',
        title: '투표 결과 공유',
        message: expect.stringContaining('가장 좋아하는 색깔은?'),
      });
    });
  });

  it('handles saving with permissions granted', async () => {
    const mockOnSave = jest.fn();

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
        onSave={mockOnSave}
      />
    );

    fireEvent.press(getByText('저장하기'));

    await waitFor(() => {
      expect(mockMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(mockCaptureRef).toHaveBeenCalled();
      expect(mockMediaLibrary.createAssetAsync).toHaveBeenCalledWith('captured-image-uri');
      expect(mockMediaLibrary.createAlbumAsync).toHaveBeenCalledWith('Circly', expect.any(Object), false);
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('handles saving with permissions denied', async () => {
    mockMediaLibrary.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    fireEvent.press(getByText('저장하기'));

    await waitFor(() => {
      expect(mockMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(mockMediaLibrary.createAssetAsync).not.toHaveBeenCalled();
    });
  });

  it('handles capture error during sharing', async () => {
    mockCaptureRef.mockRejectedValue(new Error('Capture failed'));

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    fireEvent.press(getByText('공유하기'));

    await waitFor(() => {
      expect(mockShare.share).not.toHaveBeenCalled();
    });
  });

  it('handles capture error during saving', async () => {
    mockCaptureRef.mockRejectedValue(new Error('Capture failed'));

    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    fireEvent.press(getByText('저장하기'));

    await waitFor(() => {
      expect(mockMediaLibrary.createAssetAsync).not.toHaveBeenCalled();
    });
  });

  it('handles poll without description', () => {
    const pollWithoutDescription = { ...mockPoll, description: undefined };

    const { getByText, queryByText } = render(
      <ResultCard
        poll={pollWithoutDescription}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('가장 좋아하는 색깔은?')).toBeTruthy();
    expect(queryByText('당신이 가장 좋아하는 색깔을 선택해주세요')).toBeNull();
  });

  it('handles non-anonymous poll', () => {
    const publicPoll = { ...mockPoll, is_anonymous: false };

    const { queryByText } = render(
      <ResultCard
        poll={publicPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(queryByText('익명 투표')).toBeNull();
  });

  it('displays ranking correctly', () => {
    const { getAllByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    // Check ranking numbers (1, 2, 3)
    const rankings = getAllByText(/^[1-3]$/);
    expect(rankings).toHaveLength(3);
    expect(getAllByText('1')).toBeTruthy(); // Winner rank
    expect(getAllByText('2')).toBeTruthy(); // Second place
    expect(getAllByText('3')).toBeTruthy(); // Third place
  });

  it('handles empty results', () => {
    const { getByText } = render(
      <ResultCard
        poll={{ ...mockPoll, options: [], total_votes: 0 }}
        results={[]}
        circleName={circleName}
      />
    );

    // Should still render basic information
    expect(getByText('가장 좋아하는 색깔은?')).toBeTruthy();
    expect(getByText('총 0명 참여')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    
    const { getByTestId } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
        style={customStyle}
        testID="result-card"
      />
    );

    const container = getByTestId('result-card');
    expect(container.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ alignItems: 'center' }),
      customStyle,
    ]));
  });

  it('shows footer with app promotion', () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    expect(getByText('앱에서 더 많은 투표를 만나보세요')).toBeTruthy();
  });

  it('captures with high resolution', async () => {
    const { getByText } = render(
      <ResultCard
        poll={mockPoll}
        results={mockResults}
        circleName={circleName}
      />
    );

    fireEvent.press(getByText('공유하기'));

    await waitFor(() => {
      expect(mockCaptureRef).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          format: 'png',
          quality: 1.0,
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
    });
  });
});