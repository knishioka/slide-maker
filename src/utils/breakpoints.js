/**
 * Responsive Breakpoint Management for Google Slides Layout System
 * Handles viewport-based responsive behavior and adaptive content strategies
 */
class BreakpointManager {
  constructor() {
    this.breakpoints = {
      xs: { 
        maxWidth: 480, 
        label: 'Extra Small',
        description: 'Mobile phones portrait',
        columns: 1,
        fontSize: 0.7,
        spacing: 0.8,
        margins: 0.6
      },
      sm: { 
        maxWidth: 768, 
        label: 'Small',
        description: 'Mobile phones landscape, small tablets',
        columns: 1,
        fontSize: 0.8,
        spacing: 0.9,
        margins: 0.8
      },
      md: { 
        maxWidth: 1024, 
        label: 'Medium',
        description: 'Tablets, small desktops',
        columns: 2,
        fontSize: 0.9,
        spacing: 1.0,
        margins: 1.0
      },
      lg: { 
        maxWidth: 1440, 
        label: 'Large',
        description: 'Desktops, laptops',
        columns: 3,
        fontSize: 1.0,
        spacing: 1.0,
        margins: 1.2
      },
      xl: { 
        minWidth: 1441, 
        label: 'Extra Large',
        description: 'Large desktops, wide screens',
        columns: 4,
        fontSize: 1.1,
        spacing: 1.1,
        margins: 1.4
      }
    };

    this.contentStrategies = {
      xs: { priority: 'readability', density: 'low' },
      sm: { priority: 'readability', density: 'low' },
      md: { priority: 'balanced', density: 'medium' },
      lg: { priority: 'content', density: 'medium' },
      xl: { priority: 'content', density: 'high' }
    };
  }

  /**
   * Determine current breakpoint based on dimensions
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   * @returns {Object} Current breakpoint information
   */
  getCurrentBreakpoint(width, height) {
    // Determine breakpoint based on width
    for (const [key, config] of Object.entries(this.breakpoints)) {
      if (config.maxWidth && width <= config.maxWidth) {
        return { 
          key, 
          ...config, 
          actualWidth: width, 
          actualHeight: height,
          aspectRatio: width / height 
        };
      } else if (config.minWidth && width >= config.minWidth) {
        return { 
          key, 
          ...config, 
          actualWidth: width, 
          actualHeight: height,
          aspectRatio: width / height 
        };
      }
    }

    // Default to medium if no match
    return { 
      key: 'md', 
      ...this.breakpoints.md, 
      actualWidth: width, 
      actualHeight: height,
      aspectRatio: width / height 
    };
  }

  /**
   * Get breakpoint configuration
   * @param {string} breakpointKey - Breakpoint identifier
   * @returns {Object} Breakpoint configuration
   */
  getBreakpointConfig(breakpointKey) {
    return this.breakpoints[breakpointKey] || this.breakpoints.md;
  }

  /**
   * Calculate responsive scaling factors
   * @param {Object} currentBreakpoint - Current breakpoint info
   * @param {Object} baseConfig - Base configuration
   * @returns {Object} Scaling factors
   */
  calculateScalingFactors(currentBreakpoint, baseConfig = {}) {
    const { actualWidth, actualHeight, fontSize, spacing, margins } = currentBreakpoint;
    
    // Base reference dimensions (standard presentation size)
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    // Calculate dimensional scaling
    const widthScale = actualWidth / baseWidth;
    const heightScale = actualHeight / baseHeight;
    const uniformScale = Math.min(widthScale, heightScale);
    
    // Apply breakpoint-specific adjustments
    const responsiveScale = {
      fontSize: fontSize * uniformScale,
      spacing: spacing * uniformScale,
      margins: margins * uniformScale,
      uniform: uniformScale,
      width: widthScale,
      height: heightScale
    };

    // Content density adjustments
    const strategy = this.contentStrategies[currentBreakpoint.key];
    if (strategy.density === 'low') {
      responsiveScale.contentDensity = 0.7;
    } else if (strategy.density === 'high') {
      responsiveScale.contentDensity = 1.3;
    } else {
      responsiveScale.contentDensity = 1.0;
    }

    return responsiveScale;
  }

