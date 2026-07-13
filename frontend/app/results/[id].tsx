import { View, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { usePollDetail } from '../../src/hooks/usePolls';
import { LoadingSpinner, EmptyState } from '../../src/components/states';
import { ResultsView } from '../../src/components/results/ResultsView';

/**
 * 투표 결과 화면
 *
 * 결과 표시, 공유, Orb Mode 진입을 담당하는 정본 화면.
 */
export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data: currentUser } = useCurrentUser();
  const isOrbMode = currentUser?.is_orb_mode ?? false;

  const { data: poll, isLoading, error, refetch } = usePollDetail(id ?? '');

  const handleOrbMode = () => {
    if (isOrbMode) {
      router.push(`/results/${id}/voters`);
    } else {
      router.push('/subscription');
    }
  };

  if (!id) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <EmptyState
            variant="network-error"
            title="잘못된 접근이에요"
            description="투표를 찾을 수 없습니다"
          />
        </View>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  if (error || !poll) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <EmptyState
            variant="network-error"
            title="결과를 불러올 수 없어요"
            description="잠시 후 다시 시도해주세요"
            onAction={() => refetch()}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '투표 결과',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />
      <ResultsView poll={poll} isOrbMode={isOrbMode} onOpenOrbMode={handleOrbMode} />
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });
