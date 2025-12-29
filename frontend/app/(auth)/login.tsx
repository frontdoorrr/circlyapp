import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLogin } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/primitives/Button';
import { Input } from '../../src/components/primitives/Input';
import { tokens } from '../../src/theme';
import { ApiError } from '../../src/types/api';

/**
 * Login Screen
 *
 * 이메일/비밀번호로 로그인
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지

  const loginMutation = useLogin();

  const handleLogin = async () => {
    console.log('[Login] handleLogin 호출됨', {
      isSubmitting,
      isPending: loginMutation.isPending,
      timestamp: new Date().toISOString(),
    });

    // 중복 제출 방지
    if (isSubmitting || loginMutation.isPending) {
      console.log('[Login] 🚫 이미 제출 중입니다. 중복 요청 무시.');
      return;
    }

    // 입력 검증
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsSubmitting(true); // 제출 시작

    try {
      await loginMutation.mutateAsync({ email, password });
      // 성공 시 자동으로 메인 화면으로 리다이렉트됨 (useAuthStore가 처리)
      router.replace('/(main)/(home)');
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('로그인 실패', error.message);
      } else {
        Alert.alert('오류', '로그인 중 문제가 발생했습니다');
      }
    } finally {
      setIsSubmitting(false); // 제출 완료
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>Circly에 오신 것을 환영합니다!</Text>
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
            editable={!isSubmitting && !loginMutation.isPending}
          />

          <Input
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            textContentType="oneTimeCode"
            editable={!isSubmitting && !loginMutation.isPending}
            onSubmitEditing={handleLogin}
          />

          <Button
            onPress={handleLogin}
            loading={isSubmitting || loginMutation.isPending}
            disabled={isSubmitting || !email.trim() || !password.trim()}
            fullWidth
          >
            로그인
          </Button>
        </View>

        {/* 회원가입 링크 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <Button
            variant="ghost"
            onPress={() => router.push('/(auth)/register')}
            disabled={isSubmitting || loginMutation.isPending}
          >
            회원가입
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  content: {
    flex: 1,
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
