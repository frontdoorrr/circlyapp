import { View, Text, StyleSheet } from 'react-native';

/**
 * Profile Screen
 *
 * 사용자 프로필 화면
 *
 * TODO: Implement profile UI
 * - User info
 * - Circles list
 * - Settings
 */
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 프로필</Text>
      <Text style={styles.subtitle}>내 정보</Text>
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
