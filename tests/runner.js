#!/usr/bin/env node

/**
 * Simple test runner for Google Apps Script
 * Supports unit, integration, and e2e tests
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      failures: []
    };
    this.testFiles = [];
    this.currentSuite = null;
  }

  /**
   * Simple mock function implementation
   */
  mockFn(implementation) {
    const mockData = {
      calls: [],
      results: [],
      instances: [],
      implementation: implementation || (() => {}),
      onceValues: [],
      returnValue: undefined,
      hasReturnValue: false
    };
    
    const mockFunction = function (...args) {
      mockData.calls.push([...args]);
      mockData.instances.push(this);
      
      try {
        let result;
        
        // Check for one-time return values first
        if (mockData.onceValues.length > 0) {
          result = mockData.onceValues.shift();
        } else if (mockData.hasReturnValue) {
          result = mockData.returnValue;
        } else {
          result = mockData.implementation.apply(this, args);
        }
        
        mockData.results.push({ type: 'return', value: result });
        return result;
      } catch (error) {
        mockData.results.push({ type: 'throw', value: error });
        throw error;
      }
    };
    
    // Attach mock properties
    mockFunction.mock = mockData;
    
    mockFunction.mockReturnValue = (value) => {
      mockData.returnValue = value;
      mockData.hasReturnValue = true;
      return mockFunction;
    };
    
    mockFunction.mockImplementation = (impl) => {
      mockData.implementation = impl;
      mockData.hasReturnValue = false;
      return mockFunction;
    };
    
    mockFunction.mockReturnValueOnce = (value) => {
      mockData.onceValues.push(value);
      return mockFunction;
    };
    
    mockFunction.mockClear = () => {
      mockData.calls.length = 0;
      mockData.results.length = 0;
      mockData.instances.length = 0;
      return mockFunction;
    };
    
    mockFunction.mockReset = () => {
      mockFunction.mockClear();
      mockData.implementation = () => {};
      mockData.hasReturnValue = false;
      mockData.onceValues.length = 0;
      return mockFunction;
    };
    
    return mockFunction;
  }

  /**
   * Load test files based on type
   * @param {string} testType - unit, integration, or e2e
   */
  loadTestFiles(testType) {
    const testDir = path.join(__dirname, testType);
    
    if (!fs.existsSync(testDir)) {
      console.log(`📁 Creating test directory: ${testDir}`);
      fs.mkdirSync(testDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(testDir)
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(testDir, file));

    return files;
  }

  /**
   * Mock Google Apps Script globals for testing
   */
  setupGASMocks() {
    global.console = console;
    
    // Mock GAS Services
    global.SlidesApp = {
      create: this.mockFn(() => ({ getId: () => 'mock-presentation-id' })),
      openById: this.mockFn(() => ({
        getSlides: () => [{ insertTextBox: this.mockFn() }]
      }))
    };

    global.DriveApp = {
      createFile: this.mockFn(() => ({
        getId: () => 'mock-file-id',
        getBlob: () => ({ getBytes: () => new Uint8Array() })
      })),
      getFileById: this.mockFn(() => ({
        setTrashed: this.mockFn()
      }))
    };

    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: this.mockFn(),
        setProperty: this.mockFn(),
        getProperties: this.mockFn(() => ({}))
      })
    };

    global.Utilities = {
      sleep: this.mockFn(),
      base64Encode: this.mockFn(str => Buffer.from(str).toString('base64')),
      base64Decode: this.mockFn(str => Buffer.from(str, 'base64').toString())
    };

    global.UrlFetchApp = {
      fetch: this.mockFn(() => ({
        getContentText: () => '{"status": "success"}',
        getResponseCode: () => 200
      }))
    };

    global.Logger = {
      log: this.mockFn(console.log)
    };

    global.HtmlService = {
      createHtmlOutputFromFile: this.mockFn(() => ({
        setTitle: this.mockFn(),
        setWidth: this.mockFn(),
        setHeight: this.mockFn()
      }))
    };
  }

  /**
   * Simple test framework implementation
   */
  setupTestFramework() {
    // Setup jest global
    global.jest = {
      fn: (implementation) => this.mockFn(implementation),
      clearAllMocks: () => {
        // Simple implementation - in a real scenario, we'd track all mocks
      },
      restoreAllMocks: () => {
        // Simple implementation
      }
    };

    global.describe = (suiteName, suiteFunc) => {
      this.currentSuite = suiteName;
      console.log(`\n📋 ${suiteName}`);
      suiteFunc();
      this.currentSuite = null;
    };

    global.it = (testName, testFunc) => {
      this.testResults.total++;
      try {
        testFunc();
        this.testResults.passed++;
        console.log(`  ✅ ${testName}`);
      } catch (error) {
        this.testResults.failed++;
        this.testResults.failures.push({
          suite: this.currentSuite,
          test: testName,
          error: error.message
        });
        console.log(`  ❌ ${testName}`);
        console.log(`     Error: ${error.message}`);
      }
    };

    global.expect = (actual) => ({
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toThrow: (expectedMessage) => {
        let thrown = false;
        let thrownError = null;
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (e) {
          thrown = true;
          thrownError = e;
        }
        if (!thrown) {
          throw new Error('Expected function to throw an error');
        }
        if (expectedMessage && !thrownError.message.includes(expectedMessage)) {
          throw new Error(`Expected error message to contain "${expectedMessage}", but got "${thrownError.message}"`);
        }
      },
      toContain: (expected) => {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) {
            throw new Error(`Expected array to contain ${expected}, but it did not`);
          }
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected)) {
            throw new Error(`Expected string to contain "${expected}", but it did not`);
          }
        } else {
          throw new Error('toContain can only be used with arrays or strings');
        }
      },
      toHaveLength: (expected) => {
        if (!actual || typeof actual.length !== 'number') {
          throw new Error('Expected value to have a length property');
        }
        if (actual.length !== expected) {
          throw new Error(`Expected length ${expected}, but got ${actual.length}`);
        }
      },
      toBeInstanceOf: (expected) => {
        if (!(actual instanceof expected)) {
          throw new Error(`Expected value to be instance of ${expected.name}`);
        }
      },
      toHaveBeenCalled: () => {
        if (!actual.mock || !Array.isArray(actual.mock.calls)) {
          throw new Error('Expected a mock function');
        }
        if (actual.mock.calls.length === 0) {
          throw new Error('Expected function to have been called');
        }
      },
      toHaveBeenCalledWith: (...expectedArgs) => {
        if (!actual.mock || !Array.isArray(actual.mock.calls)) {
          throw new Error('Expected a mock function');
        }
        const found = actual.mock.calls.some(call => {
          if (call.length !== expectedArgs.length) {
            return false;
          }
          return call.every((arg, index) => {
            const expected = expectedArgs[index];
            // Handle expect matchers
            if (expected && typeof expected === 'object') {
              if (expected.expectedString) {
                return typeof arg === 'string' && arg.includes(expected.expectedString);
              }
              if (expected.pattern) {
                return typeof arg === 'string' && expected.pattern.test(arg);
              }
              if (expected.expectedObject) {
                return typeof arg === 'object' && arg !== null &&
                       Object.entries(expected.expectedObject).every(([key, value]) =>
                         arg[key] !== undefined && JSON.stringify(arg[key]) === JSON.stringify(value));
              }
            }
            return JSON.stringify(arg) === JSON.stringify(expected);
          });
        });
        if (!found) {
          throw new Error(`Expected function to have been called with ${JSON.stringify(expectedArgs)}`);
        }
      },
      toHaveBeenCalledTimes: (expected) => {
        if (!actual.mock || !Array.isArray(actual.mock.calls)) {
          throw new Error('Expected a mock function');
        }
        if (actual.mock.calls.length !== expected) {
          throw new Error(`Expected function to have been called ${expected} times, but it was called ${actual.mock.calls.length} times`);
        }
      },
      not: {
        toBe: (expected) => {
          if (actual === expected) {
            throw new Error(`Expected ${actual} not to be ${expected}`);
          }
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`);
          }
        },
        toContain: (expected) => {
          if (Array.isArray(actual) && actual.includes(expected)) {
            throw new Error(`Expected array not to contain ${expected}`);
          } else if (typeof actual === 'string' && actual.includes(expected)) {
            throw new Error(`Expected string not to contain "${expected}"`);
          }
        },
        toHaveBeenCalled: () => {
          if (!actual.mock || !Array.isArray(actual.mock.calls)) {
            throw new Error('Expected a mock function');
          }
          if (actual.mock.calls.length > 0) {
            throw new Error('Expected function not to have been called');
          }
        },
        toHaveBeenCalledWith: (...expectedArgs) => {
          if (!actual.mock || !Array.isArray(actual.mock.calls)) {
            throw new Error('Expected a mock function');
          }
          const found = actual.mock.calls.some(call => 
            call.length === expectedArgs.length &&
            call.every((arg, index) => JSON.stringify(arg) === JSON.stringify(expectedArgs[index])));
          if (found) {
            throw new Error(`Expected function not to have been called with ${JSON.stringify(expectedArgs)}`);
          }
        },
        toThrow: () => {
          let thrown = false;
          try {
            if (typeof actual === 'function') {
              actual();
            }
          } catch (e) {
            thrown = true;
          }
          if (thrown) {
            throw new Error('Expected function not to throw');
          }
        }
      },
      // String matchers
      stringContaining: (expected) => {
        if (typeof actual !== 'string' || !actual.includes(expected)) {
          throw new Error(`Expected string containing "${expected}"`);
        }
      },
      stringMatching: (pattern) => {
        if (typeof actual !== 'string' || !pattern.test(actual)) {
          throw new Error(`Expected string matching pattern ${pattern}`);
        }
      },
      // Object matchers
      objectContaining: (expected) => {
        if (typeof actual !== 'object' || actual === null) {
          throw new Error('Expected an object');
        }
        for (const [key, value] of Object.entries(expected)) {
          if (!(key in actual) || JSON.stringify(actual[key]) !== JSON.stringify(value)) {
            throw new Error(`Expected object to contain property ${key} with value ${JSON.stringify(value)}`);
          }
        }
      },
      // Number matchers
      toBeGreaterThan: (expected) => {
        if (typeof actual !== 'number' || actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (typeof actual !== 'number' || actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toBeCloseTo: (expected, precision = 2) => {
        if (typeof actual !== 'number') {
          throw new Error('Expected a number');
        }
        const pass = Math.abs(expected - actual) < Math.pow(10, -precision) / 2;
        if (!pass) {
          throw new Error(`Expected ${actual} to be close to ${expected}`);
        }
      },
      // Additional matchers
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },
      toBeUndefined: () => {
        if (actual !== undefined) {
          throw new Error('Expected value to be undefined');
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error('Expected value to be null');
        }
      },
      toMatch: (pattern) => {
        if (typeof actual !== 'string') {
          throw new Error('toMatch requires a string');
        }
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        if (!regex.test(actual)) {
          throw new Error(`Expected "${actual}" to match ${pattern}`);
        }
      }
    });

    // Add expect helpers
    global.expect.anything = () => ({ toString: () => 'anything()' });
    global.expect.any = (constructor) => ({ 
      toString: () => `any(${constructor.name})`,
      constructor 
    });
    global.expect.stringContaining = (str) => ({ 
      toString: () => `stringContaining("${str}")`,
      expectedString: str 
    });
    global.expect.stringMatching = (pattern) => ({ 
      toString: () => `stringMatching(${pattern})`,
      pattern 
    });
    global.expect.objectContaining = (obj) => ({ 
      toString: () => `objectContaining(${JSON.stringify(obj)})`,
      expectedObject: obj 
    });

    global.beforeEach = (func) => {
      // Simple implementation - just run before each test
      func();
    };

    global.afterEach = (func) => {
      // Simple implementation - just run after each test
      func();
    };
  }

  /**
   * Run tests for specified type
   * @param {string} testType - unit, integration, or e2e
   */
  async run(testType = 'unit') {
    console.log(`🧪 Running ${testType} tests...\n`);
    
    this.setupGASMocks();
    this.setupTestFramework();

    const testFiles = this.loadTestFiles(testType);
    
    if (testFiles.length === 0) {
      console.log(`⚠️  No test files found in tests/${testType}/`);
      console.log('💡 Create test files with .test.js extension in that directory');
      return;
    }

    // Load and run each test file
    for (const testFile of testFiles) {
      console.log(`📄 Loading: ${path.basename(testFile)}`);
      try {
        require(testFile);
      } catch (error) {
        console.error(`❌ Error loading test file ${testFile}:`, error.message);
        this.testResults.failed++;
        this.testResults.total++;
      }
    }

    this.printResults();
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    
    if (this.testResults.failures.length > 0) {
      console.log('\n🔍 Failure Details:');
      this.testResults.failures.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.suite} - ${failure.test}`);
        console.log(`   Error: ${failure.error}`);
      });
    }

    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    if (this.testResults.failed > 0) {
      process.exit(1);
    }
  }

  /**
   * Watch mode for continuous testing
   */
  watch(testType = 'unit') {
    console.log(`👀 Watching for changes in tests/${testType}/...\n`);
    
    const testDir = path.join(__dirname, testType);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const chokidar = require('chokidar');
    chokidar.watch(testDir, { ignored: /node_modules/ })
      .on('change', () => {
        console.clear();
        this.testResults = { passed: 0, failed: 0, total: 0, failures: [] };
        this.run(testType);
      });
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const testType = args[0] || 'unit';
  const isWatch = args.includes('--watch');

  const runner = new TestRunner();
  
  if (isWatch) {
    runner.watch(testType);
  } else {
    runner.run(testType);
  }
}

module.exports = TestRunner;