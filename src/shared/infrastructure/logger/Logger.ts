interface LogLevel {
  DEBUG: 0
  INFO: 1
  WARN: 2
  ERROR: 3
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

class Logger {
  private currentLevel: number

  constructor() {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
    this.currentLevel = LOG_LEVELS[level as keyof LogLevel] || LOG_LEVELS.INFO
  }

  private shouldLog(level: number): boolean {
    return level >= this.currentLevel
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toLocaleTimeString()
    const isDev = process.env.NODE_ENV !== 'production'
    
    if (isDev) {
      // Formato mais legível para desenvolvimento
      const levelColors = {
        DEBUG: '\x1b[36m', // cyan
        INFO: '\x1b[32m',  // green
        WARN: '\x1b[33m',  // yellow
        ERROR: '\x1b[31m'  // red
      }
      const reset = '\x1b[0m'
      const color = levelColors[level as keyof typeof levelColors] || ''
      
      let formattedMessage = `${color}[${timestamp}] ${level}${reset}: ${message}`
      
      if (meta) {
        // Formata metadata de forma mais legível
        if (typeof meta === 'object' && meta !== null) {
          formattedMessage += `\n  ${JSON.stringify(meta, null, 2).split('\n').join('\n  ')}`
        } else {
          formattedMessage += ` | ${meta}`
        }
      }
      
      return formattedMessage
    } else {
      // Formato JSON para produção
      const baseLog = {
        timestamp: new Date().toISOString(),
        level,
        message
      }
      const logObject = meta ? { ...baseLog, meta } : baseLog
      return JSON.stringify(logObject)
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, meta))
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(this.formatMessage('INFO', message, meta))
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage('WARN', message, meta))
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const errorMeta = error instanceof Error 
        ? { 
            name: error.name, 
            message: error.message, 
            stack: error.stack 
          }
        : error

      console.error(this.formatMessage('ERROR', message, errorMeta))
    }
  }
}

export const logger = new Logger() 