import { getHomeState } from '../homeState';

const ownerCircle = {
  id: 'owner-circle',
  memberCount: 5,
  activePollCount: 0,
  role: 'OWNER' as const,
};

describe('getHomeState', () => {
  it('Circle이 없으면 신규 참여 상태다', () => {
    expect(
      getHomeState({ circles: [], pendingPollCircleIds: [], canStartSession: false, isCoolingDown: false })
    ).toEqual({ kind: 'no-circle' });
  });

  it('답할 Poll이 있으면 가장 먼저 투표를 안내한다', () => {
    expect(
      getHomeState({
        circles: [{ ...ownerCircle, activePollCount: 5 }],
        pendingPollCircleIds: ['owner-circle'],
        canStartSession: true,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'ready', circleId: 'owner-circle' });
  });

  it('활성 Poll이 있지만 현재 멤버가 부족하면 후보 초대를 안내한다', () => {
    expect(
      getHomeState({
        circles: [{ ...ownerCircle, memberCount: 4, activePollCount: 5 }],
        pendingPollCircleIds: ['owner-circle'],
        canStartSession: true,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'candidate-shortage', circleId: 'owner-circle' });
  });

  it('후보가 부족한 Circle보다 바로 투표 가능한 Circle을 우선한다', () => {
    expect(
      getHomeState({
        circles: [
          { ...ownerCircle, id: 'shortage', memberCount: 4, activePollCount: 5 },
          { ...ownerCircle, id: 'ready', activePollCount: 5 },
        ],
        pendingPollCircleIds: ['shortage', 'ready'],
        canStartSession: true,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'ready', circleId: 'ready' });
  });

  it('OWNER와 ADMIN은 5명부터 라운드를 열 수 있다', () => {
    for (const role of ['OWNER', 'ADMIN'] as const) {
      expect(
        getHomeState({
          circles: [{ ...ownerCircle, role }],
          pendingPollCircleIds: [],
          canStartSession: false,
          isCoolingDown: false,
        })
      ).toEqual({ kind: 'can-open-round', circleId: 'owner-circle' });
    }
  });

  it('여러 Circle 중 바로 라운드를 열 수 있는 Circle을 우선한다', () => {
    expect(
      getHomeState({
        circles: [
          { ...ownerCircle, id: 'small', memberCount: 3 },
          ownerCircle,
        ],
        pendingPollCircleIds: [],
        canStartSession: false,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'can-open-round', circleId: 'owner-circle' });
  });

  it('5명 미만 Circle은 역할과 무관하게 친구 초대를 안내한다', () => {
    expect(
      getHomeState({
        circles: [{ ...ownerCircle, memberCount: 3, role: 'MEMBER' }],
        pendingPollCircleIds: [],
        canStartSession: false,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'needs-members', circleId: 'owner-circle' });
  });

  it('일반 멤버는 관리자가 라운드를 열 때까지 대기한다', () => {
    expect(
      getHomeState({
        circles: [{ ...ownerCircle, role: 'MEMBER' }],
        pendingPollCircleIds: [],
        canStartSession: false,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'empty', circleId: 'owner-circle' });
  });

  it('모두 답한 활성 라운드가 있으면 받은 하트 상태에 사용할 Circle을 고른다', () => {
    expect(
      getHomeState({
        circles: [
          { ...ownerCircle, id: 'waiting', role: 'MEMBER' },
          { ...ownerCircle, id: 'answered', activePollCount: 5, role: 'MEMBER' },
        ],
        pendingPollCircleIds: [],
        canStartSession: true,
        isCoolingDown: false,
      })
    ).toEqual({ kind: 'empty', circleId: 'answered' });
  });

  it('서버 쿨다운 중이면 새로운 행동보다 쿨다운을 안내한다', () => {
    expect(
      getHomeState({
        circles: [ownerCircle],
        pendingPollCircleIds: [],
        canStartSession: false,
        isCoolingDown: true,
      })
    ).toEqual({ kind: 'cooldown' });
  });
});
