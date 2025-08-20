/**
 * 공유 관련 React Hook
 * TRD 07-sharing-system.md의 공유 시스템 요구사항 기반
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { sharingService, ShareResult } from '../services/sharing';
import type { PollResponse } from '../types/poll';

export interface UseSharingReturn {
  // 상태
  isSharing: boolean;
  isSaving: boolean;
  error: string | null;
  
  // 액션
  sharePollInvitation: (poll: PollResponse, circleName: string, inviteCode?: string) => Promise<ShareResult>;
  sharePollResults: (poll: PollResponse, circleName: string, winnerText: string, totalVotes: number) => Promise<ShareResult>;
  shareCircleInvitation: (circleName: string, memberCount: number, inviteCode: string) => Promise<ShareResult>;
  shareText: (title: string, message: string, url?: string) => Promise<ShareResult>;
  shareImage: (imageUri: string, message?: string) => Promise<ShareResult>;
  captureAndShare: (viewRef: React.RefObject<any>, message?: string) => Promise<ShareResult>;
  captureAndSave: (viewRef: React.RefObject<any>, albumName?: string) => Promise<boolean>;
  copyToClipboard: (text: string, successMessage?: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * 공유 기능 Hook
 */
export const useSharing = (): UseSharingReturn => {
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    console.error(defaultMessage, err);
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 투표 초대 공유
  const sharePollInvitation = useCallback(async (
    poll: PollResponse,
    circleName: string,
    inviteCode?: string
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.sharePollInvitation(poll, circleName, inviteCode);
      
      if (result.success) {
        // 성공 알림 (선택적)
        // Alert.alert('공유 완료', '투표 초대가 성공적으로 공유되었습니다.');
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '투표 초대 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 투표 결과 공유
  const sharePollResults = useCallback(async (
    poll: PollResponse,
    circleName: string,
    winnerText: string,
    totalVotes: number
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.sharePollResults(poll, circleName, winnerText, totalVotes);
      
      if (result.success) {
        // 성공 알림 (선택적)
        // Alert.alert('공유 완료', '투표 결과가 성공적으로 공유되었습니다.');
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '투표 결과 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 서클 초대 공유
  const shareCircleInvitation = useCallback(async (
    circleName: string,
    memberCount: number,
    inviteCode: string
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.shareCircleInvitation(circleName, memberCount, inviteCode);
      
      if (result.success) {
        // 성공 알림 (선택적)
        // Alert.alert('공유 완료', '서클 초대가 성공적으로 공유되었습니다.');
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '서클 초대 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 일반 텍스트 공유
  const shareText = useCallback(async (
    title: string,
    message: string,
    url?: string
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.shareText({
        type: 'poll_result', // 기본값
        title,
        message,
        url,
      });
      
      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '텍스트 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 이미지 공유
  const shareImage = useCallback(async (
    imageUri: string,
    message?: string
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.shareImage({
        type: 'poll_result',
        imageUri,
        message,
      });
      
      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '이미지 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 뷰 캡처 후 공유
  const captureAndShare = useCallback(async (
    viewRef: React.RefObject<any>,
    message?: string
  ): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await sharingService.captureAndShare(viewRef, {
        type: 'poll_result',
        message,
        quality: 1.0,
      });
      
      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      handleError(err, '캡처 및 공유 실패');
      return { success: false, error: error || '알 수 없는 오류' };
    } finally {
      setIsSharing(false);
    }
  }, [error, handleError]);

  // 뷰 캡처 후 저장
  const captureAndSave = useCallback(async (
    viewRef: React.RefObject<any>,
    albumName?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await sharingService.captureAndSave(viewRef, {
        quality: 1.0,
        albumName: albumName || 'Circly',
      });
      
      return result;
    } catch (err) {
      handleError(err, '캡처 및 저장 실패');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [handleError]);

  // 클립보드 복사
  const copyToClipboard = useCallback(async (
    text: string,
    successMessage?: string
  ): Promise<boolean> => {
    setError(null);

    try {
      const result = await sharingService.copyToClipboard(text, successMessage);
      return result;
    } catch (err) {
      handleError(err, '클립보드 복사 실패');
      return false;
    }
  }, [handleError]);

  return {
    // 상태
    isSharing,
    isSaving,
    error,
    
    // 액션
    sharePollInvitation,
    sharePollResults,
    shareCircleInvitation,
    shareText,
    shareImage,
    captureAndShare,
    captureAndSave,
    copyToClipboard,
    clearError,
  };
};

/**
 * 투표 관련 공유 Hook
 */
export const usePollSharing = (poll: PollResponse, circleName: string) => {
  const sharing = useSharing();

  const shareInvitation = useCallback(async (inviteCode?: string): Promise<ShareResult> => {
    return sharing.sharePollInvitation(poll, circleName, inviteCode);
  }, [sharing, poll, circleName]);

  const shareResults = useCallback(async (
    winnerText: string,
    totalVotes: number
  ): Promise<ShareResult> => {
    return sharing.sharePollResults(poll, circleName, winnerText, totalVotes);
  }, [sharing, poll, circleName]);

  const shareResultCard = useCallback(async (
    cardRef: React.RefObject<any>
  ): Promise<ShareResult> => {
    const message = `"${poll.title}" 투표 결과 🗳️\n서클: ${circleName}\n\nCircly에서 확인하기 ➡️`;
    return sharing.captureAndShare(cardRef, message);
  }, [sharing, poll, circleName]);

  const saveResultCard = useCallback(async (
    cardRef: React.RefObject<any>
  ): Promise<boolean> => {
    return sharing.captureAndSave(cardRef, 'Circly 투표 결과');
  }, [sharing]);

  return {
    ...sharing,
    shareInvitation,
    shareResults,
    shareResultCard,
    saveResultCard,
  };
};

export default useSharing;