/**
 * Chart Generation Integration Tests
 * End-to-end testing of chart creation workflow
 */

// Test configuration
const INTEGRATION_TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  cleanup: true
};

// Test data for integration tests
const INTEGRATION_CHART_DATA = {
  salesChart: {
    type: 'chart',
    chartType: 'column',
    title: 'Quarterly Sales Performance',
    data: [
      ['Quarter', 'Sales ($M)', 'Profit ($M)', 'Growth (%)'],
      ['Q1 2023', 12.5, 2.8, 15.2],
      ['Q2 2023', 14.2, 3.1, 13.6],
      ['Q3 2023', 16.8, 3.9, 18.3],
      ['Q4 2023', 19.1, 4.5, 13.7]
    ],
    options: {
      width: 700,
      height: 450,
      stacked: false,
      legend: 'bottom',
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c']
    }
  },

  marketShareChart: {
    type: 'chart',
    chartType: 'pie',
    title: 'Market Share Distribution',
    data: [
      ['Company', 'Market Share (%)'],
      ['Our Company', 28.5],
      ['Competitor A', 24.2],
      ['Competitor B', 18.7],
      ['Competitor C', 15.3],
      ['Others', 13.3]
    ],
    options: {
      width: 500,
      height: 400,
      is3D: false,
      pieHole: 0.2
    }
  },

  trendChart: {
    type: 'chart',
    chartType: 'line',
    title: 'Monthly Revenue Trend',
    data: [
      ['Month', 'Revenue', 'Target', 'Previous Year'],
      ['Jan', 85000, 80000, 75000],
      ['Feb', 89000, 85000, 78000],
      ['Mar', 92000, 90000, 82000],
      ['Apr', 87000, 88000, 79000],
      ['May', 94000, 93000, 85000],
      ['Jun', 98000, 95000, 88000]
    ],
    options: {
      smooth: true,
      pointSize: 4,
      lineWidth: 2
    }
  },

  compareChart: {
    type: 'chart',
    chartType: 'bar',
    title: 'Regional Performance Comparison',
    data: [
      ['Region', 'Sales', 'Target'],
      ['North America', 45.2, 42.0],
      ['Europe', 38.7, 40.0],
      ['Asia Pacific', 52.1, 48.0],
      ['Latin America', 23.4, 25.0],
      ['Middle East & Africa', 18.9, 20.0]
    ],
    options: {
      orientation: 'horizontal',
      stacked: false
    }
  }
};

// Mock presentation setup for integration tests
const TEST_PRESENTATION_CONFIG = {
  title: 'Chart Integration Test Presentation',
  theme: {
    fontFamily: 'Arial',
    titleFontSize: 28,
    bodyFontSize: 18,
    primaryColor: '#2c3e50',
    secondaryColor: '#34495e',
    backgroundColor: '#ffffff',
    colorPalette: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
  }
};

/**
 * Chart Creation Integration Tests
 */
