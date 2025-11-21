/**
 * @fileoverview Compliments Dashboard Model
 *
 * Database queries for network graph calculations.
 * Uses raw SQL for performance with complex aggregations.
 */

import { prisma } from '@/lib/database'
import { Prisma } from '@prisma/client'
import { NetworkNode, NetworkLink } from './compliments-dashboard.types'

/**
 * Get nodes (users with compliment statistics)
 *
 * Returns users who have sent or received compliments in the given period,
 * with their total counts and department/job title information.
 */
export async function getNetworkNodes(
  companyId: string,
  startDate: Date,
  endDate: Date,
  department?: string,
  minConnections: number = 1,
  limit: number = 50,
  userIds?: string[],
): Promise<NetworkNode[]> {
  const departmentFilter = department
    ? Prisma.sql`AND d.name = ${department}`
    : Prisma.empty

  const userIdsFilter =
    userIds && userIds.length > 0 ? Prisma.sql`AND u.id IN (${Prisma.join(userIds)})` : Prisma.empty

  const result = await prisma.$queryRaw<
    Array<{
      id: string
      name: string
      avatar: string | null
      role: string
      department: string
      compliments_given: bigint
      compliments_received: bigint
    }>
  >`
    SELECT
      u.id,
      u.name,
      u.avatar,
      COALESCE(jt.name, 'Sem Cargo') as role,
      COALESCE(d.name, 'Sem Departamento') as department,
      COUNT(DISTINCT CASE WHEN c.sender_id = u.id THEN c.id END) as compliments_given,
      COUNT(DISTINCT CASE WHEN c.receiver_id = u.id THEN c.id END) as compliments_received
    FROM users u
    LEFT JOIN job_titles jt ON u.job_title_id = jt.id AND jt.company_id = ${companyId}
    LEFT JOIN departments d ON u.department_id = d.id AND d.company_id = ${companyId}
    LEFT JOIN compliments c ON (c.sender_id = u.id OR c.receiver_id = u.id)
      AND c.company_id = ${companyId}
      AND c.created_at >= ${startDate}
      AND c.created_at <= ${endDate}
    WHERE u.company_id = ${companyId}
      AND u.is_active = true
      ${departmentFilter}
      ${userIdsFilter}
    GROUP BY u.id, u.name, u.avatar, jt.name, d.name
    HAVING (
      COUNT(DISTINCT CASE WHEN c.sender_id = u.id THEN c.id END) +
      COUNT(DISTINCT CASE WHEN c.receiver_id = u.id THEN c.id END)
    ) >= ${minConnections}
    ORDER BY (
      COUNT(DISTINCT CASE WHEN c.sender_id = u.id THEN c.id END) +
      COUNT(DISTINCT CASE WHEN c.receiver_id = u.id THEN c.id END)
    ) DESC
    LIMIT ${limit}
  `

  return result.map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    role: row.role,
    department: row.department,
    complimentsGiven: Number(row.compliments_given),
    complimentsReceived: Number(row.compliments_received),
  }))
}

/**
 * Get all user IDs connected to the specified users
 *
 * Returns IDs of users who have sent or received compliments
 * from/to the specified users in the given period.
 */
export async function getConnectedUserIds(
  companyId: string,
  userIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<string[]> {
  if (userIds.length === 0) {
    return []
  }

  const result = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT DISTINCT
      CASE
        WHEN c.sender_id IN (${Prisma.join(userIds)}) THEN c.receiver_id
        ELSE c.sender_id
      END as user_id
    FROM compliments c
    WHERE c.company_id = ${companyId}
      AND c.created_at >= ${startDate}
      AND c.created_at <= ${endDate}
      AND (
        c.sender_id IN (${Prisma.join(userIds)})
        OR c.receiver_id IN (${Prisma.join(userIds)})
      )
  `

  return result.map((row) => row.user_id)
}

/**
 * Get links (compliment relationships between users)
 *
 * Returns aggregated compliment data for pairs of users,
 * including count and array of compliment messages.
 */
export async function getNetworkLinks(
  companyId: string,
  userIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<NetworkLink[]> {
  if (userIds.length === 0) {
    return []
  }

  const result = await prisma.$queryRaw<
    Array<{
      source: string
      target: string
      value: bigint
      compliments: string[]
    }>
  >`
    SELECT
      c.sender_id as source,
      c.receiver_id as target,
      COUNT(*) as value,
      ARRAY_AGG(c.message ORDER BY c.created_at DESC) as compliments
    FROM compliments c
    WHERE c.company_id = ${companyId}
      AND c.sender_id IN (${Prisma.join(userIds)})
      AND c.receiver_id IN (${Prisma.join(userIds)})
      AND c.created_at >= ${startDate}
      AND c.created_at <= ${endDate}
    GROUP BY c.sender_id, c.receiver_id
    ORDER BY value DESC
  `

  return result.map((row) => ({
    source: row.source,
    target: row.target,
    value: Number(row.value),
    compliments: row.compliments,
  }))
}
