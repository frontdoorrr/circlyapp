import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useAuthStore } from '../../store';
import { authApi } from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    profileEmoji: '😊',
  });
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values - useRef to prevent recreation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, []);

  const checkPasswordStrength = useCallback(async (password: string) => {
    try {
      const strength = await authApi.checkPasswordStrength(password);
      setPasswordStrength(strength);
    } catch (err) {
      console.warn('Password strength check failed:', err);
      // 네트워크 오류 시 기본값으로 설정
      setPasswordStrength({
        score: 1,
        max_score: 5,
        issues: ['서버와 연결할 수 없습니다. 나중에 다시 시도해주세요.'],
        is_valid: false
      });
    }
  }, []);

  // Check password strength when password changes (with debouncing)
  useEffect(() => {
    if (formData.password.length > 0) {
      const timeoutId = setTimeout(() => {
        checkPasswordStrength(formData.password);
      }, 500); // 500ms 디바운싱
      
      return () => clearTimeout(timeoutId);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password, checkPasswordStrength]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    if (!formData.username.trim()) {
      setError('사용자명을 입력해주세요.');
      return false;
    }

    if (passwordStrength && !passwordStrength.is_valid) {
      setError('비밀번호가 보안 기준을 충족하지 않습니다.');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await authApi.register({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        username: formData.username.trim(),
        display_name: formData.displayName.trim() || formData.username.trim(),
        profile_emoji: formData.profileEmoji,
      });
      
      if (result) {
        Alert.alert(
          '회원가입 성공!',
          '이메일 인증을 위해 메일함을 확인해주세요.',
          [{ text: '확인', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '#ddd';
    if (passwordStrength.score >= 4) return '#4caf50';
    if (passwordStrength.score >= 3) return '#ff9800';
    return '#f44336';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.score >= 4) return '매우 강함';
    if (passwordStrength.score >= 3) return '강함';
    if (passwordStrength.score >= 2) return '보통';
    return '약함';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        enabled={true}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
          scrollEnabled={true}
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
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            이메일 계정으로 더 안전하게 시작하세요
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
            label="이메일"
            placeholder="your@email.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="사용자명"
            placeholder="username"
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="표시 이름"
            placeholder="친구들에게 보여질 이름"
            value={formData.displayName}
            onChangeText={(value) => handleInputChange('displayName', value)}
          />

          <Input
            label="비밀번호"
            placeholder="안전한 비밀번호를 입력하세요"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules="minlength: 8;"
            importantForAutofill="no"
          />

          {passwordStrength && (
            <View style={styles.passwordStrength}>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill,
                    { 
                      width: `${(passwordStrength.score / passwordStrength.max_score) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                {getPasswordStrengthText()}
              </Text>
              {passwordStrength.issues.length > 0 && (
                <View style={styles.strengthIssues}>
                  {passwordStrength.issues.map((issue: string, index: number) => (
                    <Text key={index} style={styles.issueText}>• {issue}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <Input
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules="minlength: 8;"
            importantForAutofill="no"
          />

          {error && (
            <Animated.View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Button
            title="회원가입"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              이미 계정이 있으신가요? 로그인하기
            </Text>
          </TouchableOpacity>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 200 : 120, // iOS에서 키보드 공간 확보
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
  passwordStrength: {
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  strengthIssues: {
    marginTop: 4,
  },
  issueText: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 2,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
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
});