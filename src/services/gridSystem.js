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
    
    // Dynamic row calculations
    const rowHeight = this.calculateRowHeight(area, margins);
    const y = margins.top + ((rowStart - 1) * (rowHeight + gap));
    const height = ((rowEnd - rowStart) * rowHeight) + ((rowEnd - rowStart - 1) * gap);
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Calculate dynamic row height based on content and constraints
   * @param {Object} area - Grid area definition
   * @param {Object} margins - Grid margins
   * @returns {number} Calculated row height
   */
  calculateRowHeight(area, margins) {
    // Base row height calculation
    const minRowHeight = 80;
    const maxRowHeight = 200;
    
    // Calculate available height
    const availableHeight = 720 - margins.top - margins.bottom; // Standard slide height
    const rowSpan = area.rowEnd - area.rowStart;
    
    // Calculate optimal row height
    let rowHeight = availableHeight / 6; // Default to 6 rows
    
    // Adjust for row span
    if (rowSpan > 1) {
      rowHeight = Math.max(minRowHeight, rowHeight * 0.8);
    }
    
    return Math.min(Math.max(rowHeight, minRowHeight), maxRowHeight);
  }

  /**
   * Create flexbox-style layout
   * @param {Object} config - Flexbox configuration
   * @returns {Object} Flexbox layout system
   */
  createFlexLayout(config) {
    const {
      slideDimensions,
      direction = 'row', // 'row' | 'column'
      justifyContent = 'space-between', // 'flex-start' | 'center' | 'space-between' | 'space-around'
      alignItems = 'stretch', // 'flex-start' | 'center' | 'flex-end' | 'stretch'
      wrap = 'nowrap', // 'nowrap' | 'wrap'
      gap = 16,
      margins = { top: 32, right: 32, bottom: 32, left: 32 }
    } = config;

    const { width, height } = slideDimensions;
    const contentWidth = width - margins.left - margins.right;
    const contentHeight = height - margins.top - margins.bottom;

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      direction,
      justifyContent,
      alignItems,
      wrap,
      gap,
      margins,

      // Flexbox positioning functions
      distributeItems: (items) => this.distributeFlexItems(items, {
        contentWidth,
        contentHeight,
        direction,
        justifyContent,
        alignItems,
        gap,
        margins
      }),

      calculateItemDimensions: (itemCount) => this.calculateFlexItemDimensions(itemCount, {
        contentWidth,
        contentHeight,
        direction,
        gap
      })
    };
  }

  /**
   * Distribute items in flexbox layout
   * @param {Array} items - Items to distribute
   * @param {Object} flexConfig - Flex configuration
   * @returns {Array} Positioned items
   */
  distributeFlexItems(items, flexConfig) {
    const { contentWidth, contentHeight, direction, justifyContent, alignItems, gap, margins } = flexConfig;
    const itemCount = items.length;

    if (itemCount === 0) return [];

    // Calculate item dimensions
    const itemDimensions = this.calculateFlexItemDimensions(itemCount, {
      contentWidth,
      contentHeight,
      direction,
      gap
    });

    // Calculate positions based on justifyContent
    const positions = this.calculateFlexPositions(itemCount, {
      contentWidth,
      contentHeight,
      direction,
      justifyContent,
      alignItems,
      gap,
      itemDimensions
    });

    return items.map((item, index) => ({
      ...item,
      position: {
        x: Math.round(margins.left + positions[index].x),
        y: Math.round(margins.top + positions[index].y),
        width: Math.round(itemDimensions.width),
        height: Math.round(itemDimensions.height)
      },
      flexIndex: index
    }));
  }

  /**
   * Calculate flex item dimensions
   * @param {number} itemCount - Number of items
   * @param {Object} config - Dimension calculation config
   * @returns {Object} Item dimensions
   */
  calculateFlexItemDimensions(itemCount, config) {
    const { contentWidth, contentHeight, direction, gap } = config;

    if (direction === 'row') {
      const totalGaps = (itemCount - 1) * gap;
      const availableWidth = contentWidth - totalGaps;
      return {
        width: availableWidth / itemCount,
        height: contentHeight
      };
    } else {
      const totalGaps = (itemCount - 1) * gap;
      const availableHeight = contentHeight - totalGaps;
      return {
        width: contentWidth,
        height: availableHeight / itemCount
      };
    }
  }

  /**
   * Calculate flex item positions
   * @param {number} itemCount - Number of items
   * @param {Object} config - Position calculation config
   * @returns {Array} Item positions
   */
  calculateFlexPositions(itemCount, config) {
    const { contentWidth, contentHeight, direction, justifyContent, alignItems, gap, itemDimensions } = config;
    const positions = [];

    for (let i = 0; i < itemCount; i++) {
      let x = 0;
      let y = 0;

      if (direction === 'row') {
        // Calculate X position based on justifyContent
        const totalItemsWidth = itemCount * itemDimensions.width + (itemCount - 1) * gap;
        const remainingSpace = contentWidth - totalItemsWidth;

        switch (justifyContent) {
          case 'flex-start':
            x = i * (itemDimensions.width + gap);
            break;
          case 'center':
            x = remainingSpace / 2 + i * (itemDimensions.width + gap);
            break;
          case 'flex-end':
            x = remainingSpace + i * (itemDimensions.width + gap);
            break;
          case 'space-between':
            if (itemCount === 1) {
              x = remainingSpace / 2;
            } else {
              x = i * (itemDimensions.width + remainingSpace / (itemCount - 1));
            }
            break;
          case 'space-around':
            const spacePerItem = remainingSpace / itemCount;
            x = spacePerItem / 2 + i * (itemDimensions.width + spacePerItem);
            break;
          default:
            x = i * (itemDimensions.width + gap);
        }

        // Calculate Y position based on alignItems
        switch (alignItems) {
          case 'flex-start':
            y = 0;
            break;
          case 'center':
            y = (contentHeight - itemDimensions.height) / 2;
            break;
          case 'flex-end':
            y = contentHeight - itemDimensions.height;
            break;
          case 'stretch':
          default:
            y = 0;
        }
      } else {
        // Column direction
        switch (alignItems) {
          case 'flex-start':
            x = 0;
            break;
          case 'center':
            x = (contentWidth - itemDimensions.width) / 2;
            break;
          case 'flex-end':
            x = contentWidth - itemDimensions.width;
            break;
          case 'stretch':
          default:
            x = 0;
        }

        const totalItemsHeight = itemCount * itemDimensions.height + (itemCount - 1) * gap;
        const remainingSpace = contentHeight - totalItemsHeight;

        switch (justifyContent) {
          case 'flex-start':
            y = i * (itemDimensions.height + gap);
            break;
          case 'center':
            y = remainingSpace / 2 + i * (itemDimensions.height + gap);
            break;
          case 'flex-end':
            y = remainingSpace + i * (itemDimensions.height + gap);
            break;
          case 'space-between':
            if (itemCount === 1) {
              y = remainingSpace / 2;
            } else {
              y = i * (itemDimensions.height + remainingSpace / (itemCount - 1));
            }
            break;
          case 'space-around':
            const spacePerItem = remainingSpace / itemCount;
            y = spacePerItem / 2 + i * (itemDimensions.height + spacePerItem);
            break;
          default:
            y = i * (itemDimensions.height + gap);
        }
      }

      positions.push({ x, y });
    }

    return positions;
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