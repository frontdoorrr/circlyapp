/**
 * RevenueCat SDK Wrapper
 *
 * Modern implementation with Paywall UI and Customer Center support
 *
 * @module services/subscription/revenuecat
 */

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Alert } from 'react-native';
import { logger } from '../../utils/logger';

// ============================================================================
// Configuration
// ============================================================================

// RevenueCat API Keys
// For production, use environment variables:
// const API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? 'YOUR_KEY';
const REVENUECAT_API_KEY = 'test_buCwmBrvrkYvGBmDlmmgplDcQai';

// Entitlement identifier
const PRO_ENTITLEMENT = 'frontdoorrr Pro';

// Product identifiers
// RevenueCat standard package identifiers
export const PRODUCT_IDS = {
  MONTHLY: '$rc_monthly',
  YEARLY: '$rc_annual',
  LIFETIME: '$rc_lifetime',
} as const;

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionStatus {
  isSubscribed: boolean;
  entitlementInfo: CustomerInfo['entitlements']['active'][string] | null;
  expirationDate: Date | null;
  willRenew: boolean;
  productIdentifier: string | null;
  isLifetime: boolean;
}

export interface PaywallResult {
  purchased: boolean;
  restored: boolean;
  cancelled: boolean;
  error: Error | null;
}

// ============================================================================
// Initialization
// ============================================================================

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 *
 * @param userId - Optional user ID for logged-in users
 */
export async function initializePurchases(userId?: string): Promise<CustomerInfo | null> {
  try {
    // Set log level
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
    }

    // Configure SDK
    if (!isConfigured) {
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId ?? null,
      });
      isConfigured = true;
      logger.log('[RevenueCat] SDK configured');
    } else if (userId) {
      // If already configured, log in the user
      await Purchases.logIn(userId);
      logger.log('[RevenueCat] User logged in:', userId);
    }

    const customerInfo = await Purchases.getCustomerInfo();
    logCustomerInfo(customerInfo);

    return customerInfo;
  } catch (error) {
    logger.error('[RevenueCat] Initialization failed:', error);
    return null;
  }
}

/**
 * Check if SDK is configured
 */
export function isInitialized(): boolean {
  return isConfigured;
}

// ============================================================================
// Subscription Status
// ============================================================================

/**
 * Check if user has active Pro subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!isConfigured) {
    logger.warn('[RevenueCat] SDK not initialized, returning false');
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  } catch (error) {
    logger.error('[RevenueCat] Failed to check subscription:', error);
    return false;
  }
}

/**
 * Get detailed subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!isConfigured) {
    logger.warn('[RevenueCat] SDK not initialized, returning default status');
    return {
      isSubscribed: false,
      entitlementInfo: null,
      expirationDate: null,
      willRenew: false,
      productIdentifier: null,
      isLifetime: false,
    };
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];

    if (!entitlement) {
      return {
        isSubscribed: false,
        entitlementInfo: null,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
        isLifetime: false,
      };
    }

    const isLifetime = entitlement.productIdentifier === PRODUCT_IDS.LIFETIME;

    return {
      isSubscribed: true,
      entitlementInfo: entitlement,
      expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
      willRenew: entitlement.willRenew,
      productIdentifier: entitlement.productIdentifier,
      isLifetime,
    };
  } catch (error) {
    logger.error('[RevenueCat] Failed to get subscription status:', error);
    return {
      isSubscribed: false,
      entitlementInfo: null,
      expirationDate: null,
      willRenew: false,
      productIdentifier: null,
      isLifetime: false,
    };
  }
}

/**
 * Get customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    logger.warn('[RevenueCat] SDK not initialized');
    return null;
  }
  return Purchases.getCustomerInfo();
}

// ============================================================================
// Offerings & Products
// ============================================================================

/**
 * Get current offering with available packages
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isConfigured) {
    logger.warn('[RevenueCat] SDK not initialized, returning null offerings');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current) {
      logger.log('[RevenueCat] Current offering:', offerings.current.identifier);
      logger.log(
        '[RevenueCat] Available packages:',
        offerings.current.availablePackages.map((p) => ({
          id: p.identifier,
          price: p.product.priceString,
        }))
      );
      return offerings.current;
    }

    logger.warn('[RevenueCat] No current offering available');
    return null;
  } catch (error) {
    logger.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Get specific package from current offering
 */
export async function getPackage(
  packageId: typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS]
): Promise<PurchasesPackage | null> {
  const offering = await getOfferings();
  if (!offering) return null;

  return offering.availablePackages.find((p) => p.identifier === packageId) ?? null;
}

// ============================================================================
// Purchases
// ============================================================================

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  logger.log('[RevenueCat] Purchasing:', pkg.identifier);

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  logCustomerInfo(customerInfo);

  return customerInfo;
}

/**
 * Purchase a product by ID
 */
export async function purchaseProduct(
  productId: typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS]
): Promise<CustomerInfo | null> {
  const pkg = await getPackage(productId);

  if (!pkg) {
    logger.error('[RevenueCat] Package not found:', productId);
    return null;
  }

  return purchasePackage(pkg);
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  logger.log('[RevenueCat] Restoring purchases...');

  const customerInfo = await Purchases.restorePurchases();
  logCustomerInfo(customerInfo);

  return customerInfo;
}

// ============================================================================
// RevenueCat UI - Paywall
// ============================================================================

/**
 * Present the default paywall
 *
 * Uses RevenueCatUI for a pre-built, customizable paywall
 */
