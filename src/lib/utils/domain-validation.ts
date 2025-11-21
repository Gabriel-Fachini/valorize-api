import { prisma } from '@lib/database'
import { ValidationError } from '@/middleware/error-handler'

/**
 * Validates if an email domain matches the company's registered domain
 *
 * @param companyId - The company ID to validate against
 * @param email - The email address to validate
 * @throws {ValidationError} If the company is not found
 * @throws {ValidationError} If the email domain doesn't match the company domain
 */
export async function validateEmailDomain(
  companyId: string,
  email: string
): Promise<void> {
  // Extract domain from email
  const emailDomain = email.split('@')[1]?.toLowerCase()

  if (!emailDomain) {
    throw new ValidationError('Invalid email format')
  }

  // Get company domain
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { domain: true }
  })

  if (!company) {
    throw new ValidationError('Company not found')
  }

  // Exact domain match validation
  if (emailDomain !== company.domain.toLowerCase()) {
    throw new ValidationError(
      `Email domain does not match company domain. Expected @${company.domain}`
    )
  }
}
