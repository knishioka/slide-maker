/**
 * Responsive Engine for Google Slides Layout System
 * Handles breakpoint-based responsive behavior and adaptive content redistribution
 */
class ResponsiveEngine {
  constructor() {
    this.breakpoints = {
      xs: { maxWidth: 480, label: 'Extra Small' },
      sm: { maxWidth: 768, label: 'Small' },
      md: { maxWidth: 1024, label: 'Medium' },
      lg: { maxWidth: 1440, label: 'Large' },
      xl: { minWidth: 1441, label: 'Extra Large' }
    };

    this.defaultResponsiveConfig = {
      xs: { columns: 1, fontSize: 0.7, spacing: 0.8 },
      sm: { columns: 1, fontSize: 0.8, spacing: 0.9 },
      md: { columns: 2, fontSize: 0.9, spacing: 1.0 },
      lg: { columns: 3, fontSize: 1.0, spacing: 1.0 },
      xl: { columns: 4, fontSize: 1.1, spacing: 1.1 }
    };
  }

  /**
   * Determine current breakpoint based on slide dimensions
   * @param {number} width - Slide width
   * @param {number} height - Slide height
   * @returns {Object} Current breakpoint information
   */
  getCurrentBreakpoint(width, height) {
    for (const [key, config] of Object.entries(this.breakpoints)) {
      if (config.maxWidth && width <= config.maxWidth) {
        return { key, ...config, width, height };
      } else if (config.minWidth && width >= config.minWidth) {
        return { key, ...config, width, height };
      }
    }
    return { key: 'md', ...this.breakpoints.md, width, height };
  }

  /**
   * Create responsive layout configuration
   * @param {Object} baseConfig - Base layout configuration
   * @param {Object} slideDimensions - Current slide dimensions
   * @returns {Object} Responsive layout configuration
   */
  createResponsiveLayout(baseConfig, slideDimensions) {
    const currentBreakpoint = this.getCurrentBreakpoint(slideDimensions.width, slideDimensions.height);
    const responsiveConfig = this.getResponsiveConfig(currentBreakpoint.key);

    return {
      ...baseConfig,
      breakpoint: currentBreakpoint,
      responsive: responsiveConfig,
      adaptedConfig: this.adaptConfigToBreakpoint(baseConfig, responsiveConfig),
      scalingFactors: this.calculateScalingFactors(slideDimensions, currentBreakpoint.key)
    };
  }

  /**
   * Get responsive configuration for breakpoint
   * @param {string} breakpointKey - Breakpoint identifier
   * @returns {Object} Responsive configuration
   */
  getResponsiveConfig(breakpointKey) {
    return this.defaultResponsiveConfig[breakpointKey] || this.defaultResponsiveConfig.md;
  }

  /**
   * Adapt base configuration to current breakpoint
   * @param {Object} baseConfig - Original configuration
   * @param {Object} responsiveConfig - Responsive settings
   * @returns {Object} Adapted configuration
   */
  adaptConfigToBreakpoint(baseConfig, responsiveConfig) {
    const adapted = { ...baseConfig };

    // Adjust columns
    if (responsiveConfig.columns) {
      adapted.columns = Math.min(baseConfig.columns || 1, responsiveConfig.columns);
    }

    // Adapt grid areas for smaller screens
    if (baseConfig.areas && responsiveConfig.columns < 3) {
      adapted.areas = this.redistributeGridAreas(baseConfig.areas, responsiveConfig.columns);
    }

    // Adjust spacing
    if (responsiveConfig.spacing) {
      adapted.spacing = this.scaleSpacing(baseConfig.spacing || {}, responsiveConfig.spacing);
    }

    return adapted;
  }

  /**
   * Redistribute grid areas for different column counts
   * @param {Object} originalAreas - Original grid area definitions
   * @param {number} targetColumns - Target number of columns
   * @returns {Object} Redistributed grid areas
   */
  redistributeGridAreas(originalAreas, targetColumns) {
    if (!originalAreas || targetColumns >= 3) return originalAreas;

    const redistributed = {};
    let currentRow = 1;

    // For single column layout, stack everything vertically
    if (targetColumns === 1) {
      Object.keys(originalAreas).forEach((areaName, index) => {
        redistributed[areaName] = `${currentRow} / 1 / ${currentRow + 1} / 2`;
        currentRow++;
      });
      return redistributed;
    }

    // For two-column layout, redistribute intelligently
    if (targetColumns === 2) {
      const areaNames = Object.keys(originalAreas);
      const leftColumn = [];
      const rightColumn = [];

      // Distribute areas alternately or by importance
      areaNames.forEach((name, index) => {
        if (index % 2 === 0) {
          leftColumn.push(name);
        } else {
          rightColumn.push(name);
        }
      });

      let leftRow = 1;
      leftColumn.forEach(name => {
        redistributed[name] = `${leftRow} / 1 / ${leftRow + 1} / 2`;
        leftRow++;
      });

      let rightRow = 1;
      rightColumn.forEach(name => {
        redistributed[name] = `${rightRow} / 2 / ${rightRow + 1} / 3`;
        rightRow++;
      });
    }

    return redistributed;
  }

  /**
   * Scale spacing values based on responsive factor
   * @param {Object} baseSpacing - Base spacing configuration
   * @param {number} scaleFactor - Scaling factor
   * @returns {Object} Scaled spacing configuration
   */
  scaleSpacing(baseSpacing, scaleFactor) {
    const scaled = {};
    
    Object.entries(baseSpacing).forEach(([key, value]) => {
      if (typeof value === 'number') {
        scaled[key] = Math.round(value * scaleFactor);
      } else if (typeof value === 'object') {
        scaled[key] = this.scaleSpacing(value, scaleFactor);
      } else {
        scaled[key] = value;
      }
    });

    return scaled;
  }

