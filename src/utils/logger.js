/**
 * Comprehensive Logging System for Google Apps Script
 * Supports multiple log levels, sheet logging, and structured error tracking
 */
class Logger {
  /**
   * Initialize Logger with default configuration
   */
  constructor() {
    this.LOG_LEVELS = {
      DEBUG: 3,
      INFO: 2,
      WARN: 1,
      ERROR: 0
    };

    this.currentLevel = this.LOG_LEVELS.INFO;
    this.logSheetName = 'ApplicationLog';
    this.maxLogEntries = 1000;
  }

  /**
   * Set logging level
   * @param {string} level - LOG level (DEBUG, INFO, WARN, ERROR)
   */
  setLevel(level) {
    if (Object.prototype.hasOwnProperty.call(this.LOG_LEVELS, level)) {
      this.currentLevel = this.LOG_LEVELS[level];
    }
  }

  /**
   * Get current log level name
   * @returns {string} Current log level
   */
  getCurrentLevel() {
    return Object.keys(this.LOG_LEVELS).find(key => this.LOG_LEVELS[key] === this.currentLevel);
  }

  /**
   * Core logging method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   * @param {Error} error - Error object if applicable
   */
  log(level, message, data = null, error = null) {
    const levelValue = this.LOG_LEVELS[level];

    if (levelValue > this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: this.sanitizeData(data),
      error: error ? this.formatError(error) : null,
      executionId: Utilities.getUuid()
    };

    try {
      console.log(`[${timestamp}] ${level}: ${message}`, data);

      if (levelValue <= this.LOG_LEVELS.WARN) {
        this.writeToSheet(logEntry);
      }
    } catch (loggingError) {
      console.error('Logging failed:', loggingError);
    }
  }

  /**
   * Debug level logging
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  /**
   * Info level logging
   * @param {string} message - Info message
   * @param {*} data - Additional data
   */
  info(message, data = null) {
    this.log('INFO', message, data);
  }

  /**
   * Warning level logging
   * @param {string} message - Warning message
   * @param {*} data - Additional data
   */
  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  /**
   * Error level logging
   * @param {string} message - Error message
   * @param {*} data - Additional data
   * @param {Error} error - Error object
   */
  error(message, data = null, error = null) {
    this.log('ERROR', message, data, error);
  }

  /**
   * Performance timing utility
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to time
   * @returns {*} Function result
   */
  time(operation, fn) {
    const startTime = Date.now();
    this.debug(`Starting operation: ${operation}`);

    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operation}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operation}`, { duration: `${duration}ms` }, error);
      throw error;
    }
  }

  /**
   * Write log entry to spreadsheet
   * @param {Object} logEntry - Log entry object
   */
  writeToSheet(logEntry) {
    try {
      const spreadsheet = this.getOrCreateLogSpreadsheet();
      const sheet = this.getOrCreateLogSheet(spreadsheet);

      const rowData = [
        logEntry.timestamp,
        logEntry.level,
        logEntry.message,
        JSON.stringify(logEntry.data),
        logEntry.error ? JSON.stringify(logEntry.error) : '',
        logEntry.executionId
      ];

      sheet.appendRow(rowData);

      this.maintainLogSize(sheet);
    } catch (sheetError) {
      console.error('Failed to write to log sheet:', sheetError);
    }
  }

  /**
   * Get or create logging spreadsheet
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} Log spreadsheet
   */
  getOrCreateLogSpreadsheet() {
    const fileName = 'SlideMaker_ApplicationLog';
    const files = DriveApp.getFilesByName(fileName);

    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }

    const spreadsheet = SpreadsheetApp.create(fileName);
    this.initializeLogSheet(spreadsheet.getActiveSheet());
    return spreadsheet;
  }

  /**
   * Get or create log sheet within spreadsheet
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - Target spreadsheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Log sheet
   */
  getOrCreateLogSheet(spreadsheet) {
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName(this.logSheetName);
    } catch (error) {
      sheet = spreadsheet.insertSheet(this.logSheetName);
      this.initializeLogSheet(sheet);
    }

    if (!sheet) {
      sheet = spreadsheet.insertSheet(this.logSheetName);
      this.initializeLogSheet(sheet);
    }

    return sheet;
  }

  /**
   * Initialize log sheet with headers
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet to initialize
   */
  initializeLogSheet(sheet) {
    const headers = ['Timestamp', 'Level', 'Message', 'Data', 'Error', 'Execution ID'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#f0f0f0');
  }

  /**
   * Maintain log size by removing old entries
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Log sheet
   */
  maintainLogSize(sheet) {
    const numRows = sheet.getLastRow();

    if (numRows > this.maxLogEntries + 1) {
      const rowsToDelete = numRows - this.maxLogEntries;
      sheet.deleteRows(2, rowsToDelete);
    }
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   * @param {*} data - Data to sanitize
   * @returns {*} Sanitized data
   */
  sanitizeData(data) {
    if (!data) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];

    if (typeof data === 'object') {
      const sanitized = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

        sanitized[key] = isSensitive ? '[REDACTED]' : value;
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Format error object for logging
   * @param {Error} error - Error to format
   * @returns {Object} Formatted error
   */
  formatError(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      toString: error.toString()
    };
  }

  /**
   * Create performance monitor for function execution
   * @param {string} functionName - Name of function being monitored
   * @returns {Object} Performance monitor
   */
  createPerformanceMonitor(functionName) {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    return {
      start: () => {
        this.debug(`Performance monitor started: ${functionName}`);
      },

      end: () => {
        const duration = Date.now() - startTime;
        const endMemory = this.getMemoryUsage();
        const memoryDelta = endMemory - startMemory;

        this.info(`Performance monitor completed: ${functionName}`, {
          duration: `${duration}ms`,
          memoryUsed: `${memoryDelta}MB`
        });

        return { duration, memoryDelta };
      }
    };
  }

  /**
   * Get approximate memory usage (rough estimation for GAS)
   * @returns {number} Estimated memory usage in MB
   */
  getMemoryUsage() {
    try {
      const properties = PropertiesService.getScriptProperties().getProperties();
      return Object.keys(properties).length * 0.1;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear all logs
   * @returns {boolean} Success status
   */
  clearLogs() {
    try {
      const spreadsheet = this.getOrCreateLogSpreadsheet();
      const sheet = this.getOrCreateLogSheet(spreadsheet);

      if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }

      this.info('All logs cleared');
      return true;
    } catch (error) {
      this.error('Failed to clear logs', null, error);
      return false;
    }
  }

  /**
   * Get recent log entries
   * @param {number} count - Number of recent entries to retrieve
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 50) {
    try {
      const spreadsheet = this.getOrCreateLogSpreadsheet();
      const sheet = this.getOrCreateLogSheet(spreadsheet);

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return [];
      }

      const startRow = Math.max(2, lastRow - count + 1);
      const numRows = lastRow - startRow + 1;

      const values = sheet.getRange(startRow, 1, numRows, 6).getValues();

      return values.map(row => ({
        timestamp: row[0],
        level: row[1],
        message: row[2],
        data: this.tryParseJSON(row[3]),
        error: this.tryParseJSON(row[4]),
        executionId: row[5]
      }));
    } catch (error) {
      this.error('Failed to retrieve recent logs', null, error);
      return [];
    }
  }

  /**
   * Safely parse JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {*} Parsed object or original string
   */
  tryParseJSON(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      return jsonString;
    }
  }
}

// Create global logger instance
// eslint-disable-next-line no-redeclare
const logger = new Logger();

// Global export for Google Apps Script
