/**
 * Logging utility for consistent logging across the application
 * Can be easily disabled in production by setting LOG_LEVEL environment variable
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
  private level: LogLevel;

  constructor() {
    // Default to INFO in production, DEBUG in development
    this.level = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel) {
    this.level = level;
  }

  /**
   * Debug messages (verbose, development only)
   */
  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info messages (general information)
   */
  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  /**
   * Success messages (operations completed successfully)
   */
  success(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  /**
   * Warning messages (potential issues)
   */
  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  /**
   * Error messages (failures)
   */
  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  /**
   * Log a feature start (with emoji for visibility)
   */
  feature(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`🚀 ${message}`, ...args);
    }
  }

  /**
   * Log data loading (with emoji for visibility)
   */
  load(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`📂 ${message}`, ...args);
    }
  }

  /**
   * Log delete operations
   */
  delete(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🗑️ [Delete] ${message}`, ...args);
    }
  }

  /**
   * Log user interactions
   */
  click(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`👆 [Click] ${message}`, ...args);
    }
  }

  /**
   * Log save operations
   */
  save(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`💾 [Save] ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
