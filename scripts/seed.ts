/**
 * Seed entrypoint kept outside src so Sonar analyzes only production runtime code.
 */

import { seed } from '../src/lib/seed/index'
import { logger } from '../src/lib/logger'

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error:', error)
      process.exit(1)
    })
}

export { seed }
