import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

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

export default function AppNavigator() {
  console.log('🏠 [AppNavigator] Component rendering started');
  
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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