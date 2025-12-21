/**
 * Responsive Test Screen
 * 다양한 화면 크기에서 컴포넌트를 테스트하는 데모 화면
 *
 * 사용법:
 * 1. iOS Simulator에서 디바이스 변경
 * 2. 이 화면에서 모든 컴포넌트 variant 확인
 * 3. 레이아웃, 간격, 터치 영역 검증
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../src/theme';
import { getDeviceInfo } from '../../src/utils/responsive';

// Components
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { Card } from '../../src/components/primitives/Card';
import { Input } from '../../src/components/primitives/Input';
import { VoteCard } from '../../src/components/patterns/VoteCard';
import { ResultBar } from '../../src/components/patterns/ResultBar';
import { ProgressBar, CompactProgressBar, DotProgress } from '../../src/components/patterns/ProgressBar';
import { EmptyState } from '../../src/components/states/EmptyState';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { SkeletonVoteCard, SkeletonResultBar } from '../../src/components/states/Skeleton';

export default function ResponsiveTestScreen() {
  const [selectedVote, setSelectedVote] = useState<string>();
  const [inputValue, setInputValue] = useState('');
  const deviceInfo = getDeviceInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Device Info */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            📱 Device Info
          </Text>
          <Card style={styles.infoCard}>
            <Text variant="sm" color={tokens.colors.neutral[600]}>
              Width: {deviceInfo.width}pt × Height: {deviceInfo.height}pt
            </Text>
            <Text variant="sm" color={tokens.colors.neutral[600]}>
              Size: {deviceInfo.size} | Pixel Ratio: {deviceInfo.pixelRatio}x
            </Text>
            <Text variant="sm" color={tokens.colors.neutral[600]}>
              Platform: {deviceInfo.platform} {deviceInfo.platformVersion}
            </Text>
            <Text variant="sm" color={tokens.colors.neutral[600]}>
              {deviceInfo.isSmall && '⚠️ Small Device'}
              {deviceInfo.isTablet && '📱 Tablet'}
              {deviceInfo.isLandscape && '🔄 Landscape'}
            </Text>
          </Card>
        </View>

        {/* Typography */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            ✏️ Typography
          </Text>
          <Card>
            <Text variant="4xl" weight="bold">4xl - Hero</Text>
            <Text variant="3xl" weight="bold">3xl - Page Title</Text>
            <Text variant="2xl" weight="semibold">2xl - Section</Text>
            <Text variant="xl" weight="semibold">xl - Subsection</Text>
            <Text variant="lg">lg - Emphasized</Text>
            <Text variant="base">base - Body</Text>
            <Text variant="sm" color={tokens.colors.neutral[600]}>sm - Secondary</Text>
            <Text variant="xs" color={tokens.colors.neutral[500]}>xs - Caption</Text>
          </Card>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            🔘 Buttons
          </Text>

          <Text variant="base" weight="semibold" style={styles.subsectionTitle}>
            Primary Buttons
          </Text>
          <View style={styles.buttonRow}>
            <Button variant="primary" size="sm" onPress={() => {}}>
              Small
            </Button>
            <Button variant="primary" size="md" onPress={() => {}}>
              Medium
            </Button>
            <Button variant="primary" size="lg" onPress={() => {}}>
              Large
            </Button>
          </View>

          <Text variant="base" weight="semibold" style={styles.subsectionTitle}>
            Secondary & Ghost
          </Text>
          <View style={styles.buttonRow}>
            <Button variant="secondary" size="md" onPress={() => {}}>
              Secondary
            </Button>
            <Button variant="ghost" size="md" onPress={() => {}}>
              Ghost
            </Button>
          </View>

          <Text variant="base" weight="semibold" style={styles.subsectionTitle}>
            States
          </Text>
          <View style={styles.buttonColumn}>
            <Button variant="primary" loading onPress={() => {}}>
              Loading Button
            </Button>
            <Button variant="primary" disabled onPress={() => {}}>
              Disabled Button
            </Button>
            <Button variant="primary" fullWidth onPress={() => {}}>
              Full Width Button
            </Button>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            📝 Input Fields
          </Text>

          <Input
            label="기본 입력"
            placeholder="텍스트를 입력하세요"
            value={inputValue}
            onChangeText={setInputValue}
          />

          <Input
            label="에러 상태"
            placeholder="잘못된 입력"
            value="invalid@"
            onChangeText={() => {}}
            error="올바른 형식이 아닙니다"
          />

          <Input
            label="도움말 포함"
            placeholder="Circle 이름"
            value=""
            onChangeText={() => {}}
            helperText="친구들이 알아볼 수 있는 이름을 지어주세요"
            maxLength={30}
          />

          <Input
            label="비활성화"
            placeholder="입력할 수 없음"
            value="disabled input"
            onChangeText={() => {}}
            disabled
          />
        </View>

        {/* VoteCard */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            🗳️ Vote Card (2x2 Grid)
          </Text>
          <VoteCard
            question="가장 친절한 친구는?"
            options={[
              { id: '1', name: '김철수' },
              { id: '2', name: '이영희' },
              { id: '3', name: '박민수' },
              { id: '4', name: '최지은' },
            ]}
            selectedId={selectedVote}
            onSelect={setSelectedVote}
          />
        </View>

        {/* Result Bars */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            📊 Result Bars
          </Text>
          <Card>
            <ResultBar
              rank={1}
              name="김철수"
              voteCount={12}
              percentage={48}
              isWinner
              animationDelay={0}
            />
            <ResultBar
              rank={2}
              name="이영희"
              voteCount={8}
              percentage={32}
              animationDelay={100}
            />
            <ResultBar
              rank={3}
              name="박민수"
              voteCount={3}
              percentage={12}
              animationDelay={200}
            />
            <ResultBar
              rank={4}
              name="최지은"
              voteCount={2}
              percentage={8}
              animationDelay={300}
            />
          </Card>
        </View>

        {/* Progress Bars */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            ⏳ Progress Indicators
          </Text>

          <Card>
            <Text variant="sm" weight="semibold" style={styles.subsectionTitle}>
              Standard Progress Bar
            </Text>
            <ProgressBar current={3} total={10} showLabel />

            <Text variant="sm" weight="semibold" style={styles.subsectionTitle}>
              Compact Progress Bar
            </Text>
            <CompactProgressBar current={5} total={8} />

            <Text variant="sm" weight="semibold" style={styles.subsectionTitle}>
              Dot Progress
            </Text>
            <DotProgress current={4} total={10} maxDots={8} />
          </Card>
        </View>

        {/* Empty States */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            🔍 Empty States
          </Text>

          <EmptyState
            variant="no-polls"
            actionLabel="투표 만들기"
            onAction={() => {}}
          />
        </View>

        {/* Loading States */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            ⏰ Loading States
          </Text>

          <Card>
            <Text variant="sm" weight="semibold" style={styles.subsectionTitle}>
              Loading Spinner
            </Text>
            <View style={styles.loadingRow}>
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <LoadingSpinner size="xl" />
            </View>

            <Text variant="sm" weight="semibold" style={styles.subsectionTitle}>
              Skeleton Loading
            </Text>
            <SkeletonVoteCard />
            <SkeletonResultBar count={3} />
          </Card>
        </View>

        {/* Safe Area Visualization */}
        <View style={styles.section}>
          <Text variant="2xl" weight="bold" style={styles.sectionTitle}>
            🛡️ Safe Area
          </Text>
          <Card style={styles.safeAreaCard}>
            <Text variant="sm" color={tokens.colors.neutral[600]}>
              ✅ 이 콘텐츠는 SafeAreaView 안에 있어서 노치나 Home Indicator에 가려지지
              않습니다.
            </Text>
            <Text variant="sm" color={tokens.colors.neutral[600]} style={{ marginTop: 8 }}>
              화면 하단까지 스크롤해서 여백을 확인하세요.
            </Text>
          </Card>
        </View>

        {/* Bottom Padding for Safe Area */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    marginBottom: tokens.spacing.md,
  },
  subsectionTitle: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  infoCard: {
    gap: tokens.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  buttonColumn: {
    gap: tokens.spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  safeAreaCard: {
    backgroundColor: tokens.colors.success[50],
    borderColor: tokens.colors.success[200],
    borderWidth: 1,
  },
  bottomSpacer: {
    height: tokens.spacing.xl,
  },
});
