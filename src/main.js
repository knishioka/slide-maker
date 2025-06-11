/**
 * Google Slides Content Generator - Main Entry Point
 * Provides the primary API for slide generation and management
 */

/**
 * Initialize the slide generator services
 * This function should be called before using any other functions
 * @returns {boolean} True if initialization successful
 */
function initializeServices() {
  try {
    Logger.info('Initializing Slide Generator services');

    // Test service initialization
    const _slidesService = new SlidesService();
    const _contentService = new ContentService();
    const _validationService = new ValidationService();

    Logger.info('All services initialized successfully');
    return true;
  } catch (error) {
    Logger.error('Failed to initialize services', null, error);
    return false;
  }
}

/**
 * Create a new presentation with slides
 * @param {Object} config - Presentation configuration
 * @returns {Object} Creation result with presentation ID and metadata
 */
function createSlidePresentation(config) {
  const monitor = Logger.createPerformanceMonitor('createSlidePresentation');
  monitor.start();

  try {
    Logger.info('Creating slide presentation', { title: config.title });

    const contentService = new ContentService();
    const result = contentService.createPresentation(config);

    Logger.info('Slide presentation created successfully', {
      presentationId: result.presentationId,
      slideCount: result.slides.length
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Failed to create slide presentation', { config }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  } finally {
    monitor.end();
  }
}

/**
 * Create presentation from content array (API compatible)
 * @param {string} title - Presentation title
 * @param {Array} slides - Array of slide content objects
 * @param {Object} options - Additional options (theme, layout)
 * @returns {Object} Creation result
 */
function createPresentationFromContent(title, slides = [], options = {}) {
  const monitor = Logger.createPerformanceMonitor('createPresentationFromContent');
  monitor.start();

  try {
    Logger.info('Creating presentation from content', { 
      title, 
      slideCount: slides.length,
      layout: options.layout
    });

    // Validate input
    const validation = ValidationService.validatePresentationData({
      title,
      slides,
      theme: options.theme,
      layout: options.layout
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create the presentation
    const contentService = new ContentService();
    const result = contentService.createPresentation({
      title,
      slides,
      theme: options.theme,
      layout: options.layout || 'single-column'
    });

    Logger.info('Presentation created from content successfully', {
      presentationId: result.presentationId,
      slideCount: result.slides.length
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Failed to create presentation from content', { 
      title, 
      slides: slides.length,
      options 
    }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  } finally {
    monitor.end();
  }
}

/**
 * Add a single slide to existing presentation
 * @param {string} presentationId - Target presentation ID
 * @param {Object} slideConfig - Slide configuration
 * @returns {Object} Addition result
 */
function addSlideToPresentation(presentationId, slideConfig) {
  try {
    Logger.info('Adding slide to presentation', { presentationId, type: slideConfig.type });

    const contentService = new ContentService();
    const result = contentService.addSlideWithContent(presentationId, slideConfig);

    Logger.info('Slide added successfully', {
      presentationId,
      slideIndex: result.slideIndex
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Failed to add slide', { presentationId, slideConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Apply theme to existing presentation
 * @param {string} presentationId - Target presentation ID
 * @param {Object} theme - Theme configuration
 * @returns {Object} Theme application result
 */
function applyPresentationTheme(presentationId, theme) {
  try {
    Logger.info('Applying theme to presentation', { presentationId });

    const contentService = new ContentService();
    const result = contentService.applyTheme(presentationId, theme);

    Logger.info('Theme applied successfully', {
      presentationId,
      slidesProcessed: result.slidesProcessed
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Failed to apply theme', { presentationId, theme }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Validate slide content before processing
 * @param {Object} content - Content to validate
 * @returns {Object} Validation result
 */
function validateSlideContent(content) {
  try {
    const validationService = new ValidationService();
    const result = validationService.validateSlideContent(content);

    Logger.debug('Content validation completed', {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Content validation failed', { content }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get presentation information
 * @param {string} presentationId - Presentation ID
 * @returns {Object} Presentation metadata
 */
function getPresentationInfo(presentationId) {
  try {
    Logger.debug('Getting presentation info', { presentationId });

    const slidesService = new SlidesService();
    const result = slidesService.getPresentationInfo(presentationId);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.error('Failed to get presentation info', { presentationId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Process a single slide in batch operation
 * @param {Object} contentService - Content service instance
 * @param {string} presentationId - Presentation ID
 * @param {Object} slideConfig - Slide configuration
 * @param {number} index - Slide index
 * @returns {Object} Processing result
 */
function _processSingleSlide(contentService, presentationId, slideConfig, index) {
  try {
    const slideResult = contentService.addSlideWithContent(presentationId, slideConfig);
    return {
      index: index,
      success: true,
      data: slideResult
    };
  } catch (slideError) {
    Logger.warn(
      'Failed to create slide in batch',
      {
        index: index,
        presentationId
      },
      slideError
    );

    return {
      index: index,
      success: false,
      error: slideError.message
    };
  }
}

/**
 * Batch create multiple slides
 * @param {string} presentationId - Target presentation ID
 * @param {Array} slidesConfig - Array of slide configurations
 * @returns {Object} Batch creation result
 */
function batchCreateSlides(presentationId, slidesConfig) {
  const monitor = Logger.createPerformanceMonitor('batchCreateSlides');
  monitor.start();

  try {
    Logger.info('Starting batch slide creation', {
      presentationId,
      slideCount: slidesConfig.length
    });

    const contentService = new ContentService();
    const results = [];

    for (let i = 0; i < slidesConfig.length; i++) {
      const result = _processSingleSlide(contentService, presentationId, slidesConfig[i], i);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    Logger.info('Batch slide creation completed', {
      presentationId,
      total: results.length,
      successful: successCount,
      failed: failureCount
    });

    return {
      success: true,
      data: {
        presentationId,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    };
  } catch (error) {
    Logger.error('Batch slide creation failed', { presentationId, slidesConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  } finally {
    monitor.end();
  }
}

/**
 * Generate slides from Mermaid diagrams
 * @param {string} presentationId - Target presentation ID
 * @param {Array} mermaidCodes - Array of Mermaid diagram codes
 * @returns {Object} Generation result
 */
function generateMermaidSlides(presentationId, mermaidCodes) {
  try {
    Logger.info('Generating Mermaid slides', {
      presentationId,
      diagramCount: mermaidCodes.length
    });

    const slidesConfig = mermaidCodes.map((code, index) => ({
      title: `Diagram ${index + 1}`,
      layout: 'single',
      content: [
        {
          type: 'mermaid',
          code: code
        }
      ]
    }));

    return batchCreateSlides(presentationId, slidesConfig);
  } catch (error) {
    Logger.error('Failed to generate Mermaid slides', { presentationId, mermaidCodes }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Convert text content to slides with automatic layout
 * @param {string} presentationId - Target presentation ID
 * @param {Array} textBlocks - Array of text blocks
 * @param {Object} options - Formatting options
 * @returns {Object} Conversion result
 */
function convertTextToSlides(presentationId, textBlocks, options = {}) {
  try {
    Logger.info('Converting text to slides', {
      presentationId,
      textBlockCount: textBlocks.length
    });

    const theme = options.theme || {
      fontFamily: 'Arial',
      titleFontSize: 36,
      bodyFontSize: 24,
      primaryColor: '#000000'
    };

    const slidesConfig = textBlocks.map((textBlock, index) => ({
      title: textBlock.title || `Slide ${index + 1}`,
      layout: options.layout || 'single',
      content: [
        {
          type: 'text',
          text: textBlock.content,
          fontSize: theme.bodyFontSize,
          fontFamily: theme.fontFamily,
          color: theme.primaryColor
        }
      ]
    }));

    return batchCreateSlides(presentationId, slidesConfig);
  } catch (error) {
    Logger.error('Failed to convert text to slides', { presentationId, textBlocks }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get system health and statistics
 * @returns {Object} System health information
 */
function getSystemHealth() {
  try {
    const logs = Logger.getRecentLogs(10);
    const errorCount = logs.filter(log => log.level === 'ERROR').length;
    const warningCount = logs.filter(log => log.level === 'WARN').length;

    return {
      success: true,
      data: {
        status: errorCount === 0 ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        recentLogs: logs.length,
        recentErrors: errorCount,
        recentWarnings: warningCount,
        logLevel: Logger.getCurrentLevel()
      }
    };
  } catch (error) {
    Logger.error('Failed to get system health', null, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Set logging level
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @returns {Object} Operation result
 */
function setLogLevel(level) {
  try {
    Logger.setLevel(level);
    Logger.info('Log level changed', { newLevel: level });

    return {
      success: true,
      data: { level: Logger.getCurrentLevel() }
    };
  } catch (error) {
    Logger.error('Failed to set log level', { level }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Auto-initialize services when script loads
initializeServices();
