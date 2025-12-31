import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, spacing, borderRadius } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

interface HomeHeaderProps {
  circleName: string;
  notificationCount?: number;
  profileImageUrl?: string;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

// ============================================================================
// HomeHeader Component
// ============================================================================

/**
 * HomeHeader Component
 *
 * 홈 화면 상단 헤더
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * Layout:
 * - 좌측: 알림 아이콘 (뱃지 포함)
 * - 중앙: Circle 이름
 * - 우측: 프로필 아이콘
 *
 * @param circleName - Circle 이름
 * @param notificationCount - 읽지 않은 알림 개수
 * @param profileImageUrl - 프로필 이미지 URL
 * @param onNotificationPress - 알림 아이콘 클릭 핸들러
 * @param onProfilePress - 프로필 아이콘 클릭 핸들러
 */
export function HomeHeader({
  circleName,
  notificationCount = 0,
  profileImageUrl,
  onNotificationPress,
  onProfilePress,
}: HomeHeaderProps) {
  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotificationPress();
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onProfilePress();
  };

  return (
    <View style={styles.container}>
      {/* Left: Notification Icon */}
      <Pressable
        onPress={handleNotificationPress}
        style={styles.iconButton}
        hitSlop={8}
      >
        <View style={styles.notificationContainer}>
          <Text variant="2xl">🔔</Text>
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text
                variant="xs"
                weight="bold"
                color={tokens.colors.white}
                style={styles.badgeText}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Center: Circle Name */}
      <View style={styles.centerContainer}>
        <Text
          variant="lg"
          weight="semibold"
          color={tokens.colors.neutral[900]}
          numberOfLines={1}
        >
          {circleName}
        </Text>
      </View>

      {/* Right: Profile Icon */}
      <Pressable
        onPress={handleProfilePress}
        style={styles.iconButton}
        hitSlop={8}
      >
        {profileImageUrl ? (
          <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text variant="base" weight="semibold" color={tokens.colors.neutral[600]}>
              👤
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], // 16px
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: tokens.colors.semantic.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: tokens.colors.neutral[100],
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: tokens.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
