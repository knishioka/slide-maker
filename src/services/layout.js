/**
 * Google Slides Layout Engine
 * Advanced layout management system with responsive design and accessibility support
 */
class LayoutService {
  /**
   * Initialize LayoutService with design system configuration
   */
  constructor(slidesService) {
    this.slidesService = slidesService;
    this.designSystem = this.initializeDesignSystem();
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

      // Layout patterns
      layouts: {
        'single-column': { columns: 1, description: 'Single column layout' },
        'double-column': { columns: 2, description: 'Two column layout' },
        'title-content': { rows: [1, 4], description: 'Title and content layout' },
        'three-column': { columns: 3, description: 'Three column layout' }
      }
    };
  }

  /**
   * Create layout with specified configuration
   * @param {string} presentationId - Presentation ID
   * @param {Object} config - Layout configuration
   * @returns {Object} Layout result
   */
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
   * Get design system information
   * @returns {Object} Design system summary
   */
  getDesignSystemInfo() {
    return {
      fonts: Object.keys(this.designSystem.fonts),
      layouts: Object.keys(this.designSystem.layouts),
      themes: Object.keys(this.designSystem.themes),
      spacingBase: this.designSystem.spacing.base,
      colorPalette: Object.keys(this.designSystem.colors)
    };
  }
}

// Global export for Google Apps Script