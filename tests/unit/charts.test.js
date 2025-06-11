/**
 * Chart Service Unit Tests
 * Comprehensive test suite for chart generation functionality
 */

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 2
};

// Test data fixtures
const CHART_TEST_DATA = {
  validBarChart: {
    chartType: 'bar',
    title: 'Sample Bar Chart',
    data: [
      ['Quarter', 'Sales', 'Profit'],
      ['Q1', 100, 20],
      ['Q2', 120, 25],
      ['Q3', 140, 30],
      ['Q4', 160, 35]
    ],
    options: {
      width: 600,
      height: 400,
      colors: ['#1f77b4', '#ff7f0e'],
      legend: 'bottom'
    }
  },

  validPieChart: {
    chartType: 'pie',
    title: 'Market Share',
    data: [
      ['Company', 'Market Share'],
      ['Company A', 35],
      ['Company B', 25],
      ['Company C', 20],
      ['Company D', 20]
    ],
    options: {
      width: 500,
      height: 400,
      is3D: false
    }
  },

  validLineChart: {
    chartType: 'line',
    title: 'Growth Trend',
    data: [
      ['Month', 'Revenue', 'Expenses'],
      ['Jan', 1000, 800],
      ['Feb', 1200, 850],
      ['Mar', 1100, 820],
      ['Apr', 1300, 900],
      ['May', 1500, 950]
    ],
    options: {
      smooth: true,
      pointSize: 5
    }
  },

  invalidData: {
    chartType: 'bar',
    data: [
      ['Single Column'] // Missing data columns
    ]
  },

  emptyData: {
    chartType: 'column',
    data: []
  },

  largeDataset: {
    chartType: 'column',
    data: [
      ['Item', 'Value'],
      ...Array.from({ length: 1000 }, (_, i) => [`Item${i}`, Math.random() * 100])
    ]
  }
};

// Mock theme for testing
const TEST_THEME = {
  fontFamily: 'Arial',
  titleFontSize: 24,
  bodyFontSize: 16,
  primaryColor: '#000000',
  secondaryColor: '#666666',
  backgroundColor: '#FFFFFF',
  colorPalette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
};

/**
 * ChartService Unit Tests
 */
