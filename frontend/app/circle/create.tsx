import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { tokens } from '../../src/theme';

/**
 * Circle 생성 화면
 *
 * 새로운 Circle을 만듭니다.
 * - Circle 이름 입력
 * - 설명 입력 (선택)
 * - 생성 완료 시 Circle 화면으로 이동
 */
export default function CreateCircleScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (text: string) => {
    // 2-30자 제한
    const cleaned = text.slice(0, 30);
    setName(cleaned);
    setError('');
  };

  const handleDescriptionChange = (text: string) => {
    // 0-100자 제한
    const cleaned = text.slice(0, 100);
    setDescription(cleaned);
  };

  const handleCreate = async () => {
    if (name.length < 2) {
      setError('Circle 이름은 2자 이상이어야 해요');
      return;
    }

    if (name.length > 30) {
      setError('Circle 이름은 30자 이하여야 해요');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // TODO: API 호출하여 Circle 생성
      // const response = await createCircle({
      //   name,
      //   description,
      // });

      // 임시로 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 성공 시 Circle 상세 화면으로 이동
      router.replace({
        pathname: '/circle/[id]',
        params: {
          id: 'temp-circle-id', // TODO: 실제 생성된 circle ID
        },
      });
    } catch (err) {
      setError('Circle 생성에 실패했어요. 다시 시도해주세요');
    } finally {
      setIsCreating(false);
    }
  };

  const isNameValid = name.length >= 2 && name.length <= 30;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Circle 만들기',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>새로운 Circle을 만들어요</Text>
            <Text style={styles.description}>
              친구들과 함께 즐길 수 있는{'\n'}나만의 Circle을 만들어보세요
            </Text>
          </View>

          {/* Circle 이름 입력 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Circle 이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                isNameValid && styles.inputValid,
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="예: 3-2반 친구들"
              placeholderTextColor={tokens.colors.neutral[400]}
              maxLength={30}
              editable={!isCreating}
            />

            <View style={styles.inputFooter}>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.hint}>2-30자로 입력해주세요</Text>
              )}
              <Text
                style={[
                  styles.charCount,
                  name.length > 30 && styles.charCountError,
                ]}
              >
                {name.length}/30
              </Text>
            </View>
          </View>

          {/* Circle 설명 입력 (선택) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Circle 소개 (선택)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="이 Circle에 대해 간단히 소개해주세요"
              placeholderTextColor={tokens.colors.neutral[400]}
              multiline
              numberOfLines={4}
              maxLength={100}
              textAlignVertical="top"
              editable={!isCreating}
            />

            <View style={styles.inputFooter}>
              <Text style={styles.hint}>Circle 멤버들에게 보여져요</Text>
              <Text style={styles.charCount}>{description.length}/100</Text>
            </View>
          </View>

          {/* 안내 카드 */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Circle 생성 후에는</Text>
            <Text style={styles.infoText}>
              • 초대 코드가 자동으로 생성돼요{'\n'}
              • 친구들을 초대하여 함께 투표를 즐겨보세요{'\n'}
              • Circle 이름과 설명은 나중에 변경할 수 있어요
            </Text>
          </View>
        </ScrollView>

        {/* 생성 버튼 */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.createButton,
              (!isNameValid || isCreating) && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isNameValid || isCreating}
          >
            <Text
              style={[
                styles.createButtonText,
                (!isNameValid || isCreating) && styles.createButtonTextDisabled,
              ]}
            >
              {isCreating ? 'Circle 만드는 중...' : 'Circle 만들기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: tokens.spacing.xl,
  },
  inputLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  required: {
    color: tokens.colors.red[500],
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
  },
  inputError: {
    borderColor: tokens.colors.red[500],
    backgroundColor: tokens.colors.red[50],
  },
  inputValid: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  textArea: {
    minHeight: 100,
    paddingTop: tokens.spacing.md,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  hint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.red[600],
  },
  charCount: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
  },
  charCountError: {
    color: tokens.colors.red[600],
  },
  infoCard: {
    backgroundColor: tokens.colors.primary[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
  },
  infoTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
    marginBottom: tokens.spacing.sm,
  },
  infoText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  createButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: tokens.colors.neutral[200],
  },
  createButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  createButtonTextDisabled: {
    color: tokens.colors.neutral[400],
  },
});
