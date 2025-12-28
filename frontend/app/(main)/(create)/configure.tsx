import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { tokens } from '../../../src/theme';

/**
 * 투표 옵션 설정 화면
 *
 * 투표 마감 시간과 기타 옵션을 설정합니다.
 * - 마감 시간 선택 (1H, 3H, 6H, 24H)
 * - 익명 투표 여부
 * - 투표 생성 완료 시 success 화면으로 이동
 */
export default function ConfigureScreen() {
  const { circleId, templateId } = useLocalSearchParams<{
    circleId: string;
    templateId: string;
  }>();

  const [duration, setDuration] = useState<'1H' | '3H' | '6H' | '24H'>('24H');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const durations = [
    { value: '1H' as const, label: '1시간', emoji: '⚡' },
    { value: '3H' as const, label: '3시간', emoji: '🔥' },
    { value: '6H' as const, label: '6시간', emoji: '⏰' },
    { value: '24H' as const, label: '24시간', emoji: '📅' },
  ];

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      // TODO: API 호출하여 투표 생성
      // const response = await createPoll({
      //   circleId,
      //   templateId,
      //   duration,
      //   isAnonymous,
      // });

      // 임시로 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 생성 완료 화면으로 이동
      router.push({
        pathname: '/(main)/(create)/success',
        params: {
          pollId: 'temp-poll-id', // TODO: 실제 생성된 poll ID
        },
      });
    } catch (error) {
      console.error('Failed to create poll:', error);
      // TODO: 에러 처리
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '투표 설정',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>투표 옵션을 설정해주세요</Text>
          <Text style={styles.description}>
            투표가 언제까지 진행될지 선택해주세요
          </Text>

          {/* 마감 시간 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ 마감 시간</Text>
            <View style={styles.durationGrid}>
              {durations.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.durationCard,
                    duration === item.value && styles.durationCardSelected,
                  ]}
                  onPress={() => setDuration(item.value)}
                >
                  <Text style={styles.durationEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.durationLabel,
                      duration === item.value && styles.durationLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 익명 투표 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 투표 방식</Text>
            <View style={styles.optionList}>
              <Pressable
                style={[
                  styles.optionCard,
                  isAnonymous && styles.optionCardSelected,
                ]}
                onPress={() => setIsAnonymous(true)}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>익명 투표</Text>
                  <Text style={styles.optionDescription}>
                    누가 투표했는지 알 수 없어요 (권장)
                  </Text>
                </View>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>

              <Pressable
                style={[
                  styles.optionCard,
                  !isAnonymous && styles.optionCardSelected,
                ]}
                onPress={() => setIsAnonymous(false)}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>공개 투표</Text>
                  <Text style={styles.optionDescription}>
                    누가 투표했는지 모두에게 공개돼요
                  </Text>
                </View>
                {!isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            </View>
          </View>

          {/* 투표 요약 */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📋 투표 요약</Text>
            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Circle</Text>
                <Text style={styles.summaryValue}>로딩중...</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>질문</Text>
                <Text style={styles.summaryValue}>로딩중...</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>마감 시간</Text>
                <Text style={styles.summaryValue}>
                  {durations.find((d) => d.value === duration)?.label}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>투표 방식</Text>
                <Text style={styles.summaryValue}>
                  {isAnonymous ? '익명' : '공개'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? '투표 만드는 중...' : '투표 만들기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
    marginBottom: tokens.spacing.xl,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  durationCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  durationCardSelected: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  durationEmoji: {
    fontSize: 32,
  },
  durationLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[700],
  },
  durationLabelSelected: {
    color: tokens.colors.primary[700],
  },
  optionList: {
    gap: tokens.spacing.md,
  },
  optionCard: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  checkmark: {
    fontSize: 20,
    color: tokens.colors.primary[500],
  },
  summaryCard: {
    backgroundColor: tokens.colors.neutral[100],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
  },
  summaryTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  summaryList: {
    gap: tokens.spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  summaryValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  createButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: tokens.colors.neutral[300],
  },
  createButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
});
