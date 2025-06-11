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
   * @param {string|number} level - LOG level (DEBUG, INFO, WARN, ERROR) or numeric value
   */
  setLevel(level) {
    if (typeof level === 'string' && Object.prototype.hasOwnProperty.call(this.LOG_LEVELS, level.toUpperCase())) {
      this.currentLevel = this.LOG_LEVELS[level.toUpperCase()];
    } else if (typeof level === 'number' && level >= 0 && level <= 3) {
      this.currentLevel = level;
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
   * Enhanced error handling for API operations
   * @param {Error} error - Error object
   * @param {Object} context - Error context information
   * @returns {Object} Standardized error response
   */
  handleApiError(error, context = {}) {
    const errorId = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    
    // Classify error severity
    const severity = this.classifyErrorSeverity(error);
    
    // Create detailed error report
    const errorReport = {
      id: errorId,
      timestamp,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      userMessage: this.generateUserFriendlyMessage(error, severity)
    };

    // Log with appropriate level based on severity
    if (severity === 'high') {
      this.error('High severity API error', errorReport, error);
    } else if (severity === 'medium') {
      this.warn('Medium severity API error', errorReport);
    } else {
      this.info('Low severity API error', errorReport);
    }

    return {
      success: false,
      error: {
        id: errorId,
        message: errorReport.userMessage,
        timestamp,
        severity
      }
    };
  }

  /**
   * Classify error severity based on error type and message
   * @param {Error} error - Error object
   * @returns {string} Severity level (high, medium, low)
   */
  classifyErrorSeverity(error) {
    const message = error.message.toLowerCase();
    
    // High severity: System/service failures
    if (message.includes('quota') || 
        message.includes('permission') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('service unavailable')) {
      return 'high';
    }
    
    // Medium severity: Request/network issues
    if (message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection') ||
        error.name === 'TypeError' ||
        error.name === 'ReferenceError') {
      return 'medium';
    }
    
    // Low severity: Validation/user input issues
    return 'low';
  }

  /**
   * Generate user-friendly error message
   * @param {Error} error - Error object
   * @param {string} severity - Error severity
   * @returns {string} User-friendly message
   */
  generateUserFriendlyMessage(error, severity) {
    const message = error.message.toLowerCase();
    
    // High severity errors
    if (severity === 'high') {
      if (message.includes('quota')) {
        return 'Service quota exceeded. Please try again later or contact support.';
      }
      if (message.includes('permission') || message.includes('unauthorized')) {
        return 'Authentication required. Please check your API credentials.';
      }
      if (message.includes('forbidden')) {
        return 'Access denied. Insufficient permissions for this operation.';
      }
      return 'A system error occurred. Please try again later or contact support.';
    }
    
    // Medium severity errors
    if (severity === 'medium') {
      if (message.includes('timeout')) {
        return 'Request timed out. Please try again with a smaller request.';
      }
      if (message.includes('network') || message.includes('connection')) {
        return 'Network error occurred. Please check your connection and try again.';
      }
      return 'A temporary error occurred. Please try again.';
    }
    
    // Low severity errors (validation issues)
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Invalid input provided. Please check your request data.';
    }
    
    return 'Request could not be processed. Please check your input and try again.';
  }

  /**
   * Track API operation metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Operation duration in ms
   * @param {boolean} success - Whether operation succeeded
   * @param {Object} metadata - Additional metadata
   */
  trackApiMetrics(operation, duration, success, metadata = {}) {
    const metricsData = {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    this.info('API operation metrics', metricsData);

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      this.warn('Slow API operation detected', {
        operation,
        duration: `${duration}ms`,
        threshold: '5000ms'
      });
    }

    // Log high failure rate
    if (!success && metadata.retryCount > 2) {
      this.error('High retry count for API operation', {
        operation,
        retryCount: metadata.retryCount,
        lastError: metadata.lastError
      });
    }
  }

  /**
   * Create circuit breaker for API operations
   * @param {string} serviceName - Name of the service
   * @param {number} failureThreshold - Number of failures before circuit opens
   * @param {number} timeoutMs - Timeout before trying again
   * @returns {Object} Circuit breaker instance
   */
  createCircuitBreaker(serviceName, failureThreshold = 5, timeoutMs = 60000) {
    const circuitState = {
      failures: 0,
      lastFailure: null,
      state: 'closed' // closed, open, half-open
    };

    return {
      execute: (operation) => {
        const now = Date.now();
        
        // Check if circuit should be half-open
        if (circuitState.state === 'open' && 
            now - circuitState.lastFailure > timeoutMs) {
          circuitState.state = 'half-open';
          this.info('Circuit breaker half-open', { serviceName });
        }

        // Reject if circuit is open
        if (circuitState.state === 'open') {
          const error = new Error(`Circuit breaker open for ${serviceName}`);
          this.warn('Circuit breaker rejected operation', { 
            serviceName, 
            failures: circuitState.failures 
          });
          throw error;
        }

        try {
          const result = operation();
          
          // Reset on success
          if (circuitState.failures > 0) {
            this.info('Circuit breaker reset', { serviceName });
            circuitState.failures = 0;
            circuitState.state = 'closed';
          }
          
          return result;
        } catch (error) {
          circuitState.failures++;
          circuitState.lastFailure = now;
          
          this.error('Circuit breaker recorded failure', {
            serviceName,
            failures: circuitState.failures,
            threshold: failureThreshold
          }, error);

          // Open circuit if threshold reached
          if (circuitState.failures >= failureThreshold) {
            circuitState.state = 'open';
            this.error('Circuit breaker opened', { 
              serviceName, 
              failures: circuitState.failures 
            });
          }
          
          throw error;
        }
      },
      
      getState: () => ({ ...circuitState }),
      reset: () => {
        circuitState.failures = 0;
        circuitState.state = 'closed';
        circuitState.lastFailure = null;
        this.info('Circuit breaker manually reset', { serviceName });
      }
    };
  }

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in ms
   * @param {string} operationName - Name for logging
   * @returns {*} Operation result
   */
  retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000, operationName = 'operation') {
    return new Promise((resolve, reject) => {
      let attempt = 0;

      const executeAttempt = () => {
        attempt++;
        
        try {
          const result = operation();
          
          // Handle both sync and async operations
          if (result && typeof result.then === 'function') {
            result
              .then(resolve)
              .catch(handleError);
          } else {
            resolve(result);
          }
        } catch (error) {
          handleError(error);
        }
      };

      const handleError = (error) => {
        this.warn(`Retry attempt ${attempt} failed for ${operationName}`, {
          attempt,
          maxRetries,
          error: error.message
        });

        if (attempt >= maxRetries) {
          this.error(`All retry attempts exhausted for ${operationName}`, {
            attempts: attempt,
            finalError: error.message
          }, error);
          reject(error);
          return;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        const finalDelay = delay + jitter;

        this.debug(`Retrying ${operationName} in ${finalDelay}ms`, {
          attempt: attempt + 1,
          delay: finalDelay
        });

        Utilities.sleep(finalDelay);
        executeAttempt();
      };

      executeAttempt();
    });
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
   * Get execution quota information
   * @returns {Object} Quota information
   */
  getQuotaInfo() {
    try {
      const trigger = ScriptApp.newTrigger('dummyFunction')
        .timeBased()
        .after(1)
        .create();
      
      ScriptApp.deleteTrigger(trigger);
      
      return {
        available: true,
        executionTime: Date.now(),
        timeZone: Session.getScriptTimeZone(),
        userEmail: Session.getActiveUser().getEmail()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Create contextual logger for specific operations
   * @param {string} context - Operation context
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Contextual logger
   */
  createContextLogger(context, metadata = {}) {
    const contextId = Utilities.getUuid();
    
    return {
      context,
      contextId,
      metadata,
      
      debug: (message, data = null) => {
        this.debug(`[${context}] ${message}`, { ...metadata, ...data, contextId });
      },
      
      info: (message, data = null) => {
        this.info(`[${context}] ${message}`, { ...metadata, ...data, contextId });
      },
      
      warn: (message, data = null) => {
        this.warn(`[${context}] ${message}`, { ...metadata, ...data, contextId });
      },
      
      error: (message, data = null, error = null) => {
        this.error(`[${context}] ${message}`, { ...metadata, ...data, contextId }, error);
      },
      
      time: (operation, fn) => {
        return this.time(`[${context}] ${operation}`, fn);
      }
    };
  }

  /**
   * Log API usage for quota monitoring
   * @param {string} apiName - API name
   * @param {string} operation - Operation type
   * @param {Object} metrics - Usage metrics
   */
  logApiUsage(apiName, operation, metrics = {}) {
    const apiLogData = {
      api: apiName,
      operation,
      timestamp: new Date().toISOString(),
      quotaUsed: metrics.quotaUsed || 1,
      responseTime: metrics.responseTime || 0,
      success: metrics.success !== false
    };

    this.info('API Usage', apiLogData);

    try {
      const properties = PropertiesService.getScriptProperties();
      const dailyKey = `api_usage_${apiName}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
      
      const currentUsage = parseInt(properties.getProperty(dailyKey) || '0');
      properties.setProperty(dailyKey, String(currentUsage + (metrics.quotaUsed || 1)));
    } catch (error) {
      this.warn('Failed to track API usage', { apiName, operation }, error);
    }
  }

  /**
   * Get daily API usage statistics
   * @param {string} apiName - API name
   * @param {Date} date - Target date (defaults to today)
   * @returns {number} Daily usage count
   */
  getDailyApiUsage(apiName, date = new Date()) {
    try {
      const properties = PropertiesService.getScriptProperties();
      const dailyKey = `api_usage_${apiName}_${Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
      
      return parseInt(properties.getProperty(dailyKey) || '0');
    } catch (error) {
      this.warn('Failed to get API usage stats', { apiName, date }, error);
      return 0;
    }
  }

  /**
   * Create structured error report
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {Object} Structured error report
   */
  createErrorReport(error, context = {}) {
    const errorReport = {
      id: Utilities.getUuid(),
      timestamp: new Date().toISOString(),
      error: this.formatError(error),
      context: this.sanitizeData(context),
      stack: error.stack,
      userAgent: context.userAgent || 'Google Apps Script',
      executionInfo: this.getQuotaInfo(),
      severity: this.classifyErrorSeverity(error)
    };

    this.error('Structured Error Report', errorReport, error);
    return errorReport;
  }

  /**
   * Classify error severity
   * @param {Error} error - Error object
   * @returns {string} Severity level
   */
  classifyErrorSeverity(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return 'high';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'high';
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return 'medium';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('parameter')) {
      return 'low';
    }
    
    return 'medium';
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
