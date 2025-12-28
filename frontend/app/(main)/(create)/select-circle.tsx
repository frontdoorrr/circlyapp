import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { tokens } from '../../../src/theme';

/**
 * Circle 선택 화면
 *
 * 투표를 생성할 Circle을 선택합니다.
 * - 내가 속한 Circle 목록 표시
 * - Circle 선택 시 다음 단계로 진행
 */
export default function SelectCircleScreen() {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  // TODO: 실제 Circle 목록 가져오기
  const circles = [
    { id: '1', name: '3-2반 친구들', memberCount: 15, activePolls: 2 },
    { id: '2', name: '축구부', memberCount: 12, activePolls: 1 },
    { id: '3', name: '학생회', memberCount: 8, activePolls: 0 },
  ];

  const handleCircleSelect = (circleId: string) => {
    setSelectedCircleId(circleId);
  };

  const handleNext = () => {
    if (!selectedCircleId) return;

    // TODO: 선택된 Circle ID를 다음 화면으로 전달
    router.push({
      pathname: '/(main)/(create)/select-template',
      params: { circleId: selectedCircleId },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Circle 선택',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>어느 Circle에 투표를 만들까요?</Text>
          <Text style={styles.description}>
            투표를 진행할 Circle을 선택해주세요
          </Text>

          <View style={styles.circleList}>
            {circles.map((circle) => (
              <Pressable
                key={circle.id}
                style={[
                  styles.circleCard,
                  selectedCircleId === circle.id && styles.circleCardSelected,
                ]}
                onPress={() => handleCircleSelect(circle.id)}
              >
                <View style={styles.circleInfo}>
                  <Text style={styles.circleName}>{circle.name}</Text>
                  <Text style={styles.circleStats}>
                    👥 {circle.memberCount}명 • 📊 진행중 {circle.activePolls}개
                  </Text>
                </View>
                {selectedCircleId === circle.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedCircleId && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedCircleId}
          >
            <Text
              style={[
                styles.nextButtonText,
                !selectedCircleId && styles.nextButtonTextDisabled,
              ]}
            >
              다음
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
  circleList: {
    gap: tokens.spacing.md,
  },
  circleCard: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleCardSelected: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  circleStats: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  checkmark: {
    fontSize: 24,
    color: tokens.colors.primary[500],
  },
  footer: {
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  nextButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: tokens.colors.neutral[200],
  },
  nextButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  nextButtonTextDisabled: {
    color: tokens.colors.neutral[400],
  },
});