export async function presentPaywall(): Promise<PaywallResult> {
  try {
    // Ensure SDK is configured before presenting paywall
    if (!isConfigured) {
      logger.log('[RevenueCat] SDK not configured, initializing...');
      await initializePurchases();
    }

    logger.log('[RevenueCat] Presenting paywall...');

    const result = await RevenueCatUI.presentPaywall();

    logger.log('[RevenueCat] Paywall result:', result);

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return { purchased: true, restored: false, cancelled: false, error: null };
      case PAYWALL_RESULT.RESTORED:
        return { purchased: false, restored: true, cancelled: false, error: null };
      case PAYWALL_RESULT.CANCELLED:
      case PAYWALL_RESULT.NOT_PRESENTED:
      default:
        return { purchased: false, restored: false, cancelled: true, error: null };
    }
  } catch (error) {
    logger.error('[RevenueCat] Paywall error:', error);
    return {
      purchased: false,
      restored: false,
      cancelled: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Present paywall with specific offering
 */
export async function presentPaywallWithOffering(
  offeringIdentifier: string
): Promise<PaywallResult> {
  try {
    // Ensure SDK is configured before presenting paywall
    if (!isConfigured) {
      logger.log('[RevenueCat] SDK not configured, initializing...');
      await initializePurchases();
    }

    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[offeringIdentifier];

    if (!offering) {
      throw new Error(`Offering not found: ${offeringIdentifier}`);
    }

    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT,
    });

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return { purchased: true, restored: false, cancelled: false, error: null };
      case PAYWALL_RESULT.RESTORED:
        return { purchased: false, restored: true, cancelled: false, error: null };
      default:
        return { purchased: false, restored: false, cancelled: true, error: null };
    }
  } catch (error) {
    logger.error('[RevenueCat] Paywall error:', error);
    return {
      purchased: false,
      restored: false,
      cancelled: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Present paywall only if user doesn't have Pro entitlement
 */
export async function presentPaywallIfNeeded(): Promise<PaywallResult> {
  try {
    // Ensure SDK is configured before presenting paywall
    if (!isConfigured) {
      logger.log('[RevenueCat] SDK not configured, initializing...');
      await initializePurchases();
    }

    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT,
    });

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return { purchased: true, restored: false, cancelled: false, error: null };
      case PAYWALL_RESULT.RESTORED:
        return { purchased: false, restored: true, cancelled: false, error: null };
      case PAYWALL_RESULT.NOT_PRESENTED:
        // User already has entitlement
        return { purchased: false, restored: false, cancelled: false, error: null };
      default:
        return { purchased: false, restored: false, cancelled: true, error: null };
    }
  } catch (error) {
    logger.error('[RevenueCat] Paywall error:', error);
    return {
      purchased: false,
      restored: false,
      cancelled: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ============================================================================
// RevenueCat UI - Customer Center
// ============================================================================

/**
 * Present the Customer Center
 *
 * Allows users to manage their subscription:
 * - View subscription details
 * - Cancel subscription
 * - Change plan
 * - Contact support
 */
export async function presentCustomerCenter(): Promise<void> {
  try {
    logger.log('[RevenueCat] Presenting Customer Center...');
    await RevenueCatUI.presentCustomerCenter();
    logger.log('[RevenueCat] Customer Center closed');
  } catch (error) {
    logger.error('[RevenueCat] Customer Center error:', error);

    // Fallback: Show basic subscription management options
    Alert.alert(
      '구독 관리',
      '구독 관리 화면을 열 수 없습니다.\n\n설정 앱에서 구독을 관리할 수 있습니다:\n설정 → Apple ID → 구독',
      [{ text: '확인' }]
    );
  }
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Log in a user (identify)
 */
export async function logIn(userId: string): Promise<CustomerInfo> {
  logger.log('[RevenueCat] Logging in user:', userId);

  const { customerInfo } = await Purchases.logIn(userId);
  logCustomerInfo(customerInfo);

  return customerInfo;
}

/**
 * Log out current user
 */
export async function logOut(): Promise<CustomerInfo> {
  logger.log('[RevenueCat] Logging out...');

  const customerInfo = await Purchases.logOut();
  logger.log('[RevenueCat] User logged out, now anonymous');

  return customerInfo;
}

// ============================================================================
// Listeners
// ============================================================================

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  if (!isConfigured) {
    logger.warn('[RevenueCat] SDK not initialized, listener not added');
    return () => {}; // no-op cleanup
  }

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Check if error is a user cancellation
 */
export function isPurchaseCancelled(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '알 수 없는 오류가 발생했습니다.';
  }

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return '구매가 취소되었습니다.';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return '스토어에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return '구매가 허용되지 않습니다. 설정을 확인해주세요.';
    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return '유효하지 않은 구매입니다.';
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return '현재 이 상품을 구매할 수 없습니다.';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    default:
      return err.message ?? '구매 중 오류가 발생했습니다.';
  }
}

// ============================================================================
// Helpers
// ============================================================================

function logCustomerInfo(customerInfo: CustomerInfo): void {
  logger.log('[RevenueCat] Customer ID:', customerInfo.originalAppUserId);
  logger.log(
    '[RevenueCat] Active entitlements:',
    Object.keys(customerInfo.entitlements.active)
  );
  logger.log(
    '[RevenueCat] All purchased products:',
    customerInfo.allPurchasedProductIdentifiers
  );
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(date: Date | null): string {
  if (!date) return '평생';

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get subscription period name
 */
export function getSubscriptionPeriodName(productId: string | null): string {
  switch (productId) {
    case PRODUCT_IDS.MONTHLY:
      return '월간';
    case PRODUCT_IDS.YEARLY:
      return '연간';
    case PRODUCT_IDS.LIFETIME:
      return '평생';
    default:
      return '구독';
  }
}
