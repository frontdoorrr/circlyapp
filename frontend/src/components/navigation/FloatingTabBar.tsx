import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoteSessionAvailability } from '../../hooks/usePolls';
import { tokens } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { GlassSurface } from '../primitives/GlassSurface';
import { Text } from '../primitives/Text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface TabAppearance {
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const tabAppearance: Record<string, TabAppearance> = {
  '(0-home)': { label: '홈', icon: 'home-outline', activeIcon: 'home' },
  '(1-inbox)': { label: '하트', icon: 'heart-outline', activeIcon: 'heart' },
  '(1-circle)': { label: 'Circle', icon: 'people-outline', activeIcon: 'people' },
  '(2-profile)': { label: '프로필', icon: 'person-outline', activeIcon: 'person' },
};

interface FloatingTabBarProps extends BottomTabBarProps {
  unreadHeartCount: number;
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  unreadHeartCount,
}: FloatingTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { data: availability, isLoading: isAvailabilityLoading } = useVoteSessionAvailability();
  const canStartSession = availability?.can_start ?? false;
  const remainingMinutes = Math.max(
    1,
    Math.ceil((availability?.remaining_seconds ?? 0) / 60)
  );

  const handleQuickAction = () => {
    if (!canStartSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/vote-session' as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.positioner, { bottom: Math.max(insets.bottom, 8) + 8 }]}
    >
      <View style={[styles.capsuleShadow, isDark && styles.darkShadow]}>
        <GlassSurface
          variant="thick"
          interactive
          style={[
            styles.capsule,
            {
              borderColor: isDark
                ? 'rgba(255,255,255,0.13)'
                : 'rgba(255,255,255,0.82)',
            },
          ]}
          contentStyle={styles.tabList}
          tintColor={isDark ? '#31244d' : '#f5f3ff'}
          accessibilityLabel="메인 메뉴"
        >
          {state.routes.map((route, index) => {
            const appearance = tabAppearance[route.name];
            if (!appearance) return null;

            const isFocused = state.index === index;
            const options = descriptors[route.key].options;
            const badge = route.name === '(1-inbox)' ? unreadHeartCount : 0;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? appearance.label}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <View style={[styles.iconBubble, isFocused && styles.iconBubbleActive]}>
                  <Ionicons
                    name={isFocused ? appearance.activeIcon : appearance.icon}
                    size={22}
                    color={isFocused ? tokens.colors.white : theme.textSecondary}
                  />
                  {badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: isFocused ? tokens.colors.primary[isDark ? 300 : 600] : theme.textSecondary },
                    isFocused && styles.labelActive,
                  ]}
                >
                  {appearance.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>
      </View>

      <View style={[styles.actionShadow, isDark && styles.darkShadow]}>
        <Pressable
          onPress={handleQuickAction}
          disabled={!canStartSession}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStartSession }}
          accessibilityLabel={isAvailabilityLoading
            ? '투표 세션 상태 확인 중'
            : canStartSession
              ? '투표 세션 시작'
              : `다음 투표 세션까지 약 ${remainingMinutes}분`}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && canStartSession && styles.actionPressed,
          ]}
        >
          <GlassSurface
            variant="thick"
            interactive={canStartSession}
            style={[
              styles.action,
              {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(255,255,255,0.86)',
              },
            ]}
            contentStyle={styles.actionContent}
            tintColor={canStartSession ? '#8b5cf6' : undefined}
          >
            <View style={[styles.actionIcon, !canStartSession && styles.actionIconDisabled]}>
              <Ionicons
                name={canStartSession ? 'sparkles' : 'hourglass-outline'}
                size={25}
                color={canStartSession ? tokens.colors.white : theme.textTertiary}
              />
            </View>
          </GlassSurface>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capsuleShadow: {
    flex: 1,
    borderRadius: 36,
    shadowColor: '#24163d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  darkShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.42,
  },
  capsule: {
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
  },
  tabList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 30,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    backgroundColor: tokens.colors.primary[500],
    shadowColor: tokens.colors.primary[500],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.36,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    maxWidth: '100%',
    paddingHorizontal: 2,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  labelActive: {
    fontWeight: tokens.typography.fontWeight.bold,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.semantic.error[500],
    borderWidth: 1.5,
    borderColor: tokens.colors.white,
  },
  badgeText: {
    color: tokens.colors.white,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  actionShadow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#24163d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 12,
  },
  actionPressable: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  actionPressed: {
    transform: [{ scale: 0.94 }],
  },
  action: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
  },
  actionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary[500],
  },
  actionIconDisabled: {
    backgroundColor: 'rgba(115, 115, 115, 0.14)',
  },
});
