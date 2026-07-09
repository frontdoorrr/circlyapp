import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { PollDuration, usePollCreateStore } from '../../src/stores/pollCreate';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import { tokens } from '../../src/theme';
import type { Theme } from '../../src/theme/tokens';

const DURATIONS: { value: PollDuration; label: string; detail: string }[] = [
  { value: '1H', label: '1시간', detail: '빠르게 결과 보기' },
  { value: '3H', label: '3시간', detail: '쉬는 시간 동안' },
  { value: '6H', label: '6시간', detail: '오늘 안에 마감' },
  { value: '24H', label: '24시간', detail: '친구들이 여유롭게 참여' },
];

export default function PollSettingsScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const duration = usePollCreateStore((state) => state.settings.duration);
  const setSettings = usePollCreateStore((state) => state.setSettings);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>언제 결과를 공개할까요?</Text>
      <View style={styles.options}>
        {DURATIONS.map((item) => (
          <Pressable key={item.value} style={[styles.option, duration === item.value && styles.selected]} onPress={() => setSettings({ duration: item.value })}>
            <View style={styles.optionText}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
            <View style={[styles.radio, duration === item.value && styles.radioSelected]} />
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <Button fullWidth onPress={() => router.push('/create/preview')}>미리보기</Button>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, padding: tokens.spacing.lg, backgroundColor: theme.background },
  heading: { fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: theme.text, marginBottom: tokens.spacing.xl },
  options: { gap: tokens.spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 76, padding: tokens.spacing.md, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: tokens.borderRadius.lg },
  selected: { borderWidth: 2, borderColor: tokens.colors.primary[500], backgroundColor: isDark ? theme.backgroundSecondary : tokens.colors.primary[50] },
  optionText: { flex: 1 },
  label: { color: theme.text, fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold },
  detail: { color: theme.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border },
  radioSelected: { borderWidth: 6, borderColor: tokens.colors.primary[500] },
  footer: { marginTop: 'auto' },
});
