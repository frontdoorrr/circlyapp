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
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function LoginScreen() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const { login, loading, error } = useAuthStore();
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
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
    ]).start();

    // Load device info and previous device ID
    loadDeviceInfo();
    loadPreviousDeviceId();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = `${Device.osName || 'Unknown'} ${Device.modelName || 'Device'}`;
      setDeviceInfo(info);
    } catch (error) {
      console.warn('Failed to load device info:', error);
      setDeviceInfo('Unknown Device');
    }
  };

  const loadPreviousDeviceId = async () => {
    try {
      const savedDeviceId = await AsyncStorage.getItem('last_device_id');
      if (savedDeviceId) {
        setDeviceId(savedDeviceId);
      }
    } catch (error) {
      console.warn('Failed to load previous device ID:', error);
    }
  };

  const generateDeviceId = (customPrefix?: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const osInfo = Device.osName?.toLowerCase().replace(/\s+/g, '') || 'unknown';
    const modelInfo = Device.modelName?.toLowerCase().replace(/\s+/g, '') || 'device';
    
    if (customPrefix) {
      return `${customPrefix}_${timestamp}_${random}`;
    }
    
    return `${osInfo}_${modelInfo}_${timestamp}_${random}`;
  };

  const saveDeviceId = async (id: string) => {
    try {
      await AsyncStorage.setItem('last_device_id', id);
    } catch (error) {
      console.warn('Failed to save device ID:', error);
    }
  };

  const handleLogin = async () => {
    try {
      // Use provided device ID or generate one from device info
      const finalDeviceId = deviceId.trim() || generateDeviceId();
      
      // Save device ID for future use
      await saveDeviceId(finalDeviceId);
      
      await login({ device_id: finalDeviceId });
    } catch (err: any) {
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
      // Generate a quick device ID
      const quickDeviceId = generateDeviceId('quick');
      
      // Save device ID for future use
      await saveDeviceId(quickDeviceId);
      
      await login({ device_id: quickDeviceId });
    } catch (err: any) {
      Alert.alert('Quick Login Failed', err.message || 'Something went wrong');
    }
  };

  const toggleDeviceInfo = () => {
    setShowDeviceInfo(!showDeviceInfo);
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
          {/* Device Info Section */}
          <View style={styles.deviceInfoSection}>
            <Button
              title={showDeviceInfo ? "Hide Device Info" : "Show Device Info"}
              onPress={toggleDeviceInfo}
              variant="outline"
              size="small"
              style={styles.deviceInfoToggle}
            />
            
            {showDeviceInfo && (
              <Animated.View style={styles.deviceInfoCard}>
                <Text style={styles.deviceInfoTitle}>Current Device</Text>
                <Text style={styles.deviceInfoText}>{deviceInfo}</Text>
                <Text style={styles.deviceInfoSubtext}>
                  This information helps create a unique identifier for your device
                </Text>
              </Animated.View>
            )}
          </View>

          <Input
            label="Device ID (Optional)"
            placeholder={deviceId ? "Using saved Device ID" : "Leave empty for auto-generation"}
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Device ID input field"
            accessibilityHint="Enter a custom device ID or leave empty for automatic generation"
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
              accessibilityLabel="Login with device ID"
              accessibilityHint="Login using the device ID above or auto-generated one"
            />

            <Button
              title="Quick Login"
              onPress={handleQuickLogin}
              variant="outline"
              loading={loading}
              style={styles.quickLoginButton}
              accessibilityLabel="Quick login"
              accessibilityHint="Login instantly with auto-generated device ID"
            />
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              🔒 Device-based login means your account is tied to this device.{'\n'}
              📱 No password required - secure and simple!
            </Text>
            
            {deviceId && (
              <Text style={styles.savedIdText}>
                ✅ Using saved Device ID from previous login
              </Text>
            )}
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
  deviceInfoSection: {
    marginBottom: 20,
  },
  deviceInfoToggle: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  deviceInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  deviceInfoSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
  savedIdText: {
    fontSize: 12,
    color: '#4caf50',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});