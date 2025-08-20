/**
 * 공유 서비스
 * TRD 07-sharing-system.md의 공유 시스템 요구사항 기반
 */

import { Share, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import type { PollResponse } from '../types/poll';

export interface ShareOptions {
  type: 'poll_invitation' | 'poll_result' | 'circle_invitation';
  title?: string;
  message?: string;
  url?: string;
  imageUri?: string;
}

export interface ShareResult {
  success: boolean;
  platform?: string;
  error?: string;
}

class SharingService {
  /**
   * 일반 텍스트/링크 공유
   */
  async shareText(options: ShareOptions): Promise<ShareResult> {
    try {
      const shareData: any = {
        title: options.title || 'Circly',
        message: options.message || '',
      };

      if (options.url) {
        if (Platform.OS === 'ios') {
          shareData.url = options.url;
        } else {
          shareData.message = `${shareData.message}\n\n${options.url}`;
        }
      }

      const result = await Share.share(shareData);

      if (result.action === Share.sharedAction) {
        return {
          success: true,
          platform: result.activityType || 'unknown',
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Failed to share text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 이미지와 함께 공유
   */
  async shareImage(options: ShareOptions): Promise<ShareResult> {
    try {
      if (!options.imageUri) {
        throw new Error('Image URI is required');
      }

      const shareData: any = {
        title: options.title || 'Circly',
        message: options.message || '',
      };

      if (Platform.OS === 'ios') {
        shareData.url = options.imageUri;
      } else {
        shareData.url = options.imageUri;
      }

      const result = await Share.share(shareData);

      if (result.action === Share.sharedAction) {
        return {
          success: true,
          platform: result.activityType || 'unknown',
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Failed to share image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 투표 초대 공유
   */
  async sharePollInvitation(
    poll: PollResponse,
    circleName: string,
    inviteCode?: string
  ): Promise<ShareResult> {
    const message = `🗳️ "${poll.title}" 투표에 초대되었습니다!

서클: ${circleName}
${poll.description ? `내용: ${poll.description}` : ''}

지금 참여하고 친구들의 의견을 확인해보세요!

${inviteCode ? `초대 코드: ${inviteCode}` : ''}

Circly에서 확인하기 ➡️`;

    const shareUrl = inviteCode 
      ? `https://circly.app/invite/${inviteCode}`
      : `https://circly.app/poll/${poll.id}`;

    return this.shareText({
      type: 'poll_invitation',
      title: `${poll.title} - Circly 투표`,
      message,
      url: shareUrl,
    });
  }

  /**
   * 투표 결과 공유 (텍스트만)
   */
  async sharePollResults(
    poll: PollResponse,
    circleName: string,
    winnerText: string,
    totalVotes: number
  ): Promise<ShareResult> {
    const message = `📊 "${poll.title}" 투표 결과 발표!

🏆 1위: ${winnerText}
👥 총 참여자: ${totalVotes}명
📍 서클: ${circleName}

더 많은 재미있는 투표를 만나보세요!

Circly에서 확인하기 ➡️`;

    return this.shareText({
      type: 'poll_result',
      title: `${poll.title} 결과 - Circly`,
      message,
      url: `https://circly.app/poll/${poll.id}/results`,
    });
  }

  /**
   * 서클 초대 공유
   */
  async shareCircleInvitation(
    circleName: string,
    memberCount: number,
    inviteCode: string
  ): Promise<ShareResult> {
    const message = `🎉 "${circleName}" 서클에 초대되었습니다!

현재 멤버: ${memberCount}명
초대 코드: ${inviteCode}

익명 투표로 친구들과 재미있는 소통을 시작해보세요!

Circly에서 참여하기 ➡️`;

    return this.shareText({
      type: 'circle_invitation',
      title: `${circleName} 서클 초대 - Circly`,
      message,
      url: `https://circly.app/join/${inviteCode}`,
    });
  }

  /**
   * 뷰 캡처 및 공유
   */
  async captureAndShare(
    viewRef: React.RefObject<any>,
    options: Omit<ShareOptions, 'imageUri'> & {
      filename?: string;
      quality?: number;
      width?: number;
      height?: number;
    }
  ): Promise<ShareResult> {
    try {
      if (!viewRef.current) {
        throw new Error('View reference is not available');
      }

      const uri = await captureRef(viewRef.current, {
        format: 'png',
        quality: options.quality || 1.0,
        width: options.width,
        height: options.height,
      });

      return this.shareImage({
        ...options,
        imageUri: uri,
      });
    } catch (error) {
      console.error('Failed to capture and share view:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Capture failed',
      };
    }
  }

  /**
   * 이미지를 갤러리에 저장
   */
  async saveImageToGallery(
    imageUri: string,
    albumName: string = 'Circly'
  ): Promise<boolean> {
    try {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '사진을 저장하려면 갤러리 접근 권한이 필요합니다.',
          [{ text: '확인' }]
        );
        return false;
      }

      // 이미지 저장
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      
      // 앨범에 추가
      try {
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album);
        } else {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        }
      } catch (albumError) {
        console.log('Album operation failed, but image was saved:', albumError);
      }

      Alert.alert(
        '저장 완료',
        '이미지가 갤러리에 저장되었습니다.',
        [{ text: '확인' }]
      );

      return true;
    } catch (error) {
      console.error('Failed to save image to gallery:', error);
      Alert.alert(
        '저장 실패',
        '이미지 저장 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
      return false;
    }
  }

  /**
   * 뷰 캡처 후 갤러리 저장
   */
  async captureAndSave(
    viewRef: React.RefObject<any>,
    options: {
      filename?: string;
      quality?: number;
      width?: number;
      height?: number;
      albumName?: string;
    } = {}
  ): Promise<boolean> {
    try {
      if (!viewRef.current) {
        throw new Error('View reference is not available');
      }

      const uri = await captureRef(viewRef.current, {
        format: 'png',
        quality: options.quality || 1.0,
        width: options.width,
        height: options.height,
      });

      return this.saveImageToGallery(uri, options.albumName);
    } catch (error) {
      console.error('Failed to capture and save view:', error);
      Alert.alert(
        '저장 실패',
        '이미지 캡처 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
      return false;
    }
  }

  /**
   * 텍스트를 클립보드에 복사
   */
  async copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(text);
      
      Alert.alert(
        '복사 완료',
        successMessage || '텍스트가 클립보드에 복사되었습니다.',
        [{ text: '확인' }]
      );

      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert(
        '복사 실패',
        '클립보드 복사 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
      return false;
    }
  }

  /**
   * 초대 링크 생성
   */
  generateInviteLink(type: 'circle' | 'poll', id: number | string): string {
    const baseUrl = 'https://circly.app';
    
    switch (type) {
      case 'circle':
        return `${baseUrl}/join/${id}`;
      case 'poll':
        return `${baseUrl}/poll/${id}`;
      default:
        return baseUrl;
    }
  }

  /**
   * 소셜 미디어 전용 텍스트 생성
   */
  generateSocialText(
    type: 'instagram' | 'twitter' | 'facebook',
    title: string,
    description?: string
  ): string {
    const baseText = `${title}${description ? `\n\n${description}` : ''}`;
    
    switch (type) {
      case 'instagram':
        return `${baseText}\n\n#Circly #투표 #친구들과함께`;
      case 'twitter':
        return `${baseText}\n\n#Circly #투표`;
      case 'facebook':
        return baseText;
      default:
        return baseText;
    }
  }
}

// 싱글톤 인스턴스
export const sharingService = new SharingService();

// 기본 export
export default sharingService;