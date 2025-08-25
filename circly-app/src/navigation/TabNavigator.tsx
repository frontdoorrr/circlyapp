import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabParamList } from '../types';
import { tokens } from '../styles/tokens';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import CreateScreen from '../screens/create/CreateScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// 커스텀 그라데이션 헤더 컴포넌트
const GradientHeader = ({ title }: { title: string }) => {
  return (
    <LinearGradient
      colors={tokens.gradients.primary}
      style={styles.gradientHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.headerTitle}>{title}</Text>
    </LinearGradient>
  );
};

export default function TabNavigator() {
  console.log('📱 [TabNavigator] Component rendering started');
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        header: ({ options }) => (
          <GradientHeader title={options.headerTitle || options.title || ''} />
        ),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'Home',
        }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        options={{
          title: 'Create',
          headerTitle: 'Create Poll',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    height: Platform.OS === 'ios' ? 100 : 80, // Status bar + header height
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});