/**
 * LayoutService Unit Tests
 * Comprehensive testing for layout management and responsive design
 */

const { MockSlidesService, MockLogger } = require('../fixtures/core-services-mock');

// Mock LayoutService for testing
class LayoutService {
  constructor(slidesService) {
    this.slidesService = slidesService;
    this.designSystem = this.initializeDesignSystem();
  }

  initializeDesignSystem() {
    return {
      fonts: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        subheading: { default: 28, min: 24, max: 32 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 },
        footnote: { default: 16, min: 14, max: 18 }
      },
      spacing: {
        base: 8,
        sizes: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
        slideMargins: {
          standard: { top: 48, right: 64, bottom: 48, left: 64 },
          wide: { top: 80, right: 120, bottom: 80, left: 120 }
        }
      },
      colors: {
        primary: { 50: '#e3f2fd', 500: '#2196f3', 700: '#1976d2', 900: '#0d47a1' },
        gray: { 50: '#fafafa', 200: '#eeeeee', 500: '#9e9e9e', 800: '#424242', 900: '#212121' },
        text: { primary: '#212121', secondary: '#757575', inverse: '#ffffff' }
      },
      themes: {
        default: {
          name: 'Default',
          background: '#fafafa',
          surface: '#ffffff',
          primary: '#2196f3',
          text: '#212121',
          textSecondary: '#757575'
        },
        corporate: {
          name: 'Corporate',
          background: '#ffffff',
          surface: '#f5f5f5',
          primary: '#1565c0',
          text: '#212121',
          textSecondary: '#757575'
        }
      },
      layouts: {
        'single-column': { columns: 1, description: 'Single column layout' },
        'double-column': { columns: 2, description: 'Two column layout' },
        'title-content': { rows: [1, 4], description: 'Title and content layout' },
        'three-column': { columns: 3, description: 'Three column layout' }
      }
    };
  }

  calculateResponsiveMargins(slideWidth, slideHeight) {
    const standardWidth = 960;
    const standardHeight = 540;
    
    const scaleX = slideWidth / standardWidth;
    const scaleY = slideHeight / standardHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const baseMargin = this.designSystem.spacing.sizes.xl;
    
    return {
      top: Math.round(baseMargin * scale),
      right: Math.round(baseMargin * scale * 1.3),
      bottom: Math.round(baseMargin * scale),
      left: Math.round(baseMargin * scale * 1.3)
    };
  }

  createGridSystem(slideDimensions, layoutType) {
    const { width, height } = slideDimensions;
    const margins = this.calculateResponsiveMargins(width, height);
    const layoutConfig = this.designSystem.layouts[layoutType];

    const contentWidth = width - margins.left - margins.right;
    const contentHeight = height - margins.top - margins.bottom;
    const gutter = this.designSystem.spacing.sizes.md;

    let columns = layoutConfig.columns || 1;
    let rows = layoutConfig.rows || 'auto';

    const columnWidth = (contentWidth - (gutter * (columns - 1))) / columns;

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      margins,
      gutter,
      columns,
      rows,
      columnWidth,
      
      getColumnPosition: (startCol, spanCols = 1) => {
        const x = margins.left + ((startCol - 1) * (columnWidth + gutter));
        const width = (columnWidth * spanCols) + (gutter * (spanCols - 1));
        return { x, width };
      },

      getRowPosition: (startRow, spanRows = 1, totalRows = 1) => {
        const availableHeight = contentHeight;
        const rowHeight = availableHeight / totalRows;
        const y = margins.top + ((startRow - 1) * rowHeight);
        const height = rowHeight * spanRows;
        return { y, height };
      }
    };
  }

  calculateResponsiveFontSize(options) {
    const {
      baseSize,
      slideWidth,
      slideHeight,
      contentLength = 0,
      viewingDistance = 'medium',
      importance = 'medium'
    } = options;

    if (!baseSize || !slideWidth || !slideHeight) {
      throw new Error('Required parameters: baseSize, slideWidth, slideHeight');
    }

    const standardWidth = 960;
    const standardHeight = 540;

    const widthRatio = slideWidth / standardWidth;
    const heightRatio = slideHeight / standardHeight;
    const scaleRatio = Math.min(widthRatio, heightRatio);

    const contentFactor = this.calculateContentFactor(contentLength);
    const distanceFactor = this.getDistanceFactor(viewingDistance);
    const importanceFactor = this.getImportanceFactor(importance);

    const calculatedSize = baseSize * scaleRatio * contentFactor * distanceFactor * importanceFactor;

    return Math.max(14, Math.min(72, Math.round(calculatedSize)));
  }

  calculateContentFactor(contentLength) {
    if (contentLength <= 50) return 1.0;
    if (contentLength <= 150) return 0.95;
    if (contentLength <= 300) return 0.85;
    return 0.75;
  }

  getDistanceFactor(distance) {
    const factors = { 'close': 0.9, 'medium': 1.0, 'far': 1.3 };
    return factors[distance] || 1.0;
  }

  getImportanceFactor(importance) {
    const factors = { 'high': 1.15, 'medium': 1.0, 'low': 0.9 };
    return factors[importance] || 1.0;
  }

  createLayout(presentationId, config) {
    const {
      layoutType = 'single-column',
      theme = 'default',
      content = [],
      slideIndex = 0
    } = config;

    try {
      const slideDimensions = this.slidesService.getSlideDimensions(presentationId);
      const grid = this.createGridSystem(slideDimensions, layoutType);
      const themeConfig = this.designSystem.themes[theme];

      const layoutResult = this.renderLayout(
        presentationId,
        slideIndex,
        layoutType,
        content,
        grid,
        themeConfig
      );

      return {
        success: true,
        layoutType,
        theme,
        elementsCreated: layoutResult.elements.length,
        slideDimensions,
        elements: layoutResult.elements
      };

    } catch (error) {
      throw new Error(`Layout creation failed: ${error.message}`);
    }
  }

  renderLayout(presentationId, slideIndex, layoutType, content, grid, theme) {
    const elements = [];

    switch (layoutType) {
      case 'single-column':
        elements.push(...this.renderSingleColumn(presentationId, slideIndex, content, grid, theme));
        break;
      case 'double-column':
        elements.push(...this.renderDoubleColumn(presentationId, slideIndex, content, grid, theme));
        break;
      default:
        throw new Error(`Unsupported layout type: ${layoutType}`);
    }

    return { elements };
  }

  renderSingleColumn(presentationId, slideIndex, content, grid, theme) {
    const elements = [];
    const totalItems = content.length;

    content.forEach((item, index) => {
      const rowPosition = grid.getRowPosition(index + 1, 1, totalItems);
      const columnPosition = grid.getColumnPosition(1, 1);

      const position = {
        x: columnPosition.x,
        y: rowPosition.y,
        width: columnPosition.width,
        height: rowPosition.height - this.designSystem.spacing.sizes.sm
      };

      const element = this.createContentElement(
        presentationId, 
        slideIndex, 
        item, 
        position, 
        theme,
        grid
      );
      
      elements.push(element);
    });

    return elements;
  }

  renderDoubleColumn(presentationId, slideIndex, content, grid, theme) {
    const elements = [];
    const itemsPerColumn = Math.ceil(content.length / 2);

    content.forEach((item, index) => {
      const columnIndex = Math.floor(index / itemsPerColumn);
      const rowIndex = index % itemsPerColumn;

      const columnPosition = grid.getColumnPosition(columnIndex + 1, 1);
      const rowPosition = grid.getRowPosition(rowIndex + 1, 1, itemsPerColumn);

      const position = {
        x: columnPosition.x,
        y: rowPosition.y,
        width: columnPosition.width,
        height: rowPosition.height - this.designSystem.spacing.sizes.sm
      };

      const element = this.createContentElement(
        presentationId, 
        slideIndex, 
        item, 
        position, 
        theme,
        grid
      );
      
      elements.push(element);
    });

    return elements;
  }

  createContentElement(presentationId, slideIndex, item, position, theme, grid) {
    const {
      type = 'body',
      text = '',
      importance = 'medium'
    } = item;

    const fontSize = this.calculateResponsiveFontSize({
      baseSize: this.designSystem.fonts[type].default,
      slideWidth: grid.width,
      slideHeight: grid.height,
      contentLength: text.length,
      importance
    });

    const textStyle = {
      fontFamily: 'Arial',
      fontSize: fontSize,
      color: theme.text,
      bold: ['title', 'heading'].includes(type)
    };

    const textBox = this.slidesService.insertTextBox(
      presentationId,
      slideIndex,
      text,
      position,
      textStyle
    );

    return {
      id: textBox.getObjectId(),
      type,
      text,
      position,
      style: textStyle,
      fontSize
    };
  }

  getLayoutInfo(layoutType) {
    const layout = this.designSystem.layouts[layoutType];
    if (!layout) {
      throw new Error(`Unknown layout type: ${layoutType}`);
    }

    return {
      type: layoutType,
      ...layout,
      supportedElements: ['text', 'image', 'table', 'svg'],
      accessibility: true,
      responsive: true
    };
  }
}

