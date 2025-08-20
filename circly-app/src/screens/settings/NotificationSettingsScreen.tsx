/**
 * 알림 설정 화면
 * TRD 06-notification-system.md의 알림 설정 요구사항 기반
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications, NotificationSettings } from '../../hooks/useNotifications';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    permissionStatus,
    settings,
    updateSettings,
    requestPermissions,
    isLoading,
    error,
  } = useNotifications();
  
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(
    settings || {
      poll_created: true,
      poll_deadline: true,
      poll_results: true,
      circle_invites: true,
    }
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions();
    
    if (!granted) {
      Alert.alert(
        '알림 권한이 필요합니다',
        '설정에서 알림을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => {
            // TODO: 시스템 설정 앱으로 이동
            console.log('Open system settings');
          }},
        ]
      );
    }
  };

  const handleSettingToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    try {
      await updateSettings(newSettings);
    } catch (err) {
      // 실패 시 원래 상태로 되돌림
      setLocalSettings(localSettings);
      Alert.alert('오류', '설정 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const SettingItem: React.FC<{
    title: string;
    description: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    icon: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
  }> = ({ title, description, value, onToggle, icon, disabled = false }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={disabled ? '#999' : '#007AFF'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>설정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const permissionGranted = permissionStatus?.granted || false;

  return (
    <LinearGradient colors={['#F8F9FF', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 권한 상태 */}
          {!permissionGranted && (
            <View style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <Ionicons name="notifications-off" size={32} color="#FF3B30" />
                <Text style={styles.permissionTitle}>알림 권한이 필요합니다</Text>
              </View>
              <Text style={styles.permissionDescription}>
                투표 관련 중요한 소식을 놓치지 마세요!{'\n'}
                알림을 허용하면 새로운 투표와 결과를 즉시 받아볼 수 있습니다.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handlePermissionRequest}
                testID="enable-notifications"
              >
                <Text style={styles.permissionButtonText}>알림 허용하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 에러 표시 */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 알림 설정 목록 */}
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>투표 알림</Text>
            
            <SettingItem
              title="새 투표 생성"
              description="서클에 새로운 투표가 생성되면 알림을 받습니다"
              value={localSettings.poll_created}
              onToggle={(value) => handleSettingToggle('poll_created', value)}
              icon="add-circle"
              disabled={!permissionGranted}
            />

            <View style={styles.separator} />

            <SettingItem
              title="투표 마감 알림"
              description="참여하지 않은 투표가 곧 마감될 때 알림을 받습니다"
              value={localSettings.poll_deadline}
              onToggle={(value) => handleSettingToggle('poll_deadline', value)}
              icon="time"
              disabled={!permissionGranted}
            />

            <View style={styles.separator} />

            <SettingItem
              title="투표 결과 발표"
              description="참여한 투표의 결과가 발표되면 알림을 받습니다"
              value={localSettings.poll_results}
              onToggle={(value) => handleSettingToggle('poll_results', value)}
              icon="bar-chart"
              disabled={!permissionGranted}
            />
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>서클 알림</Text>
            
            <SettingItem
              title="서클 초대"
              description="새로운 서클에 초대되면 알림을 받습니다"
              value={localSettings.circle_invites}
              onToggle={(value) => handleSettingToggle('circle_invites', value)}
              icon="people"
              disabled={!permissionGranted}
            />
          </View>

          {/* 도움말 */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle" size={20} color="#007AFF" />
              <Text style={styles.helpTitle}>알림이 오지 않나요?</Text>
            </View>
            <Text style={styles.helpText}>
              • 기기 설정에서 Circly 앱의 알림이 허용되었는지 확인해주세요{'\n'}
              • 배터리 절약 모드가 활성화되어 있으면 알림이 지연될 수 있습니다{'\n'}
              • 방해 금지 모드나 무음 모드를 확인해주세요
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  permissionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  disabledText: {
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 76,
    marginRight: 20,
  },
  helpCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E9FF',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;