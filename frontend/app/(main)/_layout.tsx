import { Tabs } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useReceivedHearts } from '../../src/hooks/usePolls';
import { FloatingTabBar } from '../../src/components/navigation/FloatingTabBar';

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
  const reduceMotion = useReducedMotion();
  const { data: receivedHearts } = useReceivedHearts();
  const unreadHeartCount =
    receivedHearts?.reduce((sum, item) => sum + (item.is_read ? 0 : item.received_count), 0) ?? 0;

  return (
    <Tabs
      initialRouteName="(0-home)"
      tabBar={(props) => (
        <FloatingTabBar {...props} unreadHeartCount={unreadHeartCount} />
      )}
      screenOptions={{
        headerShown: false,
        animation: reduceMotion ? 'none' : 'fade',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="(0-home)"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="(1-inbox)"
        options={{
          title: '받은하트',
          tabBarBadge: unreadHeartCount > 0 ? unreadHeartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="(1-circle)"
        options={{
          title: 'Circle',
        }}
      />
      <Tabs.Screen
        name="(2-profile)"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
