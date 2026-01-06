/**
 * Join Circle Modal Component
 *
 * Circle 참여를 위한 초대 코드 입력 모달
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useJoinCircle } from '../../hooks/useCircles';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';
import { ApiError } from '../../types/api';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function JoinCircleModal({ isOpen, onClose, onSuccess }: JoinCircleModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');

  const joinMutation = useJoinCircle();

  const handleJoin = async () => {
    // 입력 검증
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      Alert.alert('입력 오류', '초대 코드는 6자리입니다');
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('입력 오류', 'Circle 내에서 사용할 닉네임을 입력해주세요');
      return;
    }

    try {
      await joinMutation.mutateAsync({
        invite_code: inviteCode.toUpperCase(),
        nickname: nickname.trim(),
      });

      // 성공
      Alert.alert('성공', 'Circle에 참여했습니다!');
      handleClose();
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('참여 실패', error.message);
      } else {
        Alert.alert('오류', 'Circle 참여 중 문제가 발생했습니다');
      }
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setNickname('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modal}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>Circle 참여하기</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 아이콘 */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎯</Text>
          </View>

          {/* 설명 */}
          <Text style={styles.description}>
            친구에게 받은 초대 코드와{'\n'}Circle 내에서 사용할 닉네임을 입력해주세요
          </Text>

          {/* 입력 폼 */}
          <View style={styles.form}>
            <Input
              placeholder="초대 코드 (6자리)"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              editable={!joinMutation.isPending}
            />

            <Input
              placeholder="닉네임"
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              editable={!joinMutation.isPending}
            />

            <Text style={styles.hint}>
              초대 코드는 6자리 영문+숫자예요
            </Text>
          </View>

          {/* 버튼 */}
          <View style={styles.actions}>
            <Button
              onPress={handleJoin}
              loading={joinMutation.isPending}
              disabled={!inviteCode.trim() || !nickname.trim()}
              fullWidth
            >
              참여하기
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.borderRadius.xl,
    borderTopRightRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    color: tokens.colors.neutral[500],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  icon: {
    fontSize: 64,
    lineHeight: 76,
    textAlign: 'center',
  },
  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing.lg,
  },
  form: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  hint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
  },
  actions: {
    gap: tokens.spacing.sm,
  },
});
