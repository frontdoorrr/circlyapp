import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Device from 'expo-device';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function LoginScreen() {
  const [deviceId, setDeviceId] = useState('');
  const { login, loading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      // Use provided device ID or generate one from device info
      const finalDeviceId = deviceId.trim() || 
        `${Device.osName}_${Device.modelName}_${Date.now()}`;
      
      await login({ device_id: finalDeviceId });
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong');
    }
  };

  const handleQuickLogin = async () => {
    try {
      // Generate a quick device ID
      const quickDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await login({ device_id: quickDeviceId });
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Circly</Text>
          <Text style={styles.subtitle}>
            Create polls and gather opinions from your circle
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Device ID (Optional)"
            placeholder="Leave empty for auto-generation"
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title="Login with Device ID"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <Button
            title="Quick Login"
            onPress={handleQuickLogin}
            variant="outline"
            loading={loading}
            style={styles.quickLoginButton}
          />

          <Text style={styles.helpText}>
            Device-based login means your account is tied to this device. 
            No password required!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginBottom: 12,
  },
  quickLoginButton: {
    marginBottom: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});