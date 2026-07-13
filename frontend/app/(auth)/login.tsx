import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLogin } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/primitives/Button';
import { Input } from '../../src/components/primitives/Input';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import {
  SupabaseAuthError,
  translateSupabaseError,
  isSupabaseAuthError,
} from '../../src/utils/supabaseErrors';
import { useToast } from '../../src/providers/ToastProvider';
import { logger } from '../../src/utils/logger';

/**
 * Login Screen
 *
 * Supabase Auth 직접 연동
 * 이메일/비밀번호로 로그인
 */
export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지

  const loginMutation = useLogin();

  const handleLogin = async () => {
    logger.log('[Login] handleLogin 호출됨', {
      isSubmitting,
      isPending: loginMutation.isPending,
      timestamp: new Date().toISOString(),
    });

    // 중복 제출 방지
    if (isSubmitting || loginMutation.isPending) {
      logger.log('[Login] 이미 제출 중입니다. 중복 요청 무시.');
      return;
    }

    // 입력 검증
    if (!email.trim() || !password.trim()) {
      showToast('이메일과 비밀번호를 입력해주세요', 'error');
      return;
    }

    setIsSubmitting(true); // 제출 시작

    try {
      await loginMutation.mutateAsync({ email, password });
      // 성공 시 onAuthStateChange 리스너가 isAuthenticated를 true로 설정
      // → AppInitializer가 자동으로 Home 화면으로 리다이렉트
      logger.log('[Login] 로그인 성공 - AppInitializer가 리다이렉트 처리');
    } catch (error) {
      logger.error('[Login] 로그인 실패:', error);

      if (isSupabaseAuthError(error)) {
        showToast(translateSupabaseError(error), 'error');
      } else if (error instanceof SupabaseAuthError) {
        showToast(translateSupabaseError(error), 'error');
      } else {
        showToast('로그인 중 문제가 발생했습니다', 'error');
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

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      color: theme.text,
      marginBottom: tokens.spacing.sm,
    },
    subtitle: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
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
      color: theme.textSecondary,
    },
  });
