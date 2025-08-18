import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useCircleStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface RouteParams {
  inviteCode?: string;
}

export default function JoinCircleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { joinCircle, loading, error, clearError } = useCircleStore();
  
  const routeParams = (route.params as RouteParams) || {};
  
  const [inviteCode, setInviteCode] = useState(routeParams.inviteCode || '');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const validateInviteCode = (code: string) => {
    if (!code.trim()) {
      return 'Invite code is required';
    }
    // PRD: 6자리 코드 시스템
    if (code.length !== 6) {
      return 'Invite code must be exactly 6 characters';
    }
    // PRD: 숫자+영문 대문자 조합 (예: A1B2C3)
    if (!/^[A-Z0-9]{6}$/i.test(code)) {
      return 'Invite code must contain only letters and numbers';
    }
    return '';
  };

  const handleJoin = async () => {
    const trimmedCode = inviteCode.trim().toUpperCase();
    
    const validationResult = validateInviteCode(trimmedCode);
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    try {
      const circle = await joinCircle({ invite_code: trimmedCode });
      
      if (circle) {
        Alert.alert(
          'Successfully Joined!',
          `Welcome to "${circle.name}"! You can now participate in polls and see other members.`,
          [
            {
              text: 'Go to Circle',
              onPress: () => {
                (navigation as any).navigate('CircleDetail', { circleId: circle.id });
              },
              style: 'default',
            },
            {
              text: 'View My Circles',
              onPress: () => {
                (navigation as any).navigate('Home');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      let errorMessage = 'Failed to join circle. Please try again.';
      
      if (error.message.includes('Invalid invite code')) {
        errorMessage = 'Invalid invite code. Please check and try again.';
      } else if (error.message.includes('Already a member')) {
        errorMessage = 'You are already a member of this circle.';
      } else if (error.message.includes('Circle not found')) {
        errorMessage = 'This invite code is expired or invalid.';
      }
      
      Alert.alert('Join Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const handleInputChange = (value: string) => {
    // PRD: 숫자/영문 자동 대문자 변환, 실시간 입력 검증
    const processedValue = value
      .toUpperCase() // 자동 대문자 변환
      .replace(/[^A-Z0-9]/g, '') // 영문/숫자만 허용
      .slice(0, 6); // 6자리 제한
    
    setInviteCode(processedValue);
    
    // 실시간 입력 검증
    if (processedValue.length > 0) {
      const validationResult = validateInviteCode(processedValue);
      setValidationError(validationResult);
    } else {
      setValidationError('');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setInviteCode(clipboardContent.trim().toUpperCase());
        setValidationError('');
      }
    } catch (error) {
      console.warn('Failed to read clipboard:', error);
    }
  };

  const clearInput = () => {
    setInviteCode('');
    setValidationError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people-circle-outline" size={80} color="#007AFF" />
          </View>
          <Text style={styles.title}>Join a Circle</Text>
          <Text style={styles.subtitle}>
            Enter the invite code shared by your friend to join their circle
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Invite Code *</Text>
            <View style={styles.inputContainer}>
              <Input
                value={inviteCode}
                onChangeText={handleInputChange}
                placeholder="Enter 6-digit code (e.g., A1B2C3)"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
                error={validationError}
                style={styles.input}
              />
              <View style={styles.inputActions}>
                {inviteCode ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={clearInput}
                    accessibilityLabel="Clear input"
                  >
                    <Ionicons name="close-circle" size={24} color="#999" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={pasteFromClipboard}
                    accessibilityLabel="Paste from clipboard"
                  >
                    <Ionicons name="clipboard-outline" size={24} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Join Circle"
              onPress={handleJoin}
              loading={loading}
              disabled={loading || !inviteCode.trim()}
            />
          </View>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpText}>
            • Ask your friend to share the invite code with you{'\n'}
            • Make sure the code is exactly as shown{'\n'}
            • Invite codes are case-insensitive{'\n'}
            • Some codes may expire after a certain time
          </Text>
        </View>

        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeTitle}>Don't have a code?</Text>
          <Button
            title="Create Your Own Circle"
            onPress={() => (navigation as any).navigate('CreateCircle')}
            variant="outline"
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    paddingRight: 50, // Make room for action button
  },
  inputActions: {
    position: 'absolute',
    right: 12,
    top: 12,
    height: 44,
    justifyContent: 'center',
  },
  actionButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
  },
  buttonContainer: {
    marginTop: 10,
  },
  helpSection: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  alternativeSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
});