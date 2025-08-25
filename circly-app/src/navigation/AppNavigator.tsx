import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';
import { tokens } from '../styles/tokens';

// Import navigators and screens
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import CircleDetailScreen from '../screens/circle/CircleDetailScreen';
import CreateCircleScreen from '../screens/circle/CreateCircleScreen';
import JoinCircleScreen from '../screens/circle/JoinCircleScreen';
import CreatePollScreen from '../screens/poll/CreatePollScreen';
import PollDetailScreen from '../screens/poll/PollDetailScreen';
import { PollListScreen } from '../screens/poll/PollListScreen';
import { PollParticipationScreen } from '../screens/poll/PollParticipationScreen';
import { PollResultsScreen } from '../screens/poll/PollResultsScreen';

const Stack = createStackNavigator<RootStackParamList>();

// 커스텀 그라데이션 헤더 컴포넌트 (뒤로가기 버튼 포함)
const GradientStackHeader = ({ 
  title, 
  canGoBack, 
  onGoBack 
}: { 
  title: string; 
  canGoBack?: boolean; 
  onGoBack?: () => void; 
}) => {
  return (
    <LinearGradient
      colors={tokens.gradients.primary}
      style={styles.gradientHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerContent}>
        {canGoBack && (
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </LinearGradient>
  );
};

export default function AppNavigator() {
  console.log('🏠 [AppNavigator] Component rendering started');
  
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <GradientStackHeader
            title={options.title || route.name}
            canGoBack={navigation.canGoBack()}
            onGoBack={navigation.goBack}
          />
        ),
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CircleDetail" 
        component={CircleDetailScreen}
        options={({ route }) => ({
          title: 'Circle Details',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="CreateCircle" 
        component={CreateCircleScreen}
        options={{
          title: 'Create Circle',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JoinCircle" 
        component={JoinCircleScreen}
        options={{
          title: 'Join Circle',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="CreatePoll" 
        component={CreatePollScreen}
        options={{
          title: 'Create Poll',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PollDetail" 
        component={PollDetailScreen}
        options={{
          title: 'Poll Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PollList" 
        component={PollListScreen}
        options={({ route }) => ({
          title: `${route.params?.circleName} 투표`,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="PollParticipation" 
        component={PollParticipationScreen}
        options={{
          title: '투표 참여',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PollResults" 
        component={PollResultsScreen}
        options={{
          title: '투표 결과',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Import ProfileScreen (will be imported from Tab as well)
import ProfileScreen from '../screens/profile/ProfileScreen';

const styles = StyleSheet.create({
  gradientHeader: {
    height: Platform.OS === 'ios' ? 100 : 80, // Status bar + header height
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
});