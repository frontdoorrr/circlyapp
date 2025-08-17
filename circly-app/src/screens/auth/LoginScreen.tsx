import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function LoginScreen() {
  console.log('📱 [LoginScreen] Component rendering started');
  
  const [deviceId, setDeviceId] = useState('');
  const { login, loading, error } = useAuthStore();
  
  console.log('📱 [LoginScreen] Auth state:', { loading, error });
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    console.log('📱 [LoginScreen] useEffect started - setting up animation');
    
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('📱 [LoginScreen] Animation completed');
    });

  }, []);

  const generateDeviceId = (customPrefix?: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    if (customPrefix) {
      return `${customPrefix}_${timestamp}_${random}`;
    }
    
    return `ios_device_${timestamp}_${random}`;
  };

  const handleLogin = async () => {
    console.log('📱 [LoginScreen] Login button pressed');
    try {
      const finalDeviceId = deviceId.trim() || generateDeviceId();
      console.log('📱 [LoginScreen] Attempting login with device_id:', finalDeviceId);
      await login({ device_id: finalDeviceId });
      console.log('📱 [LoginScreen] Login successful');
    } catch (err: any) {
      console.log('📱 [LoginScreen] Login failed:', err.message);
      Alert.alert(
        'Login Failed', 
        err.message || 'Something went wrong. Please try again.',
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Try Quick Login', 
            style: 'default', 
            onPress: handleQuickLogin 
          }
        ]
      );
    }
  };

  const handleQuickLogin = async () => {
    try {
      const quickDeviceId = generateDeviceId('quick');
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
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Welcome to Circly</Text>
          <Text style={styles.subtitle}>
            Create polls and gather opinions from your circle
          </Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >

          <Input
            label="Device ID (Optional)"
            placeholder="Leave empty for auto-generation"
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <Animated.View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
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
        </Animated.View>
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