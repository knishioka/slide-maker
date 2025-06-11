/**
 * Data Transform Service Unit Tests
 * Tests for data transformation and conversion functionality
 */

// Import test framework
const TestRunner = require('../runner.js');

// Import the service under test
const DataTransformService = require('../../src/services/dataTransform.js');

/**
 * Data Transform Service Test Suite
 */
class DataTransformServiceTests {
  constructor() {
    this.runner = new TestRunner('DataTransformService Tests');
    this.dataTransformService = null;
  }

  setup() {
    this.dataTransformService = new DataTransformService();
  }

  async runAllTests() {
    this.runner.describe('DataTransformService', () => {
      this.runner.beforeEach(() => this.setup());

      // 基本的な初期化テスト
      this.testServiceInitialization();
      
      // 型変換テスト
      this.testTypeConverters();
      
      // Google Sheetsデータ変換テスト
      this.testGoogleSheetsTransformation();
      
      // APIレスポンス変換テスト
      this.testApiResponseTransformation();
      
      // スライドコンテンツ変換テスト
      this.testSlideContentTransformation();
      
      // スキーマ適用テスト
      this.testSchemaApplication();
      
      // データフィルタリングテスト
      this.testDataFiltering();
      
      // エラーハンドリングテスト
      this.testErrorHandling();
    });

    return this.runner.run();
  }

  testServiceInitialization() {
    this.runner.it('should initialize with type converters', () => {
      const service = new DataTransformService();
      
      this.runner.assert(service.typeConverters, 'Type converters should be initialized');
      this.runner.assert(typeof service.typeConverters.string === 'function', 'String converter should exist');
      this.runner.assert(typeof service.typeConverters.number === 'function', 'Number converter should exist');
      this.runner.assert(typeof service.typeConverters.boolean === 'function', 'Boolean converter should exist');
    });
  }

  testTypeConverters() {
    this.runner.it('should convert strings correctly', () => {
      const converter = this.dataTransformService.typeConverters.string;
      
      this.runner.assertEqual(converter('test'), 'test', 'Should convert string');
      this.runner.assertEqual(converter(123), '123', 'Should convert number to string');
      this.runner.assertEqual(converter(null), '', 'Should convert null to empty string');
    });

    this.runner.it('should convert numbers correctly', () => {
      const converter = this.dataTransformService.typeConverters.number;
      
      this.runner.assertEqual(converter('123'), 123, 'Should convert string to number');
      this.runner.assertEqual(converter('123.45'), 123.45, 'Should convert decimal string');
      this.runner.assertEqual(converter('invalid'), 0, 'Should return 0 for invalid input');
      this.runner.assertEqual(converter(null), 0, 'Should return 0 for null');
    });

    this.runner.it('should convert integers correctly', () => {
      const converter = this.dataTransformService.typeConverters.integer;
      
      this.runner.assertEqual(converter('123'), 123, 'Should convert string to integer');
      this.runner.assertEqual(converter('123.45'), 123, 'Should truncate decimal');
      this.runner.assertEqual(converter('invalid'), 0, 'Should return 0 for invalid input');
    });

    this.runner.it('should convert booleans correctly', () => {
      const converter = this.dataTransformService.typeConverters.boolean;
      
      this.runner.assertEqual(converter(true), true, 'Should pass through true');
      this.runner.assertEqual(converter('true'), true, 'Should convert "true" string');
      this.runner.assertEqual(converter('1'), true, 'Should convert "1" to true');
      this.runner.assertEqual(converter('yes'), true, 'Should convert "yes" to true');
      this.runner.assertEqual(converter('false'), false, 'Should convert "false" to false');
      this.runner.assertEqual(converter('0'), false, 'Should convert "0" to false');
    });

    this.runner.it('should convert dates correctly', () => {
      const converter = this.dataTransformService.typeConverters.date;
      
      const testDate = new Date('2023-01-01');
      this.runner.assertEqual(converter(testDate), testDate, 'Should pass through Date object');
      
      const convertedDate = converter('2023-01-01');
      this.runner.assert(convertedDate instanceof Date, 'Should convert valid date string');
      
      const invalidDate = converter('invalid-date');
      this.runner.assertEqual(invalidDate, null, 'Should return null for invalid date');
    });

    this.runner.it('should convert arrays correctly', () => {
      const converter = this.dataTransformService.typeConverters.array;
      
      this.runner.assert(Array.isArray(converter([1, 2, 3])), 'Should pass through array');
      this.runner.assert(Array.isArray(converter('single')), 'Should wrap single value in array');
      this.runner.assertEqual(converter('single')[0], 'single', 'Should contain original value');
    });
  }

