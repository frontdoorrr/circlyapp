import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { usePollTemplates } from '../../../src/hooks/usePolls';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { usePollCreateStore, PollDuration } from '../../../src/stores/pollCreate';

/**
 * Poll Settings Screen (투표 설정 화면)
 *
 * 투표 기간, 참여 대상, 알림 설정을 구성합니다.
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.3
 */

// 투표 기간 옵션
const DURATION_OPTIONS: { value: PollDuration; label: string }[] = [
  { value: '1H', label: '1시간' },
  { value: '3H', label: '3시간' },
  { value: '6H', label: '6시간' },
  { value: '24H', label: '24시간' },
];

// 참여 대상 타입
type ParticipationTarget = 'all' | 'select';

// 알림 설정 타입
type NotificationSetting = 'immediate' | 'scheduled';

export default function ConfigureScreen() {
  const params = useLocalSearchParams<{ templateId: string; circleId?: string }>();
  const templateId = params.templateId;
  const circleIdParam = params.circleId;

  // 데이터 조회
  const { data: templates } = usePollTemplates();
  const { data: circles } = useMyCircles();

  // Zustand store
  const {
    settings,
    selectedTemplate: storedTemplate,
    circleId: storedCircleId,
    setSettings,
    setTemplate,
    setCircleId,
  } = usePollCreateStore();

  // 선택된 템플릿 찾기
  const selectedTemplate = templates?.find((t) => t.id === templateId);

  // 첫 번째 circle을 기본값으로 (실제로는 이전 화면에서 선택되어야 함)
  const selectedCircle = circleIdParam
    ? circles?.find((c) => c.id === circleIdParam)
    : circles?.[0];

  // 초기화: 템플릿과 Circle 정보를 store에 저장
  useEffect(() => {
    if (selectedTemplate && !storedTemplate) {
      setTemplate({
        id: selectedTemplate.id,
        emoji: selectedTemplate.emoji || '❓',
        text: selectedTemplate.question_text,
      });
    }
  }, [selectedTemplate, storedTemplate, setTemplate]);

  useEffect(() => {
    if (selectedCircle && !storedCircleId) {
      setCircleId(selectedCircle.id);
    }
  }, [selectedCircle, storedCircleId, setCircleId]);

  // 기간 선택 핸들러
  const handleDurationSelect = (value: PollDuration) => {
    setSettings({ duration: value });
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  // 참여 대상 선택 핸들러
  const handleTargetSelect = (value: 'all' | 'selected') => {
    setSettings({ target: value });
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  // 알림 설정 선택 핸들러
  const handleNotificationSelect = (value: 'immediate' | 'scheduled') => {
    setSettings({ notificationTiming: value });
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  // 미리보기 버튼 핸들러
  const handlePreview = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    router.push('/(main)/(create)/preview');
  };

  if (!selectedTemplate || !selectedCircle) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '투표 설정',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 선택한 질문 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📝</Text>
              <Text style={styles.sectionTitle}>선택한 질문</Text>
            </View>
            <View style={styles.selectedQuestion}>
              <Text style={styles.selectedQuestionText}>
                {selectedTemplate.emoji} {selectedTemplate.question_text}
              </Text>
            </View>
          </View>

          {/* 투표 기간 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⏰</Text>
              <Text style={styles.sectionTitle}>투표 기간</Text>
            </View>
            <View style={styles.durationChips}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    settings.duration === option.value && styles.chipSelected,
                  ]}
                  onPress={() => handleDurationSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      settings.duration === option.value
                        ? [styles.chipText, styles.chipTextSelected]
                        : styles.chipText
                    }
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 참여 대상 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎯</Text>
              <Text style={styles.sectionTitle}>참여 대상</Text>
            </View>
            <View style={styles.radioGroup}>
              {/* Circle 전체 */}
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleTargetSelect('all')}
                activeOpacity={0.7}
              >
                <View style={styles.radioButton}>
                  {settings.target === 'all' && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioLabel}>
                  Circle 전체 ({selectedCircle.member_count || 0}명)
                </Text>
              </TouchableOpacity>

              {/* 일부만 선택 */}
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleTargetSelect('selected')}
                activeOpacity={0.7}
              >
                <View style={styles.radioButton}>
                  {settings.target === 'selected' && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioLabel}>일부만 선택하기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 알림 설정 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📢</Text>
              <Text style={styles.sectionTitle}>알림 설정</Text>
            </View>
            <View style={styles.radioGroup}>
              {/* 즉시 알림 */}
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleNotificationSelect('immediate')}
                activeOpacity={0.7}
              >
                <View style={styles.radioButton}>
                  {settings.notificationTiming === 'immediate' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>즉시 알림 보내기</Text>
              </TouchableOpacity>

              {/* 예약 발송 */}
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleNotificationSelect('scheduled')}
                activeOpacity={0.7}
              >
                <View style={styles.radioButton}>
                  {settings.notificationTiming === 'scheduled' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>예약 발송</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* 미리보기 버튼 (하단 고정) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handlePreview}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tokens.colors.primary[500], tokens.colors.secondary[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewButtonGradient}
            >
              <Text style={styles.previewButtonText}>미리보기</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Footer 공간 확보
  },

  // 섹션
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
    backgroundColor: tokens.colors.neutral[50],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.base, // 16px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.neutral[700],
    marginLeft: 8,
  },

  // 선택한 질문
  selectedQuestion: {
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
  },
  selectedQuestionText: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.medium, // 500
    color: tokens.colors.neutral[900],
  },

  // 투표 기간 칩
  durationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderWidth: 2,
    borderColor: tokens.colors.primary[500],
  },
  chipText: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.medium, // 500
    color: tokens.colors.neutral[600],
  },
  chipTextSelected: {
    color: tokens.colors.primary[700],
  },

  // 라디오 그룹
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.colors.primary[500],
  },
  radioLabel: {
    fontSize: tokens.typography.fontSize.base, // 16px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[900],
  },

  // 하단 버튼
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Safe Area Bottom
    backgroundColor: tokens.colors.white,
  },
  previewButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    // Shadow (shadow-primary)
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  previewButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.white,
  },
});
