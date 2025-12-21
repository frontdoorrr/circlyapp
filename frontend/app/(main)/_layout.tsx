import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { tokens } from '../../src/theme';

/**
 * Main Layout with Tabs
 *
 * 메인 화면 탭 레이아웃
 * - 3탭 구조: Home, Create, Profile
 * - Gas 앱 스타일 탭바
 * - Safe Area 대응
 */
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.md,
          backgroundColor: tokens.colors.white,
          borderTopWidth: 1,
          borderTopColor: tokens.colors.neutral[200],
          ...tokens.shadows.sm,
        },
        tabBarActiveTintColor: tokens.colors.primary[500],
        tabBarInactiveTintColor: tokens.colors.neutral[400],
        tabBarLabelStyle: {
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.medium,
          fontFamily: tokens.typography.fontFamily.sans,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon (Ionicons: home)
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: '만들기',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon (Ionicons: add-circle)
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon (Ionicons: person)
        }}
      />
    </Tabs>
  );
}