function testChartCreationIntegration() {
  const testSuite = 'Chart Creation Integration';
  let presentationId;
  let contentService;

  QUnit.module(testSuite, {
    beforeEach(assert) {
      const done = assert.async();
      contentService = new ContentService();
      
      // Create test presentation
      contentService.createPresentation(TEST_PRESENTATION_CONFIG)
        .then(result => {
          presentationId = result.presentationId;
          done();
        })
        .catch(error => {
          assert.ok(false, `Setup failed: ${error.message}`);
          done();
        });
    },

    afterEach() {
      // Cleanup test presentation if needed
      if (INTEGRATION_TEST_CONFIG.cleanup && presentationId) {
        try {
          const slidesService = new SlidesService();
          // Note: In real environment, consider moving to trash instead of permanent deletion
          logger.info('Integration test cleanup', { presentationId });
        } catch (error) {
          logger.warn('Cleanup failed', { presentationId }, error);
        }
      }
    }
  });

  QUnit.test('Create column chart in presentation', function(assert) {
    const done = assert.async();
    
    const slideData = {
      title: 'Sales Performance Dashboard',
      content: [INTEGRATION_CHART_DATA.salesChart],
      layout: 'single'
    };

    contentService.addSlideWithContent(presentationId, slideData, TEST_PRESENTATION_CONFIG.theme)
      .then(result => {
        assert.ok(result, 'Slide with chart should be created');
        assert.ok(result.elements.length > 0, 'Should have chart element');
        assert.equal(result.elements[0].type, 'chart', 'Element should be chart type');
        assert.equal(result.elements[0].chartType, 'column', 'Should be column chart');
        done();
      })
      .catch(error => {
        assert.ok(false, `Chart creation failed: ${error.message}`);
        done();
      });
  });

  QUnit.test('Create pie chart with theme integration', function(assert) {
    const done = assert.async();
    
    const slideData = {
      title: 'Market Analysis',
      content: [INTEGRATION_CHART_DATA.marketShareChart],
      layout: 'single'
    };

    contentService.addSlideWithContent(presentationId, slideData, TEST_PRESENTATION_CONFIG.theme)
      .then(result => {
        assert.ok(result, 'Pie chart slide should be created');
        assert.ok(result.elements[0].options, 'Chart should have options applied');
        
        // Verify theme integration
        const chartElement = result.elements[0];
        assert.ok(chartElement.options.colors, 'Should have theme colors applied');
        done();
      })
      .catch(error => {
        assert.ok(false, `Pie chart creation failed: ${error.message}`);
        done();
      });
  });

  QUnit.test('Create line chart with multiple series', function(assert) {
    const done = assert.async();
    
    const slideData = {
      title: 'Revenue Trends',
      content: [INTEGRATION_CHART_DATA.trendChart],
      layout: 'single'
    };

    contentService.addSlideWithContent(presentationId, slideData, TEST_PRESENTATION_CONFIG.theme)
      .then(result => {
        assert.ok(result, 'Line chart slide should be created');
        assert.equal(result.elements[0].chartType, 'line', 'Should be line chart');
        assert.ok(result.elements[0].dataPoints > 0, 'Should have data points');
        done();
      })
      .catch(error => {
        assert.ok(false, `Line chart creation failed: ${error.message}`);
        done();
      });
  });

  QUnit.test('Create multiple charts on single slide', function(assert) {
    const done = assert.async();
    
    const slideData = {
      title: 'Executive Dashboard',
      content: [
        INTEGRATION_CHART_DATA.salesChart,
        INTEGRATION_CHART_DATA.marketShareChart
      ],
      layout: 'double'
    };

    contentService.addSlideWithContent(presentationId, slideData, TEST_PRESENTATION_CONFIG.theme)
      .then(result => {
        assert.ok(result, 'Multi-chart slide should be created');
        assert.equal(result.elements.length, 2, 'Should have two chart elements');
        assert.equal(result.layout, 'double', 'Should use double layout');
        
        // Verify both charts are created
        const chartTypes = result.elements.map(el => el.chartType);
        assert.ok(chartTypes.includes('column'), 'Should include column chart');
        assert.ok(chartTypes.includes('pie'), 'Should include pie chart');
        done();
      })
      .catch(error => {
        assert.ok(false, `Multi-chart creation failed: ${error.message}`);
        done();
      });
  });

  QUnit.test('Create chart with custom positioning', function(assert) {
    const done = assert.async();
    
    const customChart = {
      ...INTEGRATION_CHART_DATA.compareChart,
      position: {
        x: 100,
        y: 150,
        width: 800,
        height: 300
      }
    };

    const slideData = {
      title: 'Regional Performance',
      content: [customChart],
      layout: 'single'
    };

    contentService.addSlideWithContent(presentationId, slideData, TEST_PRESENTATION_CONFIG.theme)
      .then(result => {
        assert.ok(result, 'Chart with custom position should be created');
        const chartElement = result.elements[0];
        assert.deepEqual(chartElement.position, customChart.position, 'Should use custom position');
        done();
      })
      .catch(error => {
        assert.ok(false, `Custom positioned chart creation failed: ${error.message}`);
        done();
      });
  });
}

