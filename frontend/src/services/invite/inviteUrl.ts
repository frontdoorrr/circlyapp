const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export function buildInviteUrl(
  inviteLinkId: string,
  baseUrl = process.env.EXPO_PUBLIC_INVITE_BASE_URL?.trim()
): string {
  if (baseUrl) {
    return `${baseUrl.replace(/\/+$/, '')}/join/${inviteLinkId}`;
  }
  return `circly://join/${inviteLinkId}`;
}

export function extractInviteLinkId(url: string): string | null {
  const match = url.match(
    new RegExp(`^(?:circly:\\/\\/|https?:\\/\\/[^/]+\\/)join\\/(${UUID_PATTERN})(?:[/?#]|$)`, 'i')
  );
  return match?.[1] ?? null;
}
