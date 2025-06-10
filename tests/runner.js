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
      create: jest.fn(() => ({ getId: () => 'mock-presentation-id' })),
      openById: jest.fn(() => ({
        getSlides: () => [{ insertTextBox: jest.fn() }]
      }))
    };

    global.DriveApp = {
      createFile: jest.fn(() => ({
        getId: () => 'mock-file-id',
        getBlob: () => ({ getBytes: () => new Uint8Array() })
      })),
      getFileById: jest.fn(() => ({
        setTrashed: jest.fn()
      }))
    };

    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: jest.fn(),
        setProperty: jest.fn(),
        getProperties: jest.fn(() => ({}))
      })
    };

    global.Utilities = {
      sleep: jest.fn(),
      base64Encode: jest.fn(str => Buffer.from(str).toString('base64')),
      base64Decode: jest.fn(str => Buffer.from(str, 'base64').toString())
    };

    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getContentText: () => '{"status": "success"}',
        getResponseCode: () => 200
      }))
    };

    global.Logger = {
      log: jest.fn(console.log)
    };

    global.HtmlService = {
      createHtmlOutputFromFile: jest.fn(() => ({
        setTitle: jest.fn(),
        setWidth: jest.fn(),
        setHeight: jest.fn()
      }))
    };
  }

  /**
   * Simple test framework implementation
   */
  setupTestFramework() {
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
      toThrow: () => {
        let thrown = false;
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (e) {
          thrown = true;
        }
        if (!thrown) {
          throw new Error('Expected function to throw an error');
        }
      }
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
      console.log(`💡 Create test files with .test.js extension in that directory`);
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
    console.log(`📊 Test Results Summary`);
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