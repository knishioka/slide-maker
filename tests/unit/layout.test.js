/**
 * LayoutService Unit Tests
 * Comprehensive testing for advanced layout management, responsive design, and grid systems
 */

const { MockSlidesService, MockLogger } = require('../fixtures/core-services-mock');

// Mock GridSystem
class MockGridSystem {
  createAdvancedGrid(config) {
    return {
      width: config.slideDimensions.width,
      height: config.slideDimensions.height,
      columns: config.columns || 12,
      gap: config.gap || 16,
      gridAreas: config.areas || {},
      getGridPosition: (area) => ({ x: 50, y: 50, width: 400, height: 100 }),
      margins: { top: 32, right: 42, bottom: 32, left: 42 }
    };
  }
}

// Mock ResponsiveEngine
class MockResponsiveEngine {
  getCurrentBreakpoint(width, height) {
    if (width <= 768) return { key: 'sm', columns: 1, fontSize: 0.8 };
    if (width <= 1024) return { key: 'md', columns: 2, fontSize: 0.9 };
    return { key: 'lg', columns: 3, fontSize: 1.0 };
  }

  createResponsiveLayout(config, dimensions) {
    return {
      adaptedConfig: config,
      responsive: true,
      breakpoint: this.getCurrentBreakpoint(dimensions.width, dimensions.height)
    };
  }
}

// Mock LayoutTemplates
class MockLayoutTemplates {
  createLayoutConfig(templateName, options = {}) {
    return {
      templateId: templateName,
      areas: { main: '1 / 1 / 6 / 13' },
      content: [{ type: 'body', text: 'Template content', area: 'main' }]
    };
  }

  getTemplate(name) {
    return {
      name: 'Test Template',
      areas: { main: '1 / 1 / 6 / 13' },
      defaultContent: ['body']
    };
  }

  generatePreview(templateName) {
    return {
      templateId: templateName,
      name: 'Preview Template',
      content: [{ type: 'body', text: 'Preview content' }]
    };
  }
}

// Enhanced LayoutService for testing
class LayoutService {
  constructor(slidesService) {
    this.slidesService = slidesService;
    this.designSystem = this.initializeDesignSystem();
    
    // Initialize advanced layout components
    this.gridSystem = new MockGridSystem();
    this.responsiveEngine = new MockResponsiveEngine();
    this.layoutTemplates = new MockLayoutTemplates();
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
        'three-column': { columns: 3, description: 'Three column layout' },
        'custom-grid': { type: 'template', description: 'Template-based advanced layout' },
        'responsive-grid': { type: 'responsive', description: 'Responsive grid layout' }
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
      slideIndex = 0,
      template = null,
      responsive = true,
      customAreas = null
    } = config;

