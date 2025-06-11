/**
 * Data Source Service Unit Tests
 * Tests for external data source integration functionality
 */

// Import test framework and utilities
const TestRunner = require('../runner.js');
const { mockPropertiesService, mockUrlFetchApp, mockSpreadsheetApp } = require('../helpers/enhanced-gas-mocks.js');

// Mock Google Apps Script global objects
global.PropertiesService = mockPropertiesService;
global.UrlFetchApp = mockUrlFetchApp;
global.SpreadsheetApp = mockSpreadsheetApp;
global.Utilities = {
  base64Encode: (text) => Buffer.from(text).toString('base64'),
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Import the service under test
const DataSourceService = require('../../src/services/dataSource.js');

/**
 * Data Source Service Test Suite
 */
class DataSourceServiceTests {
  constructor() {
    this.dataSourceService = null;
  }

  setup() {
    this.dataSourceService = new DataSourceService();
  }

  tearDown() {
    this.dataSourceService.clearCache();
  }

  async runAllTests() {
    describe('DataSourceService', () => {
      beforeEach(() => this.setup());
      afterEach(() => this.tearDown());

      // 基本的な初期化テスト
      this.testServiceInitialization();
      
      // Google Sheets関連テスト
      this.testGoogleSheetsDataFetch();
      this.testGoogleSheetsValidation();
      this.testGoogleSheetsCache();
      
      // API関連テスト
      this.testApiDataFetch();
      this.testApiValidation();
      this.testApiRetry();
      this.testApiRateLimit();
      
      // CSV関連テスト
      this.testCsvDataParsing();
      this.testCsvValidation();
      
      // キャッシュ関連テスト
      this.testCacheManagement();
      
      // エラーハンドリングテスト
      this.testErrorHandling();
      
      // セキュリティテスト
      this.testSecurityValidation();
    });
  }

  testServiceInitialization() {
    it('should initialize with default configuration', () => {
      const service = new DataSourceService();
      
      expect(service.config).toBeTruthy();
      expect(service.cache).toBeInstanceOf(Map);
      expect(service.rateLimiters).toBeInstanceOf(Map);
      expect(service.config.cacheEnabled).toBe(true);
    });

    it('should have correct default rate limits', () => {
      const service = new DataSourceService();
      
      expect(service.config.rateLimit.default).toBeTruthy();
      expect(service.config.rateLimit.googleSheets).toBeTruthy();
      expect(service.config.rateLimit.external).toBeTruthy();
    });
  }

  testGoogleSheetsDataFetch() {
    this.runner.it('should fetch Google Sheets data successfully', async () => {
      const mockData = [
        ['Name', 'Age', 'City'],
        ['John', '25', 'Tokyo'],
        ['Jane', '30', 'Osaka']
      ];

      // Setup mock
      mockSpreadsheetApp.setMockData('test-spreadsheet-id', mockData);

      const result = await this.dataSourceService.fetchGoogleSheetsData(
        'test-spreadsheet-id',
        'A1:C3'
      );

      this.runner.assertEqual(result.length, 3, 'Should return 3 rows');
      this.runner.assertEqual(result[0][0], 'Name', 'First cell should be "Name"');
      this.runner.assertEqual(result[1][1], '25', 'Should return correct age');
    });

    this.runner.it('should handle empty Google Sheets', async () => {
      mockSpreadsheetApp.setMockData('empty-spreadsheet', []);

      const result = await this.dataSourceService.fetchGoogleSheetsData(
        'empty-spreadsheet',
        'A1:C3'
      );

      this.runner.assertEqual(result.length, 0, 'Should return empty array');
    });

    this.runner.it('should throw error for invalid spreadsheet ID', async () => {
      try {
        await this.dataSourceService.fetchGoogleSheetsData(
          'invalid-id',
          'A1:C3'
        );
        this.runner.fail('Should throw error for invalid ID');
      } catch (error) {
        this.runner.assert(error.message.includes('Google Sheetsデータ取得失敗'), 'Should throw appropriate error');
      }
    });
  }

  testGoogleSheetsValidation() {
    this.runner.it('should validate sheet data correctly', async () => {
      const validData = [
        ['Header1', 'Header2'],
        ['Value1', 'Value2']
      ];

      const result = await this.dataSourceService.validateSheetData(validData);
      this.runner.assertEqual(result, validData, 'Valid data should pass through unchanged');
    });

    this.runner.it('should handle oversized data', async () => {
      const oversizedData = Array(15000).fill(['A', 'B', 'C']);

      const result = await this.dataSourceService.validateSheetData(oversizedData, { maxRows: 1000 });
      this.runner.assertEqual(result.length, 1000, 'Should limit to max rows');
    });
  }

  testGoogleSheetsCache() {
    this.runner.it('should cache Google Sheets results', async () => {
      const mockData = [['Test', 'Data']];
      mockSpreadsheetApp.setMockData('cache-test-id', mockData);

      // First fetch
      const result1 = await this.dataSourceService.fetchGoogleSheetsData(
        'cache-test-id',
        'A1:B1'
      );

      // Verify cache
      this.runner.assert(this.dataSourceService.cache.size > 0, 'Cache should contain data');

      // Second fetch should use cache
      const result2 = await this.dataSourceService.fetchGoogleSheetsData(
        'cache-test-id',
        'A1:B1'
      );

      this.runner.assertEqual(result1.length, result2.length, 'Cached result should match');
    });
  }

  testApiDataFetch() {
    this.runner.it('should fetch API data successfully', async () => {
      const mockResponse = { users: [{ name: 'John', age: 25 }] };
      
      mockUrlFetchApp.setMockResponse('https://api.example.com/users', {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(mockResponse)
      });

      const result = await this.dataSourceService.fetchApiData('https://api.example.com/users');
      
      this.runner.assertEqual(result.users.length, 1, 'Should return user data');
      this.runner.assertEqual(result.users[0].name, 'John', 'Should return correct user name');
    });

    this.runner.it('should handle API errors', async () => {
      mockUrlFetchApp.setMockResponse('https://api.example.com/error', {
        getResponseCode: () => 404,
        getContentText: () => 'Not Found'
      });

      try {
        await this.dataSourceService.fetchApiData('https://api.example.com/error');
        this.runner.fail('Should throw error for 404');
      } catch (error) {
        this.runner.assert(error.message.includes('HTTP 404'), 'Should throw HTTP error');
      }
    });

    this.runner.it('should add authentication headers', async () => {
      const mockResponse = { data: 'authenticated' };
      
      this.dataSourceService.setAuthToken('https://api.example.com', 'test-token');

      mockUrlFetchApp.setMockResponse('https://api.example.com/auth', {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(mockResponse)
      });

      const result = await this.dataSourceService.fetchApiData(
        'https://api.example.com/auth',
        { authToken: 'test-token' }
      );

      this.runner.assertEqual(result.data, 'authenticated', 'Should handle authenticated requests');
    });
  }

  testApiValidation() {
    this.runner.it('should validate API responses', async () => {
      const validResponse = { status: 'success', data: [] };
      
      const result = await this.dataSourceService.validateApiData(validResponse);
      this.runner.assertEqual(result, validResponse, 'Valid API response should pass through');
    });

    this.runner.it('should reject oversized API responses', async () => {
      const oversizedResponse = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB

      try {
        await this.dataSourceService.validateApiData(oversizedResponse, { maxSize: 1024 * 1024 });
        this.runner.fail('Should throw error for oversized response');
      } catch (error) {
        this.runner.assert(error.message.includes('サイズが制限を超過'), 'Should throw size error');
      }
    });
  }

  testApiRetry() {
    this.runner.it('should retry failed API requests', async () => {
      let callCount = 0;
      
      // Mock function that fails twice then succeeds
      const mockFn = () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Network error');
        }
        return { success: true };
      };

      const result = await this.dataSourceService.executeWithRetry(mockFn, 3);
      
      this.runner.assertEqual(callCount, 3, 'Should retry 3 times');
      this.runner.assertEqual(result.success, true, 'Should eventually succeed');
    });

    this.runner.it('should fail after max retries', async () => {
      const mockFn = () => {
        throw new Error('Persistent error');
      };

      try {
        await this.dataSourceService.executeWithRetry(mockFn, 2);
        this.runner.fail('Should throw error after max retries');
      } catch (error) {
        this.runner.assertEqual(error.message, 'Persistent error', 'Should throw original error');
      }
    });
  }

  testApiRateLimit() {
    this.runner.it('should respect rate limits', async () => {
      const startTime = Date.now();
      
      // Set very restrictive rate limit for testing
      this.dataSourceService.config.rateLimit.external = { requests: 1, window: 1000 };

      // First request should succeed immediately
      await this.dataSourceService.checkRateLimit('external');
      
      // Second request should be delayed
      await this.dataSourceService.checkRateLimit('external');
      
      const elapsed = Date.now() - startTime;
      this.runner.assert(elapsed >= 1000, 'Second request should be delayed by rate limit');
    });
  }

  testCsvDataParsing() {
    this.runner.it('should parse simple CSV data', async () => {
      const csvData = 'Name,Age,City\nJohn,25,Tokyo\nJane,30,Osaka';
      
      const result = await this.dataSourceService.fetchCsvData(csvData);
      
      this.runner.assertEqual(result.length, 2, 'Should parse 2 data rows');
      this.runner.assertEqual(result[0].Name, 'John', 'Should parse first row correctly');
      this.runner.assertEqual(result[1].Age, '30', 'Should parse second row correctly');
    });

    this.runner.it('should handle CSV with quotes', async () => {
      const csvData = 'Name,Description\n"John","He said, ""Hello"""\n"Jane","Simple text"';
      
      const result = await this.dataSourceService.fetchCsvData(csvData);
      
      this.runner.assertEqual(result.length, 2, 'Should parse 2 rows');
      this.runner.assertEqual(result[0].Description, 'He said, "Hello"', 'Should handle quoted content');
    });

    this.runner.it('should parse CSV without headers', async () => {
      const csvData = 'John,25,Tokyo\nJane,30,Osaka';
      
      const result = await this.dataSourceService.fetchCsvData(csvData, { header: false });
      
      this.runner.assertEqual(result.length, 2, 'Should parse 2 rows');
      this.runner.assert(Array.isArray(result[0]), 'Should return arrays when no headers');
      this.runner.assertEqual(result[0][0], 'John', 'Should parse first cell correctly');
    });
  }

  testCsvValidation() {
    this.runner.it('should validate CSV data', async () => {
      const validData = [
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ];

      const result = await this.dataSourceService.validateCsvData(validData);
      this.runner.assertEqual(result.length, 2, 'Valid CSV data should pass through');
    });

    this.runner.it('should limit oversized CSV data', async () => {
      const oversizedData = Array(15000).fill({ col1: 'data', col2: 'more data' });

      const result = await this.dataSourceService.validateCsvData(oversizedData, { maxRows: 5000 });
      this.runner.assertEqual(result.length, 5000, 'Should limit to max rows');
    });
  }

  testCacheManagement() {
    this.runner.it('should clear cache by pattern', () => {
      this.dataSourceService.cache.set('api_test1', { data: '1' });
      this.dataSourceService.cache.set('api_test2', { data: '2' });
      this.dataSourceService.cache.set('sheets_test1', { data: '3' });

      this.dataSourceService.clearCache('api_');

      this.runner.assertEqual(this.dataSourceService.cache.size, 1, 'Should clear only matching entries');
      this.runner.assert(this.dataSourceService.cache.has('sheets_test1'), 'Should keep non-matching entries');
    });

    this.runner.it('should clear all cache', () => {
      this.dataSourceService.cache.set('key1', { data: '1' });
      this.dataSourceService.cache.set('key2', { data: '2' });

      this.dataSourceService.clearCache();

      this.runner.assertEqual(this.dataSourceService.cache.size, 0, 'Should clear all cache');
    });
  }

  testErrorHandling() {
    this.runner.it('should handle network errors gracefully', async () => {
      mockUrlFetchApp.setMockError('https://api.example.com/error', new Error('Network timeout'));

      try {
        await this.dataSourceService.fetchApiData('https://api.example.com/error');
        this.runner.fail('Should throw error for network failure');
      } catch (error) {
        this.runner.assert(error.message.includes('APIデータ取得失敗'), 'Should wrap network errors');
      }
    });

    this.runner.it('should handle invalid JSON responses', async () => {
      mockUrlFetchApp.setMockResponse('https://api.example.com/invalid', {
        getResponseCode: () => 200,
        getContentText: () => 'invalid json{'
      });

      try {
        await this.dataSourceService.fetchApiData('https://api.example.com/invalid');
        this.runner.fail('Should throw error for invalid JSON');
      } catch (error) {
        this.runner.assert(error.message.includes('APIデータ取得失敗'), 'Should handle JSON parse errors');
      }
    });
  }

  testSecurityValidation() {
    this.runner.it('should reject invalid URLs', async () => {
      try {
        await this.dataSourceService.fetchApiData('not-a-url');
        this.runner.fail('Should reject invalid URLs');
      } catch (error) {
        this.runner.assert(error.message.includes('無効なURL'), 'Should reject invalid URLs');
      }
    });

    this.runner.it('should sanitize URLs in logs', () => {
      const url = 'https://api.example.com/users?token=secret123&key=value';
      const sanitized = this.dataSourceService.sanitizeUrl(url);
      
      this.runner.assertEqual(sanitized, 'https://api.example.com/users', 'Should remove query parameters');
    });

    this.runner.it('should generate consistent cache keys', () => {
      const url = 'https://api.example.com/data';
      const options = { method: 'GET', headers: { 'Accept': 'application/json' } };
      
      const key1 = this.dataSourceService.generateCacheKey(url, options);
      const key2 = this.dataSourceService.generateCacheKey(url, options);
      
      this.runner.assertEqual(key1, key2, 'Should generate consistent cache keys');
    });
  }
}

// Export test suite
module.exports = DataSourceServiceTests;

// Setup and run tests if this file is executed directly
if (require.main === module) {
  // Setup test framework
  const runner = new TestRunner();
  runner.setupGASMocks();
  runner.setupTestFramework();
  
  const tests = new DataSourceServiceTests();
  tests.runAllTests();
}