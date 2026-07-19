import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_LINK_KEY = '@circly:pending_invite_link_id';

export async function savePendingInviteLinkId(inviteLinkId: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_INVITE_LINK_KEY, inviteLinkId);
}

export async function getPendingInviteLinkId(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_INVITE_LINK_KEY);
}

export async function clearPendingInviteLinkId(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_INVITE_LINK_KEY);
}
