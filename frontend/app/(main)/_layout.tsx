import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../src/theme';
import { useTheme } from '../../src/theme/ThemeContext';

/**
 * Main Layout with Tabs
 *
 * 메인 화면 탭 레이아웃
 * - 4탭 구조: Home, 받은하트, Circle, Profile
 * - Gas 앱 스타일 탭바
 * - Safe Area 대응
 * - 다크모드 지원
 */
export default function MainLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      initialRouteName="(0-home)"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.md,
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          ...(isDark ? {} : tokens.shadows.sm),
        },
        tabBarActiveTintColor: tokens.colors.primary[isDark ? 400 : 500],
        tabBarInactiveTintColor: theme.textTertiary,
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
        name="(0-home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(1-inbox)"
        options={{
          title: '받은하트',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(1-circle)"
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people-circle' : 'people-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(2-profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
