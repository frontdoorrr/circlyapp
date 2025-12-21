import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Main Layout with Tabs
 *
 * 메인 화면 탭 레이아웃
 * - 3탭 구조: Home, Create, Profile
 * - Gas 앱 스타일 탭바
 */
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
        },
        tabBarActiveTintColor: '#667eea', // primary-500
        tabBarInactiveTintColor: '#A3A3A3', // gray-400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: '만들기',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => null, // TODO: Add icon
        }}
      />
    </Tabs>
  );
}