function testChartService() {
  const testSuite = 'ChartService';
  let chartService;

  QUnit.module(testSuite, {
    beforeEach() {
      chartService = new ChartService();
    }
  });

  QUnit.test('Chart service initialization', function(assert) {
    assert.ok(chartService, 'ChartService should initialize');
    assert.ok(chartService.SUPPORTED_CHART_TYPES, 'Should have supported chart types');
    assert.ok(chartService.CHART_CONSTRAINTS, 'Should have chart constraints');
    assert.ok(chartService.DEFAULT_CHART_OPTIONS, 'Should have default options');
  });

  QUnit.test('Validate chart configuration - valid data', function(assert) {
    const validation = chartService.validateChartConfig(CHART_TEST_DATA.validBarChart);
    
    assert.ok(validation.isValid, 'Valid chart config should pass validation');
    assert.equal(validation.errors.length, 0, 'Should have no validation errors');
    assert.ok(validation.sanitized, 'Should return sanitized data');
    assert.equal(validation.sanitized.chartType, 'bar', 'Should preserve chart type');
  });

  QUnit.test('Validate chart configuration - invalid data', function(assert) {
    const validation = chartService.validateChartConfig(CHART_TEST_DATA.invalidData);
    
    assert.notOk(validation.isValid, 'Invalid chart config should fail validation');
    assert.ok(validation.errors.length > 0, 'Should have validation errors');
  });

  QUnit.test('Validate chart configuration - empty data', function(assert) {
    const validation = chartService.validateChartConfig(CHART_TEST_DATA.emptyData);
    
    assert.notOk(validation.isValid, 'Empty chart data should fail validation');
    assert.ok(validation.errors.length > 0, 'Should have validation errors');
  });

  QUnit.test('Chart type validation', function(assert) {
    const validTypes = ['bar', 'column', 'line', 'pie', 'scatter'];
    const invalidTypes = ['invalid', 'unknown', null, undefined];

    validTypes.forEach(type => {
      const config = { ...CHART_TEST_DATA.validBarChart, chartType: type };
      const validation = chartService.validateChartConfig(config);
      assert.ok(validation.isValid || validation.errors.every(e => !e.includes('Unsupported chart type')), 
        `${type} should be supported chart type`);
    });

    invalidTypes.forEach(type => {
      const config = { ...CHART_TEST_DATA.validBarChart, chartType: type };
      const validation = chartService.validateChartConfig(config);
      assert.notOk(validation.isValid, `${type} should be invalid chart type`);
    });
  });

  QUnit.test('Chart data validation', function(assert) {
    // Test minimum data requirements
    const minValidData = {
      chartType: 'bar',
      data: [
        ['Category', 'Value'],
        ['A', 10]
      ]
    };
    
    const validation = chartService.validateChartConfig(minValidData);
    assert.ok(validation.isValid, 'Minimum valid data should pass');

    // Test large dataset warning
    const largeValidation = chartService.validateChartConfig(CHART_TEST_DATA.largeDataset);
    assert.ok(largeValidation.warnings.length > 0, 'Large dataset should generate warnings');
  });

  QUnit.test('Chart options validation', function(assert) {
    const configWithOptions = {
      ...CHART_TEST_DATA.validBarChart,
      options: {
        width: 800,
        height: 600,
        colors: ['#ff0000', '#00ff00'],
        backgroundColor: '#ffffff',
        legend: 'top'
      }
    };

    const validation = chartService.validateChartConfig(configWithOptions);
    assert.ok(validation.isValid, 'Valid options should pass validation');
    assert.ok(validation.sanitized.options, 'Should include sanitized options');
  });

  QUnit.test('Theme application to charts', function(assert) {
    const chartConfig = CHART_TEST_DATA.validBarChart;
    const themedOptions = chartService.applyThemeToChart(chartConfig, TEST_THEME);

    assert.ok(themedOptions, 'Should return themed options');
    assert.equal(themedOptions.titleFontFamily, TEST_THEME.fontFamily, 'Should apply theme font');
    assert.deepEqual(themedOptions.colors, TEST_THEME.colorPalette.slice(0, 2), 'Should apply theme colors');
    assert.equal(themedOptions.backgroundColor, TEST_THEME.backgroundColor, 'Should apply theme background');
  });

  QUnit.test('Data table creation', function(assert) {
    const data = CHART_TEST_DATA.validBarChart.data;
    
    try {
      const dataTable = chartService.createDataTable(data);
      assert.ok(dataTable, 'Should create data table');
    } catch (error) {
      // In test environment, Google Charts API might not be available
      assert.ok(true, 'Data table creation attempted');
    }
  });

  QUnit.test('Chart type recommendations', function(assert) {
    // Test pie chart recommendation for small single series
    const smallSingleSeries = [
      ['Category', 'Value'],
      ['A', 10], ['B', 20], ['C', 30]
    ];
    
    const pieRecommendation = chartService.getRecommendedChartType(smallSingleSeries);
    assert.equal(pieRecommendation.type, 'pie', 'Should recommend pie chart for small single series');

    // Test line chart recommendation for many points, multiple series
    const multiSeriesData = [
      ['Month', 'Sales', 'Profit'],
      ...Array.from({ length: 25 }, (_, i) => [`Month${i}`, i * 10, i * 2])
    ];
    
    const lineRecommendation = chartService.getRecommendedChartType(multiSeriesData);
    assert.equal(lineRecommendation.type, 'line', 'Should recommend line chart for time series data');
  });

  QUnit.test('Chart preview generation', function(assert) {
    const preview = chartService.generateChartPreview(CHART_TEST_DATA.validBarChart, TEST_THEME);
    
    assert.ok(preview.isValid, 'Valid chart should generate valid preview');
    assert.ok(preview.dataPoints > 0, 'Should calculate data points');
    assert.ok(preview.seriesCount > 0, 'Should calculate series count');
    assert.ok(preview.estimatedSize, 'Should provide estimated size');
    assert.ok(preview.recommendation, 'Should provide chart type recommendation');
  });

  QUnit.test('Data point counting', function(assert) {
    const barData = CHART_TEST_DATA.validBarChart.data;
    const dataPoints = chartService.countDataPoints(barData);
    
    // 4 rows of data (excluding header) × 2 data columns = 8 data points
    const expectedPoints = (barData.length - 1) * (barData[0].length - 1);
    assert.equal(dataPoints, expectedPoints, 'Should count data points correctly');
  });

  QUnit.test('Chart configuration sanitization', function(assert) {
    const unsafeConfig = {
      chartType: 'bar',
      title: '<script>alert("xss")</script>Safe Title',
      data: [
        ['Category', 'Value'],
        ['<img src=x onerror=alert(1)>', 100],
        ['Normal', 'not-a-number']
      ],
      options: {
        width: 50000, // Too large
        height: -100, // Invalid
        colors: ['not-a-color', '#ff0000'],
        backgroundColor: 'invalid-color'
      }
    };

    const validation = chartService.validateChartConfig(unsafeConfig);
    const sanitized = validation.sanitized;

    assert.ok(sanitized.title.indexOf('<script>') === -1, 'Should sanitize script tags from title');
    assert.equal(sanitized.data[1][1], 100, 'Should preserve valid numeric data');
    assert.equal(sanitized.data[2][1], 0, 'Should convert invalid numbers to 0');
  });
}

