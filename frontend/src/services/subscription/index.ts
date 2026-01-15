/**
 * Subscription Service Module
 *
 * Provides subscription management functionality using RevenueCat
 */

export {
  initializePurchases,
  getSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  logOut,
  addCustomerInfoUpdateListener,
  getExpirationDate,
  willRenew,
  PACKAGE_IDS,
} from './revenuecat';
