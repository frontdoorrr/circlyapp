import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearPendingInviteLinkId,
  getPendingInviteLinkId,
  savePendingInviteLinkId,
} from '../pendingInvite';

describe('pendingInvite', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('로그인 전에 받은 영구 초대 링크 ID를 보존한다', async () => {
    await savePendingInviteLinkId('11111111-1111-4111-8111-111111111111');

    await expect(getPendingInviteLinkId()).resolves.toBe(
      '11111111-1111-4111-8111-111111111111'
    );
  });

  it('Circle 참여가 끝나면 대기 중인 링크 ID를 제거한다', async () => {
    await savePendingInviteLinkId('22222222-2222-4222-8222-222222222222');
    await clearPendingInviteLinkId();

    await expect(getPendingInviteLinkId()).resolves.toBeNull();
  });
});
