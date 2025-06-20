/**
 * Content Management Service
 * Orchestrates slide content creation, layout management, and theme application
 */
class ContentService {
  /**
   * Initialize ContentService with required dependencies
   */
  constructor() {
    this.slidesService = new SlidesService();
    this.validationService = new ValidationService();
    this.mermaidService = new MermaidService();
    this.chartService = new ChartService();

    this.defaultTheme = {
      fontFamily: 'Arial',
      titleFontSize: 36,
      bodyFontSize: 24,
      captionFontSize: 22,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      backgroundColor: '#FFFFFF',
      lineHeight: 1.4
    };

    this.layoutTemplates = {
      single: {
        margin: 60,
        titleHeight: 80,
        contentSpacing: 40
      },
      double: {
        margin: 60,
        columnGap: 40,
        titleHeight: 80,
        contentSpacing: 30
      }
    };
  }

  /**
   * Create a complete presentation with content
   * @param {Object} presentationData - Presentation configuration
   * @returns {Promise<Object>} Creation result
   */
  async createPresentation(presentationData) {
    const monitor = logger.createPerformanceMonitor('createPresentation');
    monitor.start();

    try {
      logger.info('Starting presentation creation', { title: presentationData.title });

      const validation = this.validationService.validatePresentationParams(presentationData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('Validation warnings', { warnings: validation.warnings });
      }

      const presentationId = this.slidesService.createPresentation(validation.sanitized.title);
      logger.info('Presentation created', { presentationId });

      const result = {
        presentationId,
        title: validation.sanitized.title,
        slides: [],
        theme: presentationData.theme || this.defaultTheme
      };

      if (presentationData.slides && presentationData.slides.length > 0) {
        for (let i = 0; i < presentationData.slides.length; i++) {
          const slideData = presentationData.slides[i];
          const slideResult = await this.addSlideWithContent(
            presentationId,
            slideData,
            result.theme
          );
          result.slides.push(slideResult);
        }
      }

      logger.info('Presentation creation completed', {
        presentationId,
        slideCount: result.slides.length
      });

      return result;
    } catch (error) {
      logger.error('Presentation creation failed', { presentationData }, error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  /**
   * Add slide with content to existing presentation
   * @param {string} presentationId - Target presentation ID
   * @param {Object} slideData - Slide content configuration
   * @param {Object} theme - Theme configuration
   * @returns {Promise<Object>} Slide creation result
   */
  async addSlideWithContent(presentationId, slideData, theme = null) {
    const activeTheme = theme || this.defaultTheme;

    try {
      logger.debug('Adding slide with content', { presentationId, slideType: slideData.type });

      const validation = this.validationService.validateSlideContent(slideData);
      if (!validation.isValid) {
        throw new Error(`Slide validation failed: ${validation.errors.join(', ')}`);
      }

      const slide = this.slidesService.addSlide(presentationId, 'BLANK');
      const slideIndex = await this.getSlideIndex(presentationId, slide);

      const slideDimensions = this.slidesService.getSlideDimensions(presentationId);

      const contentElements = [];

      if (slideData.title) {
        const titleElement = await this.addTitleElement(
          presentationId,
          slideIndex,
          slideData.title,
          slideDimensions,
          activeTheme
        );
        contentElements.push(titleElement);
      }

      if (slideData.content) {
        const contentResult = await this.addContentElements(
          presentationId,
          slideIndex,
          slideData.content,
          slideDimensions,
          activeTheme,
          slideData.layout
        );
        contentElements.push(...contentResult);
      }

      logger.info('Slide added successfully', {
        presentationId,
        slideIndex,
        elementCount: contentElements.length
      });

      return {
        slideIndex,
        elements: contentElements,
        layout: slideData.layout || 'single',
        theme: activeTheme
      };
    } catch (error) {
      logger.error('Failed to add slide with content', { presentationId, slideData }, error);
      throw error;
    }
  }

  /**
   * Add title element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {string} title - Title text
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @returns {Promise<Object>} Title element result
   */
  async addTitleElement(presentationId, slideIndex, title, slideDimensions, theme) {
    const position = {
      x: this.layoutTemplates.single.margin,
      y: this.layoutTemplates.single.margin,
      width: slideDimensions.width - this.layoutTemplates.single.margin * 2,
      height: this.layoutTemplates.single.titleHeight
    };

    const style = {
      fontFamily: theme.fontFamily,
      fontSize: theme.titleFontSize,
      color: theme.primaryColor,
      bold: true,
      alignment: 'CENTER'
    };

    const _textBox = this.slidesService.insertTextBox(
      presentationId,
      slideIndex,
      title,
      position,
      style
    );

    return {
      type: 'title',
      text: title,
      position,
      style
    };
  }

  /**
   * Add content elements to slide based on layout
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Array} content - Content array
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @returns {Promise<Array>} Content elements results
   */
  async addContentElements(
    presentationId,
    slideIndex,
    content,
    slideDimensions,
    theme,
    layout = 'single'
  ) {
    const elements = [];

    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      const element = await this.processContentItem(
        presentationId,
        slideIndex,
        item,
        slideDimensions,
        theme,
        layout,
        i
      );

      if (element) {
        elements.push(element);
      }
    }

    return elements;
  }

  /**
   * Process a single content item
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} item - Content item
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @param {number} index - Item index
   * @returns {Promise<Object|null>} Processed element or null
   */
  async processContentItem(
    presentationId,
    slideIndex,
    item,
    slideDimensions,
    theme,
    layout,
    index
  ) {
    try {
      return await this.createElementByType(
        item.type,
        presentationId,
        slideIndex,
        item,
        slideDimensions,
        theme,
        layout,
        index
      );
    } catch (error) {
      logger.error(
        'Failed to add content element',
        {
          type: item.type,
          index,
          presentationId,
          slideIndex
        },
        error
      );
      return null;
    }
  }

  /**
   * Create element based on type
   * @param {string} type - Element type
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} item - Content item
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @param {number} index - Item index
   * @returns {Promise<Object>} Created element
   */
  async createElementByType(
    type,
    presentationId,
    slideIndex,
    item,
    slideDimensions,
    theme,
    layout,
    index
  ) {
    const elementHandlers = this.getElementHandlers({
      presentationId,
      slideIndex,
      item,
      slideDimensions,
      theme,
      layout,
      index
    });

    const handler = elementHandlers[type];
    if (handler) {
      return await handler();
    }

    logger.warn('Unknown content type', { type, index });
    return null;
  }

  /**
   * Get element handlers mapping
   * @param {Object} params - Parameters object
   * @returns {Object} Handler mapping object
   */
  getElementHandlers(params) {
    const { presentationId: pId, slideIndex: sIdx, item, slideDimensions: dims } = params;
    const { theme, layout, index } = params;
    return {
      text: () => this.addTextElement(pId, sIdx, item, dims, theme, layout, index),
      image: () => this.addImageElement(pId, sIdx, item, dims, layout, index),
      table: () => this.addTableElement(pId, sIdx, item, dims, theme, layout, index),
      chart: () => this.addChartElement(pId, sIdx, item, dims, theme, layout, index),
      mermaid: () => this.addMermaidElement(pId, sIdx, item, dims, layout, index),
      svg: () => this.addSVGElement(pId, sIdx, item, dims, layout, index)
    };
  }

  /**
   * Add text element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} textItem - Text item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Text element result
   */
  async addTextElement(
    presentationId,
    slideIndex,
    textItem,
    slideDimensions,
    theme,
    layout,
    elementIndex
  ) {
    const validation = this.validationService.validateSlideContent(textItem);
    if (!validation.isValid) {
      throw new Error(`Text validation failed: ${validation.errors.join(', ')}`);
    }

    const position = this.calculateContentPosition(slideDimensions, layout, elementIndex, 'text');
    const fontSize =
      textItem.fontSize ||
      this.slidesService.calculateOptimalFontSize(
        slideDimensions.width,
        slideDimensions.height,
        textItem.text.length
      );

    const style = {
      fontFamily: textItem.fontFamily || theme.fontFamily,
      fontSize: fontSize,
      color: textItem.color || theme.primaryColor,
      lineHeight: theme.lineHeight,
      alignment: textItem.alignment || 'LEFT'
    };

    const _textBox = this.slidesService.insertTextBox(
      presentationId,
      slideIndex,
      validation.sanitized.text,
      position,
      style
    );

    return {
      type: 'text',
      text: validation.sanitized.text,
      position,
      style
    };
  }

  /**
   * Add image element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} imageItem - Image item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Image element result
   */
  async addImageElement(
    presentationId,
    slideIndex,
    imageItem,
    slideDimensions,
    layout,
    elementIndex
  ) {
    const validation = this.validationService.validateImageParams(imageItem);
    if (!validation.isValid) {
      throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
    }

    const position =
      imageItem.position ||
      this.calculateContentPosition(slideDimensions, layout, elementIndex, 'image');

    const _image = this.slidesService.insertImage(
      presentationId,
      slideIndex,
      validation.sanitized.source,
      position
    );

    return {
      type: 'image',
      source: validation.sanitized.source,
      position,
      altText: validation.sanitized.altText
    };
  }

  /**
   * Add table element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} tableItem - Table item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Table element result
   */
  async addTableElement(
    presentationId,
    slideIndex,
    tableItem,
    slideDimensions,
    theme,
    layout,
    elementIndex
  ) {
    const validation = this.validationService.validateTableData(tableItem.data);
    if (!validation.isValid) {
      throw new Error(`Table validation failed: ${validation.errors.join(', ')}`);
    }

    const position =
      tableItem.position ||
      this.calculateContentPosition(slideDimensions, layout, elementIndex, 'table');

    const rows = validation.sanitized.length;
    const columns = Math.max(...validation.sanitized.map(row => row.length));

    const _table = this.slidesService.insertTable(
      presentationId,
      slideIndex,
      rows,
      columns,
      position,
      validation.sanitized
    );

    return {
      type: 'table',
      data: validation.sanitized,
      position,
      rows,
      columns
    };
  }

  /**
   * Add Mermaid diagram element to slide with advanced features
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} mermaidItem - Mermaid item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Mermaid element result
   */
  async addMermaidElement(
    presentationId,
    slideIndex,
    mermaidItem,
    slideDimensions,
    layout,
    elementIndex
  ) {
    try {
      logger.debug('Adding advanced Mermaid element', { 
        presentationId, 
        slideIndex, 
        interactive: mermaidItem.interactive,
        exportFormats: mermaidItem.exportFormats 
      });

      const position =
        mermaidItem.position ||
        this.calculateContentPosition(slideDimensions, layout, elementIndex, 'diagram');

      // Use advanced MermaidService for diagram creation
      const diagramOptions = {
        code: mermaidItem.code,
        styleTemplate: mermaidItem.styleTemplate || 'professional',
        customTheme: mermaidItem.customTheme,
        interactive: mermaidItem.interactive || false,
        interactiveOptions: mermaidItem.interactiveOptions || {},
        exportFormats: mermaidItem.exportFormats || ['svg'],
        width: position.width,
        height: position.height,
        clickHandlers: mermaidItem.clickHandlers,
        tooltipData: mermaidItem.tooltipData,
        animations: mermaidItem.animations
      };

      const diagramResult = await this.mermaidService.createAdvancedDiagram(diagramOptions);

      // Insert the primary SVG into the slide
      const svgContent = diagramResult.outputs.interactive || diagramResult.outputs.svg;
      const _image = this.slidesService.insertSVG(presentationId, slideIndex, svgContent, position);

      // Store additional outputs for potential export
      const result = {
        type: 'mermaid',
        code: diagramResult.code,
        position,
        config: diagramResult.config,
        metadata: diagramResult.metadata,
        outputs: diagramResult.outputs,
        features: {
          interactive: Boolean(mermaidItem.interactive),
          multiFormat: diagramResult.outputs ? 
            Object.keys(diagramResult.outputs).length > 1 : false,
          customStyling: Boolean(mermaidItem.styleTemplate) || 
            Boolean(mermaidItem.customTheme)
        }
      };

      logger.info('Advanced Mermaid element added successfully', {
        presentationId,
        slideIndex,
        features: result.features,
        complexity: result.metadata.complexity
      });

      return result;
    } catch (error) {
      logger.error('Failed to add advanced Mermaid element', { 
        presentationId, 
        slideIndex, 
        mermaidItem 
      }, error);
      
      // Fallback to basic Mermaid generation
      logger.warn('Falling back to basic Mermaid generation');
      return await this.addBasicMermaidElement(
        presentationId, 
        slideIndex, 
        mermaidItem, 
        slideDimensions, 
        layout, 
        elementIndex
      );
    }
  }

  /**
   * Fallback method for basic Mermaid diagram creation
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} mermaidItem - Mermaid item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Basic Mermaid element result
   */
  async addBasicMermaidElement(
    presentationId,
    slideIndex,
    mermaidItem,
    slideDimensions,
    layout,
    elementIndex
  ) {
    const validation = this.validationService.validateMermaidCode(mermaidItem.code);
    if (!validation.isValid) {
      throw new Error(`Mermaid validation failed: ${validation.errors.join(', ')}`);
    }

    const position =
      mermaidItem.position ||
      this.calculateContentPosition(slideDimensions, layout, elementIndex, 'diagram');

    const svgContent = await this.convertMermaidToSVG(validation.sanitized);
    const _image = this.slidesService.insertSVG(presentationId, slideIndex, svgContent, position);

    return {
      type: 'mermaid',
      code: validation.sanitized,
      position,
      fallback: true
    };
  }

  /**
   * Add chart element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} chartItem - Chart item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {Object} theme - Theme configuration
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} Chart element result
   */
  async addChartElement(
    presentationId,
    slideIndex,
    chartItem,
    slideDimensions,
    theme,
    layout,
    elementIndex
  ) {
    const validation = this.chartService.validateChartConfig(chartItem);
    if (!validation.isValid) {
      throw new Error(`Chart validation failed: ${validation.errors.join(', ')}`);
    }

    const position =
      chartItem.position ||
      this.calculateContentPosition(slideDimensions, layout, elementIndex, 'chart');

    const chartResult = await this.chartService.createChart(
      presentationId,
      slideIndex,
      validation.sanitized,
      position,
      theme
    );

    return {
      type: 'chart',
      chartType: validation.sanitized.chartType,
      position,
      dataPoints: chartResult.dataPoints,
      options: chartResult.options
    };
  }

  /**
   * Add SVG element to slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} svgItem - SVG item configuration
   * @param {Object} slideDimensions - Slide dimensions
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element position index
   * @returns {Promise<Object>} SVG element result
   */
  async addSVGElement(presentationId, slideIndex, svgItem, slideDimensions, layout, elementIndex) {
    const validation = this.validationService.validateSVGContent(svgItem.content);
    if (!validation.isValid) {
      throw new Error(`SVG validation failed: ${validation.errors.join(', ')}`);
    }

    const position =
      svgItem.position ||
      this.calculateContentPosition(slideDimensions, layout, elementIndex, 'diagram');

    const _image = this.slidesService.insertSVG(
      presentationId,
      slideIndex,
      validation.sanitized,
      position
    );

    return {
      type: 'svg',
      content: validation.sanitized,
      position
    };
  }

  /**
   * Calculate content position based on layout and element index
   * @param {Object} slideDimensions - Slide dimensions
   * @param {string} layout - Layout type
   * @param {number} elementIndex - Element index
   * @param {string} elementType - Element type
   * @returns {Object} Position configuration
   */
  calculateContentPosition(slideDimensions, layout, elementIndex, elementType) {
    const template = this.layoutTemplates[layout] || this.layoutTemplates.single;
    const { margin, titleHeight, contentSpacing } = template;

    const startY = margin + titleHeight + contentSpacing;

    if (layout === 'single') {
      const elementHeight = this.getElementHeight(elementType);
      return {
        x: margin,
        y: startY + elementIndex * (elementHeight + contentSpacing),
        width: slideDimensions.width - margin * 2,
        height: elementHeight
      };
    }

    if (layout === 'double') {
      const columnWidth = (slideDimensions.width - margin * 2 - template.columnGap) / 2;
      const column = elementIndex % 2;
      const row = Math.floor(elementIndex / 2);
      const elementHeight = this.getElementHeight(elementType);

      return {
        x: margin + column * (columnWidth + template.columnGap),
        y: startY + row * (elementHeight + contentSpacing),
        width: columnWidth,
        height: elementHeight
      };
    }

    throw new Error(`Unsupported layout: ${layout}`);
  }

  /**
   * Get default height for element type
   * @param {string} elementType - Element type
   * @returns {number} Height in points
   */
  getElementHeight(elementType) {
    const heights = {
      text: 100,
      image: 200,
      table: 150,
      chart: 300,
      diagram: 250
    };

    return heights[elementType] || 100;
  }

  /**
   * Convert Mermaid code to SVG
   * @param {string} mermaidCode - Mermaid diagram code
   * @returns {Promise<string>} SVG content
   */
  async convertMermaidToSVG(mermaidCode) {
    try {
      logger.debug('Converting Mermaid to SVG', { codeLength: mermaidCode.length });

      const response = UrlFetchApp.fetch(
        'https://mermaid.ink/svg/' + Utilities.base64Encode(mermaidCode),
        {
          method: 'GET',
          headers: { Accept: 'image/svg+xml' }
        }
      );

      if (response.getResponseCode() === 200) {
        return response.getContentText();
      } else {
        throw new Error(`Mermaid API error: ${response.getResponseCode()}`);
      }
    } catch (error) {
      logger.error('Failed to convert Mermaid to SVG', { mermaidCode }, error);
      throw new Error('Mermaid diagram conversion failed');
    }
  }

  /**
   * Get slide index from slide object
   * @param {string} presentationId - Presentation ID
   * @param {GoogleAppsScript.Slides.Slide} slide - Slide object
   * @returns {Promise<number>} Slide index
   */
  async getSlideIndex(presentationId, slide) {
    const presentation = this.slidesService.openPresentation(presentationId);
    const slides = presentation.getSlides();

    for (let i = 0; i < slides.length; i++) {
      if (slides[i].getObjectId() === slide.getObjectId()) {
        return i;
      }
    }

    throw new Error('Could not determine slide index');
  }

  /**
   * Apply theme to existing presentation
   * @param {string} presentationId - Presentation ID
   * @param {Object} theme - Theme configuration
   * @returns {Promise<Object>} Theme application result
   */
  async applyTheme(presentationId, theme) {
    try {
      logger.info('Applying theme to presentation', { presentationId, theme });

      const presentation = this.slidesService.openPresentation(presentationId);
      const slides = presentation.getSlides();

      const results = [];

      for (let i = 0; i < slides.length; i++) {
        const slideResult = await this.applyThemeToSlide(presentationId, i, theme);
        results.push(slideResult);
      }

      logger.info('Theme applied successfully', {
        presentationId,
        slidesProcessed: results.length
      });

      return {
        presentationId,
        theme,
        slidesProcessed: results.length,
        results
      };
    } catch (error) {
      logger.error('Failed to apply theme', { presentationId, theme }, error);
      throw error;
    }
  }

  /**
   * Apply theme to specific slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} theme - Theme configuration
   * @returns {Promise<Object>} Slide theme result
   */
  async applyThemeToSlide(presentationId, slideIndex, theme) {
    const presentation = this.slidesService.openPresentation(presentationId);
    const slide = presentation.getSlides()[slideIndex];
    const shapes = slide.getShapes();

    let elementsUpdated = 0;

    shapes.forEach(shape => {
      if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
        const text = shape.getText();
        const textStyle = text.getTextStyle();

        if (theme.fontFamily) {
          textStyle.setFontFamily(theme.fontFamily);
        }
        if (theme.primaryColor) {
          textStyle.setForegroundColor(theme.primaryColor);
        }

        elementsUpdated++;
      }
    });

    return {
      slideIndex,
      elementsUpdated
    };
  }

  /**
   * Export Mermaid diagram in multiple formats
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} exportOptions - Export configuration
   * @returns {Promise<Object>} Export result with multiple formats
   */
  async exportMermaidDiagram(presentationId, slideIndex, exportOptions) {
    try {
      logger.info('Exporting Mermaid diagram', { 
        presentationId, 
        slideIndex, 
        formats: exportOptions.formats 
      });

      // Find the Mermaid element in the slide
      const presentation = this.slidesService.openPresentation(presentationId);
      const _slide = presentation.getSlides()[slideIndex];
      
      // For this implementation, we'll need to recreate the diagram with export options
      if (!exportOptions.mermaidCode) {
        throw new Error('Mermaid code is required for export');
      }

      const diagramOptions = {
        code: exportOptions.mermaidCode,
        styleTemplate: exportOptions.styleTemplate || 'professional',
        customTheme: exportOptions.customTheme,
        exportFormats: exportOptions.formats || ['svg', 'png', 'pdf'],
        width: exportOptions.width || 800,
        height: exportOptions.height || 600,
        interactive: false // Disable for export
      };

      const diagramResult = await this.mermaidService.createAdvancedDiagram(diagramOptions);

      // Prepare export results
      const exportResult = {
        presentationId,
        slideIndex,
        timestamp: new Date().toISOString(),
        formats: {},
        metadata: diagramResult.metadata
      };

      // Process each requested format
      for (const format of exportOptions.formats) {
        if (diagramResult.outputs[format]) {
          exportResult.formats[format] = {
            content: diagramResult.outputs[format],
            mimeType: this.getMimeTypeForFormat(format),
            filename: `mermaid-diagram-${slideIndex}.${format}`,
            size: this.calculateContentSize(diagramResult.outputs[format])
          };
        }
      }

      logger.info('Mermaid diagram export completed', {
        presentationId,
        slideIndex,
        exportedFormats: Object.keys(exportResult.formats)
      });

      return exportResult;
    } catch (error) {
      logger.error('Failed to export Mermaid diagram', { 
        presentationId, 
        slideIndex, 
        exportOptions 
      }, error);
      throw error;
    }
  }

  /**
   * Get MIME type for export format
   * @param {string} format - Export format
   * @returns {string} MIME type
   */
  getMimeTypeForFormat(format) {
    const mimeTypes = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      pdf: 'application/pdf'
    };

    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Calculate content size
   * @param {string|Blob} content - Content to measure
   * @returns {number} Size in bytes
   */
  calculateContentSize(content) {
    if (typeof content === 'string') {
      return content.length;
    } else if (content && content.getBytes) {
      return content.getBytes().length;
    }
    return 0;
  }

  /**
   * Batch export multiple Mermaid diagrams from presentation
   * @param {string} presentationId - Presentation ID
   * @param {Object} batchOptions - Batch export configuration
   * @returns {Promise<Object>} Batch export result
   */
  async batchExportMermaidDiagrams(presentationId, batchOptions) {
    try {
      logger.info('Starting batch export of Mermaid diagrams', { 
        presentationId, 
        formats: batchOptions.formats 
      });

      const presentation = this.slidesService.openPresentation(presentationId);
      const slides = presentation.getSlides();
      const results = [];

      for (let i = 0; i < slides.length; i++) {
        try {
          // Check if slide contains Mermaid diagrams
          if (batchOptions.slideIndices && !batchOptions.slideIndices.includes(i)) {
            continue;
          }

          // This would need additional logic to detect existing Mermaid diagrams
          // For now, skip slides without explicit Mermaid code provided
          if (batchOptions.slideMermaidCodes && batchOptions.slideMermaidCodes[i]) {
            const exportOptions = {
              mermaidCode: batchOptions.slideMermaidCodes[i],
              formats: batchOptions.formats,
              styleTemplate: batchOptions.styleTemplate,
              customTheme: batchOptions.customTheme,
              width: batchOptions.width,
              height: batchOptions.height
            };

            const slideResult = await this.exportMermaidDiagram(presentationId, i, exportOptions);
            results.push(slideResult);
          }
        } catch (error) {
          logger.warn(`Failed to export Mermaid diagram from slide ${i}`, error);
          results.push({
            slideIndex: i,
            error: error.message,
            success: false
          });
        }
      }

      const batchResult = {
        presentationId,
        timestamp: new Date().toISOString(),
        totalSlides: slides.length,
        processedSlides: results.length,
        successfulExports: results.filter(r => !r.error).length,
        failedExports: results.filter(r => r.error).length,
        results
      };

      logger.info('Batch export completed', {
        presentationId,
        successful: batchResult.successfulExports,
        failed: batchResult.failedExports
      });

      return batchResult;
    } catch (error) {
      logger.error('Batch export failed', { presentationId, batchOptions }, error);
      throw error;
    }
  }
}

// Global export for Google Apps Script
