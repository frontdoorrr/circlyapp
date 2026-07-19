import { getCircleRoundAction } from '../circleRound';

describe('getCircleRoundAction', () => {
  it('활성 Poll이 있으면 역할과 무관하게 투표 상태다', () => {
    expect(
      getCircleRoundAction({ activePollCount: 5, memberCount: 5, role: 'MEMBER' })
    ).toBe('VOTE');
  });

  it('5명 미만이면 OWNER도 초대 상태다', () => {
    expect(
      getCircleRoundAction({ activePollCount: 0, memberCount: 4, role: 'OWNER' })
    ).toBe('INVITE');
  });

  it.each(['OWNER', 'ADMIN'] as const)('%s는 5명부터 라운드를 열 수 있다', (role) => {
    expect(getCircleRoundAction({ activePollCount: 0, memberCount: 5, role })).toBe(
      'CREATE'
    );
  });

  it('일반 멤버는 관리자 라운드를 기다린다', () => {
    expect(
      getCircleRoundAction({ activePollCount: 0, memberCount: 5, role: 'MEMBER' })
    ).toBe('WAIT');
  });
});
