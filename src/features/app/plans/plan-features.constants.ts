import { PlanType } from '@prisma/client'

/**
 * @fileoverview Plan-based feature restriction constants
 *
 * This module defines which features are available for each plan tier.
 * Used by the plan-guard middleware to enforce plan-based access control.
 *
 * @module features/app/plans/plan-features.constants
 */

/**
 * Enum of all plan-restricted features in the platform
 */
export enum PLAN_FEATURE {
  // Dashboard & Analytics
  DASHBOARD_ADVANCED_FILTERS = 'dashboard:advanced_filters',
  DASHBOARD_NETWORK_GRAPH = 'dashboard:network_graph',
  DASHBOARD_EXPORT_PDF = 'dashboard:export_pdf',

  // Economy Dashboard
  ECONOMY_WALLET_HISTORY = 'economy:wallet_history',

  // Future features (placeholders)
  ANALYTICS_CUSTOM_REPORTS = 'analytics:custom_reports',
  GAMIFICATION_ADVANCED_BADGES = 'gamification:advanced_badges',
}

/**
 * Mapping of plans to their available features
 *
 * @description
 * - ESSENTIAL: Basic features only
 * - PROFESSIONAL: All features including premium ones
 *
 * Note: Features not listed here are available to all plans
 */
export const PLAN_FEATURES_MAP: Record<PlanType, PLAN_FEATURE[]> = {
  ESSENTIAL: [
    // ESSENTIAL plan has NO premium features
    // All basic features are available without being listed here
  ],

  PROFESSIONAL: [
    // Dashboard & Analytics (Premium)
    PLAN_FEATURE.DASHBOARD_ADVANCED_FILTERS,
    PLAN_FEATURE.DASHBOARD_NETWORK_GRAPH,
    PLAN_FEATURE.DASHBOARD_EXPORT_PDF,

    // Economy Dashboard (Premium)
    PLAN_FEATURE.ECONOMY_WALLET_HISTORY,

    // Future features
    PLAN_FEATURE.ANALYTICS_CUSTOM_REPORTS,
    PLAN_FEATURE.GAMIFICATION_ADVANCED_BADGES,
  ],
}

/**
 * User-friendly feature names for error messages
 */
export const FEATURE_DISPLAY_NAMES: Record<PLAN_FEATURE, string> = {
  [PLAN_FEATURE.DASHBOARD_ADVANCED_FILTERS]: 'Advanced Dashboard Filters',
  [PLAN_FEATURE.DASHBOARD_NETWORK_GRAPH]: 'Network Graph Visualization',
  [PLAN_FEATURE.DASHBOARD_EXPORT_PDF]: 'PDF Report Export',
  [PLAN_FEATURE.ECONOMY_WALLET_HISTORY]: 'Wallet Deposit History',
  [PLAN_FEATURE.ANALYTICS_CUSTOM_REPORTS]: 'Custom Analytics Reports',
  [PLAN_FEATURE.GAMIFICATION_ADVANCED_BADGES]: 'Advanced Gamification Badges',
}

/**
 * Custom error messages for specific features (optional)
 * If not defined, uses default message from PlanRestrictionError
 */
export const FEATURE_UPGRADE_MESSAGES: Partial<Record<PLAN_FEATURE, string>> = {
  [PLAN_FEATURE.DASHBOARD_EXPORT_PDF]:
    'PDF export is available on the Professional plan. Upgrade to unlock advanced reporting capabilities.',
  [PLAN_FEATURE.DASHBOARD_ADVANCED_FILTERS]:
    'Advanced filters (by department and job title) are available on the Professional plan. Upgrade to get deeper insights.',
  [PLAN_FEATURE.DASHBOARD_NETWORK_GRAPH]:
    'Network visualization is a Professional plan feature. Upgrade to see how recognition flows through your organization.',
}

/**
 * Helper function to check if a feature is available for a given plan
 *
 * @param plan - The plan type to check
 * @param feature - The feature to check availability for
 * @returns true if the feature is available, false otherwise
 */
export function isPlanFeatureAvailable(
  plan: PlanType | null | undefined,
  feature: PLAN_FEATURE,
): boolean {
  // If no plan defined, allow all features (backwards compatibility)
  if (!plan) {
    return true
  }

  const availableFeatures = PLAN_FEATURES_MAP[plan] || []
  return availableFeatures.includes(feature)
}

/**
 * Get all plans that have access to a specific feature
 *
 * @param feature - The feature to check
 * @returns Array of plan types that have access to the feature
 */
export function getPlansWithFeature(feature: PLAN_FEATURE): PlanType[] {
  return Object.entries(PLAN_FEATURES_MAP)
    .filter(([_, features]) => features.includes(feature))
    .map(([plan]) => plan as PlanType)
}

/**
 * Get minimum required plan for a feature
 *
 * @param feature - The feature to check
 * @returns The minimum plan required, or null if available to all
 */
export function getMinimumPlanForFeature(feature: PLAN_FEATURE): PlanType | null {
  const plans = getPlansWithFeature(feature)

  if (plans.length === 0) {
    return null
  }

  // If ESSENTIAL has it, that's the minimum
  if (plans.includes(PlanType.ESSENTIAL)) {
    return PlanType.ESSENTIAL
  }

  // Otherwise, PROFESSIONAL is the minimum
  return PlanType.PROFESSIONAL
}
