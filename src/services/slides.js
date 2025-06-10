/**
 * Google Slides API Wrapper Service
 * Provides comprehensive Google Slides operations with error handling and retry logic
 */
class SlidesService {
  /**
   * Initialize SlidesService with retry configuration
   */
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000;
  }

  /**
   * Execute function with exponential backoff retry
   * @param {Function} fn - Function to execute
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {*} Function result
   */
  executeWithRetry(fn, maxRetries = this.maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return fn();
      } catch (error) {
        logger.warn(`Retry attempt ${i + 1}/${maxRetries}`, { error: error.message });
        
        if (i === maxRetries - 1) {
          logger.error('All retry attempts failed', null, error);
          throw error;
        }
        
        const delay = this.baseDelay * Math.pow(2, i);
        Utilities.sleep(delay);
      }
    }
  }

  /**
   * Batch execute multiple operations with performance monitoring
   * @param {Array<Function>} operations - Array of operations to execute
   * @param {Object} options - Execution options
   * @returns {Array} Results array
   */
  batchExecute(operations, options = {}) {
    const {
      batchSize = 10,
      delayBetweenBatches = 100,
      continueOnError = false
    } = options;

    const monitor = logger.createPerformanceMonitor('batchExecute');
    monitor.start();

    const results = [];
    const errors = [];

    try {
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
          batchSize: batch.length,
          totalOperations: operations.length
        });

        for (const operation of batch) {
          try {
            const result = this.executeWithRetry(operation);
            results.push(result);
          } catch (error) {
            errors.push({ index: results.length + errors.length, error });
            if (!continueOnError) {
              throw error;
            }
            results.push(null);
          }
        }

        if (i + batchSize < operations.length && delayBetweenBatches > 0) {
          Utilities.sleep(delayBetweenBatches);
        }
      }

      return { results, errors, successful: results.filter(r => r !== null).length };
    } finally {
      monitor.end();
    }
  }

  /**
   * Create new presentation
   * @param {string} title - Presentation title
   * @returns {string} Presentation ID
   */
  createPresentation(title) {
    return this.executeWithRetry(() => {
      const presentation = SlidesApp.create(title);
      return presentation.getId();
    });
  }

  /**
   * Open existing presentation
   * @param {string} presentationId - Presentation ID
   * @returns {GoogleAppsScript.Slides.Presentation} Presentation object
   */
  openPresentation(presentationId) {
    return this.executeWithRetry(() => {
      return SlidesApp.openById(presentationId);
    });
  }

  /**
   * Add new slide to presentation
   * @param {string} presentationId - Presentation ID
   * @param {string} layoutType - Layout type (BLANK, TITLE_AND_BODY, etc.)
   * @returns {GoogleAppsScript.Slides.Slide} New slide object
   */
  addSlide(presentationId, layoutType = 'BLANK') {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const layout =
        presentation
          .getLayouts()
          .find(l => l.getLayoutType() === SlidesApp.PredefinedLayout[layoutType]) ||
        presentation.getLayouts()[0];

      return presentation.appendSlide(layout);
    });
  }

  /**
   * Insert text box into slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index (0-based)
   * @param {string} text - Text content
   * @param {Object} position - {x, y, width, height} in points
   * @param {Object} style - Text style options
   * @returns {GoogleAppsScript.Slides.Shape} Text box shape
   */
  insertTextBox(presentationId, slideIndex, text, position, style = {}) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slide = presentation.getSlides()[slideIndex];

      const textBox = slide.insertTextBox(
        text,
        position.x,
        position.y,
        position.width,
        position.height
      );

      this.applyTextStyle(textBox, style);

      return textBox;
    });
  }

  /**
   * Apply text styling
   * @param {GoogleAppsScript.Slides.Shape} textBox - Text box element
   * @param {Object} style - Style configuration
   */
  applyTextStyle(textBox, style) {
    const textStyle = textBox.getText().getTextStyle();
    const paragraphStyle = textBox.getText().getParagraphStyle();

    if (style.fontFamily) {
      textStyle.setFontFamily(style.fontFamily);
    }
    if (style.fontSize) {
      textStyle.setFontSize(style.fontSize);
    }
    if (style.color) {
      textStyle.setForegroundColor(style.color);
    }
    if (style.bold !== undefined) {
      textStyle.setBold(style.bold);
    }
    if (style.italic !== undefined) {
      textStyle.setItalic(style.italic);
    }
    if (style.lineHeight) {
      paragraphStyle.setLineSpacing(style.lineHeight);
    }
    if (style.alignment) {
      paragraphStyle.setParagraphAlignment(SlidesApp.ParagraphAlignment[style.alignment]);
    }
  }

  /**
   * Insert image into slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {string|Blob} imageSource - Image URL or Blob
   * @param {Object} position - {x, y, width, height}
   * @returns {GoogleAppsScript.Slides.Image} Image object
   */
  insertImage(presentationId, slideIndex, imageSource, position) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slide = presentation.getSlides()[slideIndex];

      let image;
      if (typeof imageSource === 'string') {
        image = slide.insertImage(
          imageSource,
          position.x,
          position.y,
          position.width,
          position.height
        );
      } else {
        image = slide.insertImage(
          imageSource,
          position.x,
          position.y,
          position.width,
          position.height
        );
      }

      return image;
    });
  }

  /**
   * Insert table into slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {number} rows - Number of rows
   * @param {number} columns - Number of columns
   * @param {Object} position - {x, y, width, height}
   * @param {Array<Array<string>>} data - Table data
   * @returns {GoogleAppsScript.Slides.Table} Table object
   */
  insertTable(presentationId, slideIndex, rows, columns, position, data = []) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slide = presentation.getSlides()[slideIndex];

      const table = slide.insertTable(
        rows,
        columns,
        position.x,
        position.y,
        position.width,
        position.height
      );

      if (data.length > 0) {
        this.fillTableData(table, data);
      }

      return table;
    });
  }

  /**
   * Fill table with data
   * @param {GoogleAppsScript.Slides.Table} table - Table object
   * @param {Array<Array<string>>} data - Table data
   */
  fillTableData(table, data) {
    for (let row = 0; row < Math.min(data.length, table.getNumRows()); row++) {
      for (let col = 0; col < Math.min(data[row].length, table.getNumColumns()); col++) {
        table.getCell(row, col).getText().setText(data[row][col]);
      }
    }
  }

  /**
   * Insert SVG as image
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {string} svgContent - SVG content
   * @param {Object} position - {x, y, width, height}
   * @returns {GoogleAppsScript.Slides.Image} Image object
   */
  insertSVG(presentationId, slideIndex, svgContent, position) {
    return this.executeWithRetry(() => {
      const tempFile = DriveApp.createFile('temp.svg', svgContent, 'image/svg+xml');

      try {
        const image = this.insertImage(presentationId, slideIndex, tempFile.getBlob(), position);
        return image;
      } finally {
        DriveApp.getFileById(tempFile.getId()).setTrashed(true);
      }
    });
  }

  /**
   * Get slide dimensions
   * @param {string} presentationId - Presentation ID
   * @returns {Object} {width, height} in points
   */
  getSlideDimensions(presentationId) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const _pageSize = presentation.getPageWidth();
      return {
        width: presentation.getPageWidth(),
        height: presentation.getPageHeight()
      };
    });
  }

  /**
   * Calculate optimal font size based on slide dimensions and content
   * @param {number} slideWidth - Slide width in points
   * @param {number} slideHeight - Slide height in points
   * @param {number} textLength - Text character count
   * @returns {number} Optimal font size in points
   */
  calculateOptimalFontSize(slideWidth, slideHeight, textLength) {
    const baseSize = 24;
    const standardWidth = 960;
    const standardHeight = 540;

    const widthFactor = slideWidth / standardWidth;
    const heightFactor = slideHeight / standardHeight;
    const scaleFactor = Math.min(widthFactor, heightFactor);

    const lengthAdjustment = Math.max(0.8, 1 - (textLength / 1000) * 0.2);

    return Math.round(baseSize * scaleFactor * lengthAdjustment);
  }

  /**
   * Apply layout-specific positioning
   * @param {string} layoutType - 'single' or 'double'
   * @param {Object} slideDimensions - {width, height}
   * @param {number} elementIndex - Element position index
   * @returns {Object} Position configuration
   */
  calculateLayoutPosition(layoutType, slideDimensions, elementIndex) {
    const margin = 60;
    const { width, height: _height } = slideDimensions;

    if (layoutType === 'single') {
      return {
        x: margin,
        y: margin + elementIndex * 100,
        width: width - margin * 2,
        height: 80
      };
    }

    if (layoutType === 'double') {
      const columnWidth = (width - margin * 3) / 2;
      const column = elementIndex % 2;
      const row = Math.floor(elementIndex / 2);

      return {
        x: margin + column * (columnWidth + margin),
        y: margin + row * 100,
        width: columnWidth,
        height: 80
      };
    }

    throw new Error(`Unsupported layout type: ${layoutType}`);
  }

  /**
   * Delete slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index to delete
   * @returns {void}
   */
  deleteSlide(presentationId, slideIndex) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slides = presentation.getSlides();

      if (slideIndex >= 0 && slideIndex < slides.length) {
        slides[slideIndex].remove();
      }
    });
  }

  /**
   * Get presentation metadata
   * @param {string} presentationId - Presentation ID
   * @returns {Object} Presentation metadata
   */
  getPresentationInfo(presentationId) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);

      return {
        id: presentation.getId(),
        name: presentation.getName(),
        url: presentation.getUrl(),
        slideCount: presentation.getSlides().length,
        width: presentation.getPageWidth(),
        height: presentation.getPageHeight()
      };
    });
  }

  /**
   * Clone slide within presentation
   * @param {string} presentationId - Presentation ID
   * @param {number} sourceSlideIndex - Source slide index
   * @param {number} targetIndex - Target position index
   * @returns {GoogleAppsScript.Slides.Slide} Cloned slide
   */
  cloneSlide(presentationId, sourceSlideIndex, targetIndex = null) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slides = presentation.getSlides();
      
      if (sourceSlideIndex < 0 || sourceSlideIndex >= slides.length) {
        throw new Error('Source slide index out of bounds');
      }

      const sourceSlide = slides[sourceSlideIndex];
      const clonedSlide = presentation.appendSlide(sourceSlide.getLayout());

      const sourceShapes = sourceSlide.getShapes();
      sourceShapes.forEach(shape => {
        try {
          this.cloneShape(shape, clonedSlide);
        } catch (error) {
          logger.warn('Failed to clone shape', { shapeType: shape.getShapeType() }, error);
        }
      });

      if (targetIndex !== null && targetIndex !== slides.length) {
        this.moveSlide(presentationId, slides.length, targetIndex);
      }

      return clonedSlide;
    });
  }

  /**
   * Clone shape to target slide
   * @param {GoogleAppsScript.Slides.Shape} sourceShape - Source shape
   * @param {GoogleAppsScript.Slides.Slide} targetSlide - Target slide
   * @returns {GoogleAppsScript.Slides.Shape} Cloned shape
   */
  cloneShape(sourceShape, targetSlide) {
    const shapeType = sourceShape.getShapeType();
    
    if (shapeType === SlidesApp.ShapeType.TEXT_BOX) {
      const textContent = sourceShape.getText().asString();
      const transform = sourceShape.getTransform();
      
      const clonedShape = targetSlide.insertTextBox(
        textContent,
        transform.getTranslateX(),
        transform.getTranslateY(),
        sourceShape.getWidth(),
        sourceShape.getHeight()
      );

      this.copyTextStyle(sourceShape.getText(), clonedShape.getText());
      return clonedShape;
    }

    if (shapeType === SlidesApp.ShapeType.IMAGE) {
      const transform = sourceShape.getTransform();
      const imageBlob = sourceShape.getAs('image/png');
      
      return targetSlide.insertImage(
        imageBlob,
        transform.getTranslateX(),
        transform.getTranslateY(),
        sourceShape.getWidth(),
        sourceShape.getHeight()
      );
    }

    logger.warn('Unsupported shape type for cloning', { shapeType });
    return null;
  }

  /**
   * Copy text style from source to target
   * @param {GoogleAppsScript.Slides.TextRange} sourceText - Source text
   * @param {GoogleAppsScript.Slides.TextRange} targetText - Target text
   */
  copyTextStyle(sourceText, targetText) {
    try {
      const sourceStyle = sourceText.getTextStyle();
      const targetStyle = targetText.getTextStyle();

      targetStyle.setFontFamily(sourceStyle.getFontFamily());
      targetStyle.setFontSize(sourceStyle.getFontSize());
      targetStyle.setForegroundColor(sourceStyle.getForegroundColor().asRgbColor().asHexString());
      targetStyle.setBold(sourceStyle.isBold());
      targetStyle.setItalic(sourceStyle.isItalic());

      const sourceParagraphStyle = sourceText.getParagraphStyle();
      const targetParagraphStyle = targetText.getParagraphStyle();
      
      targetParagraphStyle.setParagraphAlignment(sourceParagraphStyle.getParagraphAlignment());
      targetParagraphStyle.setLineSpacing(sourceParagraphStyle.getLineSpacing());
    } catch (error) {
      logger.warn('Failed to copy text style', null, error);
    }
  }

  /**
   * Move slide to new position
   * @param {string} presentationId - Presentation ID
   * @param {number} fromIndex - Source position
   * @param {number} toIndex - Target position
   * @returns {void}
   */
  moveSlide(presentationId, fromIndex, toIndex) {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      const slides = presentation.getSlides();
      
      if (fromIndex < 0 || fromIndex >= slides.length || toIndex < 0 || toIndex >= slides.length) {
        throw new Error('Slide index out of bounds');
      }

      if (fromIndex === toIndex) {
        return;
      }

      const slideToMove = slides[fromIndex];
      
      if (fromIndex < toIndex) {
        for (let i = fromIndex; i < toIndex; i++) {
          slides[i + 1].move(i);
        }
      } else {
        for (let i = fromIndex; i > toIndex; i--) {
          slides[i - 1].move(i);
        }
      }
      
      slideToMove.move(toIndex);
    });
  }

  /**
   * Export presentation to different formats
   * @param {string} presentationId - Presentation ID
   * @param {string} format - Export format (PDF, PPTX, JPEG, PNG)
   * @returns {Blob} Exported content blob
   */
  exportPresentation(presentationId, format = 'PDF') {
    return this.executeWithRetry(() => {
      const presentation = this.openPresentation(presentationId);
      
      const formatMap = {
        'PDF': 'application/pdf',
        'PPTX': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'JPEG': 'image/jpeg',
        'PNG': 'image/png'
      };

      const mimeType = formatMap[format.toUpperCase()];
      if (!mimeType) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      return presentation.getAs(mimeType);
    });
  }
}

// Global export for Google Apps Script
