import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRegister } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/primitives/Button';
import { Input } from '../../src/components/primitives/Input';
import { tokens } from '../../src/theme';
import { ApiError } from '../../src/types/api';

/**
 * Register Screen
 *
 * 회원가입 (이메일, 비밀번호, 사용자명)
 */
export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const registerMutation = useRegister();

  const handleRegister = async () => {
    // 입력 검증
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 8) {
      Alert.alert('입력 오류', '비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        username: username.trim() || undefined,
        display_name: displayName.trim() || undefined,
      });
      // 성공 시 자동으로 메인 화면으로 리다이렉트
      router.replace('/(main)/(home)');
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('회원가입 실패', error.message);
      } else {
        Alert.alert('오류', '회원가입 중 문제가 발생했습니다');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>Circly에서 친구들과 함께 해보세요!</Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          <Input
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!registerMutation.isPending}
          />

          <Input
            placeholder="사용자명 (선택)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            editable={!registerMutation.isPending}
          />

          <Input
            placeholder="표시 이름 (선택)"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            editable={!registerMutation.isPending}
          />

          <Input
            placeholder="비밀번호 (최소 8자)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            textContentType="none"
            editable={!registerMutation.isPending}
          />

          <Input
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="off"
            textContentType="none"
            editable={!registerMutation.isPending}
            onSubmitEditing={handleRegister}
          />

          <Button
            onPress={handleRegister}
            loading={registerMutation.isPending}
            disabled={!email.trim() || !password.trim() || !confirmPassword.trim()}
            fullWidth
          >
            회원가입
          </Button>
        </View>

        {/* 로그인 링크 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            disabled={registerMutation.isPending}
          >
            로그인
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.fontSize['4xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
  },
  form: {
    gap: tokens.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
  },
  footerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
  },
});
