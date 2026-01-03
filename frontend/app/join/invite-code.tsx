import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tokens } from '../../src/theme';
import { useValidateInviteCode } from '../../src/hooks/useCircles';

/**
 * 초대 코드 입력 화면
 *
 * Circle 초대 코드를 입력하여 참여합니다.
 * - 6자리 영문+숫자 코드 입력
 * - 코드 유효성 검증 (API 연동)
 * - 참여 성공 시 닉네임 설정 화면으로 이동
 * - 딥링크로 전달된 코드 자동 입력 지원
 */
export default function InviteCodeScreen() {
  // Deep link에서 전달된 코드 파라미터
  const { code: deepLinkCode } = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Deep link로 전달된 코드 자동 입력
  useEffect(() => {
    if (deepLinkCode) {
      const cleaned = deepLinkCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setCode(cleaned);
    }
  }, [deepLinkCode]);

  const validateMutation = useValidateInviteCode();
  const isValidating = validateMutation.isPending;

  // Animation values
  const buttonScale = useSharedValue(1);

  const handleCodeChange = (text: string) => {
    // 영문+숫자만 허용, 대문자로 변환, 6자리 제한
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setError('');
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 15 }, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      const result = await validateMutation.mutateAsync(code);

      if (result.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // 성공 시 닉네임 설정 화면으로 이동
        router.push({
          pathname: '/join/nickname',
          params: {
            inviteCode: code,
            circleName: result.circle_name || 'Circle',
            circleId: result.circle_id || '',
            memberCount: String(result.member_count || 0),
            maxMembers: String(result.max_members || 50),
          },
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // 에러 메시지 설정
        if (result.message?.includes('full')) {
          setError('이 Circle은 인원이 가득 찼어요');
        } else {
          setError('유효하지 않은 초대 코드예요');
        }
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('[InviteCode] Validation error:', err);
      setError('코드 확인 중 오류가 발생했어요');
    }
  };

  const isCodeValid = code.length === 6;

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Circle에 참여하기</Text>
            <Text style={styles.description}>
              친구에게 받은 초대 코드를{'\n'}입력해주세요
            </Text>
          </Animated.View>

          {/* 코드 입력 필드 */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                isCodeValid && !error && styles.inputValid,
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
              accessibilityLabel="초대 코드 입력"
              accessibilityHint="6자리 영문+숫자 초대 코드를 입력하세요"
            />

            {error ? (
              <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
                {error}
              </Animated.Text>
            ) : (
              <Text style={styles.hint}>코드는 6자리 영문+숫자예요</Text>
            )}
          </Animated.View>

          {/* 예시 */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>💡 코드는 어디서 받나요?</Text>
            <Text style={styles.exampleText}>
              • 친구에게 카카오톡/인스타그램으로 받은 초대 링크에서 확인
              {'\n'}• Circle 관리자가 공유한 6자리 코드
            </Text>
          </Animated.View>
        </View>

        {/* 참여하기 버튼 */}
        <View style={styles.footer}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[
                styles.joinButton,
                (!isCodeValid || isValidating) && styles.joinButtonDisabled,
              ]}
              onPress={handleJoin}
              disabled={!isCodeValid || isValidating}
              accessibilityRole="button"
              accessibilityLabel={isValidating ? '코드 확인 중' : '참여하기'}
              accessibilityState={{ disabled: !isCodeValid || isValidating }}
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
          </Animated.View>
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
