import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useCircleStore } from '../../store';
import type { NavigationProp } from '@react-navigation/native';

export default function CreateCircleScreen() {
  const navigation = useNavigation();
  const { createCircle, loading, error } = useCircleStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Circle name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Circle name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Circle name must be less than 100 characters';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateShareMessage = (circle: any) => {
    const inviteLink = `https://circly.app/join/${circle.id}`;
    return `🎉 Circly에서 익명 투표해요!
Circle: ${circle.name}
코드: ${circle.invite_code}
링크: ${inviteLink}

24시간 후 만료되니 지금 바로 참여하세요! 📱`;
  };

  const handleShareInviteCode = async (circle: any) => {
    try {
      const shareMessage = generateShareMessage(circle);
      const inviteLink = `https://circly.app/join/${circle.id}`;
      
      const result = await Share.share({
        message: shareMessage,
        url: inviteLink, // iOS에서 링크를 별도로 처리
        title: 'Circle 초대하기'
      }, {
        dialogTitle: 'Circle 초대하기',
        subject: `${circle.name} Circle에 초대합니다!` // 이메일 제목용
      });
      
      console.log('Share result:', result);
      
      // 공유 완료 후 CircleDetail로 이동
      // iOS에서는 result.action이 Share.sharedAction일 때만 공유됨
      // Android에서는 항상 Share.sharedAction 반환
      if (result.action === Share.sharedAction || Platform.OS === 'android') {
        (navigation as any).navigate('CircleDetail', { circleId: circle.id });
      } else if (result.action === Share.dismissedAction) {
        // 사용자가 공유를 취소한 경우에도 CircleDetail로 이동
        (navigation as any).navigate('CircleDetail', { circleId: circle.id });
      }
      
    } catch (error) {
      console.error('Error sharing invite code:', error);
      Alert.alert(
        'Sharing Failed',
        'Failed to share invite code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const circle = await createCircle(formData);
      if (circle) {
        Alert.alert(
          'Circle Created!',
          `Your circle "${circle.name}" has been created successfully.\n\nInvite Code: ${circle.invite_code}`,
          [
            {
              text: 'Share Invite Code',
              onPress: () => handleShareInviteCode(circle),
            },
            {
              text: 'Go to Circle',
              onPress: () => {
                (navigation as any).navigate('CircleDetail', { circleId: circle.id });
              },
              style: 'default',
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Creation Failed',
        error.message || 'Failed to create circle. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
          <Text style={styles.title}>Create New Circle</Text>
          <Text style={styles.subtitle}>
            Create a group where you and your friends can participate in fun polls together
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Circle Name *</Text>
            <Input
              value={formData.name}
              onChangeText={(value: string) => handleInputChange('name', value)}
              placeholder="Enter circle name (e.g., College Friends)"
              maxLength={100}
              error={errors.name}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <Input
              value={formData.description}
              onChangeText={(value: string) => handleInputChange('description', value)}
              placeholder="What's this circle about? (e.g., For our weekly game nights)"
              maxLength={500}
              multiline
              numberOfLines={3}
              error={errors.description}
            />
            <Text style={styles.characterCount}>
              {formData.description.length}/500
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Create Circle"
              onPress={handleCreate}
              loading={loading}
              disabled={loading || !formData.name.trim()}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            • You'll get a unique invite code to share with friends{'\n'}
            • Friends can join using the code or invite link{'\n'}
            • Start creating polls and have fun voting together!
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
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  buttonContainer: {
    marginTop: 10,
  },
  infoSection: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});