import React, { useEffect, useRef, useState, type ComponentProps } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useVoteSessionAvailability } from '../../hooks/usePolls';
import { tokens, springConfigs } from '../../theme';
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

// 인디케이터 위치 계산용 레이아웃 상수 (styles.tabList/tab/iconBubble 값과 동기화)
const TAB_LIST_H_PADDING = 5;
const TAB_LIST_V_PADDING = 5;
const INDICATOR_SIZE = 36;
const TAB_CONTENT_HEIGHT = 36 + 2 + 14; // iconBubble + gap + label lineHeight

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

  // 선택 탭 원형 강조 슬라이드
  const visibleRoutes = state.routes.filter((route) => tabAppearance[route.name]);
  const activeVisibleIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index]?.key
  );
  const [tabListLayout, setTabListLayout] = useState({ width: 0, height: 0 });
  const indicatorX = useSharedValue(0);
  const isFirstPosition = useRef(true);

  const slotWidth =
    tabListLayout.width > 0 && visibleRoutes.length > 0
      ? (tabListLayout.width - TAB_LIST_H_PADDING * 2) / visibleRoutes.length
      : 0;
  const indicatorTop =
    TAB_LIST_V_PADDING +
    Math.max(
      0,
      (tabListLayout.height - TAB_LIST_V_PADDING * 2 - TAB_CONTENT_HEIGHT) / 2
    );

  useEffect(() => {
    if (slotWidth === 0 || activeVisibleIndex < 0) return;

    const targetX =
      TAB_LIST_H_PADDING +
      activeVisibleIndex * slotWidth +
      (slotWidth - INDICATOR_SIZE) / 2;

    if (isFirstPosition.current) {
      indicatorX.value = targetX;
      isFirstPosition.current = false;
    } else {
      indicatorX.value = withSpring(targetX, springConfigs.stiff);
    }
  }, [activeVisibleIndex, slotWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleTabListLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTabListLayout((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
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
          contentStyle={styles.tabListFrame}
          tintColor={isDark ? '#31244d' : '#f5f3ff'}
          accessibilityLabel="메인 메뉴"
        >
          <View style={styles.tabList} onLayout={handleTabListLayout}>
          {slotWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.indicator, { top: indicatorTop }, indicatorStyle]}
            />
          )}
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
                <View style={styles.iconBubble}>
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
          </View>
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
  tabListFrame: {
    flex: 1,
  },
  tabList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: TAB_LIST_H_PADDING,
    paddingVertical: TAB_LIST_V_PADDING,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: tokens.colors.primary[500],
    shadowColor: tokens.colors.primary[500],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.36,
    shadowRadius: 8,
    elevation: 4,
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
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
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
