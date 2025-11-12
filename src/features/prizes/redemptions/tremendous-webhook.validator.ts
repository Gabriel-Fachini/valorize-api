import crypto from 'crypto'

/**
 * Validate Tremendous webhook signature using HMAC-SHA256
 *
 * Tremendous signs each webhook with a signature in the header:
 * Tremendous-Webhook-Signature: sha256=<hexadecimal>
 *
 * @param signature - The signature from the Tremendous-Webhook-Signature header
 * @param payload - The raw request body (as string or buffer)
 * @param secret - The webhook secret from Tremendous API
 * @returns true if signature is valid, false otherwise
 */
export function validateTremendousWebhookSignature(
  signature: string | undefined,
  payload: string | Buffer,
  secret: string,
): boolean {
  if (!signature) {
    return false
  }

  try {
    // Extract the hash from the signature header (format: sha256=<hex>)
    const [algorithm, hash] = signature.split('=')

    if (algorithm !== 'sha256' || !hash) {
      return false
    }

    // Ensure payload is a string
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf-8')

    // Calculate expected signature using HMAC-SHA256
    const expectedHash = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))
  } catch {
    return false
  }
}
