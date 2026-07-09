import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/states';
import { useCategories } from '../../src/hooks/usePolls';
import { useMyCircles } from '../../src/hooks/useCircles';
import { usePollCreateStore } from '../../src/stores/pollCreate';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import { tokens } from '../../src/theme';
import type { Theme } from '../../src/theme/tokens';

export default function CreatePollStartScreen() {
  const router = useRouter();
  const { circleId } = useLocalSearchParams<{ circleId?: string }>();
  const styles = useThemedStyles(createStyles);
  const { data: circles, isLoading: circlesLoading } = useMyCircles();
  const { data: categories, isLoading: categoriesLoading, refetch } = useCategories();
  const selectedCircleId = usePollCreateStore((state) => state.circleId);
  const setCircleId = usePollCreateStore((state) => state.setCircleId);
  const setCategory = usePollCreateStore((state) => state.setCategory);
  const reset = usePollCreateStore((state) => state.reset);

  useEffect(() => {
    reset();
    if (circleId) setCircleId(circleId);
  }, [circleId, reset, setCircleId]);

  if (circlesLoading || categoriesLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (!circles?.length) {
    return (
      <View style={styles.center}>
        <EmptyState
          variant="no-circles"
          actionLabel="Circle 만들기"
          onAction={() => router.replace('/circle/create')}
        />
      </View>
    );
  }

  if (!categories) {
    return (
      <View style={styles.center}>
        <EmptyState variant="network-error" onAction={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Circle</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {circles.map((circle) => (
          <Pressable
            key={circle.id}
            style={[styles.chip, selectedCircleId === circle.id && styles.chipSelected]}
            onPress={() => setCircleId(circle.id)}
          >
            <Text style={selectedCircleId === circle.id ? styles.chipTextSelected : styles.chipText}>
              {circle.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.heading}>어떤 칭찬을 나눌까요?</Text>
      <View style={styles.list}>
        {categories.map((category) => (
          <Pressable
            key={category.category}
            disabled={!selectedCircleId}
            style={[styles.category, !selectedCircleId && styles.disabled]}
            onPress={() => {
              setCategory(category.category);
              router.push('/create/question');
            }}
          >
            <Text style={styles.emoji}>{category.emoji}</Text>
            <View style={styles.categoryText}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryCount}>{category.question_count}개의 질문</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: tokens.spacing.lg, gap: tokens.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
  label: { color: theme.textSecondary, fontWeight: tokens.typography.fontWeight.semibold },
  chips: { gap: tokens.spacing.sm, paddingBottom: tokens.spacing.sm },
  chip: { borderWidth: 1, borderColor: theme.border, borderRadius: tokens.borderRadius.lg, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm },
  chipSelected: { backgroundColor: tokens.colors.primary[500], borderColor: tokens.colors.primary[500] },
  chipText: { color: theme.text },
  chipTextSelected: { color: tokens.colors.white, fontWeight: tokens.typography.fontWeight.semibold },
  heading: { marginTop: tokens.spacing.md, fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: theme.text },
  list: { gap: tokens.spacing.sm },
  category: { minHeight: 84, flexDirection: 'row', alignItems: 'center', padding: tokens.spacing.md, backgroundColor: theme.card, borderRadius: tokens.borderRadius.lg, borderWidth: isDark ? 1 : 0, borderColor: theme.border, ...(!isDark ? tokens.shadows.sm : {}) },
  disabled: { opacity: 0.45 },
  emoji: { fontSize: 34, marginRight: tokens.spacing.md },
  categoryText: { flex: 1 },
  categoryTitle: { color: theme.text, fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold },
  categoryCount: { color: theme.textSecondary, marginTop: 2 },
  arrow: { color: theme.textTertiary, fontSize: 30 },
});
