import {
  View,
  Text,
  StyleSheet,
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
 * Register Screen
 *
 * Supabase Auth 직접 연동 (2단계 방식)
 * 1단계: Supabase Auth 회원가입
 * 2단계: 백엔드 Profile 업데이트 (username, display_name)
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지

  const registerMutation = useRegister();

  const handleRegister = async () => {
    logger.log('[Register] handleRegister 호출됨', {
      isSubmitting,
      isPending: registerMutation.isPending,
      timestamp: new Date().toISOString(),
    });

    // 중복 제출 방지
    if (isSubmitting || registerMutation.isPending) {
      logger.log('[Register] 이미 제출 중입니다. 중복 요청 무시.');
      return;
    }

    // 입력 검증
    if (!email.trim() || !password.trim()) {
      showToast('이메일과 비밀번호를 입력해주세요', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('비밀번호는 최소 8자 이상이어야 합니다', 'error');
      return;
    }

    setIsSubmitting(true); // 제출 시작

    try {
      logger.log('[Register] 회원가입 시도:', { email, username, display_name: displayName });

      await registerMutation.mutateAsync({
        email,
        password,
        username: username.trim() || undefined,
        display_name: displayName.trim() || undefined,
      });

      logger.log('[Register] 회원가입 성공 - AppInitializer가 리다이렉트 처리');
      // 성공 시 onAuthStateChange 리스너가 isAuthenticated를 true로 설정
      // → AppInitializer가 자동으로 Home 화면으로 리다이렉트
    } catch (error) {
      logger.error('[Register] 회원가입 실패:', error);

      if (isSupabaseAuthError(error)) {
        showToast(translateSupabaseError(error), 'error');
      } else if (error instanceof SupabaseAuthError) {
        showToast(translateSupabaseError(error), 'error');
      } else {
        showToast('회원가입 중 문제가 발생했습니다', 'error');
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
            editable={!isSubmitting && !registerMutation.isPending}
          />

          <Input
            placeholder="사용자명 (선택)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            editable={!isSubmitting && !registerMutation.isPending}
          />

          <Input
            placeholder="표시 이름 (선택)"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            editable={!isSubmitting && !registerMutation.isPending}
          />

          <Input
            placeholder="비밀번호 (최소 8자)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            textContentType="oneTimeCode"
            editable={!isSubmitting && !registerMutation.isPending}
          />

          <Input
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="off"
            textContentType="oneTimeCode"
            editable={!isSubmitting && !registerMutation.isPending}
            onSubmitEditing={handleRegister}
          />

          <Button
            onPress={handleRegister}
            loading={isSubmitting || registerMutation.isPending}
            disabled={isSubmitting || !email.trim() || !password.trim() || !confirmPassword.trim()}
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
            disabled={isSubmitting || registerMutation.isPending}
          >
            로그인
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
