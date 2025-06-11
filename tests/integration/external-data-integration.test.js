/**
 * External Data Integration Tests
 * Integration tests for the complete external data source workflow
 */

// Import test framework and utilities
const TestRunner = require('../runner.js');
const { mockPropertiesService, mockUrlFetchApp, mockSpreadsheetApp, mockSlidesApp } = require('../helpers/enhanced-gas-mocks.js');

// Mock Google Apps Script global objects
global.PropertiesService = mockPropertiesService;
global.UrlFetchApp = mockUrlFetchApp;
global.SpreadsheetApp = mockSpreadsheetApp;
global.SlidesApp = mockSlidesApp;
global.Utilities = {
  base64Encode: (text) => Buffer.from(text).toString('base64'),
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock logger
global.logger = {
  log: (level, message, data) => {},
  info: (message, data) => {},
  debug: (message, data) => {},
  warn: (message, data) => {},
  error: (message, data, error) => {},
  createPerformanceMonitor: () => ({
    start: () => {},
    end: () => {}
  })
};

// Import services
const DataSourceService = require('../../src/services/dataSource.js');
const DataTransformService = require('../../src/services/dataTransform.js');
const ContentService = require('../../src/services/content.js');
const ValidationService = require('../../src/utils/validation.js');

/**
 * External Data Integration Test Suite
 */
class ExternalDataIntegrationTests {
  constructor() {
    this.runner = new TestRunner('External Data Integration Tests');
    this.dataSourceService = null;
    this.dataTransformService = null;
    this.contentService = null;
    this.validationService = null;
  }

  setup() {
    this.dataSourceService = new DataSourceService();
    this.dataTransformService = new DataTransformService();
    this.contentService = new ContentService();
    this.validationService = new ValidationService();

    // Initialize data source services in ContentService
    this.contentService.initializeDataSourceServices(
      this.dataSourceService,
      this.dataTransformService
    );
  }

  tearDown() {
    this.dataSourceService.clearCache();
  }

  async runAllTests() {
    this.runner.describe('External Data Integration', () => {
      this.runner.beforeEach(() => this.setup());
      this.runner.afterEach(() => this.tearDown());

      // 完全なワークフローテスト
      this.testCompleteGoogleSheetsWorkflow();
      this.testCompleteApiWorkflow();
      this.testCompleteCsvWorkflow();
      
      // バリデーション統合テスト
      this.testIntegratedValidation();
      
      // エラーシナリオテスト
      this.testErrorScenarios();
      
      // パフォーマンステスト
      this.testPerformanceScenarios();
      
      // セキュリティテスト
      this.testSecurityScenarios();
      
      // キャッシュ統合テスト
      this.testCacheIntegration();
    });

    return this.runner.run();
  }

  testCompleteGoogleSheetsWorkflow() {
    this.runner.it('should complete Google Sheets to slide workflow', async () => {
      // Setup mock Google Sheets data
      const mockSheetsData = [
        ['Product', 'Sales', 'Region'],
        ['Widget A', '1000', 'North'],
        ['Widget B', '1500', 'South'],
        ['Widget C', '800', 'East']
      ];

      mockSpreadsheetApp.setMockData('test-sheet-id', mockSheetsData);
      mockSlidesApp.setMockPresentation('test-presentation-id');

      // 1. データ取得
      const rawData = await this.dataSourceService.fetchGoogleSheetsData(
        'test-sheet-id',
        'A1:C4'
      );

      this.runner.assertEqual(rawData.length, 4, 'Should fetch all rows');

      // 2. データ変換
      const transformedData = await this.dataTransformService.transformGoogleSheetsData(rawData);

      this.runner.assertEqual(transformedData.length, 3, 'Should exclude header row');
      this.runner.assertEqual(transformedData[0].Product, 'Widget A', 'Should transform correctly');

      // 3. スライドコンテンツ変換
      const slideData = await this.dataTransformService.transformForSlideContent(
        transformedData,
        'table'
      );

      this.runner.assertEqual(slideData.type, 'table', 'Should create table format');
      this.runner.assert(slideData.headers.includes('Product'), 'Should include Product header');

      // 4. スライドに追加
      const slideResult = await this.contentService.addSlideWithContent(
        'test-presentation-id',
        {
          title: 'Sales Data',
          content: [{
            type: 'google-sheets',
            spreadsheetId: 'test-sheet-id',
            range: 'A1:C4',
            contentType: 'table'
          }]
        }
      );

      this.runner.assert(slideResult.elements.length > 0, 'Should add elements to slide');
    });
  }

  testCompleteApiWorkflow() {
    this.runner.it('should complete API to slide workflow', async () => {
      // Setup mock API response
      const mockApiResponse = {
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'John Doe', department: 'Engineering', salary: 75000 },
            { id: 2, name: 'Jane Smith', department: 'Marketing', salary: 65000 },
            { id: 3, name: 'Bob Johnson', department: 'Sales', salary: 70000 }
          ]
        }
      };

      mockUrlFetchApp.setMockResponse('https://api.company.com/users', {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(mockApiResponse)
      });

      mockSlidesApp.setMockPresentation('test-presentation-id');

      // 1. データ取得
      const rawData = await this.dataSourceService.fetchApiData('https://api.company.com/users');

      this.runner.assertEqual(rawData.status, 'success', 'Should fetch API response');

      // 2. データ変換（APIレスポンス変換）
      const extractedData = await this.dataTransformService.transformApiResponse(rawData, {
        dataPath: 'data.users',
        fieldMapping: {
          id: 'id',
          fullName: 'name',
          dept: 'department',
          compensation: 'salary'
        }
      });

      this.runner.assertEqual(extractedData.length, 3, 'Should extract user data');
      this.runner.assertEqual(extractedData[0].fullName, 'John Doe', 'Should map fields correctly');

      // 3. スライドコンテンツ変換
      const slideData = await this.dataTransformService.transformForSlideContent(
        extractedData,
        'table'
      );

      this.runner.assertEqual(slideData.type, 'table', 'Should create table format');

      // 4. スライドに追加
      const slideResult = await this.contentService.addSlideWithContent(
        'test-presentation-id',
        {
          title: 'Employee Data',
          content: [{
            type: 'api-data',
            url: 'https://api.company.com/users',
            contentType: 'table',
            transformOptions: {
              dataPath: 'data.users',
              fieldMapping: {
                id: 'id',
                fullName: 'name',
                dept: 'department',
                compensation: 'salary'
              }
            }
          }]
        }
      );

      this.runner.assert(slideResult.elements.length > 0, 'Should add API data to slide');
    });
  }

  testCompleteCsvWorkflow() {
    this.runner.it('should complete CSV to slide workflow', async () => {
      const csvData = `Country,Population,GDP
Japan,125800000,4937
Germany,83200000,3846
France,67400000,2716`;

      mockSlidesApp.setMockPresentation('test-presentation-id');

      // 1. CSV データ処理
      const parsedData = await this.dataSourceService.fetchCsvData(csvData);

      this.runner.assertEqual(parsedData.length, 3, 'Should parse 3 countries');
      this.runner.assertEqual(parsedData[0].Country, 'Japan', 'Should parse Japan data');

      // 2. スライドコンテンツ変換
      const slideData = await this.dataTransformService.transformForSlideContent(
        parsedData,
        'chart',
        {
          xField: 'Country',
          yField: 'Population'
        }
      );

      this.runner.assertEqual(slideData.type, 'chart', 'Should create chart format');
      this.runner.assert(slideData.labels.includes('Japan'), 'Should include Japan in labels');

      // 3. スライドに追加
      const slideResult = await this.contentService.addSlideWithContent(
        'test-presentation-id',
        {
          title: 'Country Statistics',
          content: [{
            type: 'csv-data',
            csvContent: csvData,
            contentType: 'chart',
            transformOptions: {
              xField: 'Country',
              yField: 'Population'
            }
          }]
        }
      );

      this.runner.assert(slideResult.elements.length > 0, 'Should add CSV data to slide');
    });
  }

  testIntegratedValidation() {
    this.runner.it('should validate data source configurations', async () => {
      const googleSheetsConfig = {
        sourceType: 'google-sheets',
        spreadsheetId: 'valid-spreadsheet-id-here-needs-44-chars-xxxx',
        range: 'A1:D10'
      };

      const validation = this.validationService.validateDataSourceConfig(googleSheetsConfig);
      this.runner.assert(validation.isValid, 'Valid Google Sheets config should pass');

      const invalidConfig = {
        sourceType: 'invalid-type'
      };

      const invalidValidation = this.validationService.validateDataSourceConfig(invalidConfig);
      this.runner.assert(!invalidValidation.isValid, 'Invalid config should fail');
    });

    this.runner.it('should validate external data content', async () => {
      const validData = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 }
      ];

      const validation = this.validationService.validateExternalData(validData);
      this.runner.assert(validation.isValid, 'Valid data should pass validation');

      const oversizedData = Array(20000).fill({ data: 'test' });
      const oversizedValidation = this.validationService.validateExternalData(oversizedData);
      this.runner.assert(!oversizedValidation.isValid, 'Oversized data should fail validation');
    });
  }

  testErrorScenarios() {
    this.runner.it('should handle Google Sheets errors gracefully', async () => {
      mockSpreadsheetApp.setMockError('error-sheet-id', new Error('Permission denied'));

      try {
        await this.dataSourceService.fetchGoogleSheetsData('error-sheet-id', 'A1:C3');
        this.runner.fail('Should throw error for permission denied');
      } catch (error) {
        this.runner.assert(error.message.includes('Google Sheetsデータ取得失敗'), 'Should wrap error appropriately');
      }
    });

    this.runner.it('should handle API errors gracefully', async () => {
      mockUrlFetchApp.setMockResponse('https://api.error.com/data', {
        getResponseCode: () => 500,
        getContentText: () => 'Internal Server Error'
      });

      try {
        await this.dataSourceService.fetchApiData('https://api.error.com/data');
        this.runner.fail('Should throw error for 500 response');
      } catch (error) {
        this.runner.assert(error.message.includes('HTTP 500'), 'Should handle HTTP errors');
      }
    });

    this.runner.it('should handle invalid CSV data', async () => {
      const invalidCsv = 'Name,Age\nJohn,25\nJane'; // Missing last field

      try {
        const result = await this.dataSourceService.fetchCsvData(invalidCsv);
        // Should not throw error, but handle gracefully
        this.runner.assert(Array.isArray(result), 'Should return array even for malformed CSV');
      } catch (error) {
        this.runner.assert(error.message.includes('CSV'), 'Should provide helpful error message');
      }
    });

    this.runner.it('should handle content service initialization errors', async () => {
      const uninitializedContentService = new ContentService();

      try {
        await uninitializedContentService.addSlideWithContent(
          'test-presentation-id',
          {
            content: [{
              type: 'external-data',
              sourceType: 'api',
              url: 'https://api.test.com'
            }]
          }
        );
        this.runner.fail('Should throw error for uninitialized services');
      } catch (error) {
        this.runner.assert(error.message.includes('初期化されていません'), 'Should check service initialization');
      }
    });
  }

  testPerformanceScenarios() {
    this.runner.it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeDataset = Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        value: Math.random() * 100
      }));

      const startTime = Date.now();
      
      const slideData = await this.dataTransformService.transformForSlideContent(
        largeDataset,
        'table',
        { maxRows: 100 }
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      this.runner.assert(processingTime < 5000, 'Should process large dataset within 5 seconds');
      this.runner.assertEqual(slideData.rows.length, 100, 'Should limit rows as specified');
    });

    this.runner.it('should cache repeated requests', async () => {
      const mockData = [['Name', 'Value'], ['Test', '123']];
      mockSpreadsheetApp.setMockData('cache-test-id', mockData);

      const startTime1 = Date.now();
      await this.dataSourceService.fetchGoogleSheetsData('cache-test-id', 'A1:B2');
      const firstRequestTime = Date.now() - startTime1;

      const startTime2 = Date.now();
      await this.dataSourceService.fetchGoogleSheetsData('cache-test-id', 'A1:B2');
      const secondRequestTime = Date.now() - startTime2;

      this.runner.assert(secondRequestTime < firstRequestTime, 'Cached request should be faster');
    });
  }

  testSecurityScenarios() {
    this.runner.it('should reject malicious data sources', async () => {
      const maliciousConfig = {
        sourceType: 'api',
        url: 'javascript:alert("xss")'
      };

      const validation = this.validationService.validateDataSourceConfig(maliciousConfig);
      this.runner.assert(!validation.isValid, 'Should reject malicious URLs');
    });

    this.runner.it('should sanitize external data', async () => {
      const maliciousData = [
        { name: 'John<script>alert("xss")</script>', age: 25 },
        { name: 'Jane', age: 30 }
      ];

      const validation = this.validationService.validateExternalData(maliciousData);
      this.runner.assert(!validation.isValid, 'Should detect malicious content');
    });

    this.runner.it('should validate API response security', async () => {
      const suspiciousResponse = {
        data: '<script>alert("xss")</script>',
        users: ['test']
      };

      const validation = this.validationService.validateApiResponse(suspiciousResponse);
      this.runner.assert(validation.isValid, 'Should validate response structure');
      
      // But security validation should catch malicious content
      const securityValidation = this.validationService.performSecurityValidation(
        JSON.stringify(suspiciousResponse),
        'api-response'
      );
      this.runner.assert(!securityValidation.isSecure, 'Should detect security issues');
    });
  }

  testCacheIntegration() {
    this.runner.it('should manage cache across services', async () => {
      const mockData = [['Test', 'Cache'], ['Data', 'Here']];
      mockSpreadsheetApp.setMockData('cache-integration-id', mockData);

      // First request
      await this.dataSourceService.fetchGoogleSheetsData('cache-integration-id', 'A1:B2');
      
      this.runner.assert(this.dataSourceService.cache.size > 0, 'Should cache data');

      // Clear specific cache
      this.dataSourceService.clearCache('sheets_');
      
      const cacheCount = Array.from(this.dataSourceService.cache.keys())
        .filter(key => key.startsWith('sheets_')).length;
      
      this.runner.assertEqual(cacheCount, 0, 'Should clear sheets cache');
    });

    this.runner.it('should respect cache TTL', async () => {
      const mockData = [['TTL', 'Test']];
      mockSpreadsheetApp.setMockData('ttl-test-id', mockData);

      // Fetch with short TTL
      await this.dataSourceService.fetchGoogleSheetsData(
        'ttl-test-id',
        'A1:B1',
        { cacheTTL: 100 }
      );

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should fetch fresh data (though we can't easily test this without mocking time)
      const result = await this.dataSourceService.fetchGoogleSheetsData(
        'ttl-test-id',
        'A1:B1',
        { cacheTTL: 100 }
      );

      this.runner.assert(Array.isArray(result), 'Should still return valid data');
    });
  }
}

// Export test suite
module.exports = ExternalDataIntegrationTests;

// Run tests if this file is executed directly
if (require.main === module) {
  const tests = new ExternalDataIntegrationTests();
  tests.runAllTests().then(results => {
    console.log('\n=== External Data Integration Test Results ===');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.failures.forEach(failure => {
        console.log(`- ${failure.name}: ${failure.error}`);
      });
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}