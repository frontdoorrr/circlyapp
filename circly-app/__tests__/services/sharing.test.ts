/**
 * 공유 서비스 테스트
 * TRD 07-sharing-system.md의 테스트 전략 기반
 */

import { Share, Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import { sharingService } from '../../src/services/sharing';
import type { PollResponse } from '../../src/types/poll';

// Mock 설정
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  getAlbumAsync: jest.fn(),
  addAssetsToAlbumAsync: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

// Mock implementations
const mockShare = Share as jest.Mocked<typeof Share>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;
const mockMediaLibrary = MediaLibrary as jest.Mocked<typeof MediaLibrary>;
const mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>;
const mockCaptureRef = captureRef as jest.MockedFunction<typeof captureRef>;

describe('SharingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockShare.share.mockResolvedValue({ action: Share.sharedAction });
    mockMediaLibrary.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockMediaLibrary.createAssetAsync.mockResolvedValue({ id: 'asset-id' } as any);
    mockMediaLibrary.createAlbumAsync.mockResolvedValue({ id: 'album-id' } as any);
    mockMediaLibrary.getAlbumAsync.mockResolvedValue(null);
    mockClipboard.setStringAsync.mockResolvedValue();
    mockCaptureRef.mockResolvedValue('captured-image-uri');
    mockAlert.alert.mockImplementation();
  });

  describe('shareText', () => {
    it('should share text successfully on iOS', async () => {
      Platform.OS = 'ios';
      
      const result = await sharingService.shareText({
        type: 'poll_invitation',
        title: 'Test Title',
        message: 'Test Message',
        url: 'https://test.com',
      });

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        url: 'https://test.com',
      });
    });

    it('should share text successfully on Android', async () => {
      Platform.OS = 'android';
      
      const result = await sharingService.shareText({
        type: 'poll_invitation',
        title: 'Test Title',
        message: 'Test Message',
        url: 'https://test.com',
      });

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message\n\nhttps://test.com',
      });
    });

    it('should handle share dismissal', async () => {
      mockShare.share.mockResolvedValue({ action: Share.dismissedAction });
      
      const result = await sharingService.shareText({
        type: 'poll_invitation',
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(result.success).toBe(false);
    });

    it('should handle share error', async () => {
      mockShare.share.mockRejectedValue(new Error('Share failed'));
      
      const result = await sharingService.shareText({
        type: 'poll_invitation',
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share failed');
    });
  });

  describe('shareImage', () => {
    it('should share image successfully', async () => {
      const result = await sharingService.shareImage({
        type: 'poll_result',
        title: 'Test Title',
        message: 'Test Message',
        imageUri: 'file://test-image.png',
      });

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        url: 'file://test-image.png',
      });
    });

    it('should handle missing image URI', async () => {
      const result = await sharingService.shareImage({
        type: 'poll_result',
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Image URI is required');
    });
  });

  describe('sharePollInvitation', () => {
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
      total_votes: 0,
      user_voted: false,
    };

    it('should share poll invitation with invite code', async () => {
      const result = await sharingService.sharePollInvitation(
        mockPoll,
        'Test Circle',
        'INVITE123'
      );

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Poll - Circly 투표',
          message: expect.stringContaining('Test Poll'),
          url: 'https://circly.app/invite/INVITE123',
        })
      );
    });

    it('should share poll invitation without invite code', async () => {
      const result = await sharingService.sharePollInvitation(
        mockPoll,
        'Test Circle'
      );

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://circly.app/poll/123',
        })
      );
    });
  });

  describe('sharePollResults', () => {
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

    it('should share poll results successfully', async () => {
      const result = await sharingService.sharePollResults(
        mockPoll,
        'Test Circle',
        'Option A',
        10
      );

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Poll 결과 - Circly',
          message: expect.stringContaining('Option A'),
          url: 'https://circly.app/poll/123/results',
        })
      );
    });
  });

  describe('shareCircleInvitation', () => {
    it('should share circle invitation successfully', async () => {
      const result = await sharingService.shareCircleInvitation(
        'Test Circle',
        5,
        'CIRCLE123'
      );

      expect(result.success).toBe(true);
      expect(mockShare.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Circle 서클 초대 - Circly',
          message: expect.stringContaining('Test Circle'),
          url: 'https://circly.app/join/CIRCLE123',
        })
      );
    });
  });

  describe('captureAndShare', () => {
    const mockViewRef = { current: {} } as any;

    it('should capture and share successfully', async () => {
      const result = await sharingService.captureAndShare(mockViewRef, {
        type: 'poll_result',
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(result.success).toBe(true);
      expect(mockCaptureRef).toHaveBeenCalledWith(mockViewRef.current, {
        format: 'png',
        quality: 1.0,
        width: undefined,
        height: undefined,
      });
      expect(mockShare.share).toHaveBeenCalled();
    });

    it('should handle null view ref', async () => {
      const nullViewRef = { current: null } as any;

      const result = await sharingService.captureAndShare(nullViewRef, {
        type: 'poll_result',
        title: 'Test Title',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('View reference is not available');
    });

    it('should handle capture error', async () => {
      mockCaptureRef.mockRejectedValue(new Error('Capture failed'));

      const result = await sharingService.captureAndShare(mockViewRef, {
        type: 'poll_result',
        title: 'Test Title',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Capture failed');
    });
  });

  describe('saveImageToGallery', () => {
    it('should save image to gallery successfully', async () => {
      const result = await sharingService.saveImageToGallery('file://test.png');

      expect(result).toBe(true);
      expect(mockMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(mockMediaLibrary.createAssetAsync).toHaveBeenCalledWith('file://test.png');
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '저장 완료',
        '이미지가 갤러리에 저장되었습니다.',
        [{ text: '확인' }]
      );
    });

    it('should handle permission denied', async () => {
      mockMediaLibrary.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);

      const result = await sharingService.saveImageToGallery('file://test.png');

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '권한 필요',
        '사진을 저장하려면 갤러리 접근 권한이 필요합니다.',
        [{ text: '확인' }]
      );
    });

    it('should handle save error', async () => {
      mockMediaLibrary.createAssetAsync.mockRejectedValue(new Error('Save failed'));

      const result = await sharingService.saveImageToGallery('file://test.png');

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '저장 실패',
        '이미지 저장 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    });

    it('should create new album when album does not exist', async () => {
      mockMediaLibrary.getAlbumAsync.mockResolvedValue(null);

      await sharingService.saveImageToGallery('file://test.png', 'TestAlbum');

      expect(mockMediaLibrary.createAlbumAsync).toHaveBeenCalledWith(
        'TestAlbum',
        expect.any(Object),
        false
      );
    });

    it('should add to existing album when album exists', async () => {
      mockMediaLibrary.getAlbumAsync.mockResolvedValue({ id: 'existing-album' } as any);

      await sharingService.saveImageToGallery('file://test.png', 'TestAlbum');

      expect(mockMediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalledWith(
        [expect.any(Object)],
        { id: 'existing-album' }
      );
    });
  });

  describe('captureAndSave', () => {
    const mockViewRef = { current: {} } as any;

    it('should capture and save successfully', async () => {
      const result = await sharingService.captureAndSave(mockViewRef, {
        quality: 0.8,
        albumName: 'TestAlbum',
      });

      expect(result).toBe(true);
      expect(mockCaptureRef).toHaveBeenCalledWith(mockViewRef.current, {
        format: 'png',
        quality: 0.8,
        width: undefined,
        height: undefined,
      });
    });

    it('should handle null view ref', async () => {
      const nullViewRef = { current: null } as any;

      const result = await sharingService.captureAndSave(nullViewRef);

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '저장 실패',
        '이미지 캡처 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard successfully', async () => {
      const result = await sharingService.copyToClipboard('Test text', 'Custom success message');

      expect(result).toBe(true);
      expect(mockClipboard.setStringAsync).toHaveBeenCalledWith('Test text');
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '복사 완료',
        'Custom success message',
        [{ text: '확인' }]
      );
    });

    it('should use default success message', async () => {
      const result = await sharingService.copyToClipboard('Test text');

      expect(result).toBe(true);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '복사 완료',
        '텍스트가 클립보드에 복사되었습니다.',
        [{ text: '확인' }]
      );
    });

    it('should handle clipboard error', async () => {
      mockClipboard.setStringAsync.mockRejectedValue(new Error('Clipboard failed'));

      const result = await sharingService.copyToClipboard('Test text');

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        '복사 실패',
        '클립보드 복사 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    });
  });

  describe('generateInviteLink', () => {
    it('should generate circle invite link', () => {
      const link = sharingService.generateInviteLink('circle', 'CIRCLE123');
      expect(link).toBe('https://circly.app/join/CIRCLE123');
    });

    it('should generate poll invite link', () => {
      const link = sharingService.generateInviteLink('poll', 123);
      expect(link).toBe('https://circly.app/poll/123');
    });

    it('should return base URL for unknown type', () => {
      const link = sharingService.generateInviteLink('unknown' as any, 123);
      expect(link).toBe('https://circly.app');
    });
  });

  describe('generateSocialText', () => {
    it('should generate Instagram social text with hashtags', () => {
      const text = sharingService.generateSocialText('instagram', 'Test Title', 'Test Description');
      
      expect(text).toBe('Test Title\n\nTest Description\n\n#Circly #투표 #친구들과함께');
    });

    it('should generate Twitter social text with hashtags', () => {
      const text = sharingService.generateSocialText('twitter', 'Test Title', 'Test Description');
      
      expect(text).toBe('Test Title\n\nTest Description\n\n#Circly #투표');
    });

    it('should generate Facebook social text without hashtags', () => {
      const text = sharingService.generateSocialText('facebook', 'Test Title', 'Test Description');
      
      expect(text).toBe('Test Title\n\nTest Description');
    });

    it('should handle missing description', () => {
      const text = sharingService.generateSocialText('instagram', 'Test Title');
      
      expect(text).toBe('Test Title\n\n#Circly #투표 #친구들과함께');
    });
  });
});