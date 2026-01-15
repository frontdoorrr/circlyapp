/**
 * RevenueCat SDK Wrapper for Circly Orb Mode Subscription
 *
 * This module provides a clean interface to interact with RevenueCat
 * for managing Orb Mode subscriptions.
 *
 * @module services/subscription/revenuecat
 */

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (replace with actual keys from RevenueCat dashboard)
const REVENUECAT_IOS_API_KEY = 'YOUR_REVENUECAT_IOS_API_KEY';
const REVENUECAT_ANDROID_API_KEY = 'YOUR_REVENUECAT_ANDROID_API_KEY';

// Entitlement identifier for Orb Mode
const ORB_MODE_ENTITLEMENT = 'orb_mode';

// Package identifiers
export const PACKAGE_IDS = {
  MONTHLY: 'orb_mode_monthly',
  ANNUAL: 'orb_mode_annual',
} as const;

/**
 * Initialize RevenueCat SDK with user identification
 *
 * @param userId - User's unique identifier (UUID from backend)
 * @returns Promise<CustomerInfo> - Customer information after initialization
 *
 * @example
 * ```typescript
 * const customerInfo = await initializePurchases(user.id);
 * ```
 */
export async function initializePurchases(userId: string): Promise<CustomerInfo> {
  // Set log level for debugging (disable in production)
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  // Configure with platform-specific API key
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

  await Purchases.configure({
    apiKey,
    appUserID: userId,
  });

  // Get initial customer info
  const customerInfo = await Purchases.getCustomerInfo();

  console.log('[RevenueCat] Initialized for user:', userId);
  console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));

  return customerInfo;
}

/**
 * Check if user has active Orb Mode subscription
 *
 * @returns Promise<boolean> - True if user has active Orb Mode entitlement
 *
 * @example
 * ```typescript
 * const isSubscribed = await getSubscriptionStatus();
 * if (isSubscribed) {
 *   // Show voter reveal feature
 * }
 * ```
 */
export async function getSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isActive = customerInfo.entitlements.active[ORB_MODE_ENTITLEMENT] !== undefined;

    console.log('[RevenueCat] Orb Mode subscription status:', isActive);

    return isActive;
  } catch (error) {
    console.error('[RevenueCat] Failed to get subscription status:', error);
    return false;
  }
}

/**
 * Get available subscription offerings
 *
 * @returns Promise<PurchasesOffering | null> - Current offering with available packages
 *
 * @example
 * ```typescript
 * const offering = await getOfferings();
 * if (offering) {
 *   const monthlyPackage = offering.availablePackages.find(p => p.identifier === 'orb_mode_monthly');
 * }
 * ```
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current !== null) {
      console.log('[RevenueCat] Current offering:', offerings.current.identifier);
      console.log(
        '[RevenueCat] Available packages:',
        offerings.current.availablePackages.map((p) => p.identifier)
      );
      return offerings.current;
    }

    console.warn('[RevenueCat] No current offering available');
    return null;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Purchase a subscription package
 *
 * @param pkg - The package to purchase
 * @returns Promise<CustomerInfo> - Updated customer info after purchase
 * @throws Error if purchase fails or is cancelled
 *
 * @example
 * ```typescript
 * try {
 *   const customerInfo = await purchasePackage(monthlyPackage);
 *   if (customerInfo.entitlements.active['orb_mode']) {
 *     // Purchase successful, enable Orb Mode
 *   }
 * } catch (error) {
 *   // Handle purchase error or cancellation
 * }
 * ```
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  console.log('[RevenueCat] Purchasing package:', pkg.identifier);

  const { customerInfo } = await Purchases.purchasePackage(pkg);

  console.log('[RevenueCat] Purchase complete');
  console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));

  return customerInfo;
}

/**
 * Restore previous purchases
 *
 * Use this when user reinstalls app or switches devices
 *
 * @returns Promise<CustomerInfo> - Customer info with restored purchases
 *
 * @example
 * ```typescript
 * const customerInfo = await restorePurchases();
 * if (customerInfo.entitlements.active['orb_mode']) {
 *   // Purchases restored, enable Orb Mode
 * }
 * ```
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  console.log('[RevenueCat] Restoring purchases...');

  const customerInfo = await Purchases.restorePurchases();

  console.log('[RevenueCat] Purchases restored');
  console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));

  return customerInfo;
}

/**
 * Get customer information
 *
 * @returns Promise<CustomerInfo> - Current customer information
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

/**
 * Log out current user
 *
 * Call this when user logs out of the app
 */
export async function logOut(): Promise<void> {
  console.log('[RevenueCat] Logging out...');
  await Purchases.logOut();
}

/**
 * Add listener for customer info updates
 *
 * @param listener - Callback function for customer info changes
 * @returns Function to remove the listener
 *
 * @example
 * ```typescript
 * const removeListener = addCustomerInfoUpdateListener((info) => {
 *   const isOrbMode = info.entitlements.active['orb_mode'] !== undefined;
 *   updateOrbModeStatus(isOrbMode);
 * });
 *
 * // Later: removeListener();
 * ```
 */
export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/**
 * Helper: Get subscription expiration date
 *
 * @returns Promise<Date | null> - Expiration date or null if not subscribed
 */
export async function getExpirationDate(): Promise<Date | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ORB_MODE_ENTITLEMENT];

    if (entitlement?.expirationDate) {
      return new Date(entitlement.expirationDate);
    }

    return null;
  } catch (error) {
    console.error('[RevenueCat] Failed to get expiration date:', error);
    return null;
  }
}

/**
 * Helper: Check if subscription will renew
 *
 * @returns Promise<boolean> - True if subscription will auto-renew
 */
export async function willRenew(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ORB_MODE_ENTITLEMENT];

    return entitlement?.willRenew ?? false;
  } catch (error) {
    console.error('[RevenueCat] Failed to check renewal status:', error);
    return false;
  }
}
