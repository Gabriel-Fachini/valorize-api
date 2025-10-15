/**
 * Legacy seed file - now uses the modular seed system
 * 
 * This file has been refactored into a modular structure:
 * - src/lib/seed/data/        -> Data definitions
 * - src/lib/seed/seeders/     -> Seeding logic
 * - src/lib/seed/utils/       -> Utilities
 * - src/lib/seed/index.ts     -> Main orchestrator
 * 
 * This file is kept for backward compatibility and simply delegates to the new system.
 */

import { seed } from './seed/index'
import { logger } from './logger'

// Execute if run directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error:', error)
      process.exit(1)
    })
}

export { seed }

