import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/states';
import { usePollTemplates } from '../../src/hooks/usePolls';
import { usePollCreateStore } from '../../src/stores/pollCreate';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import { tokens } from '../../src/theme';
import type { Theme } from '../../src/theme/tokens';
import type { TemplateCategory } from '../../src/types/poll';

export default function QuestionScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const category = usePollCreateStore((state) => state.selectedCategory) as TemplateCategory | null;
  const setTemplate = usePollCreateStore((state) => state.setTemplate);
  const { data, isLoading, refetch } = usePollTemplates(category ?? undefined);

  if (!category) {
    return <View style={styles.center}><EmptyState variant="generic" title="카테고리를 먼저 선택해주세요" actionLabel="처음으로" onAction={() => router.replace('/create')} /></View>;
  }
  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!data) return <View style={styles.center}><EmptyState variant="network-error" onAction={() => refetch()} /></View>;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={styles.question}
          onPress={() => {
            setTemplate({ id: item.id, emoji: item.emoji ?? '💜', text: item.question_text });
            router.push('/create/settings');
          }}
        >
          <Text style={styles.emoji}>{item.emoji ?? '💜'}</Text>
          <Text style={styles.text}>{item.question_text}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      )}
    />
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: tokens.spacing.lg, gap: tokens.spacing.sm },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.background },
  question: { minHeight: 88, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: tokens.borderRadius.lg, padding: tokens.spacing.md, borderWidth: isDark ? 1 : 0, borderColor: theme.border },
  emoji: { fontSize: 30, marginRight: tokens.spacing.md },
  text: { flex: 1, color: theme.text, fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold },
  arrow: { color: theme.textTertiary, fontSize: 28 },
});
