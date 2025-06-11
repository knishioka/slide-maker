/**
 * Google Slides Layout Engine
 * Advanced layout management system with responsive design and accessibility support
 */
class LayoutService {
  /**
   * Initialize LayoutService with design system configuration
   */
  constructor(slidesService, themeService = null) {
    this.slidesService = slidesService;
    this.themeService = themeService;
    this.designSystem = this.initializeDesignSystem();
    
    // Initialize advanced layout components
    this.gridSystem = new GridSystem();
    this.responsiveEngine = new ResponsiveEngine();
    this.layoutTemplates = new LayoutTemplates();
  }

  /**
   * Initialize comprehensive design system configuration
   * @returns {Object} Design system configuration
   */
  initializeDesignSystem() {
    return {
      // Font hierarchy system
      fonts: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        subheading: { default: 28, min: 24, max: 32 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 },
        footnote: { default: 16, min: 14, max: 18 }
      },

      // Spacing system (8px base)
      spacing: {
        base: 8,
        sizes: {
          xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64
        },
        slideMargins: {
          standard: { top: 48, right: 64, bottom: 48, left: 64 },
          wide: { top: 80, right: 120, bottom: 80, left: 120 }
        }
      },

      // Color system
      colors: {
        primary: { 50: '#e3f2fd', 500: '#2196f3', 700: '#1976d2', 900: '#0d47a1' },
        gray: { 50: '#fafafa', 200: '#eeeeee', 500: '#9e9e9e', 800: '#424242', 900: '#212121' },
        text: { primary: '#212121', secondary: '#757575', inverse: '#ffffff' }
      },

      // Theme configurations
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
        },
        presentation: {
          name: 'Presentation',
          background: '#1a237e',
          surface: '#303f9f',
          primary: '#ffeb3b',
          text: '#ffffff',
          textSecondary: '#e0e0e0'
        }
      },

      // Layout patterns (legacy - enhanced with new template system)
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

  /**
   * Create advanced multi-column layout with dynamic positioning
   * @param {string} presentationId - Presentation ID
   * @param {Object} config - Advanced layout configuration
   * @returns {Object} Layout result
   */
  createAdvancedLayout(presentationId, config) {
    const {
      templateType = 'auto',
      columns = 'auto',
      content = [],
      responsive = true,
      alignment = 'stretch',
      distribution = 'space-between'
    } = config;

    // Get slide dimensions
    const presentation = this.slidesService.openById(presentationId);
    const slideDimensions = this.slidesService.getSlideDimensions(presentation);

    // Determine optimal column count
    const optimalColumns = this.calculateOptimalColumns(content, columns, slideDimensions);
    
    // Create advanced grid configuration
    const gridConfig = {
      slideDimensions,
      columns: optimalColumns,
      rows: this.calculateOptimalRows(content, optimalColumns),
      areas: this.generateGridAreas(content, optimalColumns, templateType),
      gap: this.calculateOptimalGap(slideDimensions),
      margins: this.calculateOptimalMargins(slideDimensions)
    };

    // Generate grid system
    const grid = this.gridSystem.createAdvancedGrid(gridConfig);

    // Apply responsive adjustments if enabled
    if (responsive) {
      const responsiveLayout = this.responsiveEngine.createResponsiveLayout(gridConfig, slideDimensions);
      grid.responsive = responsiveLayout;
    }

    // Apply theme if available
    if (this.themeService) {
      grid.theme = this.themeService.getActiveTheme();
    }

    return {
      presentationId,
      layoutType: 'advanced-multi-column',
      grid,
      positioning: this.generateContentPositioning(content, grid),
      metadata: this.generateLayoutMetadata(config, grid)
    };
  }

  /**
   * Calculate optimal number of columns based on content
   * @param {Array} content - Content items
   * @param {string|number} columns - Column specification
   * @param {Object} slideDimensions - Slide dimensions
   * @returns {number} Optimal column count
   */
  calculateOptimalColumns(content, columns, slideDimensions) {
    if (typeof columns === 'number') {
      return Math.min(columns, content.length, 6); // Max 6 columns for readability
    }

    if (columns === 'auto') {
      const contentCount = content.length;
      const slideWidth = slideDimensions.width;
      
      // Auto-determine based on content count and slide width
      if (contentCount <= 1) return 1;
      if (contentCount <= 2 || slideWidth < 800) return 2;
      if (contentCount <= 4 || slideWidth < 1200) return Math.min(3, contentCount);
      return Math.min(4, contentCount);
    }

    return 2; // Default fallback
  }

  /**
   * Calculate optimal number of rows for content
   * @param {Array} content - Content items
   * @param {number} columns - Number of columns
   * @returns {number} Optimal row count
   */
  calculateOptimalRows(content, columns) {
    const contentCount = content.length;
    return Math.ceil(contentCount / columns);
  }

  /**
   * Generate grid areas based on content and template type
   * @param {Array} content - Content items
   * @param {number} columns - Number of columns
   * @param {string} templateType - Template type
   * @returns {Object} Grid areas configuration
   */
  generateGridAreas(content, columns, templateType) {
    const areas = {};
    
    content.forEach((item, index) => {
      const row = Math.floor(index / columns) + 1;
      const col = (index % columns) + 1;
      
      areas[`content-${index}`] = `${row} / ${col} / ${row + 1} / ${col + 1}`;
    });

    // Add special areas based on template type
    if (templateType === 'header-content') {
      areas.header = '1 / 1 / 2 / ' + (columns + 1);
      // Shift content areas down
      Object.keys(areas).forEach(key => {
        if (key.startsWith('content-')) {
          const parts = areas[key].split(' / ');
          parts[0] = String(parseInt(parts[0]) + 1);
          parts[2] = String(parseInt(parts[2]) + 1);
          areas[key] = parts.join(' / ');
        }
      });
    }

    return areas;
  }

  /**
   * Calculate optimal gap size based on slide dimensions
   * @param {Object} slideDimensions - Slide dimensions
   * @returns {number} Optimal gap size
   */
  calculateOptimalGap(slideDimensions) {
    const baseGap = 16;
    const scaleFactor = Math.min(slideDimensions.width / 1920, 1.5);
    return Math.round(baseGap * scaleFactor);
  }

  /**
   * Calculate optimal margins based on slide dimensions
   * @param {Object} slideDimensions - Slide dimensions
   * @returns {Object} Optimal margins
   */
  calculateOptimalMargins(slideDimensions) {
    const baseMargin = 48;
    const scaleFactor = Math.min(slideDimensions.width / 1920, 1.5);
    const margin = Math.round(baseMargin * scaleFactor);
    
    return {
      top: margin,
      right: margin,
      bottom: margin,
      left: margin
    };
  }

  /**
   * Generate content positioning based on grid
   * @param {Array} content - Content items
   * @param {Object} grid - Grid configuration
   * @returns {Array} Positioned content items
   */
  generateContentPositioning(content, grid) {
    return content.map((item, index) => {
      const areaName = `content-${index}`;
      const area = grid.gridAreas[areaName];
      
      if (area) {
        const position = grid.getGridPosition(area);
        return {
          ...item,
          position,
          area: areaName,
          gridArea: area
        };
      }

      return item;
    });
  }

  /**
   * Generate layout metadata
   * @param {Object} config - Original configuration
   * @param {Object} grid - Generated grid
   * @returns {Object} Layout metadata
   */
  generateLayoutMetadata(config, grid) {
    return {
      generatedAt: new Date().toISOString(),
      layoutEngine: 'Advanced Layout Engine v2.0',
      config,
      grid: {
        columns: grid.columns,
        rows: grid.rows,
        gap: grid.gap,
        margins: grid.margins,
        totalAreas: Object.keys(grid.gridAreas).length
      },
      responsive: !!grid.responsive,
      accessibility: this.generateAccessibilityMetadata(grid)
    };
  }

  /**
   * Generate accessibility metadata
   * @param {Object} grid - Grid configuration
   * @returns {Object} Accessibility information
   */
  generateAccessibilityMetadata(grid) {
    return {
      readingOrder: 'left-to-right, top-to-bottom',
      landmarks: ['main'],
      contrastCompliant: true,
      keyboardNavigable: true,
      screenReaderFriendly: true
    };
  }

  /**
   * Create layout with specified configuration and theme integration
   * @param {string} presentationId - Presentation ID
   * @param {Object} config - Layout configuration
   * @returns {Object} Layout result
   */
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
      
      // Get theme configuration from ThemeService if available
      let themeConfig;
      if (this.themeService) {
        const activeTheme = this.themeService.getActiveTheme();
        if (activeTheme) {
          themeConfig = this.convertThemeToLayoutConfig(activeTheme);
        } else {
          const themeData = this.themeService.getTheme(theme);
          themeConfig = themeData ? this.convertThemeToLayoutConfig(themeData) : this.designSystem.themes[theme];
        }
      } else {
        themeConfig = this.designSystem.themes[theme];
      }

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
        elements: layoutResult.elements,
        appliedTheme: themeConfig
      };

    } catch (error) {
      throw new Error(`Layout creation failed: ${error.message}`);
    }
  }

  /**
   * Create responsive grid system
   * @param {Object} slideDimensions - {width, height}
   * @param {string} layoutType - Layout pattern type
   * @returns {Object} Grid system configuration
   */
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

  /**
   * Calculate responsive margins based on slide dimensions
   * @param {number} slideWidth - Slide width
   * @param {number} slideHeight - Slide height
   * @returns {Object} Margin configuration
   */
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

  /**
   * Render layout with content elements
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {string} layoutType - Layout type
   * @param {Array} content - Content items
   * @param {Object} grid - Grid system
   * @param {Object} theme - Theme configuration
   * @returns {Object} Render result
   */
  renderLayout(presentationId, slideIndex, layoutType, content, grid, theme) {
    const elements = [];

    switch (layoutType) {
      case 'single-column':
        elements.push(...this.renderSingleColumn(presentationId, slideIndex, content, grid, theme));
        break;
      case 'double-column':
        elements.push(...this.renderDoubleColumn(presentationId, slideIndex, content, grid, theme));
        break;
      case 'title-content':
        elements.push(...this.renderTitleContent(presentationId, slideIndex, content, grid, theme));
        break;
      case 'three-column':
        elements.push(...this.renderThreeColumn(presentationId, slideIndex, content, grid, theme));
        break;
      default:
        throw new Error(`Unsupported layout type: ${layoutType}`);
    }

    return { elements };
  }

  /**
   * Render single column layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} grid - Grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
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

  /**
   * Render double column layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} grid - Grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
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

  /**
   * Render title-content layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} grid - Grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
  renderTitleContent(presentationId, slideIndex, content, grid, theme) {
    const elements = [];

    if (content.length === 0) return elements;

    // Title section (first item)
    const titlePosition = grid.getRowPosition(1, 1, 5);
    const titleColumnPosition = grid.getColumnPosition(1, 1);

    const titleElement = this.createContentElement(
      presentationId,
      slideIndex,
      { ...content[0], type: 'title' },
      {
        x: titleColumnPosition.x,
        y: titlePosition.y,
        width: titleColumnPosition.width,
        height: titlePosition.height
      },
      theme,
      grid
    );
    elements.push(titleElement);

    // Content section (remaining items)
    const contentItems = content.slice(1);
    contentItems.forEach((item, index) => {
      const contentRowPosition = grid.getRowPosition(index + 2, 1, 5);
      const contentColumnPosition = grid.getColumnPosition(1, 1);

      const element = this.createContentElement(
        presentationId,
        slideIndex,
        item,
        {
          x: contentColumnPosition.x,
          y: contentRowPosition.y,
          width: contentColumnPosition.width,
          height: contentRowPosition.height - this.designSystem.spacing.sizes.sm
        },
        theme,
        grid
      );
      elements.push(element);
    });

    return elements;
  }

  /**
   * Render three column layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} grid - Grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
  renderThreeColumn(presentationId, slideIndex, content, grid, theme) {
    const elements = [];
    const itemsPerColumn = Math.ceil(content.length / 3);

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

  /**
   * Create individual content element with design system styling
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} item - Content item
   * @param {Object} position - Element position
   * @param {Object} theme - Theme configuration
   * @param {Object} grid - Grid system
   * @returns {Object} Created element information
   */
  createContentElement(presentationId, slideIndex, item, position, theme, grid) {
    const {
      type = 'body',
      text = '',
      importance = 'medium'
    } = item;

    // Calculate responsive font size
    const fontSize = this.calculateResponsiveFontSize({
      baseSize: this.designSystem.fonts[type].default,
      slideWidth: grid.width,
      slideHeight: grid.height,
      contentLength: text.length,
      importance
    });

    // Create text style configuration
    const textStyle = {
      fontFamily: this.selectOptimalFont(type),
      fontSize: fontSize,
      color: theme.text,
      lineHeight: this.calculateLineHeight(fontSize, type),
      bold: ['title', 'heading'].includes(type)
    };

    // Insert text box using SlidesService
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

  /**
   * Calculate responsive font size based on multiple factors
   * @param {Object} options - Font size calculation options
   * @returns {number} Calculated font size
   */
  calculateResponsiveFontSize(options) {
    const {
      baseSize,
      slideWidth,
      slideHeight,
      contentLength = 0,
      viewingDistance = 'medium',
      importance = 'medium'
    } = options;

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

  /**
   * Calculate content length adjustment factor
   * @param {number} contentLength - Character count
   * @returns {number} Adjustment factor
   */
  calculateContentFactor(contentLength) {
    if (contentLength <= 50) return 1.0;
    if (contentLength <= 150) return 0.95;
    if (contentLength <= 300) return 0.85;
    return 0.75;
  }

  /**
   * Get viewing distance adjustment factor
   * @param {string} distance - 'close', 'medium', 'far'
   * @returns {number} Distance factor
   */
  getDistanceFactor(distance) {
    const factors = {
      'close': 0.9,
      'medium': 1.0,
      'far': 1.3
    };
    return factors[distance] || 1.0;
  }

  /**
   * Get importance adjustment factor
   * @param {string} importance - 'high', 'medium', 'low'
   * @returns {number} Importance factor
   */
  getImportanceFactor(importance) {
    const factors = {
      'high': 1.15,
      'medium': 1.0,
      'low': 0.9
    };
    return factors[importance] || 1.0;
  }

  /**
   * Calculate optimal line height for given font size and content type
   * @param {number} fontSize - Font size in points
   * @param {string} contentType - Content type
   * @returns {number} Line height
   */
  calculateLineHeight(fontSize, contentType = 'body') {
    const ratios = {
      'title': 1.2,
      'heading': 1.3,
      'body': 1.4,
      'caption': 1.5,
      'list': 1.6
    };

    const ratio = ratios[contentType] || 1.4;
    const sizeAdjustment = fontSize < 20 ? 0.1 : 0;

    return (ratio + sizeAdjustment) * fontSize;
  }

  /**
   * Select optimal font family for content type
   * @param {string} contentType - Content type
   * @param {string} language - Language code
   * @returns {string} Font family name
   */
  selectOptimalFont(contentType, language = 'en') {
    const selections = {
      'title': { en: 'Arial', ja: 'Noto Sans JP' },
      'body': { en: 'Calibri', ja: 'Hiragino Sans' },
      'code': { en: 'Courier New', ja: 'MS Gothic' }
    };

    return selections[contentType]?.[language] || 'Arial';
  }

  /**
   * Validate layout accessibility standards
   * @param {Object} element - Element to validate
   * @returns {Object} Validation result
   */
  validateAccessibility(element) {
    const issues = [];
    const minFontSizes = { title: 28, heading: 24, body: 18, caption: 16 };

    if (element.fontSize < minFontSizes[element.type]) {
      issues.push(`Font size too small: ${element.fontSize}pt`);
    }

    if (element.style.lineHeight < 1.5 * element.fontSize) {
      issues.push('Line height too small');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get layout configuration information
   * @param {string} layoutType - Layout type
   * @returns {Object} Layout information
   */
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

  /**
   * Get available themes
   * @returns {Array} Available theme configurations
   */
  getAvailableThemes() {
    return Object.keys(this.designSystem.themes).map(key => ({
      id: key,
      ...this.designSystem.themes[key]
    }));
  }

  /**
   * Create template-based layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {string} templateName - Template name
   * @param {Array} content - Content items
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {boolean} responsive - Enable responsive behavior
   * @returns {Object} Layout result
   */
  createTemplateLayout(presentationId, slideIndex, templateName, content, slideDimensions, theme, responsive) {
    const templateConfig = this.layoutTemplates.createLayoutConfig(templateName, {
      theme: theme.name || 'default',
      content: content.map(item => item.type || 'body')
    });

    const gridConfig = {
      slideDimensions,
      areas: templateConfig.areas,
      columns: 12,
      gap: this.designSystem.spacing.sizes.md
    };

    let finalConfig = gridConfig;
    if (responsive) {
      const responsiveLayout = this.responsiveEngine.createResponsiveLayout(gridConfig, slideDimensions);
      finalConfig = responsiveLayout.adaptedConfig;
    }

    const grid = this.gridSystem.createAdvancedGrid(finalConfig);
    const elements = this.renderTemplateContent(presentationId, slideIndex, templateConfig.content, grid, theme);

    return {
      elements,
      template: templateName,
      responsive: responsive,
      grid: finalConfig
    };
  }

  /**
   * Create custom grid layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} customAreas - Custom grid areas
   * @param {Array} content - Content items
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {boolean} responsive - Enable responsive behavior
   * @returns {Object} Layout result
   */
  createCustomGridLayout(presentationId, slideIndex, customAreas, content, slideDimensions, theme, responsive) {
    const gridConfig = {
      slideDimensions,
      areas: customAreas,
      columns: 12,
      gap: this.designSystem.spacing.sizes.md
    };

    let finalConfig = gridConfig;
    if (responsive) {
      const responsiveLayout = this.responsiveEngine.createResponsiveLayout(gridConfig, slideDimensions);
      finalConfig = responsiveLayout.adaptedConfig;
    }

    const grid = this.gridSystem.createAdvancedGrid(finalConfig);
    const elements = this.renderGridContent(presentationId, slideIndex, content, customAreas, grid, theme);

    return {
      elements,
      responsive: responsive,
      grid: finalConfig
    };
  }

  /**
   * Create responsive grid layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @returns {Object} Layout result
   */
  createResponsiveGridLayout(presentationId, slideIndex, content, slideDimensions, theme) {
    const breakpoint = this.responsiveEngine.getCurrentBreakpoint(slideDimensions.width, slideDimensions.height);
    const responsiveConfig = this.responsiveEngine.getResponsiveConfig(breakpoint.key);

    // Generate optimal layout based on content count and breakpoint
    const optimalColumns = Math.min(responsiveConfig.columns, Math.ceil(Math.sqrt(content.length)));
    const gridConfig = {
      slideDimensions,
      columns: optimalColumns,
      gap: this.designSystem.spacing.sizes.md * responsiveConfig.spacing
    };

    const grid = this.gridSystem.createAdvancedGrid(gridConfig);
    const elements = this.renderResponsiveContent(presentationId, slideIndex, content, grid, theme, responsiveConfig);

    return {
      elements,
      responsive: true,
      breakpoint: breakpoint.key,
      grid: gridConfig
    };
  }

  /**
   * Render template content with advanced positioning
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} templateContent - Template content with area assignments
   * @param {Object} grid - Advanced grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
  renderTemplateContent(presentationId, slideIndex, templateContent, grid, theme) {
    const elements = [];

    templateContent.forEach(item => {
      if (item.area && grid.gridAreas[item.area]) {
        const position = grid.getGridPosition(grid.gridAreas[item.area]);
        const element = this.createAdvancedContentElement(
          presentationId,
          slideIndex,
          item,
          position,
          theme,
          grid
        );
        elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Render custom grid content
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} areas - Grid areas
   * @param {Object} grid - Advanced grid system
   * @param {Object} theme - Theme configuration
   * @returns {Array} Created elements
   */
  renderGridContent(presentationId, slideIndex, content, areas, grid, theme) {
    const elements = [];
    const areaNames = Object.keys(areas);

    content.forEach((item, index) => {
      const areaName = areaNames[index];
      if (areaName && grid.gridAreas[areaName]) {
        const position = grid.getGridPosition(grid.gridAreas[areaName]);
        const element = this.createAdvancedContentElement(
          presentationId,
          slideIndex,
          { ...item, area: areaName },
          position,
          theme,
          grid
        );
        elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Render responsive content with adaptive sizing
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content items
   * @param {Object} grid - Advanced grid system
   * @param {Object} theme - Theme configuration
   * @param {Object} responsiveConfig - Responsive configuration
   * @returns {Array} Created elements
   */
  renderResponsiveContent(presentationId, slideIndex, content, grid, theme, responsiveConfig) {
    const elements = [];
    const itemsPerRow = grid.columns;
    const rows = Math.ceil(content.length / itemsPerRow);

    content.forEach((item, index) => {
      const col = (index % itemsPerRow) + 1;
      const row = Math.floor(index / itemsPerRow) + 1;

      const position = {
        x: grid.margins.left + ((col - 1) * (grid.columnWidth + grid.gap)),
        y: grid.margins.top + ((row - 1) * (grid.contentHeight / rows)),
        width: grid.columnWidth,
        height: (grid.contentHeight / rows) - grid.gap
      };

      const element = this.createAdvancedContentElement(
        presentationId,
        slideIndex,
        { ...item, responsive: true },
        position,
        theme,
        grid,
        responsiveConfig
      );
      elements.push(element);
    });

    return elements;
  }

  /**
   * Create advanced content element with enhanced features
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} item - Content item
   * @param {Object} position - Element position
   * @param {Object} theme - Theme configuration
   * @param {Object} grid - Grid system
   * @param {Object} responsiveConfig - Optional responsive configuration
   * @returns {Object} Created element information
   */
  createAdvancedContentElement(presentationId, slideIndex, item, position, theme, grid, responsiveConfig = null) {
    const {
      type = 'body',
      text = '',
      importance = 'medium',
      area = null,
      responsive = false
    } = item;

    // Enhanced font size calculation
    let fontSize = this.calculateResponsiveFontSize({
      baseSize: this.designSystem.fonts[type].default,
      slideWidth: grid.width,
      slideHeight: grid.height,
      contentLength: text.length,
      importance
    });

    // Apply responsive scaling if available
    if (responsive && responsiveConfig) {
      fontSize *= responsiveConfig.fontSize;
    }

    // Enhanced text style with area-specific adjustments
    const textStyle = {
      fontFamily: this.selectOptimalFont(type),
      fontSize: fontSize,
      color: this.getAreaSpecificColor(area, theme),
      lineHeight: this.calculateLineHeight(fontSize, type),
      bold: ['title', 'heading'].includes(type),
      alignment: this.getAreaSpecificAlignment(area, type)
    };

    // Insert text box using SlidesService
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
      area,
      position,
      style: textStyle,
      fontSize,
      responsive
    };
  }

  /**
   * Get area-specific color based on layout context
   * @param {string} area - Grid area name
   * @param {Object} theme - Theme configuration
   * @returns {string} Color value
   */
  getAreaSpecificColor(area, theme) {
    if (!area) return theme.text;

    const specialAreas = {
      'header': theme.primary,
      'sidebar': theme.textSecondary,
      'footer': theme.textSecondary,
      'title': theme.text,
      'hero': theme.primary
    };

    return specialAreas[area] || theme.text;
  }

  /**
   * Get area-specific text alignment
   * @param {string} area - Grid area name
   * @param {string} type - Content type
   * @returns {string} Alignment value
   */
  getAreaSpecificAlignment(area, type) {
    if (type === 'title' || area === 'header' || area === 'hero') {
      return 'center';
    }
    if (area === 'sidebar') {
      return 'left';
    }
    return 'left';
  }

  /**
   * Get available layout templates
   * @returns {Array} Available templates
   */
  getAvailableTemplates() {
    return this.layoutTemplates.getCategories().map(category => ({
      category: category.name,
      templates: this.layoutTemplates.getTemplatesByCategory(category.id)
    }));
  }

  /**
   * Get layout recommendations based on content
   * @param {Object} requirements - Content requirements
   * @returns {Array} Recommended layouts
   */
  getLayoutRecommendations(requirements) {
    return this.layoutTemplates.getRecommendations(requirements);
  }

  /**
   * Generate layout preview
   * @param {string} layoutType - Layout type or template name
   * @returns {Object} Preview configuration
   */
  generateLayoutPreview(layoutType) {
    if (this.layoutTemplates.getTemplate) {
      try {
        return this.layoutTemplates.generatePreview(layoutType);
      } catch (error) {
        // Fall back to legacy layout if template not found
      }
    }
    
    return {
      layoutType,
      preview: true,
      areas: this.designSystem.layouts[layoutType] || {}
    };
  }

  /**
   * Get design system information
   * @returns {Object} Design system summary
   */
  getDesignSystemInfo() {
    return {
      fonts: Object.keys(this.designSystem.fonts),
      layouts: Object.keys(this.designSystem.layouts),
      themes: Object.keys(this.designSystem.themes),
      spacingBase: this.designSystem.spacing.base,
      colorPalette: Object.keys(this.designSystem.colors),
      templates: this.layoutTemplates ? Object.keys(this.layoutTemplates.templates) : [],
      responsive: true,
      gridSystem: true
    };
  }

  /**
   * Convert ThemeService theme to LayoutService theme configuration
   * @param {Object} theme - ThemeService theme object
   * @returns {Object} LayoutService compatible theme config
   */
  convertThemeToLayoutConfig(theme) {
    return {
      name: theme.name,
      background: theme.colors.background,
      surface: theme.colors.surface,
      primary: theme.colors.primary,
      text: theme.colors.text.primary,
      textSecondary: theme.colors.text.secondary,
      // Extended properties for advanced theming
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.text,
        semantic: theme.colors.semantic
      },
      typography: theme.typography,
      spacing: theme.spacing,
      effects: theme.effects,
      accessibility: theme.accessibility
    };
  }

  /**
   * Apply comprehensive theme to slide elements
   * @param {Array} elements - Slide elements
   * @param {Object} theme - Theme configuration
   * @returns {Array} Themed elements
   */
  applyThemeToElements(elements, theme) {
    return elements.map(element => {
      const themedElement = { ...element };

      // Apply background theming
      if (element.type === 'slide') {
        themedElement.style = {
          ...themedElement.style,
          backgroundColor: theme.colors?.background || theme.background,
          backgroundImage: 'none'
        };
      }

      // Apply text theming
      if (element.type === 'text') {
        const textLevel = element.level || 'body';
        const fontConfig = theme.typography?.fontSizes?.[textLevel] || {};
        
        themedElement.style = {
          ...themedElement.style,
          color: this.getTextColor(element, theme),
          fontFamily: theme.typography?.fontFamily?.primary || 'Arial',
          fontSize: fontConfig.default || this.designSystem.fonts[textLevel]?.default || 24,
          fontWeight: this.getFontWeight(element, theme),
          lineHeight: theme.typography?.lineHeights?.normal || 1.5,
          letterSpacing: 'normal'
        };
      }

      // Apply surface theming (for containers, shapes, etc.)
      if (element.type === 'shape' || element.type === 'container') {
        themedElement.style = {
          ...themedElement.style,
          backgroundColor: theme.colors?.surface || theme.surface,
          borderColor: theme.colors?.primary || theme.primary,
          borderRadius: theme.effects?.borderRadius?.medium || 8,
          boxShadow: theme.effects?.shadows?.light || 'none'
        };
      }

      // Apply accent theming
      if (element.accent || element.highlighted) {
        themedElement.style = {
          ...themedElement.style,
          backgroundColor: theme.colors?.accent || theme.primary,
          color: theme.colors?.text?.inverse || '#ffffff'
        };
      }

      return themedElement;
    });
  }

  /**
   * Get appropriate text color based on element and theme
   * @param {Object} element - Element configuration
   * @param {Object} theme - Theme configuration
   * @returns {string} Text color
   */
  getTextColor(element, theme) {
    if (element.importance === 'high' || element.level === 'title') {
      return theme.colors?.text?.primary || theme.text;
    }
    
    if (element.importance === 'low' || element.level === 'caption') {
      return theme.colors?.text?.secondary || theme.textSecondary;
    }

    // Default text color
    return theme.colors?.text?.primary || theme.text;
  }

  /**
   * Get appropriate font weight based on element and theme
   * @param {Object} element - Element configuration
   * @param {Object} theme - Theme configuration
   * @returns {number} Font weight
   */
  getFontWeight(element, theme) {
    if (element.level === 'title') {
      return theme.typography?.fontWeights?.bold || 700;
    }
    
    if (element.level === 'heading') {
      return theme.typography?.fontWeights?.medium || 500;
    }

    return theme.typography?.fontWeights?.regular || 400;
  }

  /**
   * Generate theme-aware spacing
   * @param {Object} theme - Theme configuration
   * @param {string} size - Spacing size key
   * @returns {number} Spacing value in pixels
   */
  getThemedSpacing(theme, size = 'md') {
    if (theme.spacing?.scale) {
      const sizeIndex = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'].indexOf(size);
      return theme.spacing.scale[sizeIndex] || theme.spacing.scale[2]; // Default to 'md'
    }

    // Fallback to design system spacing
    return this.designSystem.spacing.sizes[size] || this.designSystem.spacing.sizes.md;
  }

  /**
   * Create theme-aware margins
   * @param {Object} theme - Theme configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @returns {Object} Margin configuration
   */
  createThemedMargins(theme, slideDimensions) {
    if (theme.spacing?.margins?.slide) {
      return theme.spacing.margins.slide;
    }

    // Calculate responsive margins with theme base spacing
    const baseSpacing = theme.spacing?.base || this.designSystem.spacing.base;
    const scale = Math.min(slideDimensions.width / 960, slideDimensions.height / 540);
    const scaledSpacing = Math.round(baseSpacing * scale * 4); // 4x base for margins

    return {
      top: scaledSpacing,
      right: scaledSpacing * 1.3,
      bottom: scaledSpacing,
      left: scaledSpacing * 1.3
    };
  }

  /**
   * Validate theme compatibility with layout
   * @param {Object} theme - Theme configuration
   * @param {string} layoutType - Layout type
   * @returns {Object} Validation result
   */
  validateThemeCompatibility(theme, layoutType) {
    const issues = [];
    const warnings = [];

    // Check required theme properties
    if (!theme.colors?.background) {
      issues.push('Theme missing background color');
    }

    if (!theme.colors?.text?.primary) {
      issues.push('Theme missing primary text color');
    }

    // Check accessibility
    if (theme.accessibility && theme.accessibility.minimumContrast < 4.5) {
      warnings.push('Theme contrast ratio below WCAG AA standard');
    }

    // Check typography
    if (!theme.typography?.fontFamily?.primary) {
      warnings.push('Theme missing primary font family');
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 30) - (warnings.length * 10))
    };
  }
}

// Global export for Google Apps Script