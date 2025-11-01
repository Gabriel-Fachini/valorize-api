/**
 * Prisma Error Formatter
 * Formats Prisma errors to be more readable in the console
 */

interface PrismaError extends Error {
  code?: string
  meta?: Record<string, unknown>
  clientVersion?: string
}

/**
 * Checks if an error is a Prisma error
 */
export function isPrismaError(error: unknown): error is PrismaError {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as Record<string, unknown>

  return Boolean(
    (err.name && typeof err.name === 'string' && err.name.includes('Prisma')) ||
    'code' in err ||
    'clientVersion' in err ||
    (err.message && typeof err.message === 'string' && err.message.includes('prisma.')),
  )
}

/**
 * Formats a Prisma error message to be more readable
 */
export function formatPrismaError(error: PrismaError): string {
  const lines: string[] = []

  // Header with error type
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(`🚨 ${error.name}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  // Extract file location from message if present
  const locationMatch = error.message.match(/in\n([^\n]+):(\d+):(\d+)/)
  if (locationMatch) {
    const [, file, line, column] = locationMatch
    lines.push('📍 Location:')
    lines.push(`   File: ${file}`)
    lines.push(`   Line: ${line}, Column: ${column}`)
    lines.push('')
  }

  // Extract the main error description and code context
  const errorLines = error.message.split('\n')
  let inCodeBlock = false
  let mainMessage = ''
  const codeBlock: string[] = []

  for (let i = 0; i < errorLines.length; i++) {
    const line = errorLines[i]

    // Check if this is the start of a code block (line numbers)
    if (line.match(/^\s+\d+/)) {
      inCodeBlock = true
    }

    // Collect code block lines
    if (inCodeBlock) {
      // Format the line to remove excessive spacing
      const formattedLine = line
        .replace(/^(\s+)(\d+)/, '  $2') // Normalize line number indentation
        .replace(/→/, '➜')              // Better arrow

      if (formattedLine.trim()) {
        codeBlock.push(formattedLine)
      }

      // Check if we've reached the end of the code block
      if (line.includes(')') && !line.includes('(') && i < errorLines.length - 2) {
        // Next non-empty line after the closing paren is likely the error message
        for (let j = i + 1; j < errorLines.length; j++) {
          const nextLine = errorLines[j].trim()
          if (nextLine && !nextLine.includes('at ') && !nextLine.includes('/node_modules/')) {
            mainMessage = nextLine
            break
          }
        }
        break
      }
    }
  }

  // If no main message found, look for common error patterns
  if (!mainMessage) {
    for (const line of errorLines) {
      const trimmed = line.trim()
      if (
        trimmed &&
        (trimmed.startsWith('Unknown') ||
         trimmed.startsWith('Expected') ||
         trimmed.startsWith('Missing') ||
         trimmed.startsWith('Invalid') && !trimmed.includes('invocation'))
      ) {
        mainMessage = trimmed
        break
      }
    }
  }

  // Display the main error message
  if (mainMessage) {
    lines.push('❌ Error:')
    lines.push(`   ${mainMessage}`)
    lines.push('')
  }

  // Display the code context
  if (codeBlock.length > 0) {
    lines.push('📝 Code Context:')
    lines.push('')

    // Clean up and display code block
    let foundArrow = false
    for (const line of codeBlock) {
      if (line.includes('➜')) {
        foundArrow = true
        lines.push(`   ${line}  ⚠️ Error occurs here`)
      } else if (line.includes('~~~~~')) {
        // Highlight the problematic argument
        const prevLine = lines[lines.length - 1]
        if (prevLine) {
          lines[lines.length - 1] = prevLine + '  ⚠️'
        }
      } else if (foundArrow || line.match(/^\s+\d+/)) {
        lines.push(`   ${line}`)
      }
    }
    lines.push('')
  }

  // Display Prisma error code if available
  if (error.code) {
    lines.push('🔍 Error Code:')
    lines.push(`   ${error.code}`)
    lines.push('')
  }

  // Display metadata if available
  if (error.meta && Object.keys(error.meta).length > 0) {
    lines.push('📋 Additional Information:')
    for (const [key, value] of Object.entries(error.meta)) {
      lines.push(`   ${key}: ${JSON.stringify(value)}`)
    }
    lines.push('')
  }

  // Extract and display stack trace (first few relevant lines)
  if (error.stack) {
    const stackLines = error.stack
      .split('\n')
      .filter(line =>
        line.includes('at ') &&
        !line.includes('node_modules') &&
        !line.includes('node:'),
      )
      .slice(0, 3)

    if (stackLines.length > 0) {
      lines.push('📚 Stack Trace (relevant files):')
      stackLines.forEach(line => {
        const cleanLine = line.trim().replace('at ', '')
        lines.push(`   ${cleanLine}`)
      })
      lines.push('')
    }
  }

  // Footer
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  return lines.join('\n')
}

/**
 * Extracts the most important information from a Prisma error
 */
export function getErrorSummary(error: PrismaError): {
  type: string
  message: string
  location?: string
  code?: string
} {
  const locationMatch = error.message.match(/in\n([^\n]+):(\d+):(\d+)/)

  return {
    type: error.name,
    message: error.message.split('\n').find(line =>
      line.trim() &&
      !line.includes('Invalid') &&
      !line.includes('at ') &&
      !line.includes('prisma.'),
    )?.trim() || error.message.split('\n')[0],
    location: locationMatch ? `${locationMatch[1]}:${locationMatch[2]}:${locationMatch[3]}` : undefined,
    code: error.code,
  }
}
