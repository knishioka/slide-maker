/**
 * Advanced Grid System for Google Slides Layout Engine
 * Provides CSS Grid-like functionality with responsive breakpoints
 */
class GridSystem {
  constructor() {
    this.breakpoints = {
      mobile: { maxWidth: 768, columns: 1, fontSize: 0.8 },
      tablet: { maxWidth: 1024, columns: 2, fontSize: 0.9 },
      desktop: { minWidth: 1025, columns: 3, fontSize: 1.0 }
    };
  }

  /**
   * Create advanced grid with CSS Grid-like capabilities
   * @param {Object} config - Grid configuration
   * @returns {Object} Advanced grid system
   */
  createAdvancedGrid(config) {
    const {
      slideDimensions,
      columns = 12,
      rows = 'auto',
      areas = null,
      gap = 16,
      margins = { top: 32, right: 32, bottom: 32, left: 32 }
    } = config;

    const { width, height } = slideDimensions;
    const contentWidth = width - margins.left - margins.right;
    const contentHeight = height - margins.top - margins.bottom;

    // Create 12-column grid system
    const columnWidth = (contentWidth - (gap * (columns - 1))) / columns;
    const gridAreas = this.parseGridAreas(areas);

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      columns,
      rows,
      columnWidth,
      gap,
      margins,
      gridAreas,

      // Grid positioning functions
      getGridPosition: (area) => this.calculateGridPosition(area, columnWidth, gap, margins),
      getColumnSpan: (start, end) => this.calculateColumnSpan(start, end, columnWidth, gap),
      getRowSpan: (start, end, totalRows) => this.calculateRowSpan(start, end, contentHeight, totalRows),
      
      // Responsive functions
      getResponsiveConfig: (actualWidth) => this.getResponsiveConfiguration(actualWidth),
      adaptToBreakpoint: (breakpoint) => this.adaptGridToBreakpoint(breakpoint, config)
    };
  }

  /**
   * Parse CSS Grid-like area definitions
   * @param {Object} areas - Named grid areas
   * @returns {Object} Parsed grid areas
   */
  parseGridAreas(areas) {
    if (!areas) return {};

    const parsed = {};
    Object.entries(areas).forEach(([name, definition]) => {
      // Parse "row-start / col-start / row-end / col-end" format
      const parts = definition.split('/').map(part => part.trim());
      if (parts.length === 4) {
        parsed[name] = {
          rowStart: parseInt(parts[0]) || 1,
          colStart: parseInt(parts[1]) || 1,
          rowEnd: parseInt(parts[2]) || 2,
          colEnd: parseInt(parts[3]) || 2
        };
      }
    });

    return parsed;
  }

  /**
   * Calculate position for grid area
   * @param {Object} area - Grid area definition
   * @param {number} columnWidth - Column width
   * @param {number} gap - Grid gap
   * @param {Object} margins - Grid margins
   * @returns {Object} Position and dimensions
   */
  calculateGridPosition(area, columnWidth, gap, margins) {
    const { rowStart, colStart, rowEnd, colEnd } = area;
    
    const x = margins.left + ((colStart - 1) * (columnWidth + gap));
    const width = ((colEnd - colStart) * columnWidth) + ((colEnd - colStart - 1) * gap);
    
    // Row calculations (simplified for now, can be enhanced)
    const rowHeight = 100; // Base row height, should be calculated dynamically
    const y = margins.top + ((rowStart - 1) * (rowHeight + gap));
    const height = ((rowEnd - rowStart) * rowHeight) + ((rowEnd - rowStart - 1) * gap);

    return { x, y, width, height };
  }

  /**
   * Calculate column span dimensions
   * @param {number} start - Start column (1-based)
   * @param {number} end - End column (1-based)
   * @param {number} columnWidth - Single column width
   * @param {number} gap - Grid gap
   * @returns {Object} Column span dimensions
   */
  calculateColumnSpan(start, end, columnWidth, gap) {
    const spanCount = end - start;
    const width = (columnWidth * spanCount) + (gap * (spanCount - 1));
    return { width, spanCount };
  }

  /**
   * Calculate row span dimensions
   * @param {number} start - Start row
   * @param {number} end - End row
   * @param {number} contentHeight - Available content height
   * @param {number} totalRows - Total number of rows
   * @returns {Object} Row span dimensions
   */
  calculateRowSpan(start, end, contentHeight, totalRows) {
    const spanCount = end - start;
    const rowHeight = contentHeight / totalRows;
    const height = rowHeight * spanCount;
    return { height, spanCount };
  }

  /**
   * Get responsive configuration for given width
   * @param {number} actualWidth - Current slide width
   * @returns {Object} Responsive configuration
   */
  getResponsiveConfiguration(actualWidth) {
    if (actualWidth <= this.breakpoints.mobile.maxWidth) {
      return { breakpoint: 'mobile', ...this.breakpoints.mobile };
    } else if (actualWidth <= this.breakpoints.tablet.maxWidth) {
      return { breakpoint: 'tablet', ...this.breakpoints.tablet };
    } else {
      return { breakpoint: 'desktop', ...this.breakpoints.desktop };
    }
  }

  /**
   * Adapt grid configuration to breakpoint
   * @param {string} breakpoint - Target breakpoint
   * @param {Object} originalConfig - Original grid configuration
   * @returns {Object} Adapted configuration
   */
  adaptGridToBreakpoint(breakpoint, originalConfig) {
    const breakpointConfig = this.breakpoints[breakpoint];
    if (!breakpointConfig) return originalConfig;

    return {
      ...originalConfig,
      columns: breakpointConfig.columns,
      fontSize: breakpointConfig.fontSize,
      // Simplify layout for smaller screens
      areas: breakpoint === 'mobile' ? this.simplifyAreasForMobile(originalConfig.areas) : originalConfig.areas
    };
  }

  /**
   * Simplify grid areas for mobile display
   * @param {Object} areas - Original grid areas
   * @returns {Object} Simplified areas for mobile
   */
  simplifyAreasForMobile(areas) {
    if (!areas) return areas;

    const simplified = {};
    let currentRow = 1;

    Object.entries(areas).forEach(([name, area]) => {
      // Stack all areas vertically on mobile
      simplified[name] = {
        rowStart: currentRow,
        colStart: 1,
        rowEnd: currentRow + 1,
        colEnd: 2 // Single column
      };
      currentRow++;
    });

    return simplified;
  }

  /**
   * Create layout template configurations
   * @returns {Object} Available layout templates
   */
  getLayoutTemplates() {
    return {
      'hero-content': {
        areas: {
          hero: '1 / 1 / 3 / 13',
          content: '3 / 1 / 6 / 13'
        },
        description: 'Large hero section with content below'
      },
      
      'sidebar-main': {
        areas: {
          sidebar: '1 / 1 / 6 / 4',
          main: '1 / 4 / 6 / 13'
        },
        description: 'Sidebar navigation with main content'
      },
      
      'three-section': {
        areas: {
          header: '1 / 1 / 2 / 13',
          left: '2 / 1 / 6 / 5',
          right: '2 / 5 / 6 / 9',
          footer: '2 / 9 / 6 / 13'
        },
        description: 'Header with three content sections'
      },
      
      'masonry-grid': {
        columns: 4,
        autoFlow: 'row dense',
        description: 'Masonry-style grid layout'
      },
      
      'feature-showcase': {
        areas: {
          title: '1 / 1 / 2 / 13',
          feature1: '2 / 1 / 4 / 5',
          feature2: '2 / 5 / 4 / 9',
          feature3: '2 / 9 / 4 / 13',
          description: '4 / 1 / 6 / 13'
        },
        description: 'Title with three feature highlights'
      }
    };
  }

  /**
   * Validate grid configuration
   * @param {Object} config - Grid configuration to validate
   * @returns {Object} Validation result
   */
  validateGridConfig(config) {
    const errors = [];
    const warnings = [];

    if (!config.slideDimensions) {
      errors.push('slideDimensions is required');
    }

    if (config.columns && (config.columns < 1 || config.columns > 24)) {
      warnings.push('Column count should be between 1 and 24');
    }

    if (config.areas) {
      Object.entries(config.areas).forEach(([name, area]) => {
        if (typeof area === 'string') {
          const parts = area.split('/');
          if (parts.length !== 4) {
            errors.push(`Invalid area definition for ${name}: should be "row-start / col-start / row-end / col-end"`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GridSystem;
}