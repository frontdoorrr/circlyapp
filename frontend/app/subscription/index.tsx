import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import {
  presentPaywall,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getErrorMessage,
  isPurchaseCancelled,
  PACKAGE_IDS,
  hasOrbModeEntitlement,
} from '../../src/services/subscription/revenuecat';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { logger } from '../../src/utils/logger';

/**
 * Subscription Paywall Screen
 *
 * Currently using Custom Paywall (RevenueCatUI Paywall not configured in Dashboard)
 *
 * Two modes available:
 * 1. Custom Paywall (current) - custom UI with RevenueCat SDK
 * 2. RevenueCatUI Paywall - requires Dashboard Paywall configuration
 *
 * To enable RevenueCatUI Paywall:
 * 1. Configure Paywall in RevenueCat Dashboard
 * 2. Set useCustomPaywall initial state to false
 *
 * Features:
 * - Show subscription benefits
 * - Monthly/Yearly pricing options
 * - Purchase and restore functionality
 */
const ORB_MODE_SYNC_ATTEMPTS = 6;
const ORB_MODE_SYNC_DELAY_MS = 1000;

export default function SubscriptionScreen() {
  useTheme(); // For themed styles
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { poll_id: pollId } = useLocalSearchParams<{ poll_id?: string }>();
  const { refetch: refetchUser } = useCurrentUser();
  const { refresh } = useSubscription();

  // 받은 하트 문맥에서 진입한 경우, 구독 완료 후 해당 힌트 화면으로 이어준다.
  const finishAfterSubscribe = useCallback(() => {
    if (pollId) {
      router.replace(`/results/${pollId}/hints` as any);
    } else {
      router.back();
    }
  }, [pollId]);

  const waitForOrbModeSync = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < ORB_MODE_SYNC_ATTEMPTS; attempt += 1) {
      const result = await refetchUser();
      if (result.data?.is_orb_mode) {
        return true;
      }

      if (attempt < ORB_MODE_SYNC_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, ORB_MODE_SYNC_DELAY_MS));
      }
    }

    return false;
  }, [refetchUser]);

  const completeSubscription = useCallback(async () => {
    await refresh();
    const isSynced = await waitForOrbModeSync();

    if (!isSynced) {
      Alert.alert(
        '결제 완료',
        'Orb Mode 구독은 완료됐지만 서버에 반영 중이에요. 잠시 후 다시 확인해주세요.',
        [{ text: '확인', onPress: () => router.back() }]
      );
      return;
    }

    Alert.alert(
      '구독 완료!',
      pollId ? '이제 받은 하트의 힌트를 확인할 수 있어요!' : 'Orb Mode가 활성화되었습니다!',
      [
        {
          text: pollId ? '힌트 보러 가기' : '확인',
          onPress: finishAfterSubscribe,
        },
      ]
    );
  }, [finishAfterSubscribe, pollId, refresh, waitForOrbModeSync]);

  // Skip RevenueCatUI Paywall - use Custom Paywall directly
  // RevenueCatUI requires Dashboard Paywall configuration which is not set up
  const [useCustomPaywall, setUseCustomPaywall] = useState(true);
  const [isLoadingPaywall, setIsLoadingPaywall] = useState(false);

  // Custom paywall state
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>(PACKAGE_IDS.MONTHLY);

  // RevenueCatUI Paywall - currently disabled
  // Enable this when Dashboard Paywall is configured and published
  useEffect(() => {
    // Skip RevenueCatUI paywall - Dashboard paywall not configured
    // Error: "Offering default has no configured paywall"
    if (useCustomPaywall) {
      logger.log('[Subscription] Using custom paywall (RevenueCatUI paywall not configured)');
      return;
    }

    async function tryRevenueCatPaywall() {
      try {
        setIsLoadingPaywall(true);

        // Present the RevenueCat Paywall
        const result = await presentPaywall();

        if (result.purchased || result.restored) {
          await completeSubscription();
          return;
        }

        if (result.cancelled) {
          // User cancelled, go back
          router.back();
          return;
        }

        if (result.error) {
          // Error - fall back to custom paywall
          logger.log('[Subscription] RevenueCatUI failed, using custom paywall');
          setUseCustomPaywall(true);
        }
      } catch (error) {
        logger.error('[Subscription] RevenueCatUI error:', error);
        setUseCustomPaywall(true);
      } finally {
        setIsLoadingPaywall(false);
      }
    }

    tryRevenueCatPaywall();
  }, [useCustomPaywall, completeSubscription]);

  // Load offerings for custom paywall
  useEffect(() => {
    if (!useCustomPaywall) return;

    async function loadOfferings() {
      try {
        setIsLoading(true);
        const offering = await getOfferings();

        if (offering) {
          setPackages(offering.availablePackages);
          logger.log('[Subscription] Loaded packages:', offering.availablePackages.length);
        }
      } catch (error) {
        logger.error('[Subscription] Failed to load offerings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOfferings();
  }, [useCustomPaywall]);

  // Get selected package
  const getSelectedPackage = useCallback(() => {
    return packages.find((pkg) => pkg.identifier === selectedPackage);
  }, [packages, selectedPackage]);

  // Handle purchase
  const handlePurchase = async () => {
    const pkg = getSelectedPackage();
    if (!pkg) {
      Alert.alert('오류', '구독 상품을 선택해주세요');
      return;
    }

    try {
      setIsPurchasing(true);
      const customerInfo = await purchasePackage(pkg);

      // Check subscription success
      if (hasOrbModeEntitlement(customerInfo)) {
        await completeSubscription();
      } else {
        Alert.alert('구매 확인 필요', 'Orb Mode 구독 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error: unknown) {
      if (isPurchaseCancelled(error)) {
        logger.log('[Subscription] User cancelled purchase');
        return;
      }

      logger.error('[Subscription] Purchase failed:', error);
      Alert.alert('구매 실패', getErrorMessage(error));
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const customerInfo = await restorePurchases();

      if (hasOrbModeEntitlement(customerInfo)) {
        await completeSubscription();
      } else {
        Alert.alert(
          '복원 실패',
          '복원할 구독이 없습니다. 같은 Apple/Google 계정인지 확인해주세요.'
        );
      }
    } catch (error: unknown) {
      logger.error('[Subscription] Restore failed:', error);
      Alert.alert('복원 실패', getErrorMessage(error));
    } finally {
      setIsRestoring(false);
    }
  };

  // Get package info for display
  const getPackageInfo = (packageId: string) => {
    const pkg = packages.find((p) => p.identifier === packageId);
    if (!pkg) {
      // Default prices (before RevenueCat connection)
      switch (packageId) {
        case PACKAGE_IDS.MONTHLY:
          return { price: '$4.99', period: '월', savings: null };
        case PACKAGE_IDS.YEARLY:
          return { price: '$49.99', period: '년', savings: '17% 할인' };
        default:
          return { price: '...', period: '', savings: null };
      }
    }

    const product = pkg.product;

    // Calculate savings for yearly
    if (packageId === PACKAGE_IDS.YEARLY) {
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

  // Show loading while RevenueCatUI paywall is being presented
  if (isLoadingPaywall && !useCustomPaywall) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Orb Mode',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </>
    );
  }

  // Custom paywall loading
  if (useCustomPaywall && isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Orb Mode',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        </View>
      </>
    );
  }

  // Custom paywall UI
  if (!useCustomPaywall) {
    return null; // RevenueCatUI paywall handles everything
  }

  const monthlyInfo = getPackageInfo(PACKAGE_IDS.MONTHLY);
  const yearlyInfo = getPackageInfo(PACKAGE_IDS.YEARLY);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>{pollId ? '🔮' : '⭐'}</Text>
            <Text style={styles.headerTitle}>Orb Mode</Text>
            <Text style={styles.headerSubtitle}>
              {pollId
                ? '이 하트를 보낸 사람의 안전 힌트를 확인해보세요'
                : 'Orb Mode의 프리미엄 기능을 이용해보세요'}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Orb Mode 혜택</Text>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👀</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>고급 힌트</Text>
                <Text style={styles.featureDescription}>
                  받은 하트의 안전한 단계형 힌트를 확인할 수 있어요
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
                <Text style={styles.featureTitle}>무제한 접근</Text>
                <Text style={styles.featureDescription}>
                  모든 프리미엄 기능을 무제한으로 이용하세요
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>구독 플랜 선택</Text>

            {/* Monthly */}
            <PriceCard
              title="월간 구독"
              price={monthlyInfo.price}
              period={monthlyInfo.period}
              savings={monthlyInfo.savings}
              isSelected={selectedPackage === PACKAGE_IDS.MONTHLY}
              onPress={() => setSelectedPackage(PACKAGE_IDS.MONTHLY)}
              styles={styles}
            />

            {/* Yearly */}
            <PriceCard
              title="연간 구독"
              price={yearlyInfo.price}
              period={yearlyInfo.period}
              savings={yearlyInfo.savings}
              isSelected={selectedPackage === PACKAGE_IDS.YEARLY}
              onPress={() => setSelectedPackage(PACKAGE_IDS.YEARLY)}
              styles={styles}
            />

          </View>

          {/* Legal */}
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

          {/* Restore */}
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

        {/* CTA Button */}
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

// ============================================================================
// Price Card Component
// ============================================================================

interface PriceCardProps {
  title: string;
  price: string;
  period: string;
  savings: string | null;
  isSelected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function PriceCard({
  title,
  price,
  period,
  savings,
  isSelected,
  onPress,
  styles,
}: PriceCardProps) {
  return (
    <Pressable
      style={[styles.priceCard, isSelected && styles.priceCardSelected]}
      onPress={onPress}
    >
      {savings && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{savings}</Text>
        </View>
      )}
      <View style={styles.priceCardHeader}>
        <Text style={styles.priceCardTitle}>{title}</Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.priceCardBody}>
        <Text style={styles.priceAmount}>{price}</Text>
        <Text style={styles.pricePeriod}>/ {period}</Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: tokens.spacing.md,
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
    },
    // Header
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
    // Section
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.md,
    },
    // Features
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
    // Pricing
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
        ? 'rgba(139, 92, 246, 0.1)'
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
      backgroundColor: tokens.colors.semantic.success[500],
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 4,
      borderRadius: tokens.borderRadius.md,
    },
    savingsText: {
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.white,
    },
    // Legal
    legalSection: {
      marginBottom: tokens.spacing.lg,
    },
    legalText: {
      fontSize: tokens.typography.fontSize.xs,
      color: theme.textTertiary,
      lineHeight: 18,
      marginBottom: 4,
    },
    // Restore
    restoreButton: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.md,
    },
    restoreButtonText: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 600],
      fontWeight: tokens.typography.fontWeight.medium,
    },
    // Footer
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
