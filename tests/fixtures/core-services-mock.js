/**
 * Core Services API Mock
 * Mock implementation for testing Layout Engine integration with Core Services
 */

/**
 * Mock SlidesService for Layout Engine testing
 */
class MockSlidesService {
  constructor() {
    this.presentations = new Map();
    this.callLogs = [];
    this.failureSimulation = {
      enabled: false,
      failureRate: 0,
      operations: []
    };
  }

  /**
   * Log method calls for testing verification
   */
  logCall(method, args) {
    this.callLogs.push({
      method,
      args: JSON.parse(JSON.stringify(args)),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Reset mock state
   */
  reset() {
    this.presentations.clear();
    this.callLogs = [];
    this.failureSimulation = { enabled: false, failureRate: 0, operations: [] };
  }

  /**
   * Simulate failures for testing error handling
   */
  simulateFailure(enabled = true, failureRate = 0.3, operations = []) {
    this.failureSimulation = { enabled, failureRate, operations };
  }

  /**
   * Check if operation should fail
   */
  shouldFail(operation) {
    if (!this.failureSimulation.enabled) return false;
    if (this.failureSimulation.operations.length > 0 && 
        !this.failureSimulation.operations.includes(operation)) return false;
    return Math.random() < this.failureSimulation.failureRate;
  }

  /**
   * Get slide dimensions (mock implementation)
   */
  getSlideDimensions(presentationId) {
    this.logCall('getSlideDimensions', { presentationId });

    if (this.shouldFail('getSlideDimensions')) {
      throw new Error('Failed to get slide dimensions');
    }

    // Return different dimensions based on presentation ID for testing
    const dimensions = {
      'standard': { width: 960, height: 540 },
      'wide': { width: 1920, height: 1080 },
      'square': { width: 800, height: 800 },
      'mobile': { width: 414, height: 736 }
    };

    for (const [key, value] of Object.entries(dimensions)) {
      if (presentationId.includes(key)) {
        return value;
      }
    }

    return dimensions.standard; // Default
  }

  /**
   * Insert text box (mock implementation)
   */
  insertTextBox(presentationId, slideIndex, text, position, style = {}) {
    this.logCall('insertTextBox', { 
      presentationId, 
      slideIndex, 
      text, 
      position, 
      style 
    });

    if (this.shouldFail('insertTextBox')) {
      throw new Error('Failed to insert text box');
    }

    // Validate inputs
    if (!presentationId || typeof slideIndex !== 'number' || !text) {
      throw new Error('Invalid parameters for insertTextBox');
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new Error('Invalid position for text box');
    }

    // Create mock text box
    const textBoxId = `textbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const textBox = {
      getObjectId: () => textBoxId,
      getText: () => ({
        asString: () => text,
        setText: (newText) => { text = newText; },
        getTextStyle: () => this.createMockTextStyle(style),
        getParagraphStyle: () => this.createMockParagraphStyle(style)
      }),
      getLeft: () => position.x,
      getTop: () => position.y,
      getWidth: () => position.width,
      getHeight: () => position.height,
      setLeft: (x) => { position.x = x; },
      setTop: (y) => { position.y = y; },
      setWidth: (w) => { position.width = w; },
      setHeight: (h) => { position.height = h; }
    };

    // Store in presentation data
    if (!this.presentations.has(presentationId)) {
      this.presentations.set(presentationId, { slides: [] });
    }
    
    const presentation = this.presentations.get(presentationId);
    if (!presentation.slides[slideIndex]) {
      presentation.slides[slideIndex] = { elements: [] };
    }
    
    presentation.slides[slideIndex].elements.push({
      id: textBoxId,
      type: 'textBox',
      text,
      position,
      style
    });

    return textBox;
  }

  /**
   * Create mock text style object
   */
  createMockTextStyle(style) {
    const currentStyle = {
      fontFamily: style.fontFamily || 'Arial',
      fontSize: style.fontSize || 24,
      color: style.color || '#000000',
      bold: style.bold || false,
      italic: style.italic || false
    };

    return {
      setFontFamily: (family) => { currentStyle.fontFamily = family; },
      setFontSize: (size) => { currentStyle.fontSize = size; },
      setForegroundColor: (color) => { currentStyle.color = color; },
      setBold: (bold) => { currentStyle.bold = bold; },
      setItalic: (italic) => { currentStyle.italic = italic; },
      getFontFamily: () => currentStyle.fontFamily,
      getFontSize: () => currentStyle.fontSize,
      getForegroundColor: () => ({ asHexString: () => currentStyle.color }),
      isBold: () => currentStyle.bold,
      isItalic: () => currentStyle.italic
    };
  }

  /**
   * Create mock paragraph style object
   */
  createMockParagraphStyle(style) {
    const currentStyle = {
      lineHeight: style.lineHeight || 1.4,
      alignment: style.alignment || 'LEFT'
    };

    return {
      setLineSpacing: (spacing) => { currentStyle.lineHeight = spacing; },
      setParagraphAlignment: (alignment) => { currentStyle.alignment = alignment; },
      getLineSpacing: () => currentStyle.lineHeight,
      getParagraphAlignment: () => currentStyle.alignment
    };
  }

  /**
   * Insert image (mock implementation)
   */
  insertImage(presentationId, slideIndex, imageSource, position) {
    this.logCall('insertImage', { 
      presentationId, 
      slideIndex, 
      imageSource: typeof imageSource, 
      position 
    });

    if (this.shouldFail('insertImage')) {
      throw new Error('Failed to insert image');
    }

    const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in presentation data
    if (!this.presentations.has(presentationId)) {
      this.presentations.set(presentationId, { slides: [] });
    }
    
    const presentation = this.presentations.get(presentationId);
    if (!presentation.slides[slideIndex]) {
      presentation.slides[slideIndex] = { elements: [] };
    }
    
    presentation.slides[slideIndex].elements.push({
      id: imageId,
      type: 'image',
      source: imageSource,
      position
    });

    return {
      getObjectId: () => imageId,
      getImageUrl: () => typeof imageSource === 'string' ? imageSource : 'blob-image',
      getLeft: () => position.x,
      getTop: () => position.y,
      getWidth: () => position.width,
      getHeight: () => position.height
    };
  }

  /**
   * Insert table (mock implementation)
   */
  insertTable(presentationId, slideIndex, rows, columns, position, data = []) {
    this.logCall('insertTable', { 
      presentationId, 
      slideIndex, 
      rows, 
      columns, 
      position, 
      dataRows: data.length 
    });

    if (this.shouldFail('insertTable')) {
      throw new Error('Failed to insert table');
    }

    const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in presentation data
    if (!this.presentations.has(presentationId)) {
      this.presentations.set(presentationId, { slides: [] });
    }
    
    const presentation = this.presentations.get(presentationId);
    if (!presentation.slides[slideIndex]) {
      presentation.slides[slideIndex] = { elements: [] };
    }
    
    presentation.slides[slideIndex].elements.push({
      id: tableId,
      type: 'table',
      rows,
      columns,
      position,
      data
    });

    return {
      getObjectId: () => tableId,
      getNumRows: () => rows,
      getNumColumns: () => columns,
      getCell: (row, col) => ({
        getText: () => ({
          setText: (text) => {
            if (!data[row]) data[row] = [];
            data[row][col] = text;
          },
          asString: () => data[row] && data[row][col] || ''
        })
      })
    };
  }

  /**
   * Add slide (mock implementation)
   */
  addSlide(presentationId, layoutType = 'BLANK') {
    this.logCall('addSlide', { presentationId, layoutType });

    if (this.shouldFail('addSlide')) {
      throw new Error('Failed to add slide');
    }

    if (!this.presentations.has(presentationId)) {
      this.presentations.set(presentationId, { slides: [] });
    }

    const presentation = this.presentations.get(presentationId);
    const slideIndex = presentation.slides.length;
    const slideId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    presentation.slides.push({
      id: slideId,
      index: slideIndex,
      layout: layoutType,
      elements: []
    });

    return {
      getObjectId: () => slideId,
      getSlideIndex: () => slideIndex,
      getLayout: () => ({ getLayoutType: () => layoutType })
    };
  }

  /**
   * Get call logs for testing verification
   */
  getCallLogs() {
    return [...this.callLogs];
  }

  /**
   * Get presentation data for testing verification
   */
  getPresentationData(presentationId) {
    return this.presentations.get(presentationId) || null;
  }

  /**
   * Get all presentations for testing
   */
  getAllPresentations() {
    return Object.fromEntries(this.presentations);
  }

  /**
   * Verify method was called with specific parameters
   */
  verifyMethodCalled(method, expectedArgs = null) {
    const calls = this.callLogs.filter(log => log.method === method);
    
    if (calls.length === 0) {
      return false;
    }

    if (expectedArgs === null) {
      return true;
    }

    return calls.some(call => 
      this.deepEqual(call.args, expectedArgs)
    );
  }

  /**
   * Deep equality check for testing
   */
  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  /**
   * Get method call count
   */
  getMethodCallCount(method) {
    return this.callLogs.filter(log => log.method === method).length;
  }

  /**
   * Get latest call for method
   */
  getLatestCall(method) {
    const calls = this.callLogs.filter(log => log.method === method);
    return calls.length > 0 ? calls[calls.length - 1] : null;
  }
}

/**
 * Mock ContentService for Layout Engine testing
 */
class MockContentService {
  constructor() {
    this.processedContent = [];
    this.callLogs = [];
  }

  /**
   * Reset mock state
   */
  reset() {
    this.processedContent = [];
    this.callLogs = [];
  }

  /**
   * Process content (mock implementation)
   */
  processContent(rawContent, options = {}) {
    this.callLogs.push({
      method: 'processContent',
      args: { rawContent, options },
      timestamp: new Date().toISOString()
    });

    // Mock content processing
    const processedItems = [];
    
    if (typeof rawContent === 'string') {
      // Split text into paragraphs
      const paragraphs = rawContent.split('\n').filter(p => p.trim());
      
      paragraphs.forEach((paragraph, index) => {
        const item = {
          type: index === 0 ? 'title' : 'body',
          text: paragraph.trim(),
          importance: index === 0 ? 'high' : 'medium',
          order: index
        };
        processedItems.push(item);
      });
    } else if (Array.isArray(rawContent)) {
      // Process array content
      rawContent.forEach((item, index) => {
        processedItems.push({
          type: item.type || 'body',
          text: item.text || item.content || '',
          importance: item.importance || 'medium',
          order: index
        });
      });
    }

    this.processedContent = processedItems;
    return processedItems;
  }

  /**
   * Get processed content
   */
  getProcessedContent() {
    return [...this.processedContent];
  }

  /**
   * Get call logs
   */
  getCallLogs() {
    return [...this.callLogs];
  }
}

/**
 * Mock Logger for testing
 */
class MockLogger {
  constructor() {
    this.logs = [];
  }

  log(level, message, data = null, error = null) {
    this.logs.push({
      level,
      message,
      data,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  warn(message, data = null, error = null) {
    this.log('WARN', message, data, error);
  }

  error(message, data = null, error = null) {
    this.log('ERROR', message, data, error);
  }

  getLogs() {
    return [...this.logs];
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  clear() {
    this.logs = [];
  }

  createPerformanceMonitor(operation) {
    const startTime = Date.now();
    return {
      start: () => {
        this.debug(`Performance monitor started: ${operation}`);
      },
      end: () => {
        const duration = Date.now() - startTime;
        this.info(`Performance monitor ended: ${operation}`, { duration });
        return duration;
      }
    };
  }
}

// Export all mocks
module.exports = {
  MockSlidesService,
  MockContentService,
  MockLogger
};

// Make available globally for easy access in tests
global.MockSlidesService = MockSlidesService;
global.MockContentService = MockContentService;
global.MockLogger = MockLogger;