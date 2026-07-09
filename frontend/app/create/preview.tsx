import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { useCreatePoll } from '../../src/hooks/useCreatePoll';
import { usePollCreateStore } from '../../src/stores/pollCreate';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import { tokens } from '../../src/theme';
import type { Theme } from '../../src/theme/tokens';

export default function PollPreviewScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const selectedTemplate = usePollCreateStore((state) => state.selectedTemplate);
  const circleId = usePollCreateStore((state) => state.circleId);
  const duration = usePollCreateStore((state) => state.settings.duration);
  const reset = usePollCreateStore((state) => state.reset);
  const createPoll = useCreatePoll();

  if (!selectedTemplate || !circleId) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>투표 정보를 다시 선택해주세요.</Text>
        <Button onPress={() => router.replace('/create')}>처음으로</Button>
      </View>
    );
  }

  const handlePublish = async () => {
    await createPoll.mutateAsync({ templateId: selectedTemplate.id, duration, circleId });
    reset();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>이 질문으로 투표를 시작합니다</Text>
      <View style={styles.preview}>
        <Text style={styles.emoji}>{selectedTemplate.emoji}</Text>
        <Text style={styles.question}>{selectedTemplate.text}</Text>
        <Text style={styles.duration}>{duration.replace('H', '시간')} 후 마감</Text>
      </View>
      <View style={styles.footer}>
        <Button fullWidth loading={createPoll.isPending} disabled={createPoll.isPending} onPress={handlePublish}>
          투표 발행하기
        </Button>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, padding: tokens.spacing.lg, backgroundColor: theme.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.md, backgroundColor: theme.background },
  missing: { color: theme.textSecondary },
  eyebrow: { color: theme.textSecondary, textAlign: 'center', marginTop: tokens.spacing.xl },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 72, lineHeight: 86 },
  question: { color: theme.text, fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, textAlign: 'center', marginTop: tokens.spacing.lg },
  duration: { color: tokens.colors.primary[isDark ? 400 : 600], marginTop: tokens.spacing.lg },
  footer: { paddingBottom: tokens.spacing.md },
});
