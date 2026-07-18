import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { ResultCard } from '../share/ResultCard';
import { EmptyState } from '../states';
import { tokens } from '../../theme';
import { useThemedStyles } from '../../theme/ThemeContext';
import type { Theme } from '../../theme/tokens';
import type { PollDetailResponse } from '../../types/poll';
import { useToast } from '../../providers/ToastProvider';
import { logger } from '../../utils/logger';

interface ResultsViewProps {
  poll: PollDetailResponse;
  isOrbMode: boolean;
  onOpenOrbMode: () => void;
  currentUserId?: string;
}

const TOP_RESULTS_COUNT = 3;

export function ResultsView({ poll, isOrbMode, onOpenOrbMode, currentUserId }: ResultsViewProps) {
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const viewShotRef = useRef<View | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showToast('이 기기에서는 공유 기능을 사용할 수 없어요', 'error');
        return;
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 0.9,
        result: 'tmpfile',
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: '투표 결과 공유하기',
        UTI: 'public.png',
      });
    } catch (error) {
      logger.error('Share error:', error);
      showToast('공유 중 문제가 발생했어요. 다시 시도해주세요', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const getBarWidth = (percentage: number) => `${percentage}%` as const;

  // 정서 안전을 위해 전체 순위 대신 TOP 3만 공개하고, 내 득표는 개인화해서 보여준다.
  const topResults = (poll.results ?? []).slice(0, TOP_RESULTS_COUNT);
  const othersCount = (poll.results ?? []).length - topResults.length;
  const myResult = currentUserId
    ? poll.results?.find((result) => result.user_id === currentUserId)
    : undefined;

  if (!poll.results || poll.results.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          variant="no-results"
          title="아직 결과가 없어요"
          description="투표에 참여하면 결과를 볼 수 있어요"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
      <View style={styles.shareableContent}>
          <View style={styles.header}>
            <Text style={styles.emoji}>{poll.emoji || '🗳️'}</Text>
            <Text style={styles.question}>{poll.question_text}</Text>
            <Text style={styles.stats}>총 {poll.vote_count}명 참여</Text>
          </View>

          <View style={styles.resultsList}>
            {topResults.map((result, index) => (
              <View key={result.user_id} style={styles.resultItem}>
                <View style={styles.rank}>
                  {index === 0 && <Text style={styles.rankEmoji}>👑</Text>}
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>

                <View style={styles.resultInfo}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultName}>{result.nickname || '익명'}</Text>
                    <Text style={styles.resultVotes}>
                      {result.vote_count}표 ({result.vote_percentage}%)
                    </Text>
                  </View>

                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: getBarWidth(result.vote_percentage),
                          backgroundColor:
                            index === 0
                              ? tokens.colors.primary[500]
                              : tokens.colors.primary[300],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {othersCount > 0 && (
            <Text style={styles.othersText}>
              그 외 {othersCount}명의 친구들도 하트를 받았어요 💖
            </Text>
          )}

          <View style={styles.branding}>
            <Text style={styles.brandingText}>🗳️ Circly</Text>
          </View>
      </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>⏰ 투표가 종료되었어요</Text>
          <Text style={styles.infoSubtext}>결과를 친구들과 공유해보세요!</Text>
        </View>

        {myResult && myResult.vote_count > 0 && (
          <View style={styles.myResultCard}>
            <Text style={styles.myResultTitle}>
              💖 너는 {myResult.vote_count}표를 받았어
            </Text>
            <Text style={styles.myResultSubtext}>
              누가 보냈는지 힌트로 확인해보세요
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.orbModeButton,
            !isOrbMode && styles.orbModeButtonDisabled,
          ]}
          onPress={onOpenOrbMode}
        >
          <View style={styles.orbModeContent}>
            <Text style={styles.orbModeIcon}>
              {isOrbMode ? '🔮' : '🔒'}
            </Text>
            <View style={styles.orbModeTextContainer}>
              <Text
                style={[
                  styles.orbModeTitle,
                  !isOrbMode && styles.orbModeTitleDisabled,
                ]}
              >
                받은 하트 힌트 보기
              </Text>
              <Text
                style={[
                  styles.orbModeSubtitle,
                  !isOrbMode && styles.orbModeSubtitleDisabled,
                ]}
              >
                {isOrbMode ? '안전한 단계형 힌트를 확인해보세요' : 'Orb Mode 안전 힌트'}
              </Text>
            </View>
            <Text style={styles.orbModeArrow}>→</Text>
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.actionButton,
            styles.shareButton,
            isSharing && styles.shareButtonDisabled,
          ]}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? '📤 공유 준비 중...' : '📤 결과 공유하기'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hiddenCard}>
        <ResultCard poll={poll} cardRef={viewShotRef} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
      paddingBottom: 140,
    },
    shareableContent: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.xl,
      padding: tokens.spacing.lg,
      marginBottom: tokens.spacing.lg,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : {
            shadowColor: tokens.colors.neutral[900],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }),
    },
    header: {
      alignItems: 'center',
      marginBottom: tokens.spacing.xl,
    },
    emoji: {
      fontSize: 64,
      lineHeight: 76,
      marginBottom: tokens.spacing.md,
      textAlign: 'center',
    },
    question: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      textAlign: 'center',
      marginBottom: tokens.spacing.sm,
    },
    stats: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textTertiary,
    },
    resultsList: {
      gap: tokens.spacing.lg,
    },
    resultItem: {
      flexDirection: 'row',
      gap: tokens.spacing.md,
    },
    rank: {
      width: 48,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    rankEmoji: {
      fontSize: 24,
      marginBottom: 4,
    },
    rankNumber: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.textTertiary,
    },
    resultInfo: {
      flex: 1,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing.sm,
    },
    resultName: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    resultVotes: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    barContainer: {
      height: 12,
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[200],
      borderRadius: tokens.borderRadius.full,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: tokens.borderRadius.full,
    },
    othersText: {
      marginTop: tokens.spacing.lg,
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textTertiary,
      textAlign: 'center',
    },
    myResultCard: {
      marginTop: tokens.spacing.lg,
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.lg,
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : tokens.colors.primary[50],
      borderWidth: 1,
      borderColor: isDark ? tokens.colors.primary[700] : tokens.colors.primary[200],
      alignItems: 'center',
    },
    myResultTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.primary[isDark ? 300 : 700],
      marginBottom: tokens.spacing.xs,
    },
    myResultSubtext: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    branding: {
      alignItems: 'center',
      marginTop: tokens.spacing.xl,
      paddingTop: tokens.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    brandingText: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.medium,
      color: theme.textTertiary,
    },
    infoCard: {
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : tokens.colors.primary[50],
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.lg,
      marginTop: tokens.spacing.xl,
      alignItems: 'center',
      ...(isDark && { borderWidth: 1, borderColor: tokens.colors.primary[800] }),
    },
    infoText: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 300 : 700],
      marginBottom: tokens.spacing.xs,
    },
    infoSubtext: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: tokens.spacing.lg,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: tokens.spacing.sm,
    },
    actionButton: {
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.borderRadius.lg,
      alignItems: 'center',
    },
    shareButton: {
      backgroundColor: tokens.colors.primary[500],
    },
    shareButtonDisabled: {
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[300],
    },
    shareButtonText: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.white,
    },
    hiddenCard: {
      position: 'absolute',
      left: -10000,
      top: 0,
    },
    orbModeButton: {
      marginTop: tokens.spacing.lg,
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      borderWidth: 2,
      borderColor: tokens.colors.primary[isDark ? 500 : 400],
      padding: tokens.spacing.lg,
    },
    orbModeButtonDisabled: {
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
    },
    orbModeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.md,
    },
    orbModeIcon: {
      fontSize: 32,
      lineHeight: 40,
      textAlign: 'center',
    },
    orbModeTextContainer: {
      flex: 1,
    },
    orbModeTitle: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 400 : 700],
      marginBottom: 2,
    },
    orbModeTitleDisabled: {
      color: theme.textTertiary,
    },
    orbModeSubtitle: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 500],
    },
    orbModeSubtitleDisabled: {
      color: theme.textTertiary,
    },
    orbModeArrow: {
      fontSize: tokens.typography.fontSize.xl,
      color: tokens.colors.primary[isDark ? 400 : 400],
    },
  });
