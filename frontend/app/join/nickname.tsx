import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tokens } from '../../src/theme';
import { useJoinCircle } from '../../src/hooks/useCircles';

/**
 * 닉네임 설정 화면
 *
 * Circle 참여를 위한 닉네임을 설정합니다.
 * - 2-10자 닉네임 입력
 * - Circle 가입 API 호출
 * - 완료 시 성공 화면으로 이동
 */
export default function NicknameScreen() {
  const { inviteCode, circleName, circleId, memberCount, maxMembers } = useLocalSearchParams<{
    inviteCode: string;
    circleName: string;
    circleId: string;
    memberCount: string;
    maxMembers: string;
  }>();

  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const joinMutation = useJoinCircle();
  const isJoining = joinMutation.isPending;

  // Animation values
  const buttonScale = useSharedValue(1);

  const handleNicknameChange = (text: string) => {
    // 2-10자 제한
    const cleaned = text.slice(0, 10);
    setNickname(cleaned);
    setError('');
  };

  const handleJoin = async () => {
    if (nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 해요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (nickname.length > 10) {
      setError('닉네임은 10자 이하여야 해요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 15 }, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      await joinMutation.mutateAsync({
        invite_code: inviteCode,
        nickname: nickname,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 성공 시 성공 화면으로 이동 (뒤로가기 방지를 위해 replace)
      router.replace({
        pathname: '/join/success',
        params: {
          circleName: circleName,
          nickname: nickname,
        },
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('[Nickname] Join error:', err);

      // 에러 처리
      const errorMessage = err?.response?.data?.error?.message || err?.message || '';

      if (errorMessage.includes('already') || errorMessage.includes('ALREADY_MEMBER')) {
        setError('이미 참여 중인 Circle이에요');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('nickname')) {
        setError('이미 사용 중인 닉네임이에요');
      } else if (errorMessage.includes('full') || errorMessage.includes('CIRCLE_FULL')) {
        setError('이 Circle은 인원이 가득 찼어요');
      } else if (errorMessage.includes('invalid') || errorMessage.includes('INVALID_INVITE_CODE')) {
        setError('초대 코드가 만료되었어요');
      } else {
        setError('참여에 실패했어요. 다시 시도해주세요');
      }
    }
  };

  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10;

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
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>반가워요!</Text>
            <Text style={styles.description}>
              {circleName}에서 사용할{'\n'}닉네임을 정해주세요
            </Text>
          </Animated.View>

          {/* Circle 정보 */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.circleCard}>
            <Text style={styles.circleLabel}>참여할 Circle</Text>
            <Text style={styles.circleName}>{circleName}</Text>
            <View style={styles.circleInfo}>
              <Text style={styles.circleInfoText}>
                👥 {memberCount}/{maxMembers}명
              </Text>
              <Text style={styles.circleInfoDot}>•</Text>
              <Text style={styles.circleInfoText}>
                📝 {inviteCode}
              </Text>
            </View>
          </Animated.View>

          {/* 닉네임 입력 */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.inputSection}>
            <Text style={styles.inputLabel}>닉네임</Text>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                isNicknameValid && !error && styles.inputValid,
              ]}
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder="예: 민지"
              placeholderTextColor={tokens.colors.neutral[400]}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
              editable={!isJoining}
              accessibilityLabel="닉네임 입력"
              accessibilityHint="2-10자로 입력하세요"
            />

            <View style={styles.inputFooter}>
              {error ? (
                <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
                  {error}
                </Animated.Text>
              ) : (
                <Text style={styles.hint}>2-10자로 입력해주세요</Text>
              )}
              <Text
                style={[
                  styles.charCount,
                  nickname.length > 10 && styles.charCountError,
                ]}
              >
                {nickname.length}/10
              </Text>
            </View>
          </Animated.View>

          {/* 안내 사항 */}
          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 닉네임 안내</Text>
            <Text style={styles.infoText}>
              • 같은 Circle 내에서 중복될 수 없어요{'\n'}
              • 나중에 프로필에서 변경할 수 있어요{'\n'}
              • 친구들이 알아볼 수 있는 이름을 추천해요
            </Text>
          </Animated.View>
        </View>

        {/* 완료 버튼 */}
        <View style={styles.footer}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[
                styles.joinButton,
                (!isNicknameValid || isJoining) && styles.joinButtonDisabled,
              ]}
              onPress={handleJoin}
              disabled={!isNicknameValid || isJoining}
              accessibilityRole="button"
              accessibilityLabel={isJoining ? '참여 중' : '시작하기'}
              accessibilityState={{ disabled: !isNicknameValid || isJoining }}
            >
              <Text
                style={[
                  styles.joinButtonText,
                  (!isNicknameValid || isJoining) && styles.joinButtonTextDisabled,
                ]}
              >
                {isJoining ? '참여 중...' : '시작하기'}
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
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 76,
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
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
  circleCard: {
    backgroundColor: tokens.colors.primary[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary[100],
  },
  circleLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing.xs,
  },
  circleName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
    marginBottom: tokens.spacing.sm,
  },
  circleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  circleInfoText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[500],
  },
  circleInfoDot: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[300],
  },
  inputSection: {
    marginBottom: tokens.spacing.xl,
  },
  inputLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[900],
  },
  inputError: {
    borderColor: tokens.colors.red[500],
    backgroundColor: tokens.colors.red[50],
  },
  inputValid: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  hint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.red[600],
  },
  charCount: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
  },
  charCountError: {
    color: tokens.colors.red[600],
  },
  infoCard: {
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
  },
  infoTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  infoText: {
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
