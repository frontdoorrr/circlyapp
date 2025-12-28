import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { tokens } from '../../../src/theme';

/**
 * 질문 템플릿 선택 화면
 *
 * 투표 질문 템플릿을 선택합니다.
 * - 카테고리별 템플릿 목록 표시
 * - 템플릿 선택 시 다음 단계로 진행
 */
export default function SelectTemplateScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // TODO: 실제 템플릿 목록 가져오기
  const templates = [
    {
      id: '1',
      category: '성격 관련',
      emoji: '😊',
      questions: [
        { id: 't1', text: '가장 친절한 친구는?' },
        { id: 't2', text: '가장 유머러스한 친구는?' },
        { id: 't3', text: '가장 책임감 있는 친구는?' },
      ],
    },
    {
      id: '2',
      category: '외모 관련',
      emoji: '✨',
      questions: [
        { id: 't4', text: '가장 웃음이 예쁜 친구는?' },
        { id: 't5', text: '가장 패션센스 좋은 친구는?' },
        { id: 't6', text: '가장 귀여운 친구는?' },
      ],
    },
    {
      id: '3',
      category: '특별한 날',
      emoji: '🎉',
      questions: [
        { id: 't7', text: '생일파티 주인공 같은 친구는?' },
        { id: 't8', text: '반장 하면 어울릴 것 같은 친구는?' },
      ],
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleNext = () => {
    if (!selectedTemplateId) return;

    // TODO: 선택된 템플릿 ID를 다음 화면으로 전달
    router.push({
      pathname: '/(main)/(create)/configure',
      params: {
        circleId,
        templateId: selectedTemplateId,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '질문 선택',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>어떤 질문으로 투표할까요?</Text>
          <Text style={styles.description}>
            친구들에게 묻고 싶은 질문을 선택해주세요
          </Text>

          <View style={styles.templateList}>
            {templates.map((category) => (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryCount}>
                    {category.questions.length}개
                  </Text>
                </View>

                <View style={styles.questionList}>
                  {category.questions.map((question) => (
                    <Pressable
                      key={question.id}
                      style={[
                        styles.questionCard,
                        selectedTemplateId === question.id && styles.questionCardSelected,
                      ]}
                      onPress={() => handleTemplateSelect(question.id)}
                    >
                      <Text style={styles.questionText}>{question.text}</Text>
                      {selectedTemplateId === question.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedTemplateId && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedTemplateId}
          >
            <Text
              style={[
                styles.nextButtonText,
                !selectedTemplateId && styles.nextButtonTextDisabled,
              ]}
            >
              다음
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
    backgroundColor: tokens.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 100,
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
    marginBottom: tokens.spacing.xl,
  },
  templateList: {
    gap: tokens.spacing.xl,
  },
  categorySection: {
    gap: tokens.spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    flex: 1,
  },
  categoryCount: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
  },
  questionList: {
    gap: tokens.spacing.sm,
  },
  questionCard: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCardSelected: {
    borderColor: tokens.colors.primary[500],
    backgroundColor: tokens.colors.primary[50],
  },
  questionText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: tokens.colors.primary[500],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  nextButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: tokens.colors.neutral[200],
  },
  nextButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  nextButtonTextDisabled: {
    color: tokens.colors.neutral[400],
  },
});
