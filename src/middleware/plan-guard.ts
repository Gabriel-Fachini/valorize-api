/**
 * @fileoverview Plan-based access control middleware for Fastify routes
 *
 * This module provides middleware functions to enforce plan-based restrictions
 * on API endpoints. It checks if the current user's company has the required
 * plan to access specific premium features.
 *
 * @module middleware/plan-guard
 * @requires fastify
 * @requires @/middleware/error-handler
 * @requires @/middleware/auth
 * @requires @/features/app/plans/plan-features.constants
 * @requires @/lib/logger
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { PlanRestrictionError } from '@/middleware/error-handler'
import { getCurrentUser } from '@/middleware/auth'
import { authService } from '@/features/app/auth/auth.service'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { PlanType } from '@prisma/client'
import {
  PLAN_FEATURE,
  isPlanFeatureAvailable,
  FEATURE_DISPLAY_NAMES,
  FEATURE_UPGRADE_MESSAGES,
  getMinimumPlanForFeature,
} from '@/features/app/plans/plan-features.constants'

/**
 * Cache for company plans to reduce database queries
 * Key: companyId, Value: { planType, fetchedAt }
 */
const planCache = new Map<
  string,
  { planType: PlanType | null; fetchedAt: number }
>()

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Get company's plan type with caching
 *
 * @param companyId - The company ID to fetch the plan for
 * @returns The company's plan type or null if no plan is set
 */
async function getCompanyPlan(companyId: string): Promise<PlanType | null> {
  const now = Date.now()
  const cached = planCache.get(companyId)

  // Return cached value if still valid
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.planType
  }

  // Fetch from database
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      plans: {
        where: { isActive: true },
        select: {
          planType: true,
          isActive: true,
        },
      },
    },
  })

  const activePlan = company?.plans[0]
  const planType = activePlan?.isActive ? activePlan.planType : null

  // Update cache
  planCache.set(companyId, { planType, fetchedAt: now })

  return planType
}

/**
 * Clear plan cache for a specific company (useful after plan updates)
 *
 * @param companyId - The company ID to clear from cache
 */
export function clearPlanCache(companyId: string): void {
  planCache.delete(companyId)
}

/**
 * Clear all plan cache (useful for testing or major updates)
 */
export function clearAllPlanCache(): void {
  planCache.clear()
}

/**
 * Creates a middleware function that requires a specific feature's plan tier
 *
 * This higher-order function returns a Fastify middleware that checks if the
 * authenticated user's company has a plan that includes the specified feature.
 * If the company's plan doesn't include the feature, it throws a PlanRestrictionError.
 *
 * @function requireFeature
 * @param {PLAN_FEATURE} feature - The feature that requires plan validation
 * @returns {Function} A Fastify middleware function that performs the plan check
 *
 * @example
 * // Protect a route that requires PDF export feature (PROFESSIONAL plan)
 * fastify.get('/dashboard/export-pdf', {
 *   preHandler: [
 *     requireFeature(PLAN_FEATURE.DASHBOARD_EXPORT_PDF)
 *   ]
 * }, async (request, reply) => {
 *   // Route handler code
 * })
 *
 * @throws {PlanRestrictionError} When the company's plan doesn't include the feature
 */
export const requireFeature = (feature: PLAN_FEATURE) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = getCurrentUser(request)

    logger.debug('Checking plan feature access', {
      userId: user.sub,
      feature,
    })

    try {
      // Get company ID
      const companyId = await authService.getCompanyId(user.sub)

      // Get company's plan
      const planType = await getCompanyPlan(companyId)

      logger.debug('Company plan retrieved', {
        companyId,
        planType: planType || 'undefined',
        feature,
      })

      // Check if feature is available for this plan
      const hasAccess = isPlanFeatureAvailable(planType, feature)

      if (!hasAccess) {
        const minimumPlan = getMinimumPlanForFeature(feature)
        const featureName = FEATURE_DISPLAY_NAMES[feature] || feature
        const customMessage = FEATURE_UPGRADE_MESSAGES[feature]

        logger.warn('Plan restriction triggered', {
          userId: user.sub,
          companyId,
          currentPlan: planType || 'undefined',
          requiredPlan: minimumPlan || 'unknown',
          feature,
          featureName,
        })

        throw new PlanRestrictionError(
          minimumPlan || 'PROFESSIONAL',
          planType,
          featureName,
          customMessage,
        )
      }

      logger.debug('Plan feature access granted', {
        userId: user.sub,
        companyId,
        planType,
        feature,
      })
    } catch (error) {
      // Re-throw PlanRestrictionError as-is
      if (error instanceof PlanRestrictionError) {
        throw error
      }

      // Log unexpected errors
      logger.error('Unexpected error in plan guard middleware', {
        userId: user.sub,
        feature,
        error: error instanceof Error ? error.message : String(error),
      })

      // Re-throw other errors
      throw error
    }
  }
}