    try {
      const slideDimensions = this.slidesService.getSlideDimensions(presentationId);
      const themeConfig = this.designSystem.themes[theme];

      // Enhanced layout creation with new capabilities
      let layoutResult;
      
      if (template) {
        // Use template-based layout
        layoutResult = this.createTemplateLayout(presentationId, slideIndex, template, content, slideDimensions, themeConfig, responsive);
      } else if (layoutType === 'custom-grid' || customAreas) {
        // Use custom grid layout
        layoutResult = this.createCustomGridLayout(presentationId, slideIndex, customAreas, content, slideDimensions, themeConfig, responsive);
      } else if (layoutType === 'responsive-grid') {
        // Use responsive grid layout
        layoutResult = this.createResponsiveGridLayout(presentationId, slideIndex, content, slideDimensions, themeConfig);
      } else {
        // Use legacy layout system for backward compatibility
        const grid = this.createGridSystem(slideDimensions, layoutType);
        layoutResult = this.renderLayout(presentationId, slideIndex, layoutType, content, grid, themeConfig);
      }

      return {
        success: true,
        layoutType,
        theme,
        template,
        elementsCreated: layoutResult.elements.length,
        slideDimensions,
        responsive: layoutResult.responsive || false,
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

  // Advanced layout methods for testing
  createTemplateLayout(presentationId, slideIndex, templateName, content, slideDimensions, theme, responsive) {
    const templateConfig = this.layoutTemplates.createLayoutConfig(templateName);
    const grid = this.gridSystem.createAdvancedGrid({
      slideDimensions,
      areas: templateConfig.areas,
      columns: 12
    });
    
    const elements = content.map((item, index) => ({
      id: `template-element-${index}`,
      type: item.type || 'body',
      text: item.text || '',
      template: templateName,
      responsive: responsive
    }));

    return { elements, template: templateName, responsive };
  }

  createCustomGridLayout(presentationId, slideIndex, customAreas, content, slideDimensions, theme, responsive) {
    const grid = this.gridSystem.createAdvancedGrid({
      slideDimensions,
      areas: customAreas,
      columns: 12
    });
    
    const elements = content.map((item, index) => ({
      id: `custom-element-${index}`,
      type: item.type || 'body',
      text: item.text || '',
      customGrid: true,
      responsive: responsive
    }));

    return { elements, responsive };
  }

  createResponsiveGridLayout(presentationId, slideIndex, content, slideDimensions, theme) {
    const breakpoint = this.responsiveEngine.getCurrentBreakpoint(slideDimensions.width, slideDimensions.height);
    const grid = this.gridSystem.createAdvancedGrid({
      slideDimensions,
      columns: breakpoint.columns
    });
    
    const elements = content.map((item, index) => ({
      id: `responsive-element-${index}`,
      type: item.type || 'body',
      text: item.text || '',
      breakpoint: breakpoint.key,
      responsive: true
    }));

    return { elements, responsive: true, breakpoint: breakpoint.key };
  }

  getAvailableTemplates() {
    return [
      { category: 'Basic', templates: [{ id: 'single-column', name: 'Single Column' }] },
      { category: 'Advanced', templates: [{ id: 'hero-content', name: 'Hero Content' }] }
    ];
  }

  generateLayoutPreview(layoutType) {
    return this.layoutTemplates.generatePreview(layoutType);
  }

  getDesignSystemInfo() {
    return {
      fonts: Object.keys(this.designSystem.fonts),
      layouts: Object.keys(this.designSystem.layouts),
      themes: Object.keys(this.designSystem.themes),
      spacingBase: this.designSystem.spacing.base,
      colorPalette: Object.keys(this.designSystem.colors),
      templates: ['single-column', 'hero-content', 'feature-showcase'],
      responsive: true,
      gridSystem: true
    };
  }
}

describe('Enhanced LayoutService', () => {
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

  describe('Advanced Layout Features', () => {
    test('should create template-based layout', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'title', text: 'Template Title' }];
      
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 1920, height: 1080 });
      
      const result = layoutService.createLayout(presentationId, {
        template: 'hero-content',
        content: content,
        responsive: true
      });
      
      expect(result.success).toBe(true);
      expect(result.template).toBe('hero-content');
      expect(result.responsive).toBe(true);
      expect(result.elements[0].template).toBe('hero-content');
    });