  /**
   * Calculate scaling factors for different elements
   * @param {Object} slideDimensions - Current slide dimensions
   * @param {string} breakpointKey - Current breakpoint
   * @returns {Object} Scaling factors
   */
  calculateScalingFactors(slideDimensions, breakpointKey) {
    const { width, height } = slideDimensions;
    const responsiveConfig = this.getResponsiveConfig(breakpointKey);

    // Base dimensions for scaling calculations
    const baseWidth = 1920;
    const baseHeight = 1080;

    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const uniformScale = Math.min(widthScale, heightScale);

    return {
      width: widthScale,
      height: heightScale,
      uniform: uniformScale,
      fontSize: responsiveConfig.fontSize * uniformScale,
      spacing: responsiveConfig.spacing * uniformScale,
      content: this.calculateContentScaling(width, height, breakpointKey)
    };
  }

  /**
   * Calculate content-specific scaling factors
   * @param {number} width - Slide width
   * @param {number} height - Slide height
   * @param {string} breakpointKey - Current breakpoint
   * @returns {Object} Content scaling factors
   */
  calculateContentScaling(width, height, breakpointKey) {
    const area = width * height;
    const aspectRatio = width / height;

    // Adjust content density based on screen size and aspect ratio
    let densityFactor = 1.0;
    if (breakpointKey === 'xs' || breakpointKey === 'sm') {
      densityFactor = 0.8; // Less dense on small screens
    } else if (breakpointKey === 'xl') {
      densityFactor = 1.2; // More dense on large screens
    }

    // Aspect ratio adjustments
    let aspectFactor = 1.0;
    if (aspectRatio > 2.0) {
      aspectFactor = 1.1; // Ultra-wide screens
    } else if (aspectRatio < 1.3) {
      aspectFactor = 0.9; // Square-ish screens
    }

    return {
      density: densityFactor,
      aspect: aspectFactor,
      combined: densityFactor * aspectFactor
    };
  }

  /**
   * Optimize content for mobile viewing
   * @param {Array} content - Content items
   * @param {Object} mobileConfig - Mobile-specific configuration
   * @returns {Array} Optimized content
   */
  optimizeContentForMobile(content, mobileConfig) {
    return content.map(item => {
      const optimized = { ...item };

      // Simplify complex content types
      if (item.type === 'table' && item.columns > 3) {
        optimized.type = 'list';
        optimized.text = this.convertTableToList(item);
      }

      // Shorten long text content
      if (item.text && item.text.length > 200) {
        optimized.text = this.summarizeText(item.text, 150);
        optimized.truncated = true;
      }

      // Increase font sizes for readability
      if (item.fontSize) {
        optimized.fontSize = Math.max(item.fontSize * 1.2, 18);
      }

      return optimized;
    });
  }

  /**
   * Convert table to list format for mobile
   * @param {Object} tableItem - Table content item
   * @returns {string} List-formatted text
   */
  convertTableToList(tableItem) {
    if (!tableItem.data || !Array.isArray(tableItem.data)) {
      return tableItem.text || '';
    }

    return tableItem.data.map((row, index) => {
      if (index === 0) return `Header: ${row.join(', ')}`;
      return `• ${row.join(': ')}`;
    }).join('\n');
  }

  /**
   * Summarize text for mobile display
   * @param {string} text - Original text
   * @param {number} maxLength - Maximum length
   * @returns {string} Summarized text
   */
  summarizeText(text, maxLength) {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  /**
   * Generate responsive CSS-like media queries for slide layouts
   * @param {Object} layoutConfig - Layout configuration
   * @returns {Object} Media query equivalent rules
   */
  generateMediaQueries(layoutConfig) {
    const queries = {};

    Object.entries(this.breakpoints).forEach(([key, breakpoint]) => {
      const config = this.getResponsiveConfig(key);
      queries[key] = {
        condition: breakpoint.maxWidth ? `max-width: ${breakpoint.maxWidth}px` : `min-width: ${breakpoint.minWidth}px`,
        rules: {
          columns: config.columns,
          fontSize: `${config.fontSize}em`,
          spacing: `${config.spacing}rem`,
          layout: this.getOptimalLayoutForBreakpoint(key, layoutConfig)
        }
      };
    });

    return queries;
  }

  /**
   * Get optimal layout pattern for breakpoint
   * @param {string} breakpointKey - Breakpoint identifier
   * @param {Object} baseLayout - Base layout configuration
   * @returns {string} Optimal layout type
   */
  getOptimalLayoutForBreakpoint(breakpointKey, baseLayout) {
    const responsiveConfig = this.getResponsiveConfig(breakpointKey);

    if (responsiveConfig.columns === 1) {
      return 'single-column';
    } else if (responsiveConfig.columns === 2) {
      return 'double-column';
    } else if (responsiveConfig.columns >= 3) {
      return baseLayout.type || 'three-column';
    }

    return 'single-column';
  }

  /**
   * Get performance-optimized configuration for large content
   * @param {Object} config - Base configuration
   * @param {number} itemCount - Number of content items
   * @returns {Object} Performance-optimized configuration
   */
  getPerformanceOptimizedConfig(config, itemCount) {
    const optimized = { ...config };

    // Reduce complexity for large content sets
    if (itemCount > 20) {
      optimized.animations = false;
      optimized.shadows = false;
      optimized.gradients = false;
    }

    if (itemCount > 50) {
      optimized.lazyLoading = true;
      optimized.virtualScrolling = true;
    }

    return optimized;
  }
}

// Export for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveEngine;
}