/**
 * Alternative middleware that accepts an array of allowed plan types
 *
 * This is a simpler approach that directly checks if the company's plan
 * matches one of the allowed plan types.
 *
 * @function requirePlan
 * @param {PlanType[]} allowedPlans - Array of plan types that are allowed
 * @returns {Function} A Fastify middleware function that performs the plan check
 *
 * @example
 * // Protect a route that requires PROFESSIONAL plan
 * fastify.get('/premium-feature', {
 *   preHandler: [
 *     requirePlan([PlanType.PROFESSIONAL])
 *   ]
 * }, async (request, reply) => {
 *   // Route handler code
 * })
 */
export const requirePlan = (allowedPlans: PlanType[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = getCurrentUser(request)

    logger.debug('Checking plan type access', {
      userId: user.sub,
      allowedPlans,
    })

    try {
      // Get company ID
      const companyId = await authService.getCompanyId(user.sub)

      // Get company's plan
      const planType = await getCompanyPlan(companyId)

      logger.debug('Company plan retrieved for type check', {
        companyId,
        planType: planType || 'undefined',
        allowedPlans,
      })

      // Check if plan is in allowed list
      // If no plan is set, allow access (backwards compatibility)
      if (planType && !allowedPlans.includes(planType)) {
        logger.warn('Plan type restriction triggered', {
          userId: user.sub,
          companyId,
          currentPlan: planType,
          allowedPlans,
        })

        throw new PlanRestrictionError(
          allowedPlans.join(' or '),
          planType,
          'This feature',
          `This feature requires ${allowedPlans.join(' or ')} plan. Your current plan is ${planType}.`,
        )
      }

      logger.debug('Plan type access granted', {
        userId: user.sub,
        companyId,
        planType,
        allowedPlans,
      })
    } catch (error) {
      // Re-throw PlanRestrictionError as-is
      if (error instanceof PlanRestrictionError) {
        throw error
      }

      // Log unexpected errors
      logger.error('Unexpected error in plan type guard middleware', {
        userId: user.sub,
        allowedPlans,
        error: error instanceof Error ? error.message : String(error),
      })

      // Re-throw other errors
      throw error
    }
  }
}

/**
 * Helper function to check plan access without throwing an error
 * Useful for conditional rendering or feature toggling
 *
 * @param request - Fastify request object
 * @param feature - The feature to check
 * @returns true if the user's company has access to the feature
 */
export async function checkPlanFeatureAccess(
  request: FastifyRequest,
  feature: PLAN_FEATURE,
): Promise<boolean> {
  try {
    const user = getCurrentUser(request)
    const companyId = await authService.getCompanyId(user.sub)
    const planType = await getCompanyPlan(companyId)

    return isPlanFeatureAvailable(planType, feature)
  } catch {
    // On error, deny access
    return false
  }
}

/**
 * Helper function to get current user's company plan
 * Useful for conditional logic in route handlers
 *
 * @param request - Fastify request object
 * @returns The company's plan type or null
 */
export async function getCurrentCompanyPlan(
  request: FastifyRequest,
): Promise<PlanType | null> {
  try {
    const user = getCurrentUser(request)
    const companyId = await authService.getCompanyId(user.sub)
    return await getCompanyPlan(companyId)
  } catch {
    return null
  }
}