describe('LayoutService', () => {
  let layoutService;
  let mockSlidesService;
  let mockLogger;

  beforeEach(() => {
    mockSlidesService = new MockSlidesService();
    mockLogger = new MockLogger();
    layoutService = new LayoutService(mockSlidesService);
  });

  afterEach(() => {
    mockSlidesService.reset();
    mockLogger.clear();
  });

  describe('Design System Initialization', () => {
    test('should initialize design system with correct structure', () => {
      const designSystem = layoutService.designSystem;

      expect(designSystem).toHaveProperty('fonts');
      expect(designSystem).toHaveProperty('spacing');
      expect(designSystem).toHaveProperty('colors');
      expect(designSystem).toHaveProperty('themes');
      expect(designSystem).toHaveProperty('layouts');

      // Verify font hierarchy
      expect(designSystem.fonts.title.default).toBe(44);
      expect(designSystem.fonts.body.default).toBe(24);
      
      // Verify spacing system
      expect(designSystem.spacing.base).toBe(8);
      expect(designSystem.spacing.sizes.md).toBe(16);
    });

    test('should have complete theme configurations', () => {
      const defaultTheme = layoutService.designSystem.themes.default;
      
      expect(defaultTheme).toHaveProperty('name');
      expect(defaultTheme).toHaveProperty('background');
      expect(defaultTheme).toHaveProperty('text');
      expect(defaultTheme.text).toBe('#212121');
    });

    test('should define all layout patterns', () => {
      const layouts = layoutService.designSystem.layouts;
      
      expect(layouts).toHaveProperty('single-column');
      expect(layouts).toHaveProperty('double-column');
      expect(layouts).toHaveProperty('title-content');
      expect(layouts).toHaveProperty('three-column');
    });
  });

  describe('Responsive Margin Calculation', () => {
    test('should calculate margins for standard dimensions', () => {
      const margins = layoutService.calculateResponsiveMargins(960, 540);
      
      expect(margins.top).toBe(32);
      expect(margins.bottom).toBe(32);
      expect(margins.left).toBe(42); // 32 * 1.3
      expect(margins.right).toBe(42);
    });

    test('should scale margins for larger dimensions', () => {
      const margins = layoutService.calculateResponsiveMargins(1920, 1080);
      
      expect(margins.top).toBe(64); // 32 * 2
      expect(margins.bottom).toBe(64);
      expect(margins.left).toBe(83); // 64 * 1.3
      expect(margins.right).toBe(83);
    });

    test('should scale margins for smaller dimensions', () => {
      const margins = layoutService.calculateResponsiveMargins(480, 270);
      
      expect(margins.top).toBe(16); // 32 * 0.5
      expect(margins.bottom).toBe(16);
      expect(margins.left).toBe(21); // 16 * 1.3
      expect(margins.right).toBe(21);
    });
  });

  describe('Grid System Creation', () => {
    test('should create grid for single column layout', () => {
      const slideDimensions = { width: 960, height: 540 };
      const grid = layoutService.createGridSystem(slideDimensions, 'single-column');

      expect(grid.columns).toBe(1);
      expect(grid.width).toBe(960);
      expect(grid.height).toBe(540);
      expect(grid.contentWidth).toBe(876); // 960 - 42 - 42
      expect(grid.contentHeight).toBe(476); // 540 - 32 - 32
    });

    test('should create grid for double column layout', () => {
      const slideDimensions = { width: 960, height: 540 };
      const grid = layoutService.createGridSystem(slideDimensions, 'double-column');

      expect(grid.columns).toBe(2);
      expect(grid.columnWidth).toBe(430); // (876 - 16) / 2
    });

    test('should provide column position calculation', () => {
      const slideDimensions = { width: 960, height: 540 };
      const grid = layoutService.createGridSystem(slideDimensions, 'double-column');

      const firstColumn = grid.getColumnPosition(1, 1);
      expect(firstColumn.x).toBe(42); // left margin
      expect(firstColumn.width).toBe(430);

      const secondColumn = grid.getColumnPosition(2, 1);
      expect(secondColumn.x).toBe(488); // 42 + 430 + 16
      expect(secondColumn.width).toBe(430);
    });

    test('should provide row position calculation', () => {
      const slideDimensions = { width: 960, height: 540 };
      const grid = layoutService.createGridSystem(slideDimensions, 'single-column');

      const firstRow = grid.getRowPosition(1, 1, 3);
      expect(firstRow.y).toBe(32); // top margin
      expect(firstRow.height).toBe(158); // 476 / 3

      const secondRow = grid.getRowPosition(2, 1, 3);
      expect(secondRow.y).toBe(190); // 32 + 158
      expect(secondRow.height).toBe(158);
    });
  });

  describe('Responsive Font Size Calculation', () => {
    test('should calculate font size with required parameters', () => {
      const fontSize = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540
      });

      expect(fontSize).toBe(24); // Standard dimensions = 1.0 scale
    });

    test('should scale font size for larger slides', () => {
      const fontSize = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 1920,
        slideHeight: 1080
      });

      expect(fontSize).toBe(48); // 2x scale
    });

    test('should adjust for content length', () => {
      const shortContent = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        contentLength: 30
      });

      const longContent = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        contentLength: 400
      });

      expect(shortContent).toBeGreaterThan(longContent);
    });

    test('should adjust for viewing distance', () => {
      const closeViewing = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        viewingDistance: 'close'
      });

      const farViewing = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        viewingDistance: 'far'
      });

      expect(farViewing).toBeGreaterThan(closeViewing);
    });

    test('should adjust for importance', () => {
      const lowImportance = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        importance: 'low'
      });

      const highImportance = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        importance: 'high'
      });

      expect(highImportance).toBeGreaterThan(lowImportance);
    });

    test('should enforce minimum and maximum font sizes', () => {
      const tinyFont = layoutService.calculateResponsiveFontSize({
        baseSize: 1,
        slideWidth: 100,
        slideHeight: 100
      });

      const hugeFont = layoutService.calculateResponsiveFontSize({
        baseSize: 100,
        slideWidth: 5000,
        slideHeight: 5000
      });

      expect(tinyFont).toBeGreaterThanOrEqual(14);
      expect(hugeFont).toBeLessThanOrEqual(72);
    });

    test('should throw error for missing required parameters', () => {
      expect(() => {
        layoutService.calculateResponsiveFontSize({
          slideWidth: 960,
          slideHeight: 540
        });
      }).toThrow('Required parameters: baseSize, slideWidth, slideHeight');
    });
  });

  describe('Layout Creation', () => {
    test('should create single column layout successfully', async () => {
      const presentationId = 'test-presentation';
      const content = [
        { type: 'title', text: 'Test Title', importance: 'high' },
        { type: 'body', text: 'Test content', importance: 'medium' }
      ];

      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        theme: 'default',
        content: content,
        slideIndex: 0
      });

      expect(result.success).toBe(true);
      expect(result.layoutType).toBe('single-column');
      expect(result.elementsCreated).toBe(2);
      expect(result.elements).toHaveLength(2);

      // Verify SlidesService was called
      expect(mockSlidesService.getMethodCallCount('getSlideDimensions')).toBe(1);
      expect(mockSlidesService.getMethodCallCount('insertTextBox')).toBe(2);
    });

    test('should create double column layout successfully', () => {
      const presentationId = 'test-presentation';
      const content = [
        { type: 'body', text: 'Column 1 Item 1' },
        { type: 'body', text: 'Column 2 Item 1' },
        { type: 'body', text: 'Column 1 Item 2' },
        { type: 'body', text: 'Column 2 Item 2' }
      ];

      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      const result = layoutService.createLayout(presentationId, {
        layoutType: 'double-column',
        content: content
      });

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(4);
    });

    test('should handle layout creation errors', () => {
      const presentationId = 'test-presentation';
      
      mockSlidesService.simulateFailure(true, 1.0, ['getSlideDimensions']);

      expect(() => {
        layoutService.createLayout(presentationId, {
          layoutType: 'single-column',
          content: [{ text: 'Test' }]
        });
      }).toThrow('Layout creation failed');
    });

    test('should handle unsupported layout types', () => {
      const presentationId = 'test-presentation';
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      expect(() => {
        layoutService.createLayout(presentationId, {
          layoutType: 'unsupported-layout',
          content: [{ text: 'Test' }]
        });
      }).toThrow('Unsupported layout type');
    });
  });

  describe('Content Element Creation', () => {
    test('should create text elements with correct styling', () => {
      const presentationId = 'test-presentation';
      const slideIndex = 0;
      const item = { type: 'title', text: 'Test Title', importance: 'high' };
      const position = { x: 50, y: 50, width: 400, height: 100 };
      const theme = layoutService.designSystem.themes.default;
      const grid = { width: 960, height: 540 };

      const element = layoutService.createContentElement(
        presentationId, slideIndex, item, position, theme, grid
      );

      expect(element.type).toBe('title');
      expect(element.text).toBe('Test Title');
      expect(element.position).toEqual(position);
      expect(element.style.fontFamily).toBe('Arial');
      expect(element.style.bold).toBe(true); // Title should be bold
      expect(element.fontSize).toBeGreaterThan(0);
    });

    test('should handle different content types', () => {
      const presentationId = 'test-presentation';
      const slideIndex = 0;
      const position = { x: 50, y: 50, width: 400, height: 100 };
      const theme = layoutService.designSystem.themes.default;
      const grid = { width: 960, height: 540 };

      const bodyElement = layoutService.createContentElement(
        presentationId, slideIndex, 
        { type: 'body', text: 'Body text' }, 
        position, theme, grid
      );

      const captionElement = layoutService.createContentElement(
        presentationId, slideIndex, 
        { type: 'caption', text: 'Caption text' }, 
        position, theme, grid
      );

      expect(bodyElement.style.bold).toBe(false);
      expect(captionElement.style.bold).toBe(false);
      expect(bodyElement.fontSize).toBeGreaterThan(captionElement.fontSize);
    });
  });

  describe('Layout Information', () => {
    test('should return layout information for valid layout types', () => {
      const singleColumnInfo = layoutService.getLayoutInfo('single-column');
      
      expect(singleColumnInfo.type).toBe('single-column');
      expect(singleColumnInfo.columns).toBe(1);
      expect(singleColumnInfo.supportedElements).toContain('text');
      expect(singleColumnInfo.accessibility).toBe(true);
      expect(singleColumnInfo.responsive).toBe(true);
    });

    test('should throw error for unknown layout types', () => {
      expect(() => {
        layoutService.getLayoutInfo('unknown-layout');
      }).toThrow('Unknown layout type: unknown-layout');
    });
  });

  describe('Integration with SlidesService', () => {
    test('should call SlidesService methods with correct parameters', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Test content' }];

      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: content,
        slideIndex: 0
      });

      // Verify SlidesService method calls
      expect(mockSlidesService.verifyMethodCalled('getSlideDimensions')).toBe(true);
      expect(mockSlidesService.verifyMethodCalled('insertTextBox')).toBe(true);

      const insertCall = mockSlidesService.getLatestCall('insertTextBox');
      expect(insertCall.args.presentationId).toBe(presentationId);
      expect(insertCall.args.text).toBe('Test content');
    });

    test('should handle SlidesService errors gracefully', () => {
      const presentationId = 'test-presentation';
      
      mockSlidesService.simulateFailure(true, 1.0, ['insertTextBox']);
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      expect(() => {
        layoutService.createLayout(presentationId, {
          layoutType: 'single-column',
          content: [{ text: 'Test' }]
        });
      }).toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should handle large content arrays efficiently', () => {
      const presentationId = 'test-presentation';
      const largeContent = Array.from({ length: 100 }, (_, i) => ({
        type: 'body',
        text: `Content item ${i + 1}`,
        importance: 'medium'
      }));

      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      const startTime = Date.now();
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: largeContent
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should minimize SlidesService API calls', () => {
      const presentationId = 'test-presentation';
      const content = [
        { text: 'Item 1' },
        { text: 'Item 2' },
        { text: 'Item 3' }
      ];

      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });

      layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: content
      });

      // Should call getSlideDimensions only once per layout
      expect(mockSlidesService.getMethodCallCount('getSlideDimensions')).toBe(1);
      // Should call insertTextBox once per content item
      expect(mockSlidesService.getMethodCallCount('insertTextBox')).toBe(3);
    });
  });
});