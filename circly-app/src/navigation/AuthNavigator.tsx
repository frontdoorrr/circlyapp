import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store';
import AppNavigator from './AppNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import { View, ActivityIndicator } from 'react-native';

export default function AuthNavigator() {
  const { isAuthenticated, loading, token, getCurrentUser } = useAuthStore();

  useEffect(() => {
    // If we have a token but no current user, try to get user info
    if (token && !loading) {
      getCurrentUser();
    }
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}