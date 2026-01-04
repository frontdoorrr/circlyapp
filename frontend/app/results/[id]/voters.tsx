import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { tokens } from '../../../src/theme';
import { useMyVoters } from '../../../src/hooks/usePolls';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Orb Mode - 투표자 공개 화면
 *
 * 나를 선택한 사람들의 목록을 순차적으로 공개합니다.
 */
export default function VotersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useMyVoters(id, true);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표자 보기',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
          <Text style={styles.loadingText}>투표자를 불러오는 중...</Text>
        </View>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표자 보기',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😢</Text>
          <Text style={styles.errorText}>투표자를 불러올 수 없습니다</Text>
        </View>
      </>
    );
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '투표자 보기',
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
            <Text style={styles.headerTitle}>나를 선택한 사람들</Text>
            <Text style={styles.headerQuestion}>{data.question_text}</Text>
            <Text style={styles.headerCount}>
              총 {data.voters.length}명이 선택했어요
            </Text>
          </View>

          {/* 투표자 리스트 */}
          {data.voters.length > 0 ? (
            <View style={styles.votersList}>
              {data.voters.map((voter, index) => (
                <Animated.View
                  key={voter.user_id}
                  entering={FadeInDown.delay(index * 150).duration(400)}
                  style={styles.voterCard}
                >
                  <Text style={styles.voterEmoji}>{voter.profile_emoji}</Text>
                  <View style={styles.voterInfo}>
                    <Text style={styles.voterName}>
                      {voter.nickname || '익명'}
                    </Text>
                    <Text style={styles.voterTime}>
                      {formatTime(voter.voted_at)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
    gap: tokens.spacing.md,
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
    gap: tokens.spacing.md,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[600],
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
    borderBottomColor: tokens.colors.neutral[200],
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.md,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing.sm,
  },
  headerQuestion: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[700],
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  headerCount: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
  },
  votersList: {
    gap: tokens.spacing.md,
  },
  voterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
    shadowColor: tokens.colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: tokens.spacing.md,
  },
  voterEmoji: {
    fontSize: 40,
  },
  voterInfo: {
    flex: 1,
  },
  voterName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: 2,
  },
  voterTime: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.md,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[500],
  },
});
