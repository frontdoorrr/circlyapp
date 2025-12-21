import { View, Text, StyleSheet } from 'react-native';

/**
 * Register Screen
 *
 * TODO: Implement registration UI
 * - Username input
 * - Email/Password input
 * - Register button
 */
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <Text style={styles.subtitle}>Circly에 오신 것을 환영합니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
