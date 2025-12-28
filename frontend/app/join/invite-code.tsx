import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { tokens } from '../../src/theme';

/**
 * 초대 코드 입력 화면
 *
 * Circle 초대 코드를 입력하여 참여합니다.
 * - 6자리 영문+숫자 코드 입력
 * - 코드 유효성 검증
 * - 참여 성공 시 닉네임 설정 화면으로 이동
 */
export default function InviteCodeScreen() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (text: string) => {
    // 영문+숫자만 허용, 대문자로 변환, 6자리 제한
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setError('');
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // TODO: API 호출하여 초대 코드 검증
      // const response = await validateInviteCode(code);

      // 임시로 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 성공 시 닉네임 설정 화면으로 이동
      router.push({
        pathname: '/join/nickname',
        params: {
          inviteCode: code,
          circleName: '3-2반 친구들', // TODO: 실제 Circle 정보
        },
      });
    } catch (err) {
      setError('유효하지 않은 초대 코드예요');
    } finally {
      setIsValidating(false);
    }
  };

  const isCodeValid = code.length === 6;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Circle에 참여하기</Text>
            <Text style={styles.description}>
              친구에게 받은 초대 코드를{'\n'}입력해주세요
            </Text>
          </View>

          {/* 코드 입력 필드 */}
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                isCodeValid && styles.inputValid,
              ]}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="ABC123"
              placeholderTextColor={tokens.colors.neutral[400]}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              keyboardType="ascii-capable"
              textAlign="center"
              editable={!isValidating}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.hint}>코드는 6자리 영문+숫자예요</Text>
            )}
          </View>

          {/* 예시 */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>💡 코드는 어디서 받나요?</Text>
            <Text style={styles.exampleText}>
              • 친구에게 카카오톡/인스타그램으로 받은 초대 링크에서 확인
              {'\n'}• Circle 관리자가 공유한 6자리 코드
            </Text>
          </View>
        </View>

        {/* 참여하기 버튼 */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.joinButton,
              (!isCodeValid || isValidating) && styles.joinButtonDisabled,
            ]}
            onPress={handleJoin}
            disabled={!isCodeValid || isValidating}
          >
            <Text
              style={[
                styles.joinButtonText,
                (!isCodeValid || isValidating) && styles.joinButtonTextDisabled,
              ]}
            >
              {isValidating ? '확인 중...' : '참여하기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  content: {
    flex: 1,
    padding: tokens.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: tokens.spacing['2xl'],
    marginBottom: tokens.spacing['2xl'],
  },
  emoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: tokens.spacing.xl,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.lg,
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.xl,
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    letterSpacing: 8,
  },
  inputError: {
    borderColor: tokens.colors.red[500],
    backgroundColor: tokens.colors.red[50],
  },
  inputValid: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  hint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.red[600],
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
  },
  exampleCard: {
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
  },
  exampleTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  exampleText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    lineHeight: 20,
  },
  footer: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  joinButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: tokens.colors.neutral[200],
  },
  joinButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  joinButtonTextDisabled: {
    color: tokens.colors.neutral[400],
  },
});
