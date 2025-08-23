import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface AccountMigrationScreenProps {
  navigation: any;
}

export default function AccountMigrationScreen({ navigation }: AccountMigrationScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [benefits, setBenefits] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, migrateAccount } = useAuthStore();
  
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

    // Load migration benefits
    loadMigrationBenefits();
  }, []);

  const loadMigrationBenefits = async () => {
    // This would typically come from the API
    setBenefits({
      can_migrate_to_email: true,
      migration_benefits: [
        '디바이스 변경 시 계정 유지',
        '비밀번호 기반 보안',
        '마이그레이션 특별 배지',
        '추가 기능 접근 권한'
      ],
      requirements: [
        '이메일 주소 등록',
        '안전한 비밀번호 설정',
        '이메일 인증 완료'
      ]
    });
  };

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
    
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return false;
    }
    
    return true;
  };

  const handleMigration = async () => {
    if (!validateForm()) return;
    
    Alert.alert(
      '계정 마이그레이션',
      '디바이스 계정을 이메일 계정으로 업그레이드하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: performMigration }
      ]
    );
  };

  const performMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await migrateAccount({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      
      Alert.alert(
        '마이그레이션 완료!',
        '계정이 성공적으로 이메일 계정으로 업그레이드되었습니다. 이메일 인증을 위해 메일함을 확인해주세요.',
        [{ text: '확인', onPress: () => navigation.navigate('Profile') }]
      );
    } catch (err: any) {
      setError(err.message || '계정 마이그레이션에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      '마이그레이션 건너뛰기',
      '나중에 언제든지 프로필 설정에서 계정을 업그레이드할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => navigation.goBack() }
      ]
    );
  };

  if (!user || user.account_type !== 'device') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            디바이스 계정만 마이그레이션할 수 있습니다.
          </Text>
        </View>
      </View>
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
          <Text style={styles.title}>계정 업그레이드</Text>
          <Text style={styles.subtitle}>
            더 안전하고 편리한 이메일 계정으로 업그레이드하세요
          </Text>
        </Animated.View>

        {benefits && (
          <Animated.View 
            style={[
              styles.benefitsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.benefitsTitle}>🎁 업그레이드 혜택</Text>
            {benefits.migration_benefits.map((benefit: string, index: number) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitText}>✅ {benefit}</Text>
              </View>
            ))}
          </Animated.View>
        )}

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
            label="새 비밀번호"
            placeholder="안전한 비밀번호를 입력하세요"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <Animated.View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Button
            title="계정 업그레이드"
            onPress={handleMigration}
            loading={loading}
            style={styles.migrateButton}
          />

          <TouchableOpacity 
            style={styles.skipLink}
            onPress={handleSkip}
          >
            <Text style={styles.skipLinkText}>
              나중에 하기
            </Text>
          </TouchableOpacity>

          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              ⚠️ 업그레이드 후에는 기존 디바이스 ID로 로그인할 수 없습니다.{'\n'}
              새로운 이메일과 비밀번호를 사용해 로그인해야 합니다.
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
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
  benefitsSection: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitItem: {
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  migrateButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  skipLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  skipLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  warningSection: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
    textAlign: 'center',
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