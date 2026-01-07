import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { usePollTemplates } from '../../../src/hooks/usePolls';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { useCreatePoll } from '../../../src/hooks/useCreatePoll';
import { usePollCreateStore, PollDuration } from '../../../src/stores/pollCreate';

/**
 * Poll Preview Screen (투표 미리보기 화면)
 *
 * 투표가 실제로 어떻게 보일지 미리보기를 제공합니다.
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.4
 */

// 더미 멤버 데이터 (실제로는 API에서 가져옴)
const DUMMY_MEMBERS = [
  { id: '1', name: '김민수' },
  { id: '2', name: '이지은' },
  { id: '3', name: '박서준' },
  { id: '4', name: '최하늘' },
];

// 투표 기간 라벨 매핑
const DURATION_LABELS: Record<PollDuration, string> = {
  '1H': '1시간',
  '3H': '3시간',
  '6H': '6시간',
  '24H': '24시간',
};

export default function PreviewScreen() {
  // Zustand store에서 상태 가져오기
  const {
    selectedTemplate,
    settings,
    circleId,
    isComplete,
  } = usePollCreateStore();

  // 데이터 조회
  const { data: templates } = usePollTemplates();
  const { data: circles } = useMyCircles();
  const createPollMutation = useCreatePoll();

  // Circle 정보 찾기
  const selectedCircle = circles?.find((c) => c.id === circleId);

  // 수정하기 버튼 핸들러
  const handleEdit = () => {
    router.back();
  };

  // 투표 시작 버튼 핸들러
  const handleStartPoll = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!isComplete()) {
      Alert.alert('오류', '필요한 정보를 모두 입력해주세요');
      return;
    }

    if (!selectedCircle || !selectedTemplate || !circleId) {
      Alert.alert('오류', '필요한 정보를 불러올 수 없습니다');
      return;
    }

    try {
      await createPollMutation.mutateAsync({
        templateId: selectedTemplate.id,
        duration: settings.duration,
        circleId,
      });
      // Note: useCreatePoll hook will handle navigation to success screen
    } catch (error) {
      Alert.alert('오류', '투표 생성에 실패했습니다');
      console.error('Poll creation error:', error);
    }
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
          title: '미리보기',
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
          {/* 안내 텍스트 */}
          <Text style={styles.guideText}>투표가 이렇게 보여요</Text>

          {/* 프리뷰 컨테이너 (70% 스케일) */}
          <View style={styles.previewContainer}>
            <View style={[styles.pollPreview, { transform: [{ scale: 0.7 }] }]}>
              {/* 이모지 */}
              <Text style={styles.previewEmoji}>{selectedTemplate.emoji || '❓'}</Text>

              {/* 질문 텍스트 */}
              <Text style={styles.previewQuestion}>
                {selectedTemplate.text}
              </Text>

              {/* 선택지 카드들 (더미 데이터) */}
              <View style={styles.choicesContainer}>
                {DUMMY_MEMBERS.map((member) => (
                  <View key={member.id} style={styles.choiceCard}>
                    <Text style={styles.choiceName}>{member.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 메타 정보 섹션 */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏰</Text>
              <Text style={styles.metaText}>
                {DURATION_LABELS[settings.duration]} 후 마감
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👥</Text>
              <Text style={styles.metaText}>
                {settings.target === 'all'
                  ? `Circle 전체 (${selectedCircle.member_count || 0}명)`
                  : '선택된 멤버'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📢</Text>
              <Text style={styles.metaText}>
                {settings.notificationTiming === 'immediate' ? '즉시 알림 발송' : '예약 발송'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 액션 버튼 (하단 고정) */}
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            {/* 수정하기 버튼 (Secondary) */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>수정하기</Text>
            </TouchableOpacity>

            {/* 투표 시작 버튼 (Primary) */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartPoll}
              activeOpacity={0.8}
              disabled={createPollMutation.isPending}
            >
              <LinearGradient
                colors={[tokens.colors.primary[500], tokens.colors.secondary[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>
                  {createPollMutation.isPending ? '생성 중...' : '투표 시작'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 120, // Footer 공간 확보
  },

  // 안내 텍스트
  guideText: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },

  // 프리뷰 컨테이너
  previewContainer: {
    marginHorizontal: 20,
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // 투표 프리뷰 (70% 스케일)
  pollPreview: {
    width: 400, // 스케일 전 크기
    alignItems: 'center',
    paddingVertical: 40,
  },
  previewEmoji: {
    fontSize: 80,
    lineHeight: 96,  // fontSize * 1.2 (iOS 잘림 방지)
    marginBottom: 24,
    textAlign: 'center',
  },
  previewQuestion: {
    fontSize: tokens.typography.fontSize['2xl'], // 24px
    fontWeight: tokens.typography.fontWeight.bold, // 700
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  // 선택지 카드들
  choicesContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  choiceCard: {
    backgroundColor: tokens.colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    alignItems: 'center',
  },
  choiceName: {
    fontSize: tokens.typography.fontSize.base, // 16px
    fontWeight: tokens.typography.fontWeight.medium, // 500
    color: tokens.colors.neutral[900],
  },

  // 메타 정보
  metaSection: {
    backgroundColor: tokens.colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.neutral[100],
    marginTop: 20,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metaText: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[600],
  },

  // 하단 액션 버튼
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  // 수정하기 버튼 (Secondary)
  editButton: {
    flex: 1,
    height: 56,
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.neutral[700],
  },

  // 투표 시작 버튼 (Primary)
  startButton: {
    flex: 1,
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
  startButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.white,
  },
});
