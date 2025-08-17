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
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function SimpleLoginScreen() {
  const [deviceId, setDeviceId] = useState('');
  const { login, loading, error } = useAuthStore();

  const generateSimpleDeviceId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `simple_${timestamp}_${random}`;
  };

  const handleLogin = async () => {
    try {
      const finalDeviceId = deviceId.trim() || generateSimpleDeviceId();
      await login({ device_id: finalDeviceId });
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong');
    }
  };

  const handleQuickLogin = async () => {
    try {
      const quickDeviceId = generateSimpleDeviceId();
      await login({ device_id: quickDeviceId });
    } catch (err: any) {
      Alert.alert('Quick Login Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
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
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              🔒 Device-based login means your account is tied to this device.{'\n'}
              📱 No password required - secure and simple!
            </Text>
          </View>
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
    paddingTop: 60,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  buttonContainer: {
    marginTop: 8,
  },
  loginButton: {
    marginBottom: 12,
  },
  quickLoginButton: {
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  helpSection: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});