/**
 * DesignUtils Unit Tests
 * Comprehensive testing for design calculation utilities and responsive design
 */

// Mock DesignUtils class for testing
class DesignUtils {
  constructor() {
    this.constants = this.initializeConstants();
  }

  initializeConstants() {
    return {
      standardDimensions: { width: 960, height: 540 },
      fontHierarchy: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        subheading: { default: 28, min: 24, max: 32 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 },
        footnote: { default: 16, min: 14, max: 18 }
      },
      lineHeightRatios: {
        title: 1.2, heading: 1.3, body: 1.4, caption: 1.5, list: 1.6
      },
      spacing: { base: 8, multipliers: [0.5, 1, 2, 3, 4, 6, 8] },
      contrastStandards: { AA: 4.5, AAA: 7.0, large: 3.0 },
      accessibility: {
        minFontSizes: { title: 28, heading: 24, body: 18, caption: 16 },
        minLineHeight: 1.5,
        minLetterSpacing: 0.12
      },
      factors: {
        content: { short: 1.0, medium: 0.95, long: 0.85, veryLong: 0.75 },
        distance: { close: 0.9, medium: 1.0, far: 1.3 },
        importance: { high: 1.15, medium: 1.0, low: 0.9 }
      }
    };
  }

  calculateResponsiveFontSize(options) {
    const {
      baseSize, slideWidth, slideHeight, contentLength = 0,
      viewingDistance = 'medium', importance = 'medium', contentType = 'body'
    } = options;

    if (!baseSize || !slideWidth || !slideHeight) {
      throw new Error('Required parameters: baseSize, slideWidth, slideHeight');
    }

    const scaleRatio = this.calculateScaleRatio(slideWidth, slideHeight);
    const contentFactor = this.getContentLengthFactor(contentLength);
    const distanceFactor = this.getViewingDistanceFactor(viewingDistance);
    const importanceFactor = this.getImportanceFactor(importance);

    const calculatedSize = baseSize * scaleRatio * contentFactor * distanceFactor * importanceFactor;

    const fontConfig = this.constants.fontHierarchy[contentType] || this.constants.fontHierarchy.body;
    const constrainedSize = Math.max(fontConfig.min, Math.min(fontConfig.max, Math.round(calculatedSize)));

    const accessibilityMin = this.constants.accessibility.minFontSizes[contentType] || 14;
    return Math.max(accessibilityMin, constrainedSize);
  }

  calculateScaleRatio(slideWidth, slideHeight) {
    const { width: stdWidth, height: stdHeight } = this.constants.standardDimensions;
    const widthRatio = slideWidth / stdWidth;
    const heightRatio = slideHeight / stdHeight;
    return Math.min(widthRatio, heightRatio);
  }

  getContentLengthFactor(contentLength) {
    const factors = this.constants.factors.content;
    if (contentLength <= 50) return factors.short;
    if (contentLength <= 150) return factors.medium;
    if (contentLength <= 300) return factors.long;
    return factors.veryLong;
  }

  getViewingDistanceFactor(distance) {
    return this.constants.factors.distance[distance] || this.constants.factors.distance.medium;
  }

  getImportanceFactor(importance) {
    return this.constants.factors.importance[importance] || this.constants.factors.importance.medium;
  }

  calculateLineHeight(fontSize, contentType = 'body') {
    const baseRatio = this.constants.lineHeightRatios[contentType] || this.constants.lineHeightRatios.body;
    const sizeAdjustment = fontSize < 20 ? 0.1 : 0;
    const calculatedHeight = (baseRatio + sizeAdjustment) * fontSize;
    const minHeight = this.constants.accessibility.minLineHeight * fontSize;
    return Math.max(minHeight, calculatedHeight);
  }

  calculateResponsiveMargins(slideWidth, slideHeight, options = {}) {
    const {
      baseMargin = this.constants.spacing.base * 4,
      marginRatio = 1.3,
      minMargin = this.constants.spacing.base,
      maxMargin = this.constants.spacing.base * 10
    } = options;

    const scaleRatio = this.calculateScaleRatio(slideWidth, slideHeight);
    const scaledMargin = baseMargin * scaleRatio;
    const clampedMargin = Math.max(minMargin, Math.min(maxMargin, scaledMargin));

    return {
      top: Math.round(clampedMargin),
      right: Math.round(clampedMargin * marginRatio),
      bottom: Math.round(clampedMargin),
      left: Math.round(clampedMargin * marginRatio)
    };
  }

  calculateTextSpacing(fontSize, spacingType = 'paragraph') {
    const spacingMultipliers = {
      paragraph: 1.75, listItem: 0.75, section: 2.5, title: 1.25
    };
    const multiplier = spacingMultipliers[spacingType] || spacingMultipliers.paragraph;
    return Math.round(fontSize * multiplier);
  }

  calculateGridSystem(slideConfig) {
    const { width, height, columns = 12, gutterRatio = 0.025 } = slideConfig;

    const margins = this.calculateResponsiveMargins(width, height);
    const contentWidth = width - margins.left - margins.right;
    const contentHeight = height - margins.top - margins.bottom;
    
    const gutter = Math.round(width * gutterRatio);
    const columnWidth = (contentWidth - (gutter * (columns - 1))) / columns;

    return {
      width, height, contentWidth, contentHeight, margins, columns, gutter, columnWidth,
      getColumnSpan: (startCol, spanCols = 1) => ({
        x: margins.left + ((startCol - 1) * (columnWidth + gutter)),
        width: (columnWidth * spanCols) + (gutter * (spanCols - 1))
      }),
      getRowSpan: (startRow, spanRows = 1, totalRows = 1) => {
        const rowHeight = contentHeight / totalRows;
        return {
          y: margins.top + ((startRow - 1) * rowHeight),
          height: rowHeight * spanRows
        };
      }
    };
  }

  calculateContrastRatio(foreground, background) {
    const fgLuminance = this.calculateLuminance(foreground);
    const bgLuminance = this.calculateLuminance(background);
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }

  calculateLuminance(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  validateColorAccessibility(foreground, background, fontSize, isBold = false) {
    const contrastRatio = this.calculateContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const minRequired = isLargeText ? this.constants.contrastStandards.large : this.constants.contrastStandards.AA;

    return {
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      meetsAA: contrastRatio >= this.constants.contrastStandards.AA,
      meetsAAA: contrastRatio >= this.constants.contrastStandards.AAA,
      meetsLarge: contrastRatio >= this.constants.contrastStandards.large,
      isCompliant: contrastRatio >= minRequired,
      isLargeText, minRequired,
      recommendation: this.getContrastRecommendation(contrastRatio, minRequired)
    };
  }

  getContrastRecommendation(currentRatio, requiredRatio) {
    if (currentRatio >= requiredRatio) {
      return 'Contrast ratio meets accessibility standards';
    }
    const deficit = requiredRatio - currentRatio;
    if (deficit <= 1) return 'Minor contrast adjustment needed';
    if (deficit <= 2) return 'Moderate contrast improvement required';
    return 'Significant contrast enhancement needed';
  }

  calculateElementPositioning(layoutConfig) {
    const { layoutType, elementCount, slideWidth, slideHeight, contentPadding = this.constants.spacing.base } = layoutConfig;
    const grid = this.calculateGridSystem({ width: slideWidth, height: slideHeight });
    const positions = [];

    switch (layoutType) {
      case 'single-column':
        positions.push(...this.calculateSingleColumnPositions(grid, elementCount, contentPadding));
        break;
      case 'double-column':
        positions.push(...this.calculateDoubleColumnPositions(grid, elementCount, contentPadding));
        break;
      case 'three-column':
        positions.push(...this.calculateThreeColumnPositions(grid, elementCount, contentPadding));
        break;
      case 'title-content':
        positions.push(...this.calculateTitleContentPositions(grid, elementCount, contentPadding));
        break;
      default:
        throw new Error(`Unsupported layout type: ${layoutType}`);
    }

    return { positions, grid, totalElements: positions.length };
  }

  calculateSingleColumnPositions(grid, elementCount, padding) {
    const positions = [];
    const availableHeight = grid.contentHeight - (padding * (elementCount - 1));
    const elementHeight = availableHeight / elementCount;

    for (let i = 0; i < elementCount; i++) {
      positions.push({
        x: grid.margins.left,
        y: grid.margins.top + (i * (elementHeight + padding)),
        width: grid.contentWidth,
        height: elementHeight,
        column: 1, row: i + 1
      });
    }
    return positions;
  }

  calculateDoubleColumnPositions(grid, elementCount, padding) {
    const positions = [];
    const itemsPerColumn = Math.ceil(elementCount / 2);
    const columnWidth = (grid.contentWidth - grid.gutter) / 2;
    const availableHeight = grid.contentHeight - (padding * (itemsPerColumn - 1));
    const elementHeight = availableHeight / itemsPerColumn;

    for (let i = 0; i < elementCount; i++) {
      const columnIndex = Math.floor(i / itemsPerColumn);
      const rowIndex = i % itemsPerColumn;

      positions.push({
        x: grid.margins.left + (columnIndex * (columnWidth + grid.gutter)),
        y: grid.margins.top + (rowIndex * (elementHeight + padding)),
        width: columnWidth,
        height: elementHeight,
        column: columnIndex + 1, row: rowIndex + 1
      });
    }
    return positions;
  }

  calculateThreeColumnPositions(grid, elementCount, padding) {
    const positions = [];
    const itemsPerColumn = Math.ceil(elementCount / 3);
    const columnWidth = (grid.contentWidth - (grid.gutter * 2)) / 3;
    const availableHeight = grid.contentHeight - (padding * (itemsPerColumn - 1));
    const elementHeight = availableHeight / itemsPerColumn;

    for (let i = 0; i < elementCount; i++) {
      const columnIndex = Math.floor(i / itemsPerColumn);
      const rowIndex = i % itemsPerColumn;

      positions.push({
        x: grid.margins.left + (columnIndex * (columnWidth + grid.gutter)),
        y: grid.margins.top + (rowIndex * (elementHeight + padding)),
        width: columnWidth,
        height: elementHeight,
        column: columnIndex + 1, row: rowIndex + 1
      });
    }
    return positions;
  }

  calculateTitleContentPositions(grid, elementCount, padding) {
    const positions = [];
    if (elementCount === 0) return positions;

    const titleHeight = grid.contentHeight * 0.2;
    const contentHeight = grid.contentHeight * 0.8 - padding;
    const contentElementHeight = elementCount > 1 ? 
      (contentHeight - (padding * (elementCount - 2))) / (elementCount - 1) : contentHeight;

    positions.push({
      x: grid.margins.left, y: grid.margins.top,
      width: grid.contentWidth, height: titleHeight,
      column: 1, row: 1, type: 'title'
    });

    for (let i = 1; i < elementCount; i++) {
      positions.push({
        x: grid.margins.left,
        y: grid.margins.top + titleHeight + padding + ((i - 1) * (contentElementHeight + padding)),
        width: grid.contentWidth, height: contentElementHeight,
        column: 1, row: i + 1, type: 'content'
      });
    }
    return positions;
  }

  getDesignRecommendations(content) {
    const { textContent = '', slideCount = 1, presentationType = 'general', audienceSize = 'medium' } = content;

    return {
      fontSize: this.recommendFontSize(textContent, presentationType, audienceSize),
      layout: this.recommendLayout(textContent, slideCount),
      spacing: this.recommendSpacing(textContent.length),
      colors: this.recommendColors(presentationType),
      accessibility: this.getAccessibilityRecommendations(textContent)
    };
  }

  recommendFontSize(textContent, presentationType, audienceSize) {
    const baseAdjustments = { corporate: 0.9, educational: 1.0, creative: 1.1 };
    const audienceAdjustments = { small: 0.9, medium: 1.0, large: 1.2 };
    const baseMultiplier = (baseAdjustments[presentationType] || 1.0) * (audienceAdjustments[audienceSize] || 1.0);

    return {
      title: Math.round(this.constants.fontHierarchy.title.default * baseMultiplier),
      heading: Math.round(this.constants.fontHierarchy.heading.default * baseMultiplier),
      body: Math.round(this.constants.fontHierarchy.body.default * baseMultiplier),
      multiplier: baseMultiplier
    };
  }

  recommendLayout(textContent, slideCount) {
    const contentLength = textContent.length;
    const wordsPerSlide = contentLength / slideCount / 5;
    if (wordsPerSlide < 20) return 'single-column';
    if (wordsPerSlide < 50) return 'double-column';
    return 'title-content';
  }

  recommendSpacing(contentLength) {
    const density = contentLength > 500 ? 'high' : contentLength > 200 ? 'medium' : 'low';
    const spacingMultipliers = { low: 1.2, medium: 1.0, high: 0.8 };
    const multiplier = spacingMultipliers[density];

    return {
      margins: Math.round(this.constants.spacing.base * 4 * multiplier),
      padding: Math.round(this.constants.spacing.base * 2 * multiplier),
      lineHeight: multiplier, density
    };
  }

  recommendColors(presentationType) {
    const colorSchemes = {
      corporate: { primary: '#1565c0', secondary: '#424242', background: '#ffffff', text: '#212121' },
      educational: { primary: '#2196f3', secondary: '#ff9800', background: '#fafafa', text: '#212121' },
      creative: { primary: '#9c27b0', secondary: '#ff5722', background: '#f3e5f5', text: '#4a148c' }
    };
    return colorSchemes[presentationType] || colorSchemes.educational;
  }

  getAccessibilityRecommendations(textContent) {
    const recommendations = [
      { category: 'Typography', suggestion: 'Use minimum 18pt font for body text', priority: 'high' },
      { category: 'Color', suggestion: 'Ensure 4.5:1 contrast ratio for normal text', priority: 'high' },
      { category: 'Spacing', suggestion: 'Use 1.5x line height minimum', priority: 'medium' }
    ];

    if (textContent.length > 300) {
      recommendations.push({
        category: 'Layout',
        suggestion: 'Consider breaking long content across multiple slides',
        priority: 'medium'
      });
    }
    return recommendations;
  }
}