  /**
   * Adapt layout configuration to breakpoint
   * @param {Object} layoutConfig - Original layout configuration
   * @param {Object} breakpoint - Target breakpoint
   * @returns {Object} Adapted layout configuration
   */
  adaptLayoutToBreakpoint(layoutConfig, breakpoint) {
    const adapted = { ...layoutConfig };
    const breakpointConfig = this.getBreakpointConfig(breakpoint.key);
    
    // Adjust column count
    adapted.columns = Math.min(layoutConfig.columns || 12, breakpointConfig.columns);
    
    // Adjust spacing
    if (layoutConfig.gap) {
      adapted.gap = Math.round(layoutConfig.gap * breakpointConfig.spacing);
    }
    
    // Adjust margins
    if (layoutConfig.margins) {
      adapted.margins = {
        top: Math.round(layoutConfig.margins.top * breakpointConfig.margins),
        right: Math.round(layoutConfig.margins.right * breakpointConfig.margins),
        bottom: Math.round(layoutConfig.margins.bottom * breakpointConfig.margins),
        left: Math.round(layoutConfig.margins.left * breakpointConfig.margins)
      };
    }

    // Simplify areas for small screens
    if (breakpoint.key === 'xs' || breakpoint.key === 'sm') {
      adapted.areas = this.simplifyAreasForMobile(layoutConfig.areas);
    }

    return adapted;
  }

  /**
   * Simplify grid areas for mobile viewing
   * @param {Object} areas - Original grid areas
   * @returns {Object} Simplified areas
   */
  simplifyAreasForMobile(areas) {
    if (!areas) return areas;

    const simplified = {};
    let currentRow = 1;

    // Stack all areas vertically on mobile
    Object.keys(areas).forEach((areaName) => {
      simplified[areaName] = `${currentRow} / 1 / ${currentRow + 1} / 2`;
      currentRow++;
    });

    return simplified;
  }

  /**
   * Get optimal font sizes for breakpoint
   * @param {string} breakpointKey - Breakpoint identifier
   * @param {Object} baseFontSizes - Base font size configuration
   * @returns {Object} Scaled font sizes
   */
  getResponsiveFontSizes(breakpointKey, baseFontSizes) {
    const breakpointConfig = this.getBreakpointConfig(breakpointKey);
    const scaleFactor = breakpointConfig.fontSize;

    const scaledSizes = {};
    Object.entries(baseFontSizes).forEach(([type, config]) => {
      if (typeof config === 'object' && config.default) {
        scaledSizes[type] = {
          ...config,
          default: Math.round(config.default * scaleFactor),
          min: Math.round(config.min * scaleFactor),
          max: Math.round(config.max * scaleFactor)
        };
      } else {
        scaledSizes[type] = Math.round(config * scaleFactor);
      }
    });

    return scaledSizes;
  }

  /**
   * Generate responsive CSS-like media queries
   * @param {Object} layoutRules - Layout rules to apply
   * @returns {Object} Media query rules
   */
  generateMediaQueries(layoutRules = {}) {
    const queries = {};

    Object.entries(this.breakpoints).forEach(([key, breakpoint]) => {
      const condition = breakpoint.maxWidth 
        ? `(max-width: ${breakpoint.maxWidth}px)`
        : `(min-width: ${breakpoint.minWidth}px)`;

      queries[key] = {
        condition,
        breakpoint: breakpoint.label,
        rules: {
          columns: breakpoint.columns,
          fontSize: `${breakpoint.fontSize}em`,
          spacing: `${breakpoint.spacing}rem`,
          margins: `${breakpoint.margins}rem`,
          ...layoutRules[key]
        }
      };
    });

    return queries;
  }

  /**
   * Determine optimal layout type for content and breakpoint
   * @param {Array} content - Content items
   * @param {string} breakpointKey - Current breakpoint
   * @returns {string} Optimal layout type
   */
  getOptimalLayoutType(content, breakpointKey) {
    const contentCount = content.length;
    const breakpointConfig = this.getBreakpointConfig(breakpointKey);
    const maxColumns = breakpointConfig.columns;

    // Single item - always single column
    if (contentCount === 1) {
      return 'single-column';
    }

    // Mobile devices - prefer single column
    if (breakpointKey === 'xs' || breakpointKey === 'sm') {
      return 'single-column';
    }

    // Medium screens - dual column for 2-4 items
    if (breakpointKey === 'md') {
      if (contentCount <= 2) return 'double-column';
      if (contentCount <= 4) return 'quad-grid';
      return 'responsive-grid';
    }

    // Large screens - more flexible layouts
    if (breakpointKey === 'lg' || breakpointKey === 'xl') {
      if (contentCount === 2) return 'double-column';
      if (contentCount === 3) return 'triple-column';
      if (contentCount === 4) return 'quad-grid';
      if (contentCount <= 6) return 'feature-showcase';
      return 'responsive-grid';
    }

    return 'responsive-grid';
  }

