import { buildInviteUrl, extractInviteLinkId } from '../inviteUrl';

const linkId = '11111111-1111-4111-8111-111111111111';

describe('inviteUrl', () => {
  it('검증된 HTTPS base URL이 없으면 앱 스킴 링크를 만든다', () => {
    expect(buildInviteUrl(linkId, '')).toBe(`circly://join/${linkId}`);
  });

  it('설정된 HTTPS base URL로 영구 초대 링크를 만든다', () => {
    expect(buildInviteUrl(linkId, 'https://circly.example/')).toBe(
      `https://circly.example/join/${linkId}`
    );
  });

  it.each([
    `circly://join/${linkId}`,
    `https://circly.app/join/${linkId}`,
  ])('앱 스킴과 Universal Link에서 링크 ID를 추출한다: %s', (url) => {
    expect(extractInviteLinkId(url)).toBe(linkId);
  });

  it('6자리 코드 링크는 영구 링크 ID로 오인하지 않는다', () => {
    expect(extractInviteLinkId('circly://join?code=ABC123')).toBeNull();
  });
});
