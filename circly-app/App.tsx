import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';

export default function App() {
  console.log('🚀 [App] Component rendering started');
  
  return (
    <SafeAreaProvider>
      <AuthNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}