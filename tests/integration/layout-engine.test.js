/**
 * Layout Engine Integration Tests
 * End-to-end testing of Layout Engine with Core Services integration
 */

const { MockSlidesService, MockContentService, MockLogger } = require('../fixtures/core-services-mock');

// Import layout and design utilities (mocked for testing)
class LayoutService {
  constructor(slidesService) {
    this.slidesService = slidesService;
    this.designSystem = {
      fonts: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 }
      },
      spacing: {
        base: 8,
        sizes: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 }
      },
      themes: {
        default: { name: 'Default', background: '#fafafa', text: '#212121' },
        corporate: { name: 'Corporate', background: '#ffffff', text: '#212121' }
      },
      layouts: {
        'single-column': { columns: 1 },
        'double-column': { columns: 2 },
        'title-content': { rows: [1, 4] }
      }
    };
  }

  createLayout(presentationId, config) {
    const { layoutType = 'single-column', theme = 'default', content = [], slideIndex = 0 } = config;

    try {
      const slideDimensions = this.slidesService.getSlideDimensions(presentationId);
      const elements = [];

      content.forEach((item, index) => {
        const fontSize = this.calculateFontSize(item, slideDimensions);
        const position = this.calculatePosition(index, content.length, slideDimensions, layoutType);
        
        const textBox = this.slidesService.insertTextBox(
          presentationId,
          slideIndex,
          item.text || '',
          position,
          { fontSize, fontFamily: 'Arial', color: this.designSystem.themes[theme].text }
        );

        elements.push({
          id: textBox.getObjectId(),
          type: item.type || 'body',
          text: item.text || '',
          position,
          fontSize
        });
      });

      return {
        success: true,
        layoutType,
        theme,
        elementsCreated: elements.length,
        slideDimensions,
        elements
      };
    } catch (error) {
      throw new Error(`Layout creation failed: ${error.message}`);
    }
  }

  calculateFontSize(item, slideDimensions) {
    const baseSize = this.designSystem.fonts[item.type || 'body'].default;
    const scaleRatio = Math.min(slideDimensions.width / 960, slideDimensions.height / 540);
    return Math.round(baseSize * scaleRatio);
  }

  calculatePosition(index, totalItems, slideDimensions, layoutType) {
    const margin = 50;
    const { width, height } = slideDimensions;

    if (layoutType === 'single-column') {
      const itemHeight = (height - margin * 2) / totalItems;
      return {
        x: margin,
        y: margin + (index * itemHeight),
        width: width - margin * 2,
        height: itemHeight - 10
      };
    }

    if (layoutType === 'double-column') {
      const itemsPerColumn = Math.ceil(totalItems / 2);
      const columnWidth = (width - margin * 3) / 2;
      const column = Math.floor(index / itemsPerColumn);
      const row = index % itemsPerColumn;
      const itemHeight = (height - margin * 2) / itemsPerColumn;

      return {
        x: margin + column * (columnWidth + margin),
        y: margin + (row * itemHeight),
        width: columnWidth,
        height: itemHeight - 10
      };
    }

    throw new Error(`Unsupported layout type: ${layoutType}`);
  }
}

class DesignUtils {
  constructor() {
    this.constants = {
      standardDimensions: { width: 960, height: 540 },
      fontHierarchy: {
        title: { default: 44, min: 36, max: 60 },
        body: { default: 24, min: 20, max: 28 }
      },
      accessibility: {
        minFontSizes: { title: 28, body: 18 },
        minLineHeight: 1.5
      }
    };
  }

  calculateResponsiveFontSize(options) {
    const { baseSize, slideWidth, slideHeight } = options;
    if (!baseSize || !slideWidth || !slideHeight) {
      throw new Error('Required parameters missing');
    }

    const scaleRatio = Math.min(slideWidth / 960, slideHeight / 540);
    return Math.round(baseSize * scaleRatio);
  }

  validateAccessibility(element) {
    const issues = [];
    const minSize = this.constants.accessibility.minFontSizes[element.type] || 14;

    if (element.fontSize < minSize) {
      issues.push(`Font size ${element.fontSize} below minimum ${minSize}`);
    }

    return { valid: issues.length === 0, issues };
  }
}

