/**
 * Profile Edit Modal Component
 *
 * 프로필 수정 모달
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

const EMOJI_OPTIONS = ['😊', '😎', '🤩', '🥳', '😇', '🤓', '😺', '🐶', '🦊', '🐼', '🐨', '🦁'];

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

  const handleSubmit = async () => {
    // 유효성 검증
    if (username && username.length < 3) {
      Alert.alert('입력 오류', '사용자명은 최소 3자 이상이어야 합니다');
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
                onChangeText={setUsername}
                autoCapitalize="none"
                maxLength={20}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>표시 이름</Text>
              <Input
                placeholder="표시 이름 (선택)"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={30}
                editable={!isSubmitting}
              />
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
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
});
