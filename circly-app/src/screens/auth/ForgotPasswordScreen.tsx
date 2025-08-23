import React, { useState, useEffect, useRef } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { authApi } from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
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

  const handleResetRequest = async () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      await authApi.requestPasswordReset({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      Alert.alert('오류', err.message || '비밀번호 재설정 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (sent) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.successContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>이메일을 확인하세요</Text>
            <Text style={styles.successMessage}>
              비밀번호 재설정 링크를 {email}으로 발송했습니다.{'\n\n'}
              이메일을 확인하시고 링크를 클릭해서 비밀번호를 재설정해주세요.
            </Text>
            
            <Button
              title="로그인으로 돌아가기"
              onPress={handleBackToLogin}
              style={styles.backButton}
            />
            
            <TouchableOpacity 
              style={styles.resendLink}
              onPress={() => {
                setSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendLinkText}>
                다른 이메일로 재전송
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
          <Text style={styles.title}>비밀번호 찾기</Text>
          <Text style={styles.subtitle}>
            등록된 이메일로 재설정 링크를 보내드립니다
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
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="재설정 링크 보내기"
            onPress={handleResetRequest}
            loading={loading}
            style={styles.resetButton}
          />

          <TouchableOpacity 
            style={styles.backLink}
            onPress={handleBackToLogin}
          >
            <Text style={styles.backLinkText}>
              로그인으로 돌아가기
            </Text>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              💡 이메일을 받지 못하셨나요?{'\n'}
              스팸 폴더도 확인해보세요.
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
  resetButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  backLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
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
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
    width: '100%',
  },
  resendLink: {
    alignItems: 'center',
  },
  resendLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});