  /**
   * Calculate content adaptation for breakpoint
   * @param {Array} content - Original content
   * @param {string} breakpointKey - Target breakpoint
   * @returns {Array} Adapted content
   */
  adaptContentForBreakpoint(content, breakpointKey) {
    const strategy = this.contentStrategies[breakpointKey];
    
    if (strategy.priority === 'readability') {
      return this.optimizeForReadability(content);
    } else if (strategy.priority === 'content') {
      return this.optimizeForContent(content);
    }
    
    return content; // Balanced approach - no major changes
  }

  /**
   * Optimize content for readability (mobile focus)
   * @param {Array} content - Original content
   * @returns {Array} Readability-optimized content
   */
  optimizeForReadability(content) {
    return content.map(item => {
      const optimized = { ...item };

      // Increase font sizes for mobile
      if (item.fontSize) {
        optimized.fontSize = Math.max(item.fontSize * 1.2, 18);
      }

      // Shorten long text
      if (item.text && item.text.length > 150) {
        optimized.text = this.truncateText(item.text, 120);
        optimized.truncated = true;
      }

      // Simplify complex elements
      if (item.type === 'table') {
        optimized.type = 'list';
        optimized.text = this.convertTableToList(item);
      }

      return optimized;
    });
  }

  /**
   * Optimize content for maximum content display
   * @param {Array} content - Original content
   * @returns {Array} Content-optimized version
   */
  optimizeForContent(content) {
    return content.map(item => {
      const optimized = { ...item };

      // Reduce font sizes slightly to fit more content
      if (item.fontSize) {
        optimized.fontSize = Math.max(item.fontSize * 0.9, 14);
      }

      // Reduce spacing between elements
      optimized.spacing = (item.spacing || 1) * 0.8;

      return optimized;
    });
  }

  /**
   * Truncate text intelligently
   * @param {string} text - Original text
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  /**
   * Convert table data to list format
   * @param {Object} tableItem - Table content item
   * @returns {string} List-formatted text
   */
  convertTableToList(tableItem) {
    if (!tableItem.data || !Array.isArray(tableItem.data)) {
      return tableItem.text || 'No data available';
    }

    return tableItem.data.map((row, index) => {
      if (index === 0) return `📋 ${row.join(' | ')}`;
      return `• ${row.join(': ')}`;
    }).join('\n');
  }

  /**
   * Get breakpoint transition thresholds
   * @returns {Object} Transition thresholds for smooth scaling
   */
  getTransitionThresholds() {
    const thresholds = {};
    
    Object.entries(this.breakpoints).forEach(([key, config]) => {
      thresholds[key] = {
        enter: config.maxWidth ? config.maxWidth - 50 : config.minWidth + 50,
        exit: config.maxWidth || config.minWidth,
        smoothing: 50 // pixels for smooth transition
      };
    });

    return thresholds;
  }

  /**
   * Validate responsive configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateResponsiveConfig(config) {
    const errors = [];
    const warnings = [];

    // Check required breakpoints
    const requiredBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
    requiredBreakpoints.forEach(bp => {
      if (!config[bp]) {
        warnings.push(`Missing breakpoint configuration: ${bp}`);
      }
    });

    // Validate breakpoint order
    const widths = Object.values(config)
      .filter(bp => bp.maxWidth)
      .map(bp => bp.maxWidth)
      .sort((a, b) => a - b);
    
    if (widths.length !== [...new Set(widths)].length) {
      errors.push('Duplicate breakpoint widths detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get breakpoint performance recommendations
   * @param {string} breakpointKey - Breakpoint to analyze
   * @param {number} contentCount - Number of content items
   * @returns {Object} Performance recommendations
   */
  getPerformanceRecommendations(breakpointKey, contentCount) {
    const recommendations = [];

    if (breakpointKey === 'xs' || breakpointKey === 'sm') {
      if (contentCount > 5) {
        recommendations.push('Consider pagination for mobile devices');
      }
      recommendations.push('Enable image compression for mobile');
      recommendations.push('Use simplified animations');
    }

    if (contentCount > 20) {
      recommendations.push('Implement virtual scrolling');
      recommendations.push('Consider lazy loading for content');
    }

    return {
      breakpoint: breakpointKey,
      contentCount,
      recommendations,
      optimizations: {
        images: breakpointKey === 'xs' || breakpointKey === 'sm',
        animations: breakpointKey !== 'xs',
        shadows: breakpointKey === 'lg' || breakpointKey === 'xl'
      }
    };
  }
}

// Export for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BreakpointManager;
}