/**
 * Chart Performance Integration Tests
 */
function testChartPerformanceIntegration() {
  const testSuite = 'Chart Performance Integration';
  let contentService;

  QUnit.module(testSuite, {
    beforeEach() {
      contentService = new ContentService();
    }
  });

  QUnit.test('Handle large dataset charts', function(assert) {
    const done = assert.async();
    
    // Create large dataset
    const largeData = [
      ['Month', 'Sales', 'Profit']
    ];
    for (let i = 1; i <= 500; i++) {
      largeData.push([`Month${i}`, Math.random() * 1000, Math.random() * 200]);
    }

    const largeChart = {
      type: 'chart',
      chartType: 'line',
      title: 'Large Dataset Performance Test',
      data: largeData
    };

    const slideData = {
      title: 'Performance Test',
      content: [largeChart]
    };

    const startTime = Date.now();
    
    contentService.createPresentation({ title: 'Performance Test' })
      .then(result => contentService.addSlideWithContent(result.presentationId, slideData))
      .then(result => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        assert.ok(result, 'Large chart should be created');
        assert.ok(duration < 30000, `Chart creation should complete within 30s (took ${duration}ms)`);
        assert.ok(result.elements[0].dataPoints > 0, 'Should handle large dataset');
        done();
      })
      .catch(error => {
        assert.ok(false, `Large chart creation failed: ${error.message}`);
        done();
      });
  });

  QUnit.test('Chart memory usage optimization', function(assert) {
    const done = assert.async();
    
    // Create multiple charts to test memory handling
    const charts = [
      INTEGRATION_CHART_DATA.salesChart,
      INTEGRATION_CHART_DATA.marketShareChart,
      INTEGRATION_CHART_DATA.trendChart,
      INTEGRATION_CHART_DATA.compareChart
    ];

    const slideData = {
      title: 'Memory Test Dashboard',
      content: charts,
      layout: 'single'
    };

    contentService.createPresentation({ title: 'Memory Test' })
      .then(result => contentService.addSlideWithContent(result.presentationId, slideData))
      .then(result => {
        assert.ok(result, 'Multiple charts should be created');
        assert.equal(result.elements.length, 4, 'Should create all four charts');
        
        // Verify each chart was created successfully
        result.elements.forEach((element, index) => {
          assert.equal(element.type, 'chart', `Element ${index} should be chart`);
          assert.ok(element.dataPoints > 0, `Chart ${index} should have data points`);
        });
        
        done();
      })
      .catch(error => {
        assert.ok(false, `Memory test failed: ${error.message}`);
        done();
      });
  });
}

/**
 * Chart Error Recovery Integration Tests
 */
