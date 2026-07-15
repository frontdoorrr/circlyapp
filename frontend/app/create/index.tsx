import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/primitives/Button';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/states';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import { tokens } from '../../src/theme';
import type { Theme } from '../../src/theme/tokens';

export default function CreatePollStartScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <EmptyState
          icon="🛡️"
          title="질문은 운영 템플릿으로 제공돼요"
          description="Circly는 상처가 될 수 있는 질문을 막기 위해 검수된 칭찬 질문만 사용합니다. 지금은 투표에 참여하거나 받은 하트를 확인해보세요."
        />
        <View style={styles.actions}>
          <Button fullWidth onPress={() => router.replace('/vote-session' as any)}>
            투표하러 가기
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onPress={() => router.replace('/(main)/(1-inbox)' as any)}
          >
            받은하트 보기
          </Button>
          <Button fullWidth variant="ghost" onPress={() => router.back()}>
            돌아가기
          </Button>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing.lg,
    backgroundColor: theme.background,
  },
  actions: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
});