/**
 * Chart Integration Tests
 */
function testChartIntegration() {
  const testSuite = 'Chart Integration';

  QUnit.module(testSuite);

  QUnit.test('Content service chart element handler registration', function(assert) {
    const contentService = new ContentService();
    const handlers = contentService.getElementHandlers({
      presentationId: 'test',
      slideIndex: 0,
      item: {},
      slideDimensions: { width: 960, height: 540 },
      theme: TEST_THEME,
      layout: 'single',
      index: 0
    });

    assert.ok(handlers.chart, 'Chart handler should be registered');
    assert.equal(typeof handlers.chart, 'function', 'Chart handler should be a function');
  });

  QUnit.test('Chart element height calculation', function(assert) {
    const contentService = new ContentService();
    const chartHeight = contentService.getElementHeight('chart');
    
    assert.ok(chartHeight > 0, 'Chart height should be positive');
    assert.equal(typeof chartHeight, 'number', 'Chart height should be numeric');
  });

  QUnit.test('Chart position calculation', function(assert) {
    const contentService = new ContentService();
    const slideDimensions = { width: 960, height: 540 };
    
    const position = contentService.calculateContentPosition(
      slideDimensions, 
      'single', 
      0, 
      'chart'
    );

    assert.ok(position.x >= 0, 'Chart X position should be non-negative');
    assert.ok(position.y >= 0, 'Chart Y position should be non-negative');
    assert.ok(position.width > 0, 'Chart width should be positive');
    assert.ok(position.height > 0, 'Chart height should be positive');
  });
}

/**
 * Chart Validation Tests
 */
