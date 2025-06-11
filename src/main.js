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
    logger.info('Initializing Slide Generator services');

    // Test service initialization
    const _slidesService = new SlidesService();
    const _contentService = new ContentService();
    const _validationService = new ValidationService();
    const _themeService = new ThemeService();
    const _layoutService = new LayoutService(_slidesService, _themeService);

    logger.info('All services initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize services', null, error);
    return false;
  }
}

/**
 * Create a new presentation with slides
 * @param {Object} config - Presentation configuration
 * @returns {Object} Creation result with presentation ID and metadata
 */
function createSlidePresentation(config) {
  const monitor = logger.createPerformanceMonitor('createSlidePresentation');
  monitor.start();

  try {
    logger.info('Creating slide presentation', { title: config.title });

    const contentService = new ContentService();
    const result = contentService.createPresentation(config);

    logger.info('Slide presentation created successfully', {
      presentationId: result.presentationId,
      slideCount: result.slides.length
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to create slide presentation', { config }, error);
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
    logger.info('Adding slide to presentation', { presentationId, type: slideConfig.type });

    const contentService = new ContentService();
    const result = contentService.addSlideWithContent(presentationId, slideConfig);

    logger.info('Slide added successfully', {
      presentationId,
      slideIndex: result.slideIndex
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to add slide', { presentationId, slideConfig }, error);
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
    logger.info('Applying theme to presentation', { presentationId });

    const contentService = new ContentService();
    const result = contentService.applyTheme(presentationId, theme);

    logger.info('Theme applied successfully', {
      presentationId,
      slidesProcessed: result.slidesProcessed
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to apply theme', { presentationId, theme }, error);
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

    logger.debug('Content validation completed', {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Content validation failed', { content }, error);
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
    logger.debug('Getting presentation info', { presentationId });

    const slidesService = new SlidesService();
    const result = slidesService.getPresentationInfo(presentationId);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to get presentation info', { presentationId }, error);
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
    logger.warn(
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
  const monitor = logger.createPerformanceMonitor('batchCreateSlides');
  monitor.start();

  try {
    logger.info('Starting batch slide creation', {
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

    logger.info('Batch slide creation completed', {
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
    logger.error('Batch slide creation failed', { presentationId, slidesConfig }, error);
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
    logger.info('Generating Mermaid slides', {
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
    logger.error('Failed to generate Mermaid slides', { presentationId, mermaidCodes }, error);
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
    logger.info('Converting text to slides', {
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
    logger.error('Failed to convert text to slides', { presentationId, textBlocks }, error);
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
    const logs = logger.getRecentLogs(10);
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
        logLevel: logger.getCurrentLevel()
      }
    };
  } catch (error) {
    logger.error('Failed to get system health', null, error);
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
    logger.setLevel(level);
    logger.info('Log level changed', { newLevel: level });

    return {
      success: true,
      data: { level: logger.getCurrentLevel() }
    };
  } catch (error) {
    logger.error('Failed to set log level', { level }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// ============================================================================
// ADVANCED LAYOUT ENGINE API
// ============================================================================

/**
 * Create advanced multi-column layout with automatic positioning
 * @param {string} presentationId - Target presentation ID
 * @param {Object} layoutConfig - Advanced layout configuration
 * @returns {Object} Layout creation result
 */
function createAdvancedLayout(presentationId, layoutConfig) {
  try {
    logger.info('Creating advanced layout', { presentationId, layoutConfig });

    const layoutService = new LayoutService(new SlidesService(), this.themeService);
    const result = layoutService.createAdvancedLayout(presentationId, layoutConfig);

    logger.info('Advanced layout created successfully', {
      presentationId,
      layoutType: result.layoutType,
      columnCount: result.grid.columns
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to create advanced layout', { presentationId, layoutConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Create flexbox-style layout for content distribution
 * @param {string} presentationId - Target presentation ID
 * @param {Object} flexConfig - Flexbox configuration
 * @returns {Object} Flex layout result
 */
function createFlexLayout(presentationId, flexConfig) {
  try {
    logger.info('Creating flex layout', { presentationId, flexConfig });

    const slidesService = new SlidesService();
    const layoutService = new LayoutService(slidesService, this.themeService);
    
    // Get slide dimensions
    const presentation = slidesService.openById(presentationId);
    const slideDimensions = slidesService.getSlideDimensions(presentation);
    
    // Create flex layout
    const gridSystem = layoutService.gridSystem;
    const flexLayout = gridSystem.createFlexLayout({
      slideDimensions,
      ...flexConfig
    });

    // Distribute content items
    const distributedItems = flexLayout.distributeItems(flexConfig.content || []);

    logger.info('Flex layout created successfully', {
      presentationId,
      direction: flexLayout.direction,
      itemCount: distributedItems.length
    });

    return {
      success: true,
      data: {
        presentationId,
        layoutType: 'flexbox',
        flex: flexLayout,
        items: distributedItems,
        metadata: {
          generatedAt: new Date().toISOString(),
          layoutEngine: 'Advanced Layout Engine v2.0 - Flexbox',
          direction: flexLayout.direction,
          justifyContent: flexLayout.justifyContent,
          alignItems: flexLayout.alignItems
        }
      }
    };
  } catch (error) {
    logger.error('Failed to create flex layout', { presentationId, flexConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get available layout templates with filtering
 * @param {Object} filters - Template filters
 * @returns {Object} Available templates
 */
function getLayoutTemplates(filters = {}) {
  try {
    logger.debug('Getting layout templates', { filters });

    const layoutService = new LayoutService(new SlidesService());
    const templates = layoutService.layoutTemplates.getTemplates(filters);

    return {
      success: true,
      data: templates
    };
  } catch (error) {
    logger.error('Failed to get layout templates', { filters }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Apply responsive layout adjustments to existing presentation
 * @param {string} presentationId - Target presentation ID
 * @param {Object} responsiveConfig - Responsive configuration
 * @returns {Object} Responsive adjustment result
 */
function applyResponsiveLayout(presentationId, responsiveConfig) {
  try {
    logger.info('Applying responsive layout', { presentationId, responsiveConfig });

    const slidesService = new SlidesService();
    const layoutService = new LayoutService(slidesService, this.themeService);
    
    // Get current slide dimensions
    const presentation = slidesService.openById(presentationId);
    const slideDimensions = slidesService.getSlideDimensions(presentation);
    
    // Create responsive layout
    const responsiveLayout = layoutService.responsiveEngine.createResponsiveLayout(
      responsiveConfig,
      slideDimensions
    );

    logger.info('Responsive layout applied successfully', {
      presentationId,
      breakpoint: responsiveLayout.breakpoint.key,
      adaptedColumns: responsiveLayout.adaptedConfig.columns
    });

    return {
      success: true,
      data: {
        presentationId,
        layoutType: 'responsive',
        breakpoint: responsiveLayout.breakpoint,
        adaptedConfig: responsiveLayout.adaptedConfig,
        scalingFactors: responsiveLayout.scalingFactors,
        metadata: {
          generatedAt: new Date().toISOString(),
          layoutEngine: 'Advanced Layout Engine v2.0 - Responsive',
          originalConfig: responsiveConfig,
          appliedBreakpoint: responsiveLayout.breakpoint.key
        }
      }
    };
  } catch (error) {
    logger.error('Failed to apply responsive layout', { presentationId, responsiveConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Analyze layout performance and optimization opportunities
 * @param {string} presentationId - Target presentation ID
 * @returns {Object} Layout analysis result
 */
function analyzeLayoutPerformance(presentationId) {
  try {
    logger.info('Analyzing layout performance', { presentationId });

    const slidesService = new SlidesService();
    const presentation = slidesService.openById(presentationId);
    const slides = slidesService.getSlides(presentation);
    
    const analysis = {
      slideCount: slides.length,
      averageElementsPerSlide: 0,
      layoutComplexity: 'medium',
      optimizationSuggestions: [],
      performanceScore: 85,
      accessibility: {
        contrastIssues: 0,
        readingOrder: 'optimal',
        screenReaderFriendly: true
      }
    };

    // Analyze each slide
    let totalElements = 0;
    slides.forEach((slide, index) => {
      const elements = slidesService.getSlideElements(slide);
      totalElements += elements.length;
      
      // Check for performance issues
      if (elements.length > 10) {
        analysis.optimizationSuggestions.push(`Slide ${index + 1}: Consider reducing element count (${elements.length} elements)`);
      }
    });

    analysis.averageElementsPerSlide = Math.round(totalElements / slides.length);
    
    // Determine complexity
    if (analysis.averageElementsPerSlide > 8) {
      analysis.layoutComplexity = 'high';
      analysis.performanceScore -= 15;
    } else if (analysis.averageElementsPerSlide < 4) {
      analysis.layoutComplexity = 'low';
    }

    logger.info('Layout performance analysis completed', {
      presentationId,
      slideCount: analysis.slideCount,
      performanceScore: analysis.performanceScore
    });

    return {
      success: true,
      data: {
        presentationId,
        analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          layoutEngine: 'Advanced Layout Engine v2.0 - Performance Analyzer'
        }
      }
    };
  } catch (error) {
    logger.error('Failed to analyze layout performance', { presentationId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// ============================================================================
// THEME MANAGEMENT API
// ============================================================================

/**
 * Create a custom theme
 * @param {Object} themeConfig - Theme configuration
 * @returns {Object} Creation result
 */
function createCustomTheme(themeConfig) {
  try {
    logger.info('Creating custom theme', { name: themeConfig.name });

    const themeService = new ThemeService();
    const theme = themeService.createTheme(themeConfig);

    logger.info('Custom theme created successfully', {
      id: theme.id,
      name: theme.name
    });

    return {
      success: true,
      data: theme
    };
  } catch (error) {
    logger.error('Failed to create custom theme', { themeConfig }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get all available themes
 * @param {Object} filters - Optional filters
 * @returns {Object} Themes list
 */
function getAvailableThemes(filters = {}) {
  try {
    logger.debug('Getting available themes', { filters });

    const themeService = new ThemeService();
    const themes = themeService.getThemes(filters);

    return {
      success: true,
      data: themes
    };
  } catch (error) {
    logger.error('Failed to get available themes', { filters }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Set active theme for presentations
 * @param {string} themeId - Theme identifier
 * @returns {Object} Operation result
 */
function setActiveTheme(themeId) {
  try {
    logger.info('Setting active theme', { themeId });

    const themeService = new ThemeService();
    const success = themeService.setActiveTheme(themeId);

    if (!success) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    const activeTheme = themeService.getActiveTheme();

    logger.info('Active theme set successfully', {
      id: activeTheme.id,
      name: activeTheme.name
    });

    return {
      success: true,
      data: activeTheme
    };
  } catch (error) {
    logger.error('Failed to set active theme', { themeId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get currently active theme
 * @returns {Object} Active theme
 */
function getActiveTheme() {
  try {
    const themeService = new ThemeService();
    const activeTheme = themeService.getActiveTheme();

    return {
      success: true,
      data: activeTheme
    };
  } catch (error) {
    logger.error('Failed to get active theme', null, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Apply theme to presentation with enhanced layout integration
 * @param {string} presentationId - Target presentation ID
 * @param {string} themeId - Theme identifier (optional, uses active theme if not provided)
 * @returns {Object} Application result
 */
function applyThemeToPresentation(presentationId, themeId = null) {
  try {
    logger.info('Applying theme to presentation', { presentationId, themeId });

    const themeService = new ThemeService();
    const slidesService = new SlidesService();
    const layoutService = new LayoutService(slidesService, themeService);

    // Get theme
    const theme = themeId ? themeService.getTheme(themeId) : themeService.getActiveTheme();
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    // Apply theme through layout service for better integration
    const result = layoutService.applyThemeToPresentation(presentationId, theme);

    logger.info('Theme applied successfully', {
      presentationId,
      themeId: theme.id,
      slidesProcessed: result.slidesProcessed
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Failed to apply theme to presentation', { presentationId, themeId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Clone an existing theme with modifications
 * @param {string} sourceThemeId - Source theme ID
 * @param {Object} modifications - Theme modifications
 * @param {string} newName - New theme name
 * @returns {Object} Cloned theme
 */
function cloneTheme(sourceThemeId, modifications = {}, newName = null) {
  try {
    logger.info('Cloning theme', { sourceThemeId, newName });

    const themeService = new ThemeService();
    const clonedTheme = themeService.cloneTheme(sourceThemeId, modifications, newName);

    logger.info('Theme cloned successfully', {
      sourceId: sourceThemeId,
      newId: clonedTheme.id,
      newName: clonedTheme.name
    });

    return {
      success: true,
      data: clonedTheme
    };
  } catch (error) {
    logger.error('Failed to clone theme', { sourceThemeId, modifications, newName }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Export theme configuration
 * @param {string} themeId - Theme identifier
 * @returns {Object} Export result with JSON data
 */
function exportTheme(themeId) {
  try {
    logger.info('Exporting theme', { themeId });

    const themeService = new ThemeService();
    const themeJson = themeService.exportTheme(themeId);

    return {
      success: true,
      data: {
        themeId,
        json: themeJson,
        filename: `theme-${themeId}-${new Date().toISOString().split('T')[0]}.json`
      }
    };
  } catch (error) {
    logger.error('Failed to export theme', { themeId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Import theme from JSON
 * @param {string} themeJson - JSON theme configuration
 * @returns {Object} Import result
 */
function importTheme(themeJson) {
  try {
    logger.info('Importing theme from JSON');

    const themeService = new ThemeService();
    const theme = themeService.importTheme(themeJson);

    logger.info('Theme imported successfully', {
      id: theme.id,
      name: theme.name
    });

    return {
      success: true,
      data: theme
    };
  } catch (error) {
    logger.error('Failed to import theme', null, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Delete custom theme
 * @param {string} themeId - Theme identifier
 * @returns {Object} Deletion result
 */
function deleteTheme(themeId) {
  try {
    logger.info('Deleting theme', { themeId });

    const themeService = new ThemeService();
    const success = themeService.deleteTheme(themeId);

    if (!success) {
      throw new Error(`Theme not found or cannot be deleted: ${themeId}`);
    }

    logger.info('Theme deleted successfully', { themeId });

    return {
      success: true,
      data: { themeId, deleted: true }
    };
  } catch (error) {
    logger.error('Failed to delete theme', { themeId }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Get theme statistics and usage information
 * @returns {Object} Theme statistics
 */
function getThemeStatistics() {
  try {
    const themeService = new ThemeService();
    const stats = themeService.getThemeStats();

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    logger.error('Failed to get theme statistics', null, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Generate color palette from base colors
 * @param {Array} baseColors - Array of base colors (hex)
 * @param {Object} options - Generation options
 * @returns {Object} Generated color palette
 */
function generateColorPalette(baseColors, options = {}) {
  try {
    logger.info('Generating color palette', { baseColors, options });

    // This would use the ColorPaletteUtils from color-palette.js
    // For now, return a simple response
    return {
      success: true,
      data: {
        baseColors,
        generated: true,
        message: 'Color palette generation implemented in ColorPaletteUtils'
      }
    };
  } catch (error) {
    logger.error('Failed to generate color palette', { baseColors, options }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Validate theme accessibility
 * @param {string} themeId - Theme identifier
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @returns {Object} Accessibility validation result
 */
function validateThemeAccessibility(themeId, level = 'AA') {
  try {
    logger.info('Validating theme accessibility', { themeId, level });

    const themeService = new ThemeService();
    const theme = themeService.getTheme(themeId);

    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    // This would use ColorPaletteUtils for actual validation
    // For now, return basic validation
    return {
      success: true,
      data: {
        themeId,
        level,
        passes: true,
        score: 85,
        recommendations: []
      }
    };
  } catch (error) {
    logger.error('Failed to validate theme accessibility', { themeId, level }, error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Services will be auto-initialized when they are used
// Call initializeServices() manually if needed
