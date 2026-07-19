import type { MemberRole } from '../types/circle';

export type HomeStateKind =
  | 'no-circle'
  | 'needs-members'
  | 'can-open-round'
  | 'ready'
  | 'candidate-shortage'
  | 'cooldown'
  | 'empty';

export type HomeState =
  | { kind: 'no-circle' | 'cooldown' }
  | {
      kind: Exclude<HomeStateKind, 'no-circle' | 'cooldown'>;
      circleId: string;
    };

interface HomeCircleState {
  id: string;
  memberCount: number;
  activePollCount: number;
  role: MemberRole;
}

interface HomeStateInput {
  circles: readonly HomeCircleState[];
  pendingPollCircleIds: readonly string[];
  canStartSession: boolean;
  isCoolingDown: boolean;
}

export function getHomeState({
  circles,
  pendingPollCircleIds,
  canStartSession,
  isCoolingDown,
}: HomeStateInput): HomeState {
  if (circles.length === 0) return { kind: 'no-circle' };

  const pendingCircles = circles.filter((circle) =>
    pendingPollCircleIds.includes(circle.id)
  );
  if (canStartSession && pendingCircles.length > 0) {
    const readyCircle = pendingCircles.find((circle) => circle.memberCount >= 5);
    if (readyCircle) return { kind: 'ready', circleId: readyCircle.id };
    return { kind: 'candidate-shortage', circleId: pendingCircles[0].id };
  }

  if (isCoolingDown) return { kind: 'cooldown' };

  const creatableCircle = circles.find(
    (circle) =>
      circle.activePollCount === 0 &&
      circle.memberCount >= 5 &&
      (circle.role === 'OWNER' || circle.role === 'ADMIN')
  );
  if (creatableCircle) {
    return { kind: 'can-open-round', circleId: creatableCircle.id };
  }

  const smallCircle = circles.find(
    (circle) => circle.activePollCount === 0 && circle.memberCount < 5
  );
  if (smallCircle) {
    return { kind: 'needs-members', circleId: smallCircle.id };
  }

  const answeredCircle = circles.find((circle) => circle.activePollCount > 0);
  return { kind: 'empty', circleId: (answeredCircle ?? circles[0]).id };
}
