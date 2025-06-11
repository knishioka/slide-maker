/**
 * Design Calculation Utilities
 * Advanced design system calculations for responsive layouts and accessibility
 */
class DesignUtils {
  /**
   * Initialize design utilities with configuration
   */
  constructor() {
    this.constants = this.initializeConstants();
  }

  /**
   * Initialize design constants and standards
   * @returns {Object} Design constants
   */
  initializeConstants() {
    return {
      // Standard slide dimensions (16:9)
      standardDimensions: {
        width: 960,
        height: 540
      },

      // Font size hierarchy
      fontHierarchy: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        subheading: { default: 28, min: 24, max: 32 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 },
        footnote: { default: 16, min: 14, max: 18 }
      },

      // Line height ratios
      lineHeightRatios: {
        title: 1.2,
        heading: 1.3,
        body: 1.4,
        caption: 1.5,
        list: 1.6
      },

      // Spacing system (8px base)
      spacing: {
        base: 8,
        multipliers: [0.5, 1, 2, 3, 4, 6, 8]
      },

      // Color contrast standards
      contrastStandards: {
        AA: 4.5,
        AAA: 7.0,
        large: 3.0  // For text 18pt+ or 14pt+ bold
      },

      // Accessibility minimums
      accessibility: {
        minFontSizes: {
          title: 28, heading: 24, body: 18, caption: 16
        },
        minLineHeight: 1.5,
        minLetterSpacing: 0.12  // 12% of font size
      },

      // Adjustment factors
      factors: {
        content: {
          short: 1.0,     // <= 50 chars
          medium: 0.95,   // 51-150 chars
          long: 0.85,     // 151-300 chars
          veryLong: 0.75  // 300+ chars
        },
        distance: {
          close: 0.9,     // Personal viewing
          medium: 1.0,    // Meeting room
          far: 1.3        // Large hall
        },
        importance: {
          high: 1.15,
          medium: 1.0,
          low: 0.9
        }
      }
    };
  }

  /**
   * Calculate responsive font size based on multiple factors
   * @param {Object} options - Font size calculation options
   * @returns {number} Calculated font size in points
   */
  calculateResponsiveFontSize(options) {
    const {
      baseSize,
      slideWidth,
      slideHeight,
      contentLength = 0,
      viewingDistance = 'medium',
      importance = 'medium',
      contentType = 'body'
    } = options;

    // Validate inputs
    if (!baseSize || !slideWidth || !slideHeight) {
      throw new Error('Required parameters: baseSize, slideWidth, slideHeight');
    }

    // Calculate scale ratio based on slide dimensions
    const scaleRatio = this.calculateScaleRatio(slideWidth, slideHeight);

    // Get adjustment factors
    const contentFactor = this.getContentLengthFactor(contentLength);
    const distanceFactor = this.getViewingDistanceFactor(viewingDistance);
    const importanceFactor = this.getImportanceFactor(importance);

    // Calculate final size
    const calculatedSize = baseSize * scaleRatio * contentFactor * distanceFactor * importanceFactor;

    // Apply constraints
    const fontConfig = this.constants.fontHierarchy[contentType] || this.constants.fontHierarchy.body;
    const constrainedSize = Math.max(
      fontConfig.min,
      Math.min(fontConfig.max, Math.round(calculatedSize))
    );

    // Ensure accessibility minimum
    const accessibilityMin = this.constants.accessibility.minFontSizes[contentType] || 14;
    return Math.max(accessibilityMin, constrainedSize);
  }

  /**
   * Calculate scale ratio based on slide dimensions
   * @param {number} slideWidth - Slide width in points
   * @param {number} slideHeight - Slide height in points
   * @returns {number} Scale ratio
   */
  calculateScaleRatio(slideWidth, slideHeight) {
    const { width: stdWidth, height: stdHeight } = this.constants.standardDimensions;
    
    const widthRatio = slideWidth / stdWidth;
    const heightRatio = slideHeight / stdHeight;
    
    // Use minimum ratio to ensure content fits
    return Math.min(widthRatio, heightRatio);
  }

  /**
   * Get content length adjustment factor
   * @param {number} contentLength - Character count
   * @returns {number} Adjustment factor
   */
  getContentLengthFactor(contentLength) {
    const factors = this.constants.factors.content;
    
    if (contentLength <= 50) return factors.short;
    if (contentLength <= 150) return factors.medium;
    if (contentLength <= 300) return factors.long;
    return factors.veryLong;
  }

  /**
   * Get viewing distance adjustment factor
   * @param {string} distance - Distance category
   * @returns {number} Adjustment factor
   */
  getViewingDistanceFactor(distance) {
    return this.constants.factors.distance[distance] || this.constants.factors.distance.medium;
  }

  /**
   * Get importance adjustment factor
   * @param {string} importance - Importance level
   * @returns {number} Adjustment factor
   */
  getImportanceFactor(importance) {
    return this.constants.factors.importance[importance] || this.constants.factors.importance.medium;
  }

  /**
   * Calculate optimal line height for text
   * @param {number} fontSize - Font size in points
   * @param {string} contentType - Content type
   * @returns {number} Line height
   */
  calculateLineHeight(fontSize, contentType = 'body') {
    const baseRatio = this.constants.lineHeightRatios[contentType] || 
                     this.constants.lineHeightRatios.body;

    // Small fonts need proportionally more line height
    const sizeAdjustment = fontSize < 20 ? 0.1 : 0;
    
    const calculatedHeight = (baseRatio + sizeAdjustment) * fontSize;
    
    // Ensure accessibility minimum
    const minHeight = this.constants.accessibility.minLineHeight * fontSize;
    
    return Math.max(minHeight, calculatedHeight);
  }

  /**
   * Calculate responsive margins based on slide dimensions
   * @param {number} slideWidth - Slide width
   * @param {number} slideHeight - Slide height  
   * @param {Object} options - Margin calculation options
   * @returns {Object} Margin configuration
   */
  calculateResponsiveMargins(slideWidth, slideHeight, options = {}) {
    const {
      baseMargin = this.constants.spacing.base * 4, // 32px default
      marginRatio = 1.3, // Horizontal margins are 30% larger
      minMargin = this.constants.spacing.base,
      maxMargin = this.constants.spacing.base * 10
    } = options;

    const scaleRatio = this.calculateScaleRatio(slideWidth, slideHeight);
    const scaledMargin = baseMargin * scaleRatio;

    // Clamp margins to reasonable bounds
    const clampedMargin = Math.max(minMargin, Math.min(maxMargin, scaledMargin));

    return {
      top: Math.round(clampedMargin),
      right: Math.round(clampedMargin * marginRatio),
      bottom: Math.round(clampedMargin),
      left: Math.round(clampedMargin * marginRatio)
    };
  }

  /**
   * Calculate paragraph and list spacing
   * @param {number} fontSize - Base font size
   * @param {string} spacingType - Type of spacing
   * @returns {number} Spacing value
   */
  calculateTextSpacing(fontSize, spacingType = 'paragraph') {
    const spacingMultipliers = {
      paragraph: 1.75,    // Space between paragraphs
      listItem: 0.75,     // Space between list items
      section: 2.5,       // Space between sections
      title: 1.25         // Space after title
    };

    const multiplier = spacingMultipliers[spacingType] || spacingMultipliers.paragraph;
    return Math.round(fontSize * multiplier);
  }

  /**
   * Calculate grid system parameters
   * @param {Object} slideConfig - Slide configuration
   * @returns {Object} Grid configuration
   */
  calculateGridSystem(slideConfig) {
    const {
      width,
      height,
      columns = 12,
      gutterRatio = 0.025 // 2.5% of width
    } = slideConfig;

    const margins = this.calculateResponsiveMargins(width, height);
    const contentWidth = width - margins.left - margins.right;
    const contentHeight = height - margins.top - margins.bottom;
    
    const gutter = Math.round(width * gutterRatio);
    const columnWidth = (contentWidth - (gutter * (columns - 1))) / columns;

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      margins,
      columns,
      gutter,
      columnWidth,
      
      // Helper functions
      getColumnSpan: (startCol, spanCols = 1) => {
        return {
          x: margins.left + ((startCol - 1) * (columnWidth + gutter)),
          width: (columnWidth * spanCols) + (gutter * (spanCols - 1))
        };
      },

      getRowSpan: (startRow, spanRows = 1, totalRows = 1) => {
        const rowHeight = contentHeight / totalRows;
        return {
          y: margins.top + ((startRow - 1) * rowHeight),
          height: rowHeight * spanRows
        };
      }
    };
  }

  /**
   * Calculate color contrast ratio
   * @param {string} foreground - Foreground color (hex)
   * @param {string} background - Background color (hex)
   * @returns {number} Contrast ratio
   */
  calculateContrastRatio(foreground, background) {
    const fgLuminance = this.calculateLuminance(foreground);
    const bgLuminance = this.calculateLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   * @param {string} color - Color in hex format
   * @returns {number} Relative luminance
   */
  calculateLuminance(color) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Validate color accessibility
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {number} fontSize - Font size
   * @param {boolean} isBold - Is text bold
   * @returns {Object} Accessibility validation result
   */
  validateColorAccessibility(foreground, background, fontSize, isBold = false) {
    const contrastRatio = this.calculateContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);

    const minRequired = isLargeText ? 
      this.constants.contrastStandards.large : 
      this.constants.contrastStandards.AA;

    return {
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      meetsAA: contrastRatio >= this.constants.contrastStandards.AA,
      meetsAAA: contrastRatio >= this.constants.contrastStandards.AAA,
      meetsLarge: contrastRatio >= this.constants.contrastStandards.large,
      isCompliant: contrastRatio >= minRequired,
      isLargeText,
      minRequired,
      recommendation: this.getContrastRecommendation(contrastRatio, minRequired)
    };
  }

  /**
   * Get contrast improvement recommendations
   * @param {number} currentRatio - Current contrast ratio
   * @param {number} requiredRatio - Required ratio
   * @returns {string} Recommendation text
   */
  getContrastRecommendation(currentRatio, requiredRatio) {
    if (currentRatio >= requiredRatio) {
      return 'Contrast ratio meets accessibility standards';
    }

    const deficit = requiredRatio - currentRatio;
    if (deficit <= 1) {
      return 'Minor contrast adjustment needed';
    } else if (deficit <= 2) {
      return 'Moderate contrast improvement required';
    } else {
      return 'Significant contrast enhancement needed';
    }
  }

  /**
   * Calculate optimal element positioning
   * @param {Object} layoutConfig - Layout configuration
   * @returns {Object} Position calculations
   */
  calculateElementPositioning(layoutConfig) {
    const {
      layoutType,
      elementCount,
      slideWidth,
      slideHeight,
      contentPadding = this.constants.spacing.base
    } = layoutConfig;

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

    return {
      positions,
      grid,
      totalElements: positions.length
    };
  }

  /**
   * Calculate positions for single column layout
   * @param {Object} grid - Grid system
   * @param {number} elementCount - Number of elements
   * @param {number} padding - Content padding
   * @returns {Array} Position array
   */
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
        column: 1,
        row: i + 1
      });
    }

    return positions;
  }

  /**
   * Calculate positions for double column layout
   * @param {Object} grid - Grid system
   * @param {number} elementCount - Number of elements
   * @param {number} padding - Content padding
   * @returns {Array} Position array
   */
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
        column: columnIndex + 1,
        row: rowIndex + 1
      });
    }

    return positions;
  }

  /**
   * Calculate positions for three column layout
   * @param {Object} grid - Grid system
   * @param {number} elementCount - Number of elements
   * @param {number} padding - Content padding
   * @returns {Array} Position array
   */
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
        column: columnIndex + 1,
        row: rowIndex + 1
      });
    }

    return positions;
  }

  /**
   * Calculate positions for title-content layout
   * @param {Object} grid - Grid system
   * @param {number} elementCount - Number of elements
   * @param {number} padding - Content padding
   * @returns {Array} Position array
   */
  calculateTitleContentPositions(grid, elementCount, padding) {
    const positions = [];
    
    if (elementCount === 0) return positions;

    // Title takes 20% of height
    const titleHeight = grid.contentHeight * 0.2;
    const contentHeight = grid.contentHeight * 0.8 - padding;
    const contentElementHeight = elementCount > 1 ? 
      (contentHeight - (padding * (elementCount - 2))) / (elementCount - 1) : 
      contentHeight;

    // Title position
    positions.push({
      x: grid.margins.left,
      y: grid.margins.top,
      width: grid.contentWidth,
      height: titleHeight,
      column: 1,
      row: 1,
      type: 'title'
    });

    // Content positions
    for (let i = 1; i < elementCount; i++) {
      positions.push({
        x: grid.margins.left,
        y: grid.margins.top + titleHeight + padding + ((i - 1) * (contentElementHeight + padding)),
        width: grid.contentWidth,
        height: contentElementHeight,
        column: 1,
        row: i + 1,
        type: 'content'
      });
    }

    return positions;
  }

  /**
   * Get design recommendations based on content analysis
   * @param {Object} content - Content to analyze
   * @returns {Object} Design recommendations
   */
  getDesignRecommendations(content) {
    const {
      textContent = '',
      slideCount = 1,
      presentationType = 'general',
      audienceSize = 'medium'
    } = content;

    const recommendations = {
      fontSize: this.recommendFontSize(textContent, presentationType, audienceSize),
      layout: this.recommendLayout(textContent, slideCount),
      spacing: this.recommendSpacing(textContent.length),
      colors: this.recommendColors(presentationType),
      accessibility: this.getAccessibilityRecommendations(textContent)
    };

    return recommendations;
  }

  /**
   * Recommend font size based on content and context
   * @param {string} textContent - Text content
   * @param {string} presentationType - Presentation type
   * @param {string} audienceSize - Audience size
   * @returns {Object} Font size recommendations
   */
  recommendFontSize(textContent, presentationType, audienceSize) {
    const baseAdjustments = {
      corporate: 0.9,
      educational: 1.0,
      creative: 1.1
    };

    const audienceAdjustments = {
      small: 0.9,
      medium: 1.0,
      large: 1.2
    };

    const baseMultiplier = (baseAdjustments[presentationType] || 1.0) * 
                          (audienceAdjustments[audienceSize] || 1.0);

    return {
      title: Math.round(this.constants.fontHierarchy.title.default * baseMultiplier),
      heading: Math.round(this.constants.fontHierarchy.heading.default * baseMultiplier),
      body: Math.round(this.constants.fontHierarchy.body.default * baseMultiplier),
      multiplier: baseMultiplier
    };
  }

  /**
   * Recommend layout based on content characteristics
   * @param {string} textContent - Text content
   * @param {number} slideCount - Number of slides
   * @returns {string} Recommended layout
   */
  recommendLayout(textContent, slideCount) {
    const contentLength = textContent.length;
    const wordsPerSlide = contentLength / slideCount / 5; // Rough word estimate

    if (wordsPerSlide < 20) return 'single-column';
    if (wordsPerSlide < 50) return 'double-column';
    return 'title-content';
  }

  /**
   * Recommend spacing based on content density
   * @param {number} contentLength - Content character count
   * @returns {Object} Spacing recommendations
   */
  recommendSpacing(contentLength) {
    const density = contentLength > 500 ? 'high' : contentLength > 200 ? 'medium' : 'low';
    
    const spacingMultipliers = {
      low: 1.2,    // More breathing room
      medium: 1.0, // Standard spacing
      high: 0.8    // Tighter spacing
    };

    const multiplier = spacingMultipliers[density];

    return {
      margins: Math.round(this.constants.spacing.base * 4 * multiplier),
      padding: Math.round(this.constants.spacing.base * 2 * multiplier),
      lineHeight: multiplier,
      density
    };
  }

  /**
   * Recommend colors based on presentation type
   * @param {string} presentationType - Type of presentation
   * @returns {Object} Color recommendations
   */
  recommendColors(presentationType) {
    const colorSchemes = {
      corporate: {
        primary: '#1565c0',
        secondary: '#424242',
        background: '#ffffff',
        text: '#212121'
      },
      educational: {
        primary: '#2196f3',
        secondary: '#ff9800',
        background: '#fafafa',
        text: '#212121'
      },
      creative: {
        primary: '#9c27b0',
        secondary: '#ff5722',
        background: '#f3e5f5',
        text: '#4a148c'
      }
    };

    return colorSchemes[presentationType] || colorSchemes.educational;
  }

  /**
   * Get accessibility recommendations
   * @param {string} textContent - Text content
   * @returns {Array} Accessibility recommendations
   */
  getAccessibilityRecommendations(textContent) {
    const recommendations = [];
    
    // Font size recommendations
    recommendations.push({
      category: 'Typography',
      suggestion: 'Use minimum 18pt font for body text',
      priority: 'high'
    });

    // Contrast recommendations
    recommendations.push({
      category: 'Color',
      suggestion: 'Ensure 4.5:1 contrast ratio for normal text',
      priority: 'high'
    });

    // Line height recommendations
    recommendations.push({
      category: 'Spacing',
      suggestion: 'Use 1.5x line height minimum',
      priority: 'medium'
    });

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

// Global export for Google Apps Script