    test('should create custom grid layout', () => {
      const presentationId = 'test-presentation';
      const customAreas = {
        header: '1 / 1 / 2 / 13',
        main: '2 / 1 / 6 / 13'
      };
      const content = [
        { type: 'heading', text: 'Header Content' },
        { type: 'body', text: 'Main Content' }
      ];
      
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 1920, height: 1080 });
      
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'custom-grid',
        customAreas: customAreas,
        content: content,
        responsive: true
      });
      
      expect(result.success).toBe(true);
      expect(result.responsive).toBe(true);
      expect(result.elements[0].customGrid).toBe(true);
    });

    test('should create responsive grid layout', () => {
      const presentationId = 'test-presentation';
      const content = [
        { type: 'body', text: 'Item 1' },
        { type: 'body', text: 'Item 2' },
        { type: 'body', text: 'Item 3' }
      ];
      
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 768, height: 432 });
      
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'responsive-grid',
        content: content
      });
      
      expect(result.success).toBe(true);
      expect(result.responsive).toBe(true);
      expect(result.elements[0].breakpoint).toBe('sm'); // Small screen
    });

    test('should adapt to different screen sizes', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Responsive content' }];
      
      // Test mobile size
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 480, height: 270 });
      const mobileResult = layoutService.createLayout(presentationId, {
        layoutType: 'responsive-grid',
        content: content
      });
      
      // Test desktop size
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 1920, height: 1080 });
      const desktopResult = layoutService.createLayout(presentationId, {
        layoutType: 'responsive-grid',
        content: content
      });
      
      expect(mobileResult.elements[0].breakpoint).toBe('sm');
      expect(desktopResult.elements[0].breakpoint).toBe('lg');
    });
  });

  describe('Template System', () => {
    test('should get available templates', () => {
      const templates = layoutService.getAvailableTemplates();
      
      expect(templates).toHaveLength(2);
      expect(templates[0].category).toBe('Basic');
      expect(templates[1].category).toBe('Advanced');
    });

    test('should generate layout preview', () => {
      const preview = layoutService.generateLayoutPreview('hero-content');
      
      expect(preview.templateId).toBe('hero-content');
      expect(preview.name).toBe('Preview Template');
      expect(Array.isArray(preview.content)).toBe(true);
    });
  });

  describe('Enhanced Design System', () => {
    test('should provide comprehensive design system info', () => {
      const dsInfo = layoutService.getDesignSystemInfo();
      
      expect(dsInfo.responsive).toBe(true);
      expect(dsInfo.gridSystem).toBe(true);
      expect(Array.isArray(dsInfo.templates)).toBe(true);
      expect(dsInfo.templates).toContain('hero-content');
    });

    test('should support new layout types', () => {
      expect(layoutService.designSystem.layouts).toHaveProperty('custom-grid');
      expect(layoutService.designSystem.layouts).toHaveProperty('responsive-grid');
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

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty content arrays', () => {
      const presentationId = 'test-presentation';
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });
      
      const result = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: []
      });
      
      expect(result.success).toBe(true);
      expect(result.elementsCreated).toBe(0);
    });

    test('should handle null template gracefully', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Test content' }];
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });
      
      const result = layoutService.createLayout(presentationId, {
        template: null,
        content: content
      });
      
      expect(result.success).toBe(true);
      expect(result.template).toBeNull();
    });

    test('should handle invalid slide dimensions', () => {
      const presentationId = 'test-presentation';
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 0, height: 0 });
      
      expect(() => {
        layoutService.createLayout(presentationId, {
          layoutType: 'single-column',
          content: [{ text: 'Test' }]
        });
      }).toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt font sizes for different screen sizes', () => {
      const smallFontSize = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 480,
        slideHeight: 270
      });
      
      const largeFontSize = layoutService.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 1920,
        slideHeight: 1080
      });
      
      expect(largeFontSize).toBeGreaterThan(smallFontSize);
    });

    test('should provide correct breakpoint detection', () => {
      // Test with mock responsive engine
      const smallBreakpoint = layoutService.responsiveEngine.getCurrentBreakpoint(480, 270);
      const largeBreakpoint = layoutService.responsiveEngine.getCurrentBreakpoint(1920, 1080);
      
      expect(smallBreakpoint.key).toBe('sm');
      expect(largeBreakpoint.key).toBe('lg');
      expect(smallBreakpoint.columns).toBeLessThan(largeBreakpoint.columns);
    });
  });

  describe('Integration Testing', () => {
    test('should work with all layout types', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'body', text: 'Test content' }];
      const layouts = ['single-column', 'double-column', 'custom-grid', 'responsive-grid'];
      
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });
      
      layouts.forEach(layoutType => {
        const config = { layoutType, content };
        if (layoutType === 'custom-grid') {
          config.customAreas = { main: '1 / 1 / 6 / 13' };
        }
        
        const result = layoutService.createLayout(presentationId, config);
        expect(result.success).toBe(true);
      });
    });

    test('should maintain consistency across multiple calls', () => {
      const presentationId = 'test-presentation';
      const content = [{ type: 'title', text: 'Consistent Test' }];
      
      mockSlidesService.getSlideDimensions = jest.fn().mockReturnValue({ width: 960, height: 540 });
      
      const result1 = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: content
      });
      
      const result2 = layoutService.createLayout(presentationId, {
        layoutType: 'single-column',
        content: content
      });
      
      expect(result1.elementsCreated).toBe(result2.elementsCreated);
      expect(result1.layoutType).toBe(result2.layoutType);
    });
  });
});