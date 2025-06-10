/**
 * Unit tests for Logger system
 * Tests logging functionality, levels, and error handling
 */

describe('Logger', () => {
  let logger;
  let originalConsole;
  let mockPropertiesService;
  
  beforeEach(() => {
    // Set up console spy
    originalConsole = global.console;
    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };

    // Mock PropertiesService for log storage
    mockPropertiesService = {
      getProperty: jest.fn(),
      setProperty: jest.fn(),
      getProperties: jest.fn(() => ({})),
      deleteProperty: jest.fn()
    };

    global.PropertiesService = {
      getScriptProperties: () => mockPropertiesService
    };

    // Mock Utilities for date formatting
    global.Utilities = {
      formatDate: jest.fn((date) => date.toISOString()),
      sleep: jest.fn()
    };

    // Initialize logger with different levels
    logger = {
      LEVELS: {
        DEBUG: 3,
        INFO: 2, 
        WARN: 1,
        ERROR: 0
      },
      
      level: 2, // Default to INFO level
      
      log: function (level, message, context = {}) {
        if (typeof level === 'string') {
          level = this.LEVELS[level.toUpperCase()] || this.LEVELS.INFO;
        }
        
        if (level <= this.level) {
          const timestamp = new Date().toISOString();
          const levelName = Object.keys(this.LEVELS).find(key => this.LEVELS[key] === level) || 'INFO';
          
          const logMessage = `[${timestamp}] ${levelName}: ${message}`;
          
          // Log to console
          console.log(logMessage, context);
          
          // Store in properties if context includes important data
          if (context && Object.keys(context).length > 0) {
            this.writeToSheet(level, message, context);
          }
        }
      },
      
      debug: function (message, context) {
        this.log(this.LEVELS.DEBUG, message, context);
      },
      
      info: function (message, context) {
        this.log(this.LEVELS.INFO, message, context);
      },
      
      warn: function (message, context) {
        this.log(this.LEVELS.WARN, message, context);
      },
      
      error: function (message, context) {
        this.log(this.LEVELS.ERROR, message, context);
      },
      
      writeToSheet: function (level, message, context) {
        try {
          const properties = global.PropertiesService.getScriptProperties();
          const logKey = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const logEntry = {
            level,
            message,
            context,
            timestamp: new Date().toISOString()
          };
          properties.setProperty(logKey, JSON.stringify(logEntry));
        } catch (error) {
          // Fail silently to avoid infinite loops
        }
      },
      
      setLevel: function (newLevel) {
        if (typeof newLevel === 'string') {
          this.level = this.LEVELS[newLevel.toUpperCase()] || this.LEVELS.INFO;
        } else if (typeof newLevel === 'number') {
          this.level = newLevel;
        }
      },
      
      getStoredLogs: function () {
        try {
          const properties = global.PropertiesService.getScriptProperties();
          const allProps = properties.getProperties();
          const logs = [];
          
          Object.keys(allProps).forEach(key => {
            if (key.startsWith('log_')) {
              try {
                logs.push(JSON.parse(allProps[key]));
              } catch (e) {
                // Skip invalid log entries
              }
            }
          });
          
          return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
          return [];
        }
      },
      
      clearLogs: function () {
        try {
          const properties = global.PropertiesService.getScriptProperties();
          const allProps = properties.getProperties();
          
          Object.keys(allProps).forEach(key => {
            if (key.startsWith('log_')) {
              properties.deleteProperty(key);
            }
          });
        } catch (error) {
          // Fail silently
        }
      }
    };
  });
  
  afterEach(() => {
    global.console = originalConsole;
    jest.restoreAllMocks();
  });
  
  describe('log levels', () => {
    it('should log ERROR level messages', () => {
      logger.error('Test error message', { context: 'test' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        { context: 'test' }
      );
    });
    
    it('should log WARN level messages', () => {
      logger.warn('Test warning message', { userId: '123' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message'),
        { userId: '123' }
      );
    });
    
    it('should log INFO level messages', () => {
      logger.info('Test info message', { action: 'createSlide' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message'),
        { action: 'createSlide' }
      );
    });
    
    it('should filter out lower priority messages', () => {
      logger.setLevel('ERROR'); // Set to ERROR only
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.anything()
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.anything()
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        expect.anything()
      );
    });
    
    it('should format log messages correctly', () => {
      const message = 'Test message';
      const context = { userId: '123', action: 'createSlide' };
      
      logger.info(message, context);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] INFO: Test message/),
        context
      );
    });
    
    it('should include context data in logs', () => {
      const context = { slideId: 'slide-123', operation: 'insert' };
      logger.warn('Warning message', context);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
        expect.objectContaining({ slideId: 'slide-123' })
      );
    });

    it('should handle numeric log levels', () => {
      logger.log(0, 'Error level message'); // ERROR = 0
      logger.log(1, 'Warn level message');  // WARN = 1
      logger.log(2, 'Info level message');  // INFO = 2
      logger.log(3, 'Debug level message'); // DEBUG = 3
      
      // With default level 2 (INFO), should log ERROR, WARN, and INFO but not DEBUG
      expect(console.log).toHaveBeenCalledTimes(3);
    });

    it('should handle string log levels', () => {
      logger.log('error', 'Error message');
      logger.log('WARN', 'Warning message');
      logger.log('info', 'Info message');
      
      expect(console.log).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('level management', () => {
    it('should set log level by string', () => {
      logger.setLevel('DEBUG');
      expect(logger.level).toBe(3);
      
      logger.setLevel('ERROR');
      expect(logger.level).toBe(0);
    });

    it('should set log level by number', () => {
      logger.setLevel(1);
      expect(logger.level).toBe(1);
      
      logger.setLevel(3);
      expect(logger.level).toBe(3);
    });

    it('should handle invalid log levels gracefully', () => {
      const originalLevel = logger.level;
      logger.setLevel('INVALID');
      expect(logger.level).toBe(logger.LEVELS.INFO); // Should default to INFO
      
      logger.setLevel(originalLevel);
    });

    it('should filter messages based on current level', () => {
      logger.setLevel('WARN'); // Level 1
      
      logger.error('Error message');   // Level 0 - should log
      logger.warn('Warning message');  // Level 1 - should log
      logger.info('Info message');     // Level 2 - should not log
      logger.debug('Debug message');   // Level 3 - should not log
      
      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('error handling', () => {
    it('should handle logging failures gracefully', () => {
      console.log.mockImplementation(() => {
        throw new Error('Console error');
      });
      
      expect(() => logger.info('Test')).not.toThrow();
    });

    it('should handle properties service failures gracefully', () => {
      mockPropertiesService.setProperty.mockImplementation(() => {
        throw new Error('Properties service error');
      });
      
      expect(() => logger.info('Test', { data: 'value' })).not.toThrow();
    });

    it('should handle malformed context data', () => {
      const circularObj = {};
      circularObj.self = circularObj;
      
      expect(() => logger.info('Test', circularObj)).not.toThrow();
    });

    it('should handle null and undefined context', () => {
      expect(() => logger.info('Test', null)).not.toThrow();
      expect(() => logger.info('Test', undefined)).not.toThrow();
      expect(() => logger.info('Test')).not.toThrow();
    });
  });

  describe('log storage', () => {
    it('should store logs with context to properties service', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('Test message', context);
      
      expect(mockPropertiesService.setProperty).toHaveBeenCalledWith(
        expect.stringMatching(/^log_\d+_[a-z0-9]+$/),
        expect.stringContaining('"message":"Test message"')
      );
    });

    it('should not store logs without context', () => {
      logger.info('Test message without context');
      
      expect(mockPropertiesService.setProperty).not.toHaveBeenCalled();
    });

    it('should retrieve stored logs correctly', () => {
      const mockLogs = {
        'log_123_abc': JSON.stringify({
          level: 2,
          message: 'Test 1',
          context: { id: 1 },
          timestamp: '2023-01-01T00:00:00.000Z'
        }),
        'log_124_def': JSON.stringify({
          level: 1,
          message: 'Test 2', 
          context: { id: 2 },
          timestamp: '2023-01-01T00:01:00.000Z'
        }),
        'other_prop': 'not a log'
      };
      
      mockPropertiesService.getProperties.mockReturnValue(mockLogs);
      
      const logs = logger.getStoredLogs();
      
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Test 1');
      expect(logs[1].message).toBe('Test 2');
    });

    it('should handle corrupted log entries gracefully', () => {
      const mockLogs = {
        'log_123_abc': 'invalid json',
        'log_124_def': JSON.stringify({ valid: 'log' })
      };
      
      mockPropertiesService.getProperties.mockReturnValue(mockLogs);
      
      const logs = logger.getStoredLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].valid).toBe('log');
    });

    it('should clear logs correctly', () => {
      const mockLogs = {
        'log_123_abc': 'log data',
        'log_124_def': 'more log data',
        'other_prop': 'keep this'
      };
      
      mockPropertiesService.getProperties.mockReturnValue(mockLogs);
      
      logger.clearLogs();
      
      expect(mockPropertiesService.deleteProperty).toHaveBeenCalledWith('log_123_abc');
      expect(mockPropertiesService.deleteProperty).toHaveBeenCalledWith('log_124_def');
      expect(mockPropertiesService.deleteProperty).not.toHaveBeenCalledWith('other_prop');
    });
  });

  describe('performance', () => {
    it('should not impact performance when logging is disabled', () => {
      logger.setLevel('ERROR'); // Only errors
      
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        logger.debug('Debug message that should be filtered');
      }
      
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100); // Should be very fast
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle high volume logging', () => {
      logger.setLevel('DEBUG');
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`, { index: i });
      }
      
      expect(console.log).toHaveBeenCalledTimes(100);
    });
  });

  describe('integration scenarios', () => {
    it('should log slide creation workflow', () => {
      logger.info('Starting slide creation', { presentationId: 'pres-123' });
      logger.debug('Validating input parameters', { slideCount: 5 });
      logger.info('Slide created successfully', { slideId: 'slide-456' });
      logger.warn('Performance warning', { duration: 5000 });
      
      expect(console.log).toHaveBeenCalledTimes(3); // DEBUG filtered out at default level
    });

    it('should log error scenarios with full context', () => {
      const errorContext = {
        presentationId: 'pres-123',
        operation: 'insertTextBox',
        parameters: { x: 100, y: 200 },
        error: 'API rate limit exceeded'
      };
      
      logger.error('Failed to insert text box', errorContext);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Failed to insert text box'),
        errorContext
      );
      expect(mockPropertiesService.setProperty).toHaveBeenCalled();
    });
  });
});