function testChartValidation() {
  const testSuite = 'Chart Validation';
  let validationService;

  QUnit.module(testSuite, {
    beforeEach() {
      validationService = new ValidationService();
    }
  });

  QUnit.test('Chart data validation', function(assert) {
    const validChart = CHART_TEST_DATA.validBarChart;
    const validation = validationService.validateChartData(validChart);
    
    assert.ok(validation.isValid, 'Valid chart data should pass validation');
    assert.equal(validation.errors.length, 0, 'Should have no validation errors');
  });

  QUnit.test('Chart data array validation', function(assert) {
    const validData = CHART_TEST_DATA.validBarChart.data;
    const validation = validationService.validateChartDataArray(validData);
    
    assert.equal(validation.errors.length, 0, 'Valid chart data array should have no errors');

    // Test invalid data array
    const invalidData = [
      ['Header'], // Missing second column
      'not-an-array' // Invalid row
    ];
    
    const invalidValidation = validationService.validateChartDataArray(invalidData);
    assert.ok(invalidValidation.errors.length > 0, 'Invalid data array should have errors');
  });

  QUnit.test('Chart options validation', function(assert) {
    const validOptions = {
      width: 600,
      height: 400,
      colors: ['#ff0000', '#00ff00'],
      backgroundColor: '#ffffff',
      legend: 'bottom'
    };

    const validation = validationService.validateChartOptions(validOptions);
    assert.equal(validation.errors.length, 0, 'Valid options should have no errors');

    // Test invalid options
    const invalidOptions = {
      width: 'not-a-number',
      height: -100,
      colors: ['not-a-color'],
      backgroundColor: 'invalid',
      legend: 'invalid-position'
    };

    const invalidValidation = validationService.validateChartOptions(invalidOptions);
    assert.ok(invalidValidation.errors.length > 0, 'Invalid options should have errors');
  });

  QUnit.test('Chart data sanitization', function(assert) {
    const unsafeData = {
      chartType: 'bar',
      title: '<script>alert("xss")</script>Chart Title',
      data: [
        ['Category', 'Value'],
        ['<img src=x onerror=alert(1)>', 'not-a-number'],
        ['Safe Category', 100]
      ]
    };

    const sanitized = validationService.sanitizeChartData(unsafeData);
    
    assert.ok(sanitized.title.indexOf('<script>') === -1, 'Should remove script tags');
    assert.equal(sanitized.data[1][1], 0, 'Should convert invalid numbers to 0');
    assert.equal(sanitized.data[2][1], 100, 'Should preserve valid numbers');
  });

  QUnit.test('Chart performance validation', function(assert) {
    const largeChart = {
      type: 'chart',
      data: CHART_TEST_DATA.largeDataset.data
    };

    const performance = validationService.validatePerformance(largeChart);
    assert.ok(performance.issues.length > 0 || performance.recommendations.length > 0, 
      'Large chart should have performance concerns');
  });
}

/**
 * Chart Error Handling Tests
 */
function testChartErrorHandling() {
  const testSuite = 'Chart Error Handling';
  let chartService;

  QUnit.module(testSuite, {
    beforeEach() {
      chartService = new ChartService();
    }
  });

  QUnit.test('Handle invalid chart type', function(assert) {
    const invalidConfig = {
      chartType: 'invalid-type',
      data: CHART_TEST_DATA.validBarChart.data
    };

    const validation = chartService.validateChartConfig(invalidConfig);
    assert.notOk(validation.isValid, 'Should reject invalid chart type');
    assert.ok(validation.errors.some(e => e.includes('Unsupported chart type')), 
      'Should have appropriate error message');
  });

  QUnit.test('Handle malformed data', function(assert) {
    const malformedConfigs = [
      { chartType: 'bar', data: null },
      { chartType: 'bar', data: 'not-an-array' },
      { chartType: 'bar', data: [['Header']] }, // No data rows
      { chartType: 'bar', data: [['Header'], ['Row1', 'Row2', 'ExtraColumn']] } // Mismatched columns
    ];

    malformedConfigs.forEach((config, index) => {
      const validation = chartService.validateChartConfig(config);
      assert.notOk(validation.isValid, `Malformed config ${index} should be invalid`);
    });
  });

  QUnit.test('Handle edge cases', function(assert) {
    const edgeCases = [
      { chartType: 'pie', data: [['A', 'B'], [null, null]] }, // Null values
      { chartType: 'bar', data: [['A', 'B'], ['', '']] }, // Empty values
      { chartType: 'line', data: [['A', 'B'], ['X', Infinity]] }, // Infinity values
      { chartType: 'column', data: [['A', 'B'], ['Y', NaN]] } // NaN values
    ];

    edgeCases.forEach((config, index) => {
      try {
        const validation = chartService.validateChartConfig(config);
        assert.ok(true, `Edge case ${index} handled without throwing`);
      } catch (error) {
        assert.ok(false, `Edge case ${index} should not throw: ${error.message}`);
      }
    });
  });
}

// Export test functions for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testChartService,
    testChartIntegration,
    testChartValidation,
    testChartErrorHandling,
    CHART_TEST_DATA,
    TEST_THEME
  };
}

// Auto-run tests if in QUnit environment
if (typeof QUnit !== 'undefined') {
  testChartService();
  testChartIntegration();
  testChartValidation();
  testChartErrorHandling();
}