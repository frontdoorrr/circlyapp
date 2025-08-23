import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store';
import AppNavigator from './AppNavigator';
import AuthStackNavigator from './AuthStackNavigator';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function AuthNavigator() {
  console.log('🔄 [AuthNavigator] Component rendering started');
  
  const { isAuthenticated, loading } = useAuthStore();
  
  console.log('🔄 [AuthNavigator] Auth state:', { isAuthenticated, loading });

  // Show loading only during actual login/logout operations
  if (loading) {
    console.log('🔄 [AuthNavigator] Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>Circly</Text>
        <ActivityIndicator 
          size="large" 
          color="#007AFF" 
          style={styles.loadingIndicator}
        />
        <Text style={styles.loadingText}>
          Authenticating...
        </Text>
      </View>
    );
  }

  console.log('🔄 [AuthNavigator] Rendering main navigation');
  console.log('🔄 [AuthNavigator] Will show:', isAuthenticated ? 'AppNavigator' : 'LoginScreen');
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 40,
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});