describe('DesignUtils', () => {
  let designUtils;

  beforeEach(() => {
    designUtils = new DesignUtils();
  });

  describe('Constants Initialization', () => {
    test('should initialize design constants correctly', () => {
      const constants = designUtils.constants;

      expect(constants.standardDimensions).toEqual({ width: 960, height: 540 });
      expect(constants.fontHierarchy.title.default).toBe(44);
      expect(constants.spacing.base).toBe(8);
      expect(constants.contrastStandards.AA).toBe(4.5);
    });

    test('should have complete font hierarchy', () => {
      const fonts = designUtils.constants.fontHierarchy;
      
      ['title', 'heading', 'subheading', 'body', 'caption', 'footnote'].forEach(type => {
        expect(fonts[type]).toHaveProperty('default');
        expect(fonts[type]).toHaveProperty('min');
        expect(fonts[type]).toHaveProperty('max');
      });
    });

    test('should have accessibility standards', () => {
      const accessibility = designUtils.constants.accessibility;
      
      expect(accessibility.minFontSizes).toBeDefined();
      expect(accessibility.minLineHeight).toBe(1.5);
      expect(accessibility.minLetterSpacing).toBe(0.12);
    });
  });

  describe('Scale Ratio Calculation', () => {
    test('should calculate correct scale ratio for standard dimensions', () => {
      const ratio = designUtils.calculateScaleRatio(960, 540);
      expect(ratio).toBe(1.0);
    });

    test('should calculate scale ratio for larger dimensions', () => {
      const ratio = designUtils.calculateScaleRatio(1920, 1080);
      expect(ratio).toBe(2.0);
    });

    test('should calculate scale ratio for smaller dimensions', () => {
      const ratio = designUtils.calculateScaleRatio(480, 270);
      expect(ratio).toBe(0.5);
    });

    test('should use minimum ratio for different aspect ratios', () => {
      const ratio = designUtils.calculateScaleRatio(1920, 540); // Wide but not tall
      expect(ratio).toBe(1.0); // Limited by height
    });
  });

  describe('Content Length Factor Calculation', () => {
    test('should return correct factors for different content lengths', () => {
      expect(designUtils.getContentLengthFactor(30)).toBe(1.0); // Short
      expect(designUtils.getContentLengthFactor(100)).toBe(0.95); // Medium
      expect(designUtils.getContentLengthFactor(200)).toBe(0.85); // Long
      expect(designUtils.getContentLengthFactor(400)).toBe(0.75); // Very long
    });

    test('should handle edge cases correctly', () => {
      expect(designUtils.getContentLengthFactor(50)).toBe(1.0); // Boundary case
      expect(designUtils.getContentLengthFactor(150)).toBe(0.95); // Boundary case
      expect(designUtils.getContentLengthFactor(300)).toBe(0.85); // Boundary case
    });
  });

  describe('Viewing Distance and Importance Factors', () => {
    test('should return correct distance factors', () => {
      expect(designUtils.getViewingDistanceFactor('close')).toBe(0.9);
      expect(designUtils.getViewingDistanceFactor('medium')).toBe(1.0);
      expect(designUtils.getViewingDistanceFactor('far')).toBe(1.3);
      expect(designUtils.getViewingDistanceFactor('unknown')).toBe(1.0); // Default
    });

    test('should return correct importance factors', () => {
      expect(designUtils.getImportanceFactor('low')).toBe(0.9);
      expect(designUtils.getImportanceFactor('medium')).toBe(1.0);
      expect(designUtils.getImportanceFactor('high')).toBe(1.15);
      expect(designUtils.getImportanceFactor('unknown')).toBe(1.0); // Default
    });
  });

  describe('Responsive Font Size Calculation', () => {
    test('should calculate font size with all parameters', () => {
      const fontSize = designUtils.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        contentLength: 100,
        viewingDistance: 'medium',
        importance: 'medium',
        contentType: 'body'
      });

      expect(fontSize).toBeGreaterThan(0);
      expect(fontSize).toBeLessThanOrEqual(28); // Max for body type
      expect(fontSize).toBeGreaterThanOrEqual(20); // Min for body type
    });

    test('should throw error for missing required parameters', () => {
      expect(() => {
        designUtils.calculateResponsiveFontSize({
          slideWidth: 960,
          slideHeight: 540
        });
      }).toThrow('Required parameters: baseSize, slideWidth, slideHeight');
    });

    test('should respect font hierarchy constraints', () => {
      const titleSize = designUtils.calculateResponsiveFontSize({
        baseSize: 44,
        slideWidth: 960,
        slideHeight: 540,
        contentType: 'title'
      });

      const bodySize = designUtils.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540,
        contentType: 'body'
      });

      expect(titleSize).toBeGreaterThan(bodySize);
      expect(titleSize).toBeLessThanOrEqual(60); // Max for title
      expect(titleSize).toBeGreaterThanOrEqual(36); // Min for title
    });

    test('should enforce accessibility minimums', () => {
      const smallSize = designUtils.calculateResponsiveFontSize({
        baseSize: 1, // Extremely small base
        slideWidth: 100,
        slideHeight: 100,
        contentType: 'body'
      });

      expect(smallSize).toBeGreaterThanOrEqual(18); // Accessibility minimum for body
    });

    test('should scale properly for different slide dimensions', () => {
      const standardSize = designUtils.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 960,
        slideHeight: 540
      });

      const largeSize = designUtils.calculateResponsiveFontSize({
        baseSize: 24,
        slideWidth: 1920,
        slideHeight: 1080
      });

      expect(largeSize).toBeGreaterThan(standardSize);
    });
  });

  describe('Line Height Calculation', () => {
    test('should calculate line height for different content types', () => {
      const titleHeight = designUtils.calculateLineHeight(44, 'title');
      const bodyHeight = designUtils.calculateLineHeight(24, 'body');
      const captionHeight = designUtils.calculateLineHeight(20, 'caption');

      expect(titleHeight).toBe(44 * 1.2); // Title ratio
      expect(bodyHeight).toBe(24 * 1.4); // Body ratio
      expect(captionHeight).toBe(20 * 1.5); // Caption ratio
    });

    test('should add adjustment for small fonts', () => {
      const smallFontHeight = designUtils.calculateLineHeight(18, 'body');
      const normalFontHeight = designUtils.calculateLineHeight(24, 'body');

      const smallExpected = 18 * (1.4 + 0.1); // With adjustment
      const normalExpected = 24 * 1.4; // Without adjustment

      expect(smallFontHeight).toBe(smallExpected);
      expect(normalFontHeight).toBe(normalExpected);
    });

    test('should enforce accessibility minimum', () => {
      const lineHeight = designUtils.calculateLineHeight(20, 'body');
      const accessibilityMin = 1.5 * 20;

      expect(lineHeight).toBeGreaterThanOrEqual(accessibilityMin);
    });
  });

  describe('Responsive Margins Calculation', () => {
    test('should calculate margins for standard dimensions', () => {
      const margins = designUtils.calculateResponsiveMargins(960, 540);

      expect(margins.top).toBe(32); // 32 * 1.0 scale
      expect(margins.bottom).toBe(32);
      expect(margins.left).toBe(42); // 32 * 1.3 ratio
      expect(margins.right).toBe(42);
    });

    test('should scale margins for different dimensions', () => {
      const largeMargins = designUtils.calculateResponsiveMargins(1920, 1080);
      const smallMargins = designUtils.calculateResponsiveMargins(480, 270);

      expect(largeMargins.top).toBe(64); // 32 * 2.0 scale
      expect(smallMargins.top).toBe(16); // 32 * 0.5 scale
    });

    test('should respect margin constraints', () => {
      const tinyMargins = designUtils.calculateResponsiveMargins(100, 100, {
        minMargin: 10,
        maxMargin: 50
      });

      expect(tinyMargins.top).toBeGreaterThanOrEqual(10);
      expect(tinyMargins.top).toBeLessThanOrEqual(50);
    });

    test('should use custom options', () => {
      const customMargins = designUtils.calculateResponsiveMargins(960, 540, {
        baseMargin: 40,
        marginRatio: 1.5
      });

      expect(customMargins.top).toBe(40);
      expect(customMargins.left).toBe(60); // 40 * 1.5
    });
  });

  describe('Text Spacing Calculation', () => {
    test('should calculate spacing for different text types', () => {
      const paragraphSpacing = designUtils.calculateTextSpacing(24, 'paragraph');
      const listSpacing = designUtils.calculateTextSpacing(24, 'listItem');
      const sectionSpacing = designUtils.calculateTextSpacing(24, 'section');

      expect(paragraphSpacing).toBe(42); // 24 * 1.75
      expect(listSpacing).toBe(18); // 24 * 0.75
      expect(sectionSpacing).toBe(60); // 24 * 2.5
    });

    test('should default to paragraph spacing', () => {
      const defaultSpacing = designUtils.calculateTextSpacing(24);
      const paragraphSpacing = designUtils.calculateTextSpacing(24, 'paragraph');

      expect(defaultSpacing).toBe(paragraphSpacing);
    });
  });

  describe('Grid System Calculation', () => {
    test('should create complete grid system', () => {
      const grid = designUtils.calculateGridSystem({
        width: 960,
        height: 540,
        columns: 12
      });

      expect(grid.width).toBe(960);
      expect(grid.height).toBe(540);
      expect(grid.columns).toBe(12);
      expect(grid.contentWidth).toBeGreaterThan(0);
      expect(grid.contentHeight).toBeGreaterThan(0);
      expect(grid.columnWidth).toBeGreaterThan(0);
    });

    test('should provide column span calculation', () => {
      const grid = designUtils.calculateGridSystem({ width: 960, height: 540 });
      const span = grid.getColumnSpan(1, 3);

      expect(span).toHaveProperty('x');
      expect(span).toHaveProperty('width');
      expect(span.width).toBeGreaterThan(0);
    });

    test('should provide row span calculation', () => {
      const grid = designUtils.calculateGridSystem({ width: 960, height: 540 });
      const span = grid.getRowSpan(2, 1, 5);

      expect(span).toHaveProperty('y');
      expect(span).toHaveProperty('height');
      expect(span.height).toBeGreaterThan(0);
    });

    test('should handle custom gutter ratio', () => {
      const grid = designUtils.calculateGridSystem({
        width: 960,
        height: 540,
        gutterRatio: 0.05 // 5% gutter
      });

      expect(grid.gutter).toBe(48); // 960 * 0.05
    });
  });

  describe('Color Contrast Calculation', () => {
    test('should calculate luminance correctly', () => {
      const whiteLuminance = designUtils.calculateLuminance('#ffffff');
      const blackLuminance = designUtils.calculateLuminance('#000000');

      expect(whiteLuminance).toBeCloseTo(1.0, 1);
      expect(blackLuminance).toBeCloseTo(0.0, 1);
      expect(whiteLuminance).toBeGreaterThan(blackLuminance);
    });

    test('should calculate contrast ratio correctly', () => {
      const highContrast = designUtils.calculateContrastRatio('#000000', '#ffffff');
      const lowContrast = designUtils.calculateContrastRatio('#888888', '#999999');

      expect(highContrast).toBeCloseTo(21, 0); // Perfect contrast
      expect(lowContrast).toBeLessThan(highContrast);
    });

    test('should validate accessibility compliance', () => {
      const goodContrast = designUtils.validateColorAccessibility('#000000', '#ffffff', 16);
      const poorContrast = designUtils.validateColorAccessibility('#888888', '#999999', 16);

      expect(goodContrast.isCompliant).toBe(true);
      expect(goodContrast.meetsAA).toBe(true);
      expect(goodContrast.meetsAAA).toBe(true);

      expect(poorContrast.isCompliant).toBe(false);
      expect(poorContrast.meetsAA).toBe(false);
    });

    test('should handle large text differently', () => {
      const largeText = designUtils.validateColorAccessibility('#666666', '#ffffff', 20);
      const smallText = designUtils.validateColorAccessibility('#666666', '#ffffff', 14);

      expect(largeText.isLargeText).toBe(true);
      expect(smallText.isLargeText).toBe(false);
      expect(largeText.minRequired).toBeLessThan(smallText.minRequired);
    });

    test('should provide appropriate recommendations', () => {
      const goodContrast = designUtils.validateColorAccessibility('#000000', '#ffffff', 16);
      const poorContrast = designUtils.validateColorAccessibility('#cccccc', '#ffffff', 16);

      expect(goodContrast.recommendation).toContain('meets accessibility standards');
      expect(poorContrast.recommendation).toContain('adjustment needed');
    });
  });

  describe('Element Positioning Calculation', () => {
    test('should calculate single column positions', () => {
      const result = designUtils.calculateElementPositioning({
        layoutType: 'single-column',
        elementCount: 3,
        slideWidth: 960,
        slideHeight: 540
      });

      expect(result.positions).toHaveLength(3);
      expect(result.totalElements).toBe(3);

      result.positions.forEach((pos, index) => {
        expect(pos.column).toBe(1);
        expect(pos.row).toBe(index + 1);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
      });
    });

    test('should calculate double column positions', () => {
      const result = designUtils.calculateElementPositioning({
        layoutType: 'double-column',
        elementCount: 4,
        slideWidth: 960,
        slideHeight: 540
      });

      expect(result.positions).toHaveLength(4);

      const leftColumn = result.positions.filter(p => p.column === 1);
      const rightColumn = result.positions.filter(p => p.column === 2);

      expect(leftColumn).toHaveLength(2);
      expect(rightColumn).toHaveLength(2);
    });

    test('should calculate title-content positions', () => {
      const result = designUtils.calculateElementPositioning({
        layoutType: 'title-content',
        elementCount: 3,
        slideWidth: 960,
        slideHeight: 540
      });

      expect(result.positions).toHaveLength(3);

      const titlePos = result.positions.find(p => p.type === 'title');
      const contentPos = result.positions.filter(p => p.type === 'content');

      expect(titlePos).toBeDefined();
      expect(contentPos).toHaveLength(2);
      expect(titlePos.row).toBe(1);
    });

    test('should throw error for unsupported layout', () => {
      expect(() => {
        designUtils.calculateElementPositioning({
          layoutType: 'unsupported',
          elementCount: 3,
          slideWidth: 960,
          slideHeight: 540
        });
      }).toThrow('Unsupported layout type: unsupported');
    });
  });

  describe('Design Recommendations', () => {
    test('should provide font size recommendations', () => {
      const recommendations = designUtils.recommendFontSize('test content', 'corporate', 'large');

      expect(recommendations).toHaveProperty('title');
      expect(recommendations).toHaveProperty('heading');
      expect(recommendations).toHaveProperty('body');
      expect(recommendations).toHaveProperty('multiplier');

      expect(recommendations.multiplier).toBeGreaterThan(1.0); // Large audience adjustment
    });

    test('should recommend appropriate layout', () => {
      const shortLayout = designUtils.recommendLayout('Short text', 1);
      const mediumLayout = designUtils.recommendLayout('Medium length text content for testing purposes', 1);
      const longLayout = designUtils.recommendLayout('Very long text content that would require multiple slides or careful layout consideration to ensure readability and proper information hierarchy', 1);

      expect(shortLayout).toBe('single-column');
      expect(mediumLayout).toBe('double-column');
      expect(longLayout).toBe('title-content');
    });

    test('should provide spacing recommendations based on content density', () => {
      const lightSpacing = designUtils.recommendSpacing(100); // Low density
      const denseSpacing = designUtils.recommendSpacing(600); // High density

      expect(lightSpacing.density).toBe('low');
      expect(denseSpacing.density).toBe('high');
      expect(lightSpacing.margins).toBeGreaterThan(denseSpacing.margins);
    });

    test('should recommend colors for different presentation types', () => {
      const corporateColors = designUtils.recommendColors('corporate');
      const creativeColors = designUtils.recommendColors('creative');

      expect(corporateColors).toHaveProperty('primary');
      expect(corporateColors).toHaveProperty('background');
      expect(creativeColors.primary).not.toBe(corporateColors.primary);
    });

    test('should provide accessibility recommendations', () => {
      const shortRecommendations = designUtils.getAccessibilityRecommendations('Short text');
      const longRecommendations = designUtils.getAccessibilityRecommendations('Very long text content that exceeds the recommended length for a single slide and requires special consideration for layout and readability');

      expect(shortRecommendations).toBeInstanceOf(Array);
      expect(longRecommendations.length).toBeGreaterThan(shortRecommendations.length);

      const layoutRecommendation = longRecommendations.find(r => r.category === 'Layout');
      expect(layoutRecommendation).toBeDefined();
    });

    test('should provide complete design recommendations', () => {
      const recommendations = designUtils.getDesignRecommendations({
        textContent: 'Sample presentation content',
        slideCount: 5,
        presentationType: 'educational',
        audienceSize: 'medium'
      });

      expect(recommendations).toHaveProperty('fontSize');
      expect(recommendations).toHaveProperty('layout');
      expect(recommendations).toHaveProperty('spacing');
      expect(recommendations).toHaveProperty('colors');
      expect(recommendations).toHaveProperty('accessibility');

      expect(recommendations.accessibility).toBeInstanceOf(Array);
    });
  });
});