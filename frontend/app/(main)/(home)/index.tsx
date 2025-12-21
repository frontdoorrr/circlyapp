import { View, Text, StyleSheet } from 'react-native';

/**
 * Home Screen
 *
 * 진행 중인 투표 목록 화면
 *
 * TODO: Implement home UI
 * - Active polls list
 * - Pull to refresh
 * - Empty state
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 홈</Text>
      <Text style={styles.subtitle}>진행 중인 투표</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#737373',
  },
});
