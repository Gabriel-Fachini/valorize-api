/**
 * Progress Reporter - Provides visual feedback during seeding operations
 * Uses cli-progress for professional-looking progress bars
 */

// @ts-ignore - cli-progress doesn't have TypeScript definitions
import cliProgress from 'cli-progress'
import chalk from 'chalk'

export interface ProgressConfig {
  name: string
  total: number
  showEta?: boolean
  showPercentage?: boolean
  hideCursor?: boolean
}

export class ProgressReporter {
  private bars: Map<string, cliProgress.SingleBar> = new Map()
  private multiBar: cliProgress.MultiBar | null = null
  private startTime: Date = new Date()

  /**
   * Initialize progress reporter with multi-bar support
   */
  initializeMultiBar(hideCursor: boolean = true): void {
    this.multiBar = new cliProgress.MultiBar(
      {
        clearOnComplete: false,
        hideCursor: hideCursor,
        format: `{name} │ {bar} │ {value}/{total} │ {percentage}% │ ETA: {eta_formatted}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        formatValue: (v: any, options: any, type: string) => {
          if (type === 'value' || type === 'total') {
            return String(v).padStart(String(options.total).length, ' ')
          }
          return String(v)
        },
      },
      cliProgress.Presets.shades_grey,
    )
  }

  /**
   * Create a new progress bar
   */
  createProgressBar(config: ProgressConfig): void {
    if (!this.multiBar) {
      this.initializeMultiBar(config.hideCursor ?? true)
    }

    const bar = this.multiBar!.create(config.total, 0, {
      name: config.name.padEnd(25),
      percentage: 0,
    })

    this.bars.set(config.name, bar)
  }

  /**
   * Update progress for a specific bar
   */
  updateProgress(barName: string, increment: number = 1): void {
    const bar = this.bars.get(barName)
    if (bar) {
      bar.increment(increment)
    }
  }

  /**
   * Set exact progress value
   */
  setProgress(barName: string, value: number): void {
    const bar = this.bars.get(barName)
    if (bar) {
      bar.update(value)
    }
  }

  /**
   * Complete a progress bar
   */
  completeProgress(barName: string): void {
    const bar = this.bars.get(barName)
    if (bar) {
      const total = (bar as any).getTotal()
      bar.update(total)
    }
  }

  /**
   * Stop all progress bars
   */
  stopAll(): void {
    if (this.multiBar) {
      this.multiBar.stop()
    }
  }

  /**
   * Get elapsed time since start
   */
  getElapsedTime(): string {
    const elapsed = new Date().getTime() - this.startTime.getTime()
    const seconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  /**
   * Print a summary message
   */
  printSummary(title: string, items: Record<string, string | number>): void {
    console.log('\n' + chalk.bgBlue.white(` ${title} `))
    Object.entries(items).forEach(([key, value]) => {
      console.log(`  ${chalk.cyan(key)}: ${chalk.green(String(value))}`)
    })
    console.log()
  }

  /**
   * Print a section header
   */
  printHeader(text: string): void {
    console.log('\n' + chalk.bgCyan.black(` ${text} `) + '\n')
  }

  /**
   * Print a success message
   */
  printSuccess(text: string): void {
    console.log(chalk.green(`✅ ${text}`))
  }

  /**
   * Print an info message
   */
  printInfo(text: string): void {
    console.log(chalk.blue(`ℹ️  ${text}`))
  }

  /**
   * Print a warning message
   */
  printWarning(text: string): void {
    console.log(chalk.yellow(`⚠️  ${text}`))
  }

  /**
   * Print an error message
   */
  printError(text: string): void {
    console.log(chalk.red(`❌ ${text}`))
  }

  /**
   * Print a completed operation with timing
   */
  printCompleted(operation: string, count: number, timeMs: number): void {
    const timeStr = timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(2)}s`
    console.log(chalk.green(`✅ ${operation}: ${count} records in ${timeStr}`))
  }
}

/**
 * Create a singleton instance for use in seeders
 */
export const progressReporter = new ProgressReporter()