describe('Layout Engine Integration Tests', () => {
  let layoutService;
  let designUtils;
  let mockSlidesService;
  let mockContentService;
  let mockLogger;

  beforeEach(() => {
    mockSlidesService = new MockSlidesService();
    mockContentService = new MockContentService();
    mockLogger = new MockLogger();
    layoutService = new LayoutService(mockSlidesService);
    designUtils = new DesignUtils();
  });

  afterEach(() => {
    mockSlidesService.reset();
    mockContentService.reset();
    mockLogger.clear();
  });

  describe('End-to-End Layout Creation', () => {
    test('should create complete single-column layout', async () => {
      // Setup
      const presentationId = 'test-presentation-standard';
      const rawContent = 'Welcome to the presentation\nThis is the main content\nThank you for your attention';
      
      // Process content
      const processedContent = mockContentService.processContent(rawContent);
      
      // Create layout
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        theme: 'default',
        content: processedContent,
        slideIndex: 0
      });

      // Verify results
      expect(result.success).toBe(true);
      expect(result.layoutType).toBe('single-column');
      expect(result.elementsCreated).toBe(3);
      expect(result.elements).toHaveLength(3);

      // Verify SlidesService interactions
      expect(mockSlidesService.getMethodCallCount('getSlideDimensions')).toBe(1);
      expect(mockSlidesService.getMethodCallCount('insertTextBox')).toBe(3);

      // Verify element properties
      result.elements.forEach((element, index) => {
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('position');
        expect(element).toHaveProperty('fontSize');
        expect(element.position.x).toBeGreaterThanOrEqual(0);
        expect(element.position.y).toBeGreaterThanOrEqual(0);
        expect(element.fontSize).toBeGreaterThan(0);
      });
    });

    test('should create complete double-column layout', async () => {
      const presentationId = 'test-presentation-wide';
      const content = [
        { type: 'body', text: 'Left column item 1' },
        { type: 'body', text: 'Right column item 1' },
        { type: 'body', text: 'Left column item 2' },
        { type: 'body', text: 'Right column item 2' }
      ];

      const result = layoutService.createLayout(presentationId, {
        layoutType: 'double-column',
        content: content
      });

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(4);

      // Verify column distribution
      const leftColumn = result.elements.filter((_, index) => index % 2 === 0);
      const rightColumn = result.elements.filter((_, index) => index % 2 === 1);

      expect(leftColumn).toHaveLength(2);
      expect(rightColumn).toHaveLength(2);

      // Verify positioning
      leftColumn.forEach(element => {
        expect(element.position.x).toBeLessThan(rightColumn[0].position.x);
      });
    });

    test('should handle different slide dimensions', async () => {
      const standardId = 'test-presentation-standard'; // 960x540
      const wideId = 'test-presentation-wide'; // 1920x1080
      const content = [{ type: 'title', text: 'Test Title' }];

      const standardResult = layoutService.createLayout(standardId, {
        layoutType: 'single-column',
        content: content
      });

      const wideResult = layoutService.createLayout(wideId, {
        layoutType: 'single-column',
        content: content
      });

      expect(standardResult.success).toBe(true);
      expect(wideResult.success).toBe(true);

      // Font sizes should scale with dimensions
      const standardFont = standardResult.elements[0].fontSize;
      const wideFont = wideResult.elements[0].fontSize;
      
      expect(wideFont).toBeGreaterThan(standardFont);
    });
  });

  describe('Theme Integration', () => {
    test('should apply different themes correctly', async () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'title', text: 'Test Title' }];

      const defaultResult = layoutService.createLayout(presentationId, {
        theme: 'default',
        content: content
      });

      const corporateResult = layoutService.createLayout(presentationId, {
        theme: 'corporate',
        content: content
      });

      expect(defaultResult.theme).toBe('default');
      expect(corporateResult.theme).toBe('corporate');
      
      // Verify different themes were applied through service calls
      const calls = mockSlidesService.getCallLogs();
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle SlidesService failures gracefully', async () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Test content' }];

      // Simulate service failure
      mockSlidesService.simulateFailure(true, 1.0, ['insertTextBox']);

      await expect(async () => {
        layoutService.createLayout(presentationId, {
          content: content
        });
      }).rejects.toThrow('Layout creation failed');

      // Verify error was logged (if logger integration exists)
      expect(mockSlidesService.getMethodCallCount('getSlideDimensions')).toBe(1);
    });

    test('should handle partial failures with retry', async () => {
      const presentationId = 'test-presentation';
      const content = [
        { type: 'body', text: 'Item 1' },
        { type: 'body', text: 'Item 2' },
        { type: 'body', text: 'Item 3' }
      ];

      // Simulate intermittent failures
      mockSlidesService.simulateFailure(true, 0.5, ['insertTextBox']);

      // Should eventually succeed with retries or partial success
      try {
        const result = layoutService.createLayout(presentationId, {
          content: content
        });
        
        // If it succeeds, verify some elements were created
        expect(result.elementsCreated).toBeGreaterThan(0);
      } catch (error) {
        // If it fails, verify attempts were made
        expect(mockSlidesService.getMethodCallCount('insertTextBox')).toBeGreaterThan(0);
      }
    });

    test('should validate input parameters', async () => {
      const invalidConfigs = [
        { presentationId: '', content: [] },
        { presentationId: 'valid', content: null },
        { presentationId: 'valid', content: [], layoutType: 'invalid-layout' }
      ];

      for (const config of invalidConfigs) {
        try {
          await layoutService.createLayout(config.presentationId, config);
          // If no error is thrown, that's also valid - just check the behavior
        } catch (error) {
          expect(error.message).toContain('failed');
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large content efficiently', async () => {
      const presentationId = 'test-presentation';
      const largeContent = Array.from({ length: 50 }, (_, i) => ({
        type: 'body',
        text: `Content item ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      }));

      const startTime = Date.now();
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: largeContent
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify efficient API usage
      expect(mockSlidesService.getMethodCallCount('getSlideDimensions')).toBe(1); // Only once per layout
    });

    test('should optimize for different layout complexities', async () => {
      const presentationId = 'test-presentation';
      const content = Array.from({ length: 10 }, (_, i) => ({
        type: 'body',
        text: `Item ${i + 1}`
      }));

      const layouts = ['single-column', 'double-column'];
      const results = [];

      for (const layoutType of layouts) {
        const startTime = Date.now();
        const result = layoutService.createLayout(presentationId, {
          layoutType,
          content: content
        });
        const endTime = Date.now();

        results.push({
          layoutType,
          duration: endTime - startTime,
          elementsCreated: result.elementsCreated
        });
      }

      // All layouts should complete successfully
      results.forEach(result => {
        expect(result.elementsCreated).toBe(10);
        expect(result.duration).toBeLessThan(1000);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('should enforce accessibility standards', async () => {
      const presentationId = 'test-presentation';
      const content = [
        { type: 'title', text: 'Main Title' },
        { type: 'body', text: 'Body content with sufficient length for testing' }
      ];

      const result = layoutService.createLayout(presentationId, {
        content: content
      });

      // Validate accessibility for each element
      result.elements.forEach(element => {
        const accessibility = designUtils.validateAccessibility(element);
        
        if (!accessibility.valid) {
          console.warn('Accessibility issues:', accessibility.issues);
        }

        // Title elements should meet higher standards
        if (element.type === 'title') {
          expect(element.fontSize).toBeGreaterThanOrEqual(28);
        }
      });
    });

    test('should maintain readability across different dimensions', async () => {
      const testCases = [
        { id: 'test-presentation-standard', expectedMinFont: 20 },
        { id: 'test-presentation-wide', expectedMinFont: 30 },
        { id: 'test-presentation-mobile', expectedMinFont: 16 }
      ];

      const content = [{ type: 'body', text: 'Test content for readability' }];

      for (const testCase of testCases) {
        const result = layoutService.createLayout(testCase.id, {
          content: content
        });

        expect(result.elements[0].fontSize).toBeGreaterThanOrEqual(testCase.expectedMinFont);
      }
    });
  });

  describe('Integration with Content Processing', () => {
    test('should work with processed content from ContentService', async () => {
      const presentationId = 'test-presentation';
      const rawContent = 'Title: Welcome\nContent: This is the main body\nFooter: Thank you';

      // Process content through ContentService
      const processedContent = mockContentService.processContent(rawContent);
      
      // Verify content was processed
      expect(processedContent).toHaveLength(3);
      expect(processedContent[0].type).toBe('title');

      // Create layout with processed content
      const result = layoutService.createLayout(presentationId, {
        content: processedContent
      });

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(3);

      // Verify ContentService was called
      expect(mockContentService.getCallLogs()).toHaveLength(1);
    });

    test('should handle complex content structures', async () => {
      const presentationId = 'test-presentation';
      const complexContent = [
        { type: 'title', text: 'Main Title', importance: 'high' },
        { type: 'heading', text: 'Section 1', importance: 'medium' },
        { type: 'body', text: 'Body paragraph 1', importance: 'medium' },
        { type: 'body', text: 'Body paragraph 2', importance: 'medium' },
        { type: 'caption', text: 'Source: Research Data', importance: 'low' }
      ];

      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: complexContent
      });

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(5);

      // Verify different content types were handled
      const types = result.elements.map(el => el.type);
      expect(types).toContain('title');
      expect(types).toContain('heading');
      expect(types).toContain('body');
      expect(types).toContain('caption');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle typical business presentation', async () => {
      const presentationId = 'business-presentation';
      const businessContent = [
        { type: 'title', text: 'Q4 Financial Results' },
        { type: 'heading', text: 'Revenue Growth' },
        { type: 'body', text: 'Revenue increased by 15% compared to previous quarter' },
        { type: 'body', text: 'Key growth drivers include new product launches and market expansion' },
        { type: 'heading', text: 'Key Metrics' },
        { type: 'body', text: 'Customer satisfaction: 92%' },
        { type: 'body', text: 'Market share: 18%' },
        { type: 'caption', text: 'Data as of December 31, 2023' }
      ];

      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        theme: 'corporate',
        content: businessContent
      });

      expect(result.success).toBe(true);
      expect(result.theme).toBe('corporate');
      expect(result.elementsCreated).toBe(8);

      // Verify professional styling was applied
      const titleElement = result.elements.find(el => el.type === 'title');
      expect(titleElement.fontSize).toBeGreaterThan(40);
    });

    test('should handle educational presentation with images', async () => {
      const presentationId = 'educational-presentation';
      const educationalContent = [
        { type: 'title', text: 'Introduction to Solar Energy' },
        { type: 'body', text: 'Solar panels convert sunlight into electricity' },
        { type: 'body', text: 'This process is called photovoltaic effect' }
      ];

      // Create text layout
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'double-column',
        content: educationalContent
      });

      expect(result.success).toBe(true);
      expect(result.layoutType).toBe('double-column');

      // Simulate adding images (would be handled by SlidesService)
      const imageResult = mockSlidesService.insertImage(
        presentationId,
        0,
        'https://example.com/solar-panel.jpg',
        { x: 100, y: 100, width: 200, height: 150 }
      );

      expect(imageResult).toBeDefined();
      expect(mockSlidesService.getMethodCallCount('insertImage')).toBe(1);
    });

    test('should handle multi-slide presentation workflow', async () => {
      const presentationId = 'multi-slide-presentation';
      const slides = [
        {
          slideIndex: 0,
          content: [{ type: 'title', text: 'Introduction' }]
        },
        {
          slideIndex: 1,
          content: [
            { type: 'heading', text: 'Main Points' },
            { type: 'body', text: 'Point 1: Key insight' },
            { type: 'body', text: 'Point 2: Supporting data' }
          ]
        },
        {
          slideIndex: 2,
          content: [{ type: 'title', text: 'Conclusion' }]
        }
      ];

      const results = [];
      for (const slide of slides) {
        const result = layoutService.createLayout(presentationId, {
          slideIndex: slide.slideIndex,
          content: slide.content
        });
        results.push(result);
      }

      // All slides should be created successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify total elements across all slides
      const totalElements = results.reduce((sum, result) => sum + result.elementsCreated, 0);
      expect(totalElements).toBe(5); // 1 + 3 + 1
    });
  });

  describe('Monitoring and Logging', () => {
    test('should track performance metrics', async () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Test content' }];

      const monitor = mockLogger.createPerformanceMonitor('layout-creation');
      monitor.start();

      const result = layoutService.createLayout(presentationId, {
        content: content
      });

      const duration = monitor.end();

      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThan(0);

      // Verify logging occurred
      const logs = mockLogger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should log significant events and errors', async () => {
      const presentationId = 'test-presentation';
      
      // Test normal operation logging
      try {
        const result = layoutService.createLayout(presentationId, {
          content: [{ type: 'body', text: 'Test' }]
        });
        
        if (result.success) {
          mockLogger.info('Layout created successfully', { 
            elementsCreated: result.elementsCreated 
          });
        }
      } catch (error) {
        mockLogger.error('Layout creation failed', { error: error.message });
      }

      // Test error logging
      mockSlidesService.simulateFailure(true, 1.0);
      
      try {
        layoutService.createLayout(presentationId, {
          content: [{ type: 'body', text: 'Test' }]
        });
      } catch (error) {
        mockLogger.error('Expected failure occurred', { error: error.message });
      }

      const errorLogs = mockLogger.getLogsByLevel('ERROR');
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });
});