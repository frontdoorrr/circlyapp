import { View, Text, StyleSheet } from 'react-native';

/**
 * Create Poll Screen
 *
 * 투표 생성 화면
 *
 * TODO: Implement create poll UI
 * - Template selection
 * - Duration selection
 * - Create button
 */
export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>➕ 만들기</Text>
      <Text style={styles.subtitle}>새로운 투표 만들기</Text>
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
