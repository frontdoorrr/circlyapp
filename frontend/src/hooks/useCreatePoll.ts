import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import type { PollDuration } from '../stores/pollCreate';

/**
 * 투표 생성 API 연동 훅
 *
 * POST /polls/circles/{circleId} 엔드포인트를 호출하여
 * 새로운 투표를 생성합니다.
 */

interface CreatePollRequest {
  template_id: string;
  duration_hours: number;
  circle_id: string;
}

interface CreatePollResponse {
  success: boolean;
  data: {
    id: string;
    template_id: string;
    circle_id: string;
    status: string;
    created_at: string;
    ends_at: string;
  };
}

const durationToHours: Record<PollDuration, number> = {
  '1H': 1,
  '3H': 3,
  '6H': 6,
  '24H': 24,
};

export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      duration,
      circleId,
    }: {
      templateId: string;
      duration: PollDuration;
      circleId: string;
    }) => {
      const request: CreatePollRequest = {
        template_id: templateId,
        duration_hours: durationToHours[duration],
        circle_id: circleId,
      };

      const response = await apiClient.post<CreatePollResponse>(
        `/polls/circles/${circleId}`,
        request
      );

      return response.data;
    },

    onSuccess: async (data) => {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Invalidate polls query to refresh home screen
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['circles', data.data.circle_id] });

      // Navigate to success screen
      router.push('/create/success');
    },

    onError: async (error: any) => {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      console.error('Failed to create poll:', error);

      // TODO: Show error toast/alert to user
      // const message = error.response?.data?.error?.message || '투표 생성에 실패했습니다';
    },
  });
};
