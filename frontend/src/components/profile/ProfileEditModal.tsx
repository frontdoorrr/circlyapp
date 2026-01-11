/**
 * Profile Edit Modal Component
 *
 * 프로필 수정 모달
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { UserUpdate } from '../../types/auth';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';

interface ProfileEditModalProps {
  isOpen: boolean;
  initialData: {
    username?: string | null;
    display_name?: string | null;
    profile_emoji?: string;
  };
  onSubmit: (data: UserUpdate) => Promise<void>;
  onClose: () => void;
}

// 이모지 옵션 확장 (12개 → 32개)
const EMOJI_OPTIONS = [
  // 얼굴
  '😊', '😎', '🥳', '😇', '🤩', '😋', '🤗', '🥰',
  // 동물
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯',
  // 자연/음식
  '🌟', '🌈', '🔥', '💎', '🍀', '🌸', '🍕', '🍩',
  // 활동
  '⚽', '🎮', '🎨', '🎵', '📚', '💻', '🚀', '✨',
];

// 검증 규칙 (백엔드와 통일)
const VALIDATION = {
  username: { min: 2, max: 50 },
  display_name: { max: 100 },
};

interface FieldErrors {
  username?: string;
  display_name?: string;
}

export function ProfileEditModal({
  isOpen,
  initialData,
  onSubmit,
  onClose,
}: ProfileEditModalProps) {
  const [username, setUsername] = useState(initialData.username || '');
  const [displayName, setDisplayName] = useState(initialData.display_name || '');
  const [selectedEmoji, setSelectedEmoji] = useState(initialData.profile_emoji || '😊');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // 필드 검증 함수
  const validateField = useCallback((field: 'username' | 'display_name', value: string): string | undefined => {
    if (field === 'username' && value && value.length < VALIDATION.username.min) {
      return `사용자명은 최소 ${VALIDATION.username.min}자 이상이어야 합니다`;
    }
    if (field === 'username' && value && value.length > VALIDATION.username.max) {
      return `사용자명은 ${VALIDATION.username.max}자 이하여야 합니다`;
    }
    if (field === 'display_name' && value && value.length > VALIDATION.display_name.max) {
      return `표시 이름은 ${VALIDATION.display_name.max}자 이하여야 합니다`;
    }
    return undefined;
  }, []);

  // 입력 변경 핸들러
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const error = validateField('username', value);
    setErrors(prev => ({ ...prev, username: error }));
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    const error = validateField('display_name', value);
    setErrors(prev => ({ ...prev, display_name: error }));
  };

  // 전체 폼 검증
  const validateForm = (): boolean => {
    const usernameError = validateField('username', username);
    const displayNameError = validateField('display_name', displayName);

    setErrors({
      username: usernameError,
      display_name: displayNameError,
    });

    return !usernameError && !displayNameError;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        username: username.trim() || undefined,
        display_name: displayName.trim() || undefined,
        profile_emoji: selectedEmoji,
      });
      onClose();
    } catch (error) {
      // 에러는 상위에서 처리됨
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modal}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>프로필 편집</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 이모지 선택 */}
            <View style={styles.section}>
              <Text style={styles.label}>프로필 이모지</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 입력 폼 */}
            <View style={styles.section}>
              <Text style={styles.label}>사용자명</Text>
              <Input
                placeholder="사용자명 (선택)"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                maxLength={VALIDATION.username.max}
                editable={!isSubmitting}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>표시 이름</Text>
              <Input
                placeholder="표시 이름 (선택)"
                value={displayName}
                onChangeText={handleDisplayNameChange}
                maxLength={VALIDATION.display_name.max}
                editable={!isSubmitting}
              />
              {errors.display_name && (
                <Text style={styles.errorText}>{errors.display_name}</Text>
              )}
            </View>

            {/* 버튼 */}
            <View style={styles.actions}>
              <Button
                variant="ghost"
                onPress={onClose}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onPress={handleSubmit}
                loading={isSubmitting}
              >
                저장
              </Button>
            </View>
          </ScrollView>
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
    maxHeight: '80%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
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
  section: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[700],
    marginBottom: tokens.spacing.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  emojiOption: {
    width: 64,      // 56 → 64 (iOS 이모지 렌더링 여유 공간)
    height: 64,     // 56 → 64
    borderRadius: 32,
    backgroundColor: tokens.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  emojiText: {
    fontSize: 32,
    lineHeight: 40,  // fontSize * 1.25 (iOS 잘림 방지)
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.error[600],
    marginTop: tokens.spacing.xs,
  },
});
