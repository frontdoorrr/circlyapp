import type { MemberRole } from '../types/circle';

export type CircleRoundAction = 'INVITE' | 'CREATE' | 'WAIT' | 'VOTE';

interface CircleRoundState {
  activePollCount: number;
  memberCount: number;
  role?: MemberRole;
}

export function getCircleRoundAction({
  activePollCount,
  memberCount,
  role,
}: CircleRoundState): CircleRoundAction {
  if (activePollCount > 0) return 'VOTE';
  if (memberCount < 5) return 'INVITE';
  if (role === 'OWNER' || role === 'ADMIN') return 'CREATE';
  return 'WAIT';
}
