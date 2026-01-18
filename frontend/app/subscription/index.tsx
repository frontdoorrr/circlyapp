import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PACKAGE_IDS,
} from '../../src/services/subscription/revenuecat';
import { useCurrentUser } from '../../src/hooks/useAuth';

/**
 * Orb Mode 구독 Paywall 화면
 *
 * 기능:
 * - 구독 혜택 안내
 * - 월간/연간 가격 옵션
 * - 구매 및 복원 기능
 */
export default function SubscriptionScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { refetch: refetchUser } = useCurrentUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>(PACKAGE_IDS.MONTHLY);

  // 구독 상품 정보 로드
  useEffect(() => {
    async function loadOfferings() {
      try {
        setIsLoading(true);
        const offering = await getOfferings();

        if (offering) {
          setPackages(offering.availablePackages);
          console.log('[Subscription] Loaded packages:', offering.availablePackages.length);
        }
      } catch (error) {
        console.error('[Subscription] Failed to load offerings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOfferings();
  }, []);

  // 선택된 패키지 가져오기
  const getSelectedPackage = () => {
    return packages.find((pkg) => pkg.identifier === selectedPackage);
  };

  // 구매 처리
  const handlePurchase = async () => {
    const pkg = getSelectedPackage();
    if (!pkg) {
      Alert.alert('오류', '구독 상품을 선택해주세요');
      return;
    }

    try {
      setIsPurchasing(true);
      const customerInfo = await purchasePackage(pkg);

      // 구독 성공 여부 확인
      if (customerInfo.entitlements.active['orb_mode']) {
        // 사용자 정보 새로고침 (is_orb_mode 업데이트)
        await refetchUser();

        Alert.alert(
          '구독 완료!',
          'Orb Mode가 활성화되었어요. 이제 누가 나를 선택했는지 볼 수 있어요!',
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      // 사용자가 취소한 경우
      if (error.userCancelled) {
        console.log('[Subscription] User cancelled purchase');
        return;
      }

      console.error('[Subscription] Purchase failed:', error);
      Alert.alert(
        '구매 실패',
        error.message || '구매 중 문제가 발생했어요. 다시 시도해주세요.'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  // 구매 복원
  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const customerInfo = await restorePurchases();

      if (customerInfo.entitlements.active['orb_mode']) {
        // 사용자 정보 새로고침
        await refetchUser();

        Alert.alert(
          '복원 완료!',
          'Orb Mode가 복원되었어요.',
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          '복원 실패',
          '복원할 구독이 없어요. 같은 Apple/Google 계정인지 확인해주세요.'
        );
      }
    } catch (error: any) {
      console.error('[Subscription] Restore failed:', error);
      Alert.alert(
        '복원 실패',
        error.message || '복원 중 문제가 발생했어요. 다시 시도해주세요.'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  // 패키지에서 가격 정보 추출
  const getPackageInfo = (packageId: string) => {
    const pkg = packages.find((p) => p.identifier === packageId);
    if (!pkg) {
      // 기본 가격 (RevenueCat 연결 전)
      if (packageId === PACKAGE_IDS.MONTHLY) {
        return { price: '₩5,900', period: '월', savings: null };
      }
      return { price: '₩59,000', period: '년', savings: '17% 할인' };
    }

    const product = pkg.product;
    if (packageId === PACKAGE_IDS.ANNUAL) {
      // 연간 구독 할인율 계산
      const monthlyPkg = packages.find((p) => p.identifier === PACKAGE_IDS.MONTHLY);
      if (monthlyPkg) {
        const annualPrice = product.price;
        const monthlyPrice = monthlyPkg.product.price * 12;
        const savingsPercent = Math.round((1 - annualPrice / monthlyPrice) * 100);
        return {
          price: product.priceString,
          period: '년',
          savings: savingsPercent > 0 ? `${savingsPercent}% 할인` : null,
        };
      }
    }

    return {
      price: product.priceString,
      period: packageId === PACKAGE_IDS.MONTHLY ? '월' : '년',
      savings: null,
    };
  };

  const monthlyInfo = getPackageInfo(PACKAGE_IDS.MONTHLY);
  const annualInfo = getPackageInfo(PACKAGE_IDS.ANNUAL);

  // 로딩 중
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Orb Mode',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Orb Mode',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
        >
          {/* 헤더 섹션 */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🔮</Text>
            <Text style={styles.headerTitle}>Orb Mode</Text>
            <Text style={styles.headerSubtitle}>
              누가 나를 선택했는지 궁금하지 않아?
            </Text>
          </View>

          {/* 기능 리스트 */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Orb Mode 혜택</Text>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👀</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>투표자 공개</Text>
                <Text style={styles.featureDescription}>
                  누가 나를 선택했는지 확인할 수 있어요
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>프리미엄 배지</Text>
                <Text style={styles.featureDescription}>
                  프로필에 특별한 배지가 표시돼요
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>나를 좋아하는 친구 발견</Text>
                <Text style={styles.featureDescription}>
                  친구들의 마음을 확인해보세요
                </Text>
              </View>
            </View>
          </View>

          {/* 가격 카드 */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>구독 플랜 선택</Text>

            {/* 월간 구독 */}
            <Pressable
              style={[
                styles.priceCard,
                selectedPackage === PACKAGE_IDS.MONTHLY && styles.priceCardSelected,
              ]}
              onPress={() => setSelectedPackage(PACKAGE_IDS.MONTHLY)}
            >
              <View style={styles.priceCardHeader}>
                <Text style={styles.priceCardTitle}>월간 구독</Text>
                {selectedPackage === PACKAGE_IDS.MONTHLY && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceCardBody}>
                <Text style={styles.priceAmount}>{monthlyInfo.price}</Text>
                <Text style={styles.pricePeriod}>/ {monthlyInfo.period}</Text>
              </View>
            </Pressable>

            {/* 연간 구독 */}
            <Pressable
              style={[
                styles.priceCard,
                selectedPackage === PACKAGE_IDS.ANNUAL && styles.priceCardSelected,
              ]}
              onPress={() => setSelectedPackage(PACKAGE_IDS.ANNUAL)}
            >
              {annualInfo.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{annualInfo.savings}</Text>
                </View>
              )}
              <View style={styles.priceCardHeader}>
                <Text style={styles.priceCardTitle}>연간 구독</Text>
                {selectedPackage === PACKAGE_IDS.ANNUAL && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceCardBody}>
                <Text style={styles.priceAmount}>{annualInfo.price}</Text>
                <Text style={styles.pricePeriod}>/ {annualInfo.period}</Text>
              </View>
            </Pressable>
          </View>

          {/* 법적 안내 */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              • 결제는 Apple/Google 계정으로 청구됩니다
            </Text>
            <Text style={styles.legalText}>
              • 구독은 만료 24시간 전까지 취소하지 않으면 자동 갱신됩니다
            </Text>
            <Text style={styles.legalText}>
              • 구독 관리는 기기 설정에서 할 수 있습니다
            </Text>
          </View>

          {/* 복원 링크 */}
          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            <Text style={styles.restoreButtonText}>
              {isRestoring ? '복원 중...' : '구매 내역 복원'}
            </Text>
          </Pressable>
        </ScrollView>

        {/* 하단 CTA 버튼 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[
              styles.ctaButton,
              (isPurchasing || packages.length === 0) && styles.ctaButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || packages.length === 0}
          >
            {isPurchasing ? (
              <ActivityIndicator color={tokens.colors.white} />
            ) : (
              <Text style={styles.ctaButtonText}>
                {packages.length === 0 ? '상품 준비 중' : '구독하기'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
    },
    // 헤더
    header: {
      alignItems: 'center',
      marginBottom: tokens.spacing['2xl'],
    },
    headerEmoji: {
      fontSize: 80,
      lineHeight: 96,
      marginBottom: tokens.spacing.md,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      marginBottom: tokens.spacing.sm,
    },
    headerSubtitle: {
      fontSize: tokens.typography.fontSize.lg,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    // 섹션
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.md,
    },
    // 기능 리스트
    featuresSection: {
      marginBottom: tokens.spacing['2xl'],
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.card,
      padding: tokens.spacing.md,
      borderRadius: tokens.borderRadius.lg,
      marginBottom: tokens.spacing.sm,
      ...(isDark && { borderWidth: 1, borderColor: theme.border }),
    },
    featureIcon: {
      fontSize: 28,
      lineHeight: 36,
      marginRight: tokens.spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    // 가격 카드
    pricingSection: {
      marginBottom: tokens.spacing['2xl'],
    },
    priceCard: {
      backgroundColor: theme.card,
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.xl,
      marginBottom: tokens.spacing.md,
      borderWidth: 2,
      borderColor: theme.border,
      position: 'relative',
    },
    priceCardSelected: {
      borderColor: tokens.colors.primary[500],
      backgroundColor: isDark
        ? 'rgba(102, 126, 234, 0.1)'
        : tokens.colors.primary[50],
    },
    priceCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing.sm,
    },
    priceCardTitle: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.colors.primary[500],
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: {
      color: tokens.colors.white,
      fontSize: 14,
      fontWeight: tokens.typography.fontWeight.bold,
    },
    priceCardBody: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    priceAmount: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    pricePeriod: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      marginLeft: tokens.spacing.xs,
    },
    savingsBadge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: tokens.colors.semantic.success,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 4,
      borderRadius: tokens.borderRadius.md,
    },
    savingsText: {
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.white,
    },
    // 법적 안내
    legalSection: {
      marginBottom: tokens.spacing.lg,
    },
    legalText: {
      fontSize: tokens.typography.fontSize.xs,
      color: theme.textTertiary,
      lineHeight: 18,
      marginBottom: 4,
    },
    // 복원 버튼
    restoreButton: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.md,
    },
    restoreButtonText: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 600],
      fontWeight: tokens.typography.fontWeight.medium,
    },
    // 하단 CTA
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: tokens.spacing.lg,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    ctaButton: {
      backgroundColor: tokens.colors.primary[500],
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
    },
    ctaButtonDisabled: {
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[300],
    },
    ctaButtonText: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.white,
    },
  });
