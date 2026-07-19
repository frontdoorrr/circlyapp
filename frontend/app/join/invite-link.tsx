import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { resolveInviteLink } from '../../src/api/circle';
import { Button } from '../../src/components/primitives/Button';
import { Text } from '../../src/components/primitives/Text';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import {
  clearPendingInviteLinkId,
  savePendingInviteLinkId,
} from '../../src/services/invite/pendingInvite';
import { tokens } from '../../src/theme';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import type { ResolveInviteLinkResponse } from '../../src/types/circle';
import { logger } from '../../src/utils/logger';

export default function InviteLinkScreen() {
  const { linkId } = useLocalSearchParams<{ linkId?: string }>();
  const styles = useThemedStyles(createStyles);
  const [invite, setInvite] = useState<ResolveInviteLinkResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!linkId) {
      setError('올바르지 않은 초대 링크예요');
      return;
    }

    let cancelled = false;

    async function loadInvite() {
      try {
        await savePendingInviteLinkId(linkId!);
        const result = await resolveInviteLink(linkId!);
        if (cancelled) return;

        if (!result.valid) {
          await clearPendingInviteLinkId();
          setError(
            result.message?.toLowerCase().includes('full')
              ? '이 Circle은 인원이 가득 찼어요'
              : '사용할 수 없는 초대 링크예요'
          );
          return;
        }

        setInvite(result);
      } catch (loadError) {
        logger.error('[InviteLink] Resolve failed:', loadError);
        if (!cancelled) setError('초대 정보를 불러오지 못했어요');
      }
    }

    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  const handleContinue = () => {
    if (!linkId || !invite) return;
    router.push({
      pathname: '/join/nickname',
      params: {
        inviteLinkId: linkId,
        circleName: invite.circle_name || 'Circle',
        circleId: invite.circle_id || '',
        memberCount: String(invite.member_count ?? 0),
        maxMembers: String(invite.max_members ?? 50),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerShown: true, headerBackTitle: '뒤로' }} />
      {!invite && !error ? (
        <LoadingSpinner />
      ) : error ? (
        <View style={styles.content}>
          <Text style={styles.emoji}>🔗</Text>
          <Text style={styles.title}>초대 링크를 열 수 없어요</Text>
          <Text style={styles.description}>{error}</Text>
          <Button fullWidth onPress={() => router.replace('/join/invite-code')}>
            초대 코드 입력하기
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>{invite?.circle_name}</Text>
          <Text style={styles.description}>친구가 이 Circle에 초대했어요</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              👥 {invite?.member_count ?? 0}/{invite?.max_members ?? 50}명 참여 중
            </Text>
          </View>
          <Button fullWidth onPress={handleContinue}>
            참여하기
          </Button>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.background,
      padding: tokens.spacing.lg,
    },
    content: {
      gap: tokens.spacing.lg,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 64,
      lineHeight: 76,
    },
    title: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center',
    },
    description: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    infoCard: {
      width: '100%',
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.lg,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    infoText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.text,
      textAlign: 'center',
    },
  });
