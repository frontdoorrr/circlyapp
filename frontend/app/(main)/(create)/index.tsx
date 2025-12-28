import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { usePollTemplates, useCreatePoll } from '../../../src/hooks/usePolls';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { Input } from '../../../src/components/primitives/Input';
import { tokens } from '../../../src/theme';
import { PollDuration, TemplateCategory } from '../../../src/types/poll';
import { ApiError } from '../../../src/types/api';

/**
 * Create Poll Screen
 *
 * 투표 생성 화면
 */
export default function CreateScreen() {
  const router = useRouter();

  // Circle 및 템플릿 조회
  const { data: circles, isLoading: circlesLoading } = useMyCircles();
  const { data: templates, isLoading: templatesLoading } = usePollTemplates();

  // 선택 상태
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PollDuration>('24H');
  const [customQuestion, setCustomQuestion] = useState('');

  // 투표 생성
  const createPollMutation = useCreatePoll();

  const handleCreatePoll = async () => {
    // 유효성 검증
    if (!selectedCircleId) {
      Alert.alert('입력 오류', 'Circle을 선택해주세요');
      return;
    }

    if (!selectedTemplateId && !customQuestion.trim()) {
      Alert.alert('입력 오류', '질문을 선택하거나 직접 입력해주세요');
      return;
    }

    try {
      await createPollMutation.mutateAsync({
        circleId: selectedCircleId,
        data: {
          template_id: selectedTemplateId || (templates?.[0]?.id ?? ''),
          question_text: customQuestion.trim() || undefined,
          duration: selectedDuration,
        }
      });

      Alert.alert('성공', '투표가 시작되었습니다!');
      router.replace('/(main)/(home)');
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('생성 실패', error.message);
      } else {
        Alert.alert('오류', '투표 생성 중 문제가 발생했습니다');
      }
    }
  };

  if (circlesLoading || templatesLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  // Circle이 없을 때
  if (!circles || circles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Circle이 없습니다</Text>
        <Text style={styles.emptyText}>
          먼저 Circle에 참여해주세요
        </Text>
        <Button onPress={() => router.push('/(main)/(home)')}>
          홈으로 가기
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 */}
        <Text style={styles.title}>투표 만들기</Text>

        {/* 1. Circle 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1️⃣ Circle 선택</Text>
          <View style={styles.optionsGrid}>
            {circles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                style={[
                  styles.option,
                  selectedCircleId === circle.id && styles.optionSelected
                ]}
                onPress={() => setSelectedCircleId(circle.id)}
              >
                <Text style={styles.optionText}>{circle.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. 질문 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ 투표 질문</Text>

          {/* 템플릿 목록 */}
          {templates && templates.length > 0 && (
            <View style={styles.templateList}>
              {templates.slice(0, 5).map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplateId === template.id && styles.templateCardSelected
                  ]}
                  onPress={() => {
                    setSelectedTemplateId(template.id);
                    setCustomQuestion('');
                  }}
                >
                  <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  <Text style={styles.templateText}>{template.question_text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 커스텀 질문 입력 */}
          <Text style={styles.orText}>또는</Text>
          <Input
            placeholder="직접 질문 작성하기"
            value={customQuestion}
            onChangeText={(text) => {
              setCustomQuestion(text);
              setSelectedTemplateId(null);
            }}
            maxLength={50}
            multiline
          />
        </View>

        {/* 3. 마감 시간 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3️⃣ 마감 시간</Text>
          <View style={styles.durationGrid}>
            {[
              { value: '1H', label: '1시간' },
              { value: '3H', label: '3시간' },
              { value: '6H', label: '6시간' },
              { value: '24H', label: '24시간' },
            ].map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.durationOption,
                  selectedDuration === duration.value && styles.durationOptionSelected
                ]}
                onPress={() => setSelectedDuration(duration.value as PollDuration)}
              >
                <Text
                  style={
                    selectedDuration === duration.value
                      ? styles.durationTextSelected
                      : styles.durationText
                  }
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 생성 버튼 */}
        <View style={styles.createButtonContainer}>
          <Button
            onPress={handleCreatePoll}
            loading={createPollMutation.isPending}
            disabled={!selectedCircleId || (!selectedTemplateId && !customQuestion.trim())}
            fullWidth
          >
            투표 시작하기
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xl,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  option: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
  },
  optionSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  optionText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
  },
  templateList: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
  },
  templateCardSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  templateEmoji: {
    fontSize: 24,
    marginRight: tokens.spacing.sm,
  },
  templateText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
  },
  orText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    marginVertical: tokens.spacing.md,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  durationOption: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  durationText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[700],
    fontWeight: tokens.typography.fontWeight.normal,
  },
  durationTextSelected: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.primary[700],
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  createButtonContainer: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
});
