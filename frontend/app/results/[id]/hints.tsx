import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { tokens } from '../../../src/theme';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import type { Theme } from '../../../src/theme/tokens';
import { useMyVoteHints } from '../../../src/hooks/usePolls';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { VoteHintTier } from '../../../src/types/poll';

/**
 * Orb Mode - 안전 힌트 화면
 *
 * 받은 하트의 단계형 안전 힌트를 순차적으로 표시합니다.
 */
export default function HintsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data, isLoading, error } = useMyVoteHints(id, true);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '힌트 보기',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
          <Text style={styles.loadingText}>힌트를 불러오는 중...</Text>
        </View>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '힌트 보기',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😢</Text>
          <Text style={styles.errorText}>힌트를 불러올 수 없습니다</Text>
        </View>
      </>
    );
  }

  const receivedCount = new Set(data.hints.map((hint) => hint.vote_id)).size;
  const formatHintTier = (tier: VoteHintTier): string => {
    switch (tier) {
      case 'CIRCLE':
        return 'Circle 힌트';
      case 'TIME':
        return '시간대 힌트';
      case 'INITIAL':
        return '이니셜 힌트';
      case 'FULL':
        return '고급 안전 힌트';
      default:
        return '안전 힌트';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '힌트 보기',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🔮</Text>
            <Text style={styles.headerTitle}>받은 하트 안전 힌트</Text>
            <Text style={styles.headerQuestion}>{data.question_text}</Text>
            <Text style={styles.headerCount}>
              이 질문에서 {receivedCount}개의 하트를 받았어요
            </Text>
          </View>

          {/* 힌트 리스트 */}
          {data.hints.length > 0 ? (
            <View style={styles.hintsList}>
              {data.hints.map((hint, index) => (
                <Animated.View
                  key={`${hint.vote_id}-${hint.tier}`}
                  entering={FadeInDown.delay(index * 150).duration(400)}
                  style={styles.hintCard}
                >
                  <Text style={styles.hintEmoji}>{hint.unlocked ? '✨' : '🔒'}</Text>
                  <View style={styles.hintInfo}>
                    <Text style={styles.hintText}>
                      {hint.text}
                    </Text>
                    <Text style={styles.hintTier}>
                      {hint.unlocked ? formatHintTier(hint.tier) : 'Orb Mode 안전 힌트'}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🤔</Text>
              <Text style={styles.emptyText}>
                아직 아무도 선택하지 않았어요
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      gap: tokens.spacing.md,
    },
    loadingText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textTertiary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      gap: tokens.spacing.md,
    },
    errorEmoji: {
      fontSize: 64,
      lineHeight: 76,
      textAlign: 'center',
    },
    errorText: {
      fontSize: tokens.typography.fontSize.lg,
      color: theme.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: tokens.spacing.xl,
      paddingBottom: tokens.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerEmoji: {
      fontSize: 64,
      lineHeight: 76,
      marginBottom: tokens.spacing.md,
      textAlign: 'center',
    },
    headerTitle: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.primary[isDark ? 400 : 600],
      marginBottom: tokens.spacing.sm,
    },
    headerQuestion: {
      fontSize: tokens.typography.fontSize.lg,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: tokens.spacing.sm,
    },
    headerCount: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textTertiary,
    },
    hintsList: {
      gap: tokens.spacing.md,
    },
    hintCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.lg,
      gap: tokens.spacing.md,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : {
            shadowColor: tokens.colors.neutral[900],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    hintEmoji: {
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'center',
    },
    hintInfo: {
      flex: 1,
    },
    hintText: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    hintTier: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textTertiary,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: tokens.spacing['2xl'],
    },
    emptyEmoji: {
      fontSize: 64,
      lineHeight: 76,
      marginBottom: tokens.spacing.md,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: tokens.typography.fontSize.lg,
      color: theme.textTertiary,
    },
  });
