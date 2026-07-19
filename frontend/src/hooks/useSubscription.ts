/**
 * useSubscription Hook
 *
 * React hook for managing subscription state with RevenueCat
 *
 * @module hooks/useSubscription
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  getSubscriptionStatus,
  hasActiveSubscription,
  getOfferings,
  purchasePackage,
  restorePurchases,
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  addCustomerInfoUpdateListener,
  isPurchaseCancelled,
  getErrorMessage,
  hasOrbModeEntitlement,
  type SubscriptionStatus,
  type PaywallResult,
} from '../services/subscription/revenuecat';
import { logger } from '../utils/logger';

// ============================================================================
// Query Keys
// ============================================================================

export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: () => [...subscriptionKeys.all, 'status'] as const,
  offerings: () => [...subscriptionKeys.all, 'offerings'] as const,
};

// ============================================================================
// Main Hook
// ============================================================================

export interface UseSubscriptionReturn {
  // Status
  isSubscribed: boolean;
  isLoading: boolean;
  status: SubscriptionStatus | null;

  // Offerings
  offerings: PurchasesOffering | null;
  isLoadingOfferings: boolean;

  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  showPaywall: () => Promise<PaywallResult>;
  showPaywallIfNeeded: () => Promise<PaywallResult>;
  showCustomerCenter: () => Promise<void>;
  refresh: () => Promise<void>;

  // State
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
}

/**
 * Hook for managing subscription state
 *
 * @example
 * ```tsx
 * function SubscriptionScreen() {
 *   const {
 *     isSubscribed,
 *     isLoading,
 *     offerings,
 *     purchase,
 *     showPaywall,
 *   } = useSubscription();
 *
 *   if (isLoading) return <Loading />;
 *
 *   if (isSubscribed) {
 *     return <ProFeatures />;
 *   }
 *
 *   return (
 *     <Button onPress={showPaywall}>
 *       Upgrade to Pro
 *     </Button>
 *   );
 * }
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Queries
  // ============================================================================

  // Subscription status query
  const {
    data: status,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: getSubscriptionStatus,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // SDK 미초기화 시 불필요한 재시도 방지
    refetchOnWindowFocus: false,
  });

  // Offerings query
  const {
    data: offerings,
    isLoading: isLoadingOfferings,
    refetch: refetchOfferings,
  } = useQuery({
    queryKey: subscriptionKeys.offerings(),
    queryFn: getOfferings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // SDK 미초기화 시 불필요한 재시도 방지
    refetchOnWindowFocus: false,
  });

  // ============================================================================
  // Mutations
  // ============================================================================

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: purchasePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
      setError(null);
    },
    onError: (err) => {
      if (!isPurchaseCancelled(err)) {
        setError(getErrorMessage(err));
      }
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
      setError(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // ============================================================================
  // Customer Info Updates Listener
  // ============================================================================

  useEffect(() => {
    const removeListener = addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      logger.log('[useSubscription] Customer info updated');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    });

    return removeListener;
  }, [queryClient]);

  // ============================================================================
  // Actions
  // ============================================================================

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        setError(null);
        const customerInfo = await purchaseMutation.mutateAsync(pkg);
        return hasOrbModeEntitlement(customerInfo);
      } catch (err) {
        if (isPurchaseCancelled(err)) {
          return false;
        }
        return false;
      }
    },
    [purchaseMutation]
  );

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const customerInfo = await restoreMutation.mutateAsync();
      return hasOrbModeEntitlement(customerInfo);
    } catch {
      return false;
    }
  }, [restoreMutation]);

  const showPaywall = useCallback(async (): Promise<PaywallResult> => {
    setError(null);
    const result = await presentPaywall();
    if (result.purchased || result.restored) {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    }
    if (result.error) {
      setError(getErrorMessage(result.error));
    }
    return result;
  }, [queryClient]);

  const showPaywallIfNeeded = useCallback(async (): Promise<PaywallResult> => {
    setError(null);
    const result = await presentPaywallIfNeeded();
    if (result.purchased || result.restored) {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    }
    if (result.error) {
      setError(getErrorMessage(result.error));
    }
    return result;
  }, [queryClient]);

  const showCustomerCenter = useCallback(async (): Promise<void> => {
    await presentCustomerCenter();
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([refetchStatus(), refetchOfferings()]);
  }, [refetchStatus, refetchOfferings]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Status
    isSubscribed: status?.isSubscribed ?? false,
    isLoading: isLoadingStatus,
    status: status ?? null,

    // Offerings
    offerings: offerings ?? null,
    isLoadingOfferings,

    // Actions
    purchase,
    restore,
    showPaywall,
    showPaywallIfNeeded,
    showCustomerCenter,
    refresh,

    // State
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    error,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Simple hook to check if user is subscribed
 */
export function useIsSubscribed(): boolean {
  const { data } = useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: hasActiveSubscription,
    staleTime: 1000 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return data ?? false;
}

/**
 * Hook to show paywall and handle result
 */
export function useShowPaywall() {
  const queryClient = useQueryClient();
  const [isPresenting, setIsPresenting] = useState(false);

  const show = useCallback(async (): Promise<PaywallResult> => {
    setIsPresenting(true);
    try {
      const result = await presentPaywall();
      if (result.purchased || result.restored) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
      }
      return result;
    } finally {
      setIsPresenting(false);
    }
  }, [queryClient]);

  return { show, isPresenting };
}