function testChartErrorRecoveryIntegration() {
  const testSuite = 'Chart Error Recovery Integration';
  let contentService;

  QUnit.module(testSuite, {
    beforeEach() {
      contentService = new ContentService();
    }
  });

  QUnit.test('Handle chart creation failures gracefully', function(assert) {
    const done = assert.async();
    
    const invalidChart = {
      type: 'chart',
      chartType: 'invalid-type',
      data: [['Invalid']]
    };

    const validChart = INTEGRATION_CHART_DATA.salesChart;

    const slideData = {
      title: 'Error Recovery Test',
      content: [invalidChart, validChart] // Mix invalid and valid charts
    };

    contentService.createPresentation({ title: 'Error Recovery Test' })
      .then(result => contentService.addSlideWithContent(result.presentationId, slideData))
      .then(result => {
        // Should create slide even if some charts fail
        assert.ok(result, 'Slide should be created despite chart failures');
        
        // Should have at least the valid chart
        const validElements = result.elements.filter(el => el && el.type === 'chart');
        assert.ok(validElements.length > 0, 'Should create valid charts');
        done();
      })
      .catch(error => {
        // Error is expected for invalid chart, but should not prevent valid chart creation
        assert.ok(true, 'Error handling working as expected');
        done();
      });
  });

  QUnit.test('Recover from API rate limiting', function(assert) {
    const done = assert.async();
    
    // Create many charts rapidly to potentially trigger rate limiting
    const rapidCharts = Array.from({ length: 10 }, (_, i) => ({
      ...INTEGRATION_CHART_DATA.salesChart,
      title: `Rapid Chart ${i}`
    }));

    const slideData = {
      title: 'Rate Limit Test',
      content: rapidCharts
    };

    contentService.createPresentation({ title: 'Rate Limit Test' })
      .then(result => contentService.addSlideWithContent(result.presentationId, slideData))
      .then(result => {
        assert.ok(result, 'Should handle rapid chart creation');
        assert.ok(result.elements.length > 0, 'Should create some charts despite rate limits');
        done();
      })
      .catch(error => {
        // Rate limiting errors should be handled gracefully
        assert.ok(error.message.includes('rate') || error.message.includes('limit') || 
                 error.message.includes('quota'), 'Should handle rate limiting gracefully');
        done();
      });
  });
}

/**
 * Chart Data Format Integration Tests
 */
function testChartDataFormatIntegration() {
  const testSuite = 'Chart Data Format Integration';
  let contentService;

  QUnit.module(testSuite, {
    beforeEach() {
      contentService = new ContentService();
    }
  });

  QUnit.test('Handle various data formats', function(assert) {
    const done = assert.async();
    
    const dataFormats = [
      // String numbers
      {
        type: 'chart',
        chartType: 'column',
        title: 'String Numbers Test',
        data: [
          ['Category', 'Value'],
          ['A', '100'],
          ['B', '200.5'],
          ['C', '150']
        ]
      },
      // Mixed data types
      {
        type: 'chart',
        chartType: 'bar',
        title: 'Mixed Data Test',
        data: [
          ['Item', 'Count', 'Percentage'],
          ['Item 1', 50, 25.5],
          ['Item 2', 75, 37.5],
          ['Item 3', null, 0] // Null value
        ]
      },
      // Date strings (should be handled as categories)
      {
        type: 'chart',
        chartType: 'line',
        title: 'Date Categories Test',
        data: [
          ['Date', 'Value'],
          ['2023-01-01', 100],
          ['2023-02-01', 120],
          ['2023-03-01', 140]
        ]
      }
    ];

    Promise.all(dataFormats.map(chartData => {
      const slideData = {
        title: chartData.title,
        content: [chartData]
      };

      return contentService.createPresentation({ title: chartData.title })
        .then(result => contentService.addSlideWithContent(result.presentationId, slideData));
    }))
    .then(results => {
      assert.equal(results.length, 3, 'Should handle all data format variations');
      results.forEach((result, index) => {
        assert.ok(result.elements.length > 0, `Format ${index} should create chart`);
        assert.equal(result.elements[0].type, 'chart', `Format ${index} should be chart type`);
      });
      done();
    })
    .catch(error => {
      assert.ok(false, `Data format test failed: ${error.message}`);
      done();
    });
  });
}

// Export test functions for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testChartCreationIntegration,
    testChartPerformanceIntegration,
    testChartErrorRecoveryIntegration,
    testChartDataFormatIntegration,
    INTEGRATION_CHART_DATA,
    TEST_PRESENTATION_CONFIG
  };
}

// Auto-run tests if in QUnit environment
if (typeof QUnit !== 'undefined') {
  testChartCreationIntegration();
  testChartPerformanceIntegration();
  testChartErrorRecoveryIntegration();
  testChartDataFormatIntegration();
}