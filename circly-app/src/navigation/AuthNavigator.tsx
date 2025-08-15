import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store';
import AppNavigator from './AppNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function AuthNavigator() {
  const { isAuthenticated, loading, restoreAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to restore authentication state
        await restoreAuth();
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Show splash screen while initializing
  if (isInitializing || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>Circly</Text>
        <ActivityIndicator 
          size="large" 
          color="#007AFF" 
          style={styles.loadingIndicator}
        />
        <Text style={styles.loadingText}>
          {isInitializing ? 'Starting up...' : 'Authenticating...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <LoginScreen />}
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