  testGoogleSheetsTransformation() {
    this.runner.it('should transform Google Sheets data with headers', async () => {
      const sheetsData = [
        ['Name', 'Age', 'City'],
        ['John', '25', 'Tokyo'],
        ['Jane', '30', 'Osaka'],
        ['', '', ''] // Empty row
      ];

      const result = await this.dataTransformService.transformGoogleSheetsData(sheetsData);

      this.runner.assertEqual(result.length, 2, 'Should skip empty rows by default');
      this.runner.assertEqual(result[0].Name, 'John', 'Should use headers as keys');
      this.runner.assertEqual(result[1].Age, '30', 'Should convert values correctly');
    });

    this.runner.it('should handle data without headers', async () => {
      const sheetsData = [
        ['John', '25', 'Tokyo'],
        ['Jane', '30', 'Osaka']
      ];

      const result = await this.dataTransformService.transformGoogleSheetsData(sheetsData, {
        hasHeader: false
      });

      this.runner.assertEqual(result.length, 2, 'Should process all rows');
      this.runner.assertEqual(result[0].column_1, 'John', 'Should generate column names');
      this.runner.assertEqual(result[1].column_2, '30', 'Should use generated headers');
    });

    this.runner.it('should apply column mapping', async () => {
      const sheetsData = [
        ['FirstName', 'YearsOld', 'Location'],
        ['John', '25', 'Tokyo']
      ];

      const columnMapping = {
        'FirstName': 'name',
        'YearsOld': 'age',
        'Location': 'city'
      };

      const result = await this.dataTransformService.transformGoogleSheetsData(sheetsData, {
        columnMapping
      });

      this.runner.assertEqual(result[0].name, 'John', 'Should map FirstName to name');
      this.runner.assertEqual(result[0].age, '25', 'Should map YearsOld to age');
      this.runner.assertEqual(result[0].city, 'Tokyo', 'Should map Location to city');
    });

    this.runner.it('should include empty rows when requested', async () => {
      const sheetsData = [
        ['Name', 'Age'],
        ['John', '25'],
        ['', ''],
        ['Jane', '30']
      ];

      const result = await this.dataTransformService.transformGoogleSheetsData(sheetsData, {
        includeEmptyRows: true
      });

      this.runner.assertEqual(result.length, 3, 'Should include empty row');
    });
  }

