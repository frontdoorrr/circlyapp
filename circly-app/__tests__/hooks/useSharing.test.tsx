/**
 * useSharing 훅 테스트
 * TRD 07-sharing-system.md의 테스트 전략 기반
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useSharing, usePollSharing } from '../../src/hooks/useSharing';
import { sharingService } from '../../src/services/sharing';
import type { PollResponse } from '../../src/types/poll';

// Mock 설정
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../../src/services/sharing', () => ({
  sharingService: {
    sharePollInvitation: jest.fn(),
    sharePollResults: jest.fn(),
    shareCircleInvitation: jest.fn(),
    shareText: jest.fn(),
    shareImage: jest.fn(),
    captureAndShare: jest.fn(),
    captureAndSave: jest.fn(),
    copyToClipboard: jest.fn(),
  },
}));

const mockAlert = Alert as jest.Mocked<typeof Alert>;
const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const mockPoll: PollResponse = {
  id: 123,
  title: 'Test Poll',
  description: 'Test Description',
  question_template: 'Who is the best?',
  circle_id: 1,
  creator_id: 1,
  is_active: true,
  is_anonymous: true,
  created_at: '2024-01-15T10:30:00Z',
  options: [],
  total_votes: 10,
  user_voted: false,
};

describe('useSharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSharingService.sharePollInvitation.mockResolvedValue({ success: true });
    mockSharingService.sharePollResults.mockResolvedValue({ success: true });
    mockSharingService.shareCircleInvitation.mockResolvedValue({ success: true });
    mockSharingService.shareText.mockResolvedValue({ success: true });
    mockSharingService.shareImage.mockResolvedValue({ success: true });
    mockSharingService.captureAndShare.mockResolvedValue({ success: true });
    mockSharingService.captureAndSave.mockResolvedValue(true);
    mockSharingService.copyToClipboard.mockResolvedValue(true);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSharing());

    expect(result.current.isSharing).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('sharePollInvitation', () => {
    it('should share poll invitation successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.sharePollInvitation(mockPoll, 'Test Circle', 'INVITE123');
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.sharePollInvitation).toHaveBeenCalledWith(
        mockPoll,
        'Test Circle',
        'INVITE123'
      );
      expect(result.current.isSharing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle sharing error', async () => {
      mockSharingService.sharePollInvitation.mockResolvedValue({
        success: false,
        error: 'Share failed',
      });

      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.sharePollInvitation(mockPoll, 'Test Circle');
      });

      expect(shareResult.success).toBe(false);
      expect(result.current.error).toBe('Share failed');
    });

    it('should handle service exception', async () => {
      mockSharingService.sharePollInvitation.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.sharePollInvitation(mockPoll, 'Test Circle');
      });

      expect(shareResult.success).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('should set loading state during sharing', async () => {
      let resolveShare: (value: any) => void;
      const sharePromise = new Promise(resolve => {
        resolveShare = resolve;
      });
      mockSharingService.sharePollInvitation.mockReturnValue(sharePromise);

      const { result } = renderHook(() => useSharing());

      // Start sharing
      act(() => {
        result.current.sharePollInvitation(mockPoll, 'Test Circle');
      });

      // Should be in loading state
      expect(result.current.isSharing).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveShare({ success: true });
        await sharePromise;
      });

      // Should no longer be loading
      expect(result.current.isSharing).toBe(false);
    });
  });

  describe('sharePollResults', () => {
    it('should share poll results successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.sharePollResults(mockPoll, 'Test Circle', 'Winner Option', 10);
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.sharePollResults).toHaveBeenCalledWith(
        mockPoll,
        'Test Circle',
        'Winner Option',
        10
      );
    });
  });

  describe('shareCircleInvitation', () => {
    it('should share circle invitation successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.shareCircleInvitation('Test Circle', 5, 'CIRCLE123');
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.shareCircleInvitation).toHaveBeenCalledWith(
        'Test Circle',
        5,
        'CIRCLE123'
      );
    });
  });

  describe('shareText', () => {
    it('should share text successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.shareText('Title', 'Message', 'https://test.com');
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.shareText).toHaveBeenCalledWith({
        type: 'poll_result',
        title: 'Title',
        message: 'Message',
        url: 'https://test.com',
      });
    });
  });

  describe('shareImage', () => {
    it('should share image successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.shareImage('file://test.png', 'Test message');
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.shareImage).toHaveBeenCalledWith({
        type: 'poll_result',
        imageUri: 'file://test.png',
        message: 'Test message',
      });
    });
  });

  describe('captureAndShare', () => {
    it('should capture and share successfully', async () => {
      const mockViewRef = { current: {} } as any;
      const { result } = renderHook(() => useSharing());

      let shareResult: any;

      await act(async () => {
        shareResult = await result.current.captureAndShare(mockViewRef, 'Test message');
      });

      expect(shareResult.success).toBe(true);
      expect(mockSharingService.captureAndShare).toHaveBeenCalledWith(mockViewRef, {
        type: 'poll_result',
        message: 'Test message',
        quality: 1.0,
      });
    });
  });

  describe('captureAndSave', () => {
    it('should capture and save successfully', async () => {
      const mockViewRef = { current: {} } as any;
      const { result } = renderHook(() => useSharing());

      let saveResult: boolean = false;

      await act(async () => {
        saveResult = await result.current.captureAndSave(mockViewRef, 'TestAlbum');
      });

      expect(saveResult).toBe(true);
      expect(mockSharingService.captureAndSave).toHaveBeenCalledWith(mockViewRef, {
        quality: 1.0,
        albumName: 'TestAlbum',
      });
      expect(result.current.isSaving).toBe(false);
    });

    it('should set saving state during capture', async () => {
      const mockViewRef = { current: {} } as any;
      let resolveSave: (value: boolean) => void;
      const savePromise = new Promise<boolean>(resolve => {
        resolveSave = resolve;
      });
      mockSharingService.captureAndSave.mockReturnValue(savePromise);

      const { result } = renderHook(() => useSharing());

      // Start saving
      act(() => {
        result.current.captureAndSave(mockViewRef);
      });

      // Should be in saving state
      expect(result.current.isSaving).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveSave(true);
        await savePromise;
      });

      // Should no longer be saving
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    it('should copy to clipboard successfully', async () => {
      const { result } = renderHook(() => useSharing());

      let copyResult: boolean = false;

      await act(async () => {
        copyResult = await result.current.copyToClipboard('Test text', 'Custom message');
      });

      expect(copyResult).toBe(true);
      expect(mockSharingService.copyToClipboard).toHaveBeenCalledWith('Test text', 'Custom message');
    });

    it('should handle clipboard error', async () => {
      mockSharingService.copyToClipboard.mockRejectedValue(new Error('Clipboard failed'));

      const { result } = renderHook(() => useSharing());

      let copyResult: boolean = true;

      await act(async () => {
        copyResult = await result.current.copyToClipboard('Test text');
      });

      expect(copyResult).toBe(false);
      expect(result.current.error).toBe('Clipboard failed');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockSharingService.shareText.mockResolvedValue({ success: false, error: 'Test error' });

      const { result } = renderHook(() => useSharing());

      // Create an error
      await act(async () => {
        await result.current.shareText('Title', 'Message');
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('usePollSharing', () => {
  const circleName = 'Test Circle';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingService.sharePollInvitation.mockResolvedValue({ success: true });
    mockSharingService.sharePollResults.mockResolvedValue({ success: true });
    mockSharingService.captureAndShare.mockResolvedValue({ success: true });
    mockSharingService.captureAndSave.mockResolvedValue(true);
  });

  it('should share poll invitation', async () => {
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    let shareResult: any;

    await act(async () => {
      shareResult = await result.current.shareInvitation('INVITE123');
    });

    expect(shareResult.success).toBe(true);
    expect(mockSharingService.sharePollInvitation).toHaveBeenCalledWith(
      mockPoll,
      circleName,
      'INVITE123'
    );
  });

  it('should share poll invitation without invite code', async () => {
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    let shareResult: any;

    await act(async () => {
      shareResult = await result.current.shareInvitation();
    });

    expect(shareResult.success).toBe(true);
    expect(mockSharingService.sharePollInvitation).toHaveBeenCalledWith(
      mockPoll,
      circleName,
      undefined
    );
  });

  it('should share poll results', async () => {
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    let shareResult: any;

    await act(async () => {
      shareResult = await result.current.shareResults('Winner Option', 10);
    });

    expect(shareResult.success).toBe(true);
    expect(mockSharingService.sharePollResults).toHaveBeenCalledWith(
      mockPoll,
      circleName,
      'Winner Option',
      10
    );
  });

  it('should share result card', async () => {
    const mockCardRef = { current: {} } as any;
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    let shareResult: any;

    await act(async () => {
      shareResult = await result.current.shareResultCard(mockCardRef);
    });

    expect(shareResult.success).toBe(true);
    expect(mockSharingService.captureAndShare).toHaveBeenCalledWith(
      mockCardRef,
      '"Test Poll" 투표 결과 🗳️\n서클: Test Circle\n\nCircly에서 확인하기 ➡️'
    );
  });

  it('should save result card', async () => {
    const mockCardRef = { current: {} } as any;
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    let saveResult: boolean = false;

    await act(async () => {
      saveResult = await result.current.saveResultCard(mockCardRef);
    });

    expect(saveResult).toBe(true);
    expect(mockSharingService.captureAndSave).toHaveBeenCalledWith(
      mockCardRef,
      'Circly 투표 결과'
    );
  });

  it('should inherit all useSharing methods', () => {
    const { result } = renderHook(() => usePollSharing(mockPoll, circleName));

    // Check that all useSharing methods are available
    expect(typeof result.current.shareText).toBe('function');
    expect(typeof result.current.shareImage).toBe('function');
    expect(typeof result.current.copyToClipboard).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    
    // Check state properties
    expect(result.current.isSharing).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });
});