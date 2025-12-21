/**
 * Dark Mode Test Screen
 *
 * 다크모드 기능을 테스트하는 데모 화면
 *
 * 사용법:
 * 1. ThemeToggle 컴포넌트로 라이트/다크 모드 전환
 * 2. 모든 컴포넌트가 다크모드에서 제대로 표시되는지 확인
 * 3. 테마 설정이 AsyncStorage에 저장되는지 확인 (앱 재시작 시 유지)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../../src/theme';

// Components
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { Card } from '../../src/components/primitives/Card';
import { Input } from '../../src/components/primitives/Input';
import { ThemeToggle } from '../../src/components/primitives/ThemeToggle';

export default function DarkModeTestScreen() {
  const { theme, isDark, mode, followSystem } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [inputValue, setInputValue] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="3xl" weight="bold" style={styles.title}>
            🌓 Dark Mode Test
          </Text>
          <Text variant="sm" style={styles.subtitle}>
            현재 모드: {mode === 'dark' ? '🌙 다크' : '☀️ 라이트'}
            {followSystem && ' (시스템 설정 따름)'}
          </Text>
        </View>

        {/* Theme Info Card */}
        <Card style={styles.infoCard}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            테마 정보
          </Text>
          <View style={styles.infoGrid}>
            <InfoRow label="모드" value={mode} />
            <InfoRow label="다크 모드" value={isDark ? 'Yes' : 'No'} />
            <InfoRow label="시스템 설정 따르기" value={followSystem ? 'Yes' : 'No'} />
            <InfoRow label="배경색" value={theme.background} />
            <InfoRow label="텍스트색" value={theme.text} />
          </View>
        </Card>

        {/* Theme Toggle Controls */}
        <View style={styles.section}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            Switch Variant
          </Text>
          <ThemeToggle variant="switch" />
        </View>

        <View style={styles.section}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            Button Variant
          </Text>
          <ThemeToggle variant="button" />
        </View>

        <View style={styles.section}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            Card Variant (with System Option)
          </Text>
          <ThemeToggle variant="card" showSystemOption />
        </View>

        {/* Component Showcase */}
        <View style={styles.section}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            컴포넌트 테스트
          </Text>

          <Card style={styles.showcaseCard}>
            <Text variant="base" style={styles.showcaseLabel}>
              Typography
            </Text>
            <Text variant="4xl" weight="bold">
              큰 제목 텍스트
            </Text>
            <Text variant="xl" weight="semibold">
              중간 제목 텍스트
            </Text>
            <Text variant="base">
              일반 본문 텍스트입니다. 다크모드에서도 읽기 쉬워야 합니다.
            </Text>
            <Text variant="sm" style={styles.secondaryText}>
              작은 보조 텍스트
            </Text>
          </Card>

          <Card style={styles.showcaseCard}>
            <Text variant="base" style={styles.showcaseLabel}>
              Buttons
            </Text>
            <View style={styles.buttonRow}>
              <Button variant="primary" size="sm" onPress={() => {}}>
                Primary
              </Button>
              <Button variant="secondary" size="sm" onPress={() => {}}>
                Secondary
              </Button>
              <Button variant="ghost" size="sm" onPress={() => {}}>
                Ghost
              </Button>
            </View>
          </Card>

          <Card style={styles.showcaseCard}>
            <Text variant="base" style={styles.showcaseLabel}>
              Input Field
            </Text>
            <Input
              label="테스트 입력"
              placeholder="여기에 텍스트를 입력하세요"
              value={inputValue}
              onChangeText={setInputValue}
            />
          </Card>

          <Card style={styles.showcaseCard}>
            <Text variant="base" style={styles.showcaseLabel}>
              Cards with Different Elevations
            </Text>
            <View style={styles.cardStack}>
              <Card variant="default">
                <Text variant="sm">Default Card</Text>
              </Card>
              <Card variant="elevated">
                <Text variant="sm">Elevated Card</Text>
              </Card>
              <Card variant="outlined">
                <Text variant="sm">Outlined Card</Text>
              </Card>
            </View>
          </Card>
        </View>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
            📝 테스트 가이드
          </Text>
          <Text variant="sm" style={styles.instructionText}>
            1. 위의 토글 버튼으로 라이트/다크 모드를 전환해보세요
          </Text>
          <Text variant="sm" style={styles.instructionText}>
            2. 모든 컴포넌트가 현재 테마에 맞게 표시되는지 확인하세요
          </Text>
          <Text variant="sm" style={styles.instructionText}>
            3. 앱을 완전히 종료한 후 다시 실행하여 설정이 유지되는지 확인하세요
          </Text>
          <Text variant="sm" style={styles.instructionText}>
            4. 시스템 다크모드 설정을 변경하여 "시스템 설정 따르기"가 작동하는지 확인하세요
          </Text>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.infoRow}>
      <Text variant="sm" style={styles.infoLabel}>
        {label}:
      </Text>
      <Text variant="sm" weight="semibold">
        {value}
      </Text>
    </View>
  );
}

// Themed Styles
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      marginBottom: 8,
      color: theme.text,
    },
    subtitle: {
      color: theme.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      color: theme.text,
    },
    infoCard: {
      marginBottom: 24,
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    infoGrid: {
      gap: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    infoLabel: {
      color: theme.textSecondary,
    },
    showcaseCard: {
      marginBottom: 16,
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    showcaseLabel: {
      marginBottom: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12,
      letterSpacing: 0.5,
    },
    secondaryText: {
      color: theme.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    cardStack: {
      gap: 12,
    },
    instructionsCard: {
      marginTop: 8,
      backgroundColor: isDark ? theme.cardElevated : '#f0f9ff',
      borderColor: theme.border,
    },
    instructionText: {
      marginBottom: 8,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    bottomSpacer: {
      height: 24,
    },
  });