  testApiResponseTransformation() {
    this.runner.it('should transform API response with data path', async () => {
      const apiData = {
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' }
          ]
        }
      };

      const mapping = {
        dataPath: 'data.users'
      };

      const result = await this.dataTransformService.transformApiResponse(apiData, mapping);

      this.runner.assertEqual(result.length, 2, 'Should extract data from path');
      this.runner.assertEqual(result[0].name, 'John', 'Should preserve original structure');
    });

    this.runner.it('should apply field mapping', async () => {
      const apiData = [
        { user_id: 1, full_name: 'John Doe', email_addr: 'john@example.com' },
        { user_id: 2, full_name: 'Jane Smith', email_addr: 'jane@example.com' }
      ];

      const mapping = {
        fieldMapping: {
          id: 'user_id',
          name: 'full_name',
          email: 'email_addr'
        }
      };

      const result = await this.dataTransformService.transformApiResponse(apiData, mapping);

      this.runner.assertEqual(result[0].id, 1, 'Should map user_id to id');
      this.runner.assertEqual(result[0].name, 'John Doe', 'Should map full_name to name');
      this.runner.assertEqual(result[1].email, 'jane@example.com', 'Should map email_addr to email');
    });

    this.runner.it('should handle nested data paths', async () => {
      const apiData = {
        response: {
          meta: { total: 2 },
          items: {
            list: [
              { title: 'Item 1' },
              { title: 'Item 2' }
            ]
          }
        }
      };

      const mapping = {
        dataPath: 'response.items.list'
      };

      const result = await this.dataTransformService.transformApiResponse(apiData, mapping);

      this.runner.assertEqual(result.length, 2, 'Should extract from nested path');
      this.runner.assertEqual(result[0].title, 'Item 1', 'Should preserve item structure');
    });
  }

  testSlideContentTransformation() {
    this.runner.it('should transform data to table format', async () => {
      const data = [
        { name: 'John', age: 25, city: 'Tokyo' },
        { name: 'Jane', age: 30, city: 'Osaka' }
      ];

      const result = await this.dataTransformService.transformForSlideContent(data, 'table');

      this.runner.assertEqual(result.type, 'table', 'Should set correct type');
      this.runner.assert(Array.isArray(result.headers), 'Should have headers');
      this.runner.assert(Array.isArray(result.rows), 'Should have rows');
      this.runner.assertEqual(result.rows.length, 2, 'Should have correct number of rows');
    });

    this.runner.it('should transform data to text format', async () => {
      const data = { content: 'This is a test message', title: 'Test' };

      const result = await this.dataTransformService.transformForSlideContent(data, 'text');

      this.runner.assertEqual(result.type, 'text', 'Should set correct type');
      this.runner.assert(typeof result.content === 'string', 'Should have text content');
    });

    this.runner.it('should transform data to list format', async () => {
      const data = [
        { title: 'Item 1', description: 'First item' },
        { title: 'Item 2', description: 'Second item' }
      ];

      const result = await this.dataTransformService.transformForSlideContent(data, 'list');

      this.runner.assertEqual(result.type, 'list', 'Should set correct type');
      this.runner.assert(Array.isArray(result.items), 'Should have items array');
      this.runner.assertEqual(result.items[0].title, 'Item 1', 'Should preserve item structure');
    });

    this.runner.it('should transform data to chart format', async () => {
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 15 }
      ];

      const result = await this.dataTransformService.transformForSlideContent(data, 'chart', {
        xField: 'category',
        yField: 'value'
      });

      this.runner.assertEqual(result.type, 'chart', 'Should set correct type');
      this.runner.assert(Array.isArray(result.labels), 'Should have labels');
      this.runner.assert(Array.isArray(result.data), 'Should have data points');
      this.runner.assertEqual(result.labels.length, 3, 'Should have correct number of labels');
    });

    this.runner.it('should transform data to card format', async () => {
      const data = { title: 'Revenue', value: '$50,000', description: 'Monthly revenue' };

      const result = await this.dataTransformService.transformForSlideContent(data, 'card');

      this.runner.assertEqual(result.type, 'card', 'Should set correct type');
      this.runner.assertEqual(result.title, 'Revenue', 'Should preserve title');
      this.runner.assertEqual(result.value, '$50,000', 'Should preserve value');
    });
  }

  testSchemaApplication() {
    this.runner.it('should apply schema to transform data types', async () => {
      const data = [
        { name: 'John', age: '25', active: 'true', score: '85.5' },
        { name: 'Jane', age: '30', active: 'false', score: '92.0' }
      ];

      const schema = {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
        score: { type: 'number' }
      };

      const result = await this.dataTransformService.transformToStandardFormat(data, schema);

      this.runner.assertEqual(typeof result[0].age, 'number', 'Should convert age to number');
      this.runner.assertEqual(typeof result[0].active, 'boolean', 'Should convert active to boolean');
      this.runner.assertEqual(result[0].active, true, 'Should convert "true" to boolean true');
      this.runner.assertEqual(result[1].active, false, 'Should convert "false" to boolean false');
    });

    this.runner.it('should apply default values', async () => {
      const data = [
        { name: 'John' }, // Missing age and status
        { name: 'Jane', age: '30' } // Missing status
      ];

      const schema = {
        name: { type: 'string' },
        age: { type: 'integer', default: 0 },
        status: { type: 'string', default: 'unknown' }
      };

      const result = await this.dataTransformService.transformToStandardFormat(data, schema);

      this.runner.assertEqual(result[0].age, 0, 'Should apply default age');
      this.runner.assertEqual(result[0].status, 'unknown', 'Should apply default status');
      this.runner.assertEqual(result[1].age, 30, 'Should preserve existing values');
    });

    this.runner.it('should handle required fields', async () => {
      const data = [
        { name: 'John' }, // Missing required age
        { name: 'Jane', age: '30' }
      ];

      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'integer', required: true }
      };

      try {
        await this.dataTransformService.transformToStandardFormat(data, schema, {
          strictMode: true
        });
        this.runner.fail('Should throw error for missing required field');
      } catch (error) {
        this.runner.assert(error.message.includes('必須フィールド'), 'Should throw required field error');
      }
    });
  }

  testDataFiltering() {
    this.runner.it('should filter data by criteria', async () => {
      const data = [
        { name: 'John', age: 25, department: 'Engineering' },
        { name: 'Jane', age: 30, department: 'Marketing' },
        { name: 'Bob', age: 35, department: 'Engineering' }
      ];

      const result = await this.dataTransformService.postprocessData(data, {
        filter: { department: 'Engineering' }
      });

      this.runner.assertEqual(result.length, 2, 'Should filter to Engineering only');
      this.runner.assert(result.every(item => item.department === 'Engineering'), 'All items should match filter');
    });

    this.runner.it('should limit data size', async () => {
      const data = Array(100).fill(0).map((_, i) => ({ id: i, value: `item${i}` }));

      const result = await this.dataTransformService.postprocessData(data, {
        limit: 10
      });

      this.runner.assertEqual(result.length, 10, 'Should limit to 10 items');
    });

    this.runner.it('should sort data', async () => {
      const data = [
        { name: 'Charlie', age: 35 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ];

      const result = await this.dataTransformService.postprocessData(data, {
        sort: { field: 'name', order: 'asc' }
      });

      this.runner.assertEqual(result[0].name, 'Alice', 'Should sort alphabetically');
      this.runner.assertEqual(result[2].name, 'Charlie', 'Should maintain sort order');
    });
  }

  testErrorHandling() {
    this.runner.it('should handle invalid input gracefully', async () => {
      try {
        await this.dataTransformService.transformForSlideContent(null, 'table');
        this.runner.fail('Should throw error for null input');
      } catch (error) {
        this.runner.assert(error.message.includes('変換失敗'), 'Should throw transformation error');
      }
    });

    this.runner.it('should handle unsupported content types', async () => {
      const data = [{ test: 'data' }];

      try {
        await this.dataTransformService.transformForSlideContent(data, 'unsupported-type');
        this.runner.fail('Should throw error for unsupported type');
      } catch (error) {
        this.runner.assert(error.message.includes('未対応'), 'Should throw unsupported type error');
      }
    });

    this.runner.it('should handle malformed data gracefully', async () => {
      const malformedData = "not json data";

      const result = await this.dataTransformService.preprocessData(malformedData);

      this.runner.assertEqual(result, malformedData, 'Should return original if not valid JSON');
    });

    this.runner.it('should validate slide content', async () => {
      const invalidSlideData = null;

      try {
        await this.dataTransformService.validateSlideContent(invalidSlideData, 'table');
        this.runner.fail('Should throw error for invalid slide content');
      } catch (error) {
        this.runner.assert(error.message.includes('無効な'), 'Should throw validation error');
      }
    });
  }
}

// Export test suite
module.exports = DataTransformServiceTests;

// Run tests if this file is executed directly
if (require.main === module) {
  const tests = new DataTransformServiceTests();
  tests.runAllTests().then(results => {
    console.log('\n=== Data Transform Service Test Results ===');
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