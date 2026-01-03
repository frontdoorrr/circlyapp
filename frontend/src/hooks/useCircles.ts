/**
 * Circle Hooks (React Query)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as circleApi from '../api/circle';
import { CircleCreate, JoinByCodeRequest, ValidateInviteCodeResponse } from '../types/circle';

/**
 * 내 Circle 목록 조회
 */
export function useMyCircles() {
  return useQuery({
    queryKey: ['circles', 'my'],
    queryFn: circleApi.getMyCircles,
    staleTime: 2 * 60 * 1000, // 2분
  });
}

/**
 * Circle 상세 조회
 */
export function useCircleDetail(circleId: string) {
  return useQuery({
    queryKey: ['circles', circleId],
    queryFn: () => circleApi.getCircleDetail(circleId),
    enabled: !!circleId,
    staleTime: 1 * 60 * 1000, // 1분
  });
}

/**
 * Circle 생성
 */
export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CircleCreate) => circleApi.createCircle(data),
    onSuccess: () => {
      // Circle 목록 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
    },
  });
}

/**
 * 초대 코드 검증
 */
export function useValidateInviteCode() {
  return useMutation({
    mutationFn: (code: string) => circleApi.validateInviteCode(code),
  });
}

/**
 * Circle 참여 (초대 코드)
 */
export function useJoinCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinByCodeRequest) => circleApi.joinCircleByCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });
}

/**
 * Circle 나가기
 */
export function useLeaveCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) => circleApi.leaveCircle(circleId),
    onSuccess: (_, circleId) => {
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
      queryClient.removeQueries({ queryKey: ['circles', circleId] });
    },
  });
}

/**
 * Circle 멤버 조회
 */
export function useCircleMembers(circleId: string) {
  return useQuery({
    queryKey: ['circles', circleId, 'members'],
    queryFn: () => circleApi.getCircleMembers(circleId),
    enabled: !!circleId,
    staleTime: 1 * 60 * 1000, // 1분
  });
}

/**
 * 초대 코드 재생성
 */
export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) => circleApi.regenerateInviteCode(circleId),
    onSuccess: (_, circleId) => {
      // Circle 상세 정보 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ['circles', circleId] });
    },
  });
}
