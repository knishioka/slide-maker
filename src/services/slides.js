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
        if (i === maxRetries - 1) {
          throw error;
        }
        const delay = this.baseDelay * Math.pow(2, i);
        Utilities.sleep(delay);
      }
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
      const layout = presentation.getLayouts().find(l => 
        l.getLayoutType() === SlidesApp.PredefinedLayout[layoutType]) || presentation.getLayouts()[0];
      
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
      
      const textBox = slide.insertTextBox(text, position.x, position.y, position.width, position.height);
      
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
        image = slide.insertImage(imageSource, position.x, position.y, position.width, position.height);
      } else {
        image = slide.insertImage(imageSource, position.x, position.y, position.width, position.height);
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
      
      const table = slide.insertTable(rows, columns, position.x, position.y, position.width, position.height);
      
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
        y: margin + (elementIndex * 100),
        width: width - (margin * 2),
        height: 80
      };
    }
    
    if (layoutType === 'double') {
      const columnWidth = (width - (margin * 3)) / 2;
      const column = elementIndex % 2;
      const row = Math.floor(elementIndex / 2);
      
      return {
        x: margin + (column * (columnWidth + margin)),
        y: margin + (row * 100),
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
}

// Global export for Google Apps Script