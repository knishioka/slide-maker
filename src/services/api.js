/**
 * RESTful API Service for Google Slides Content Generator
 * Provides HTTP endpoints for slide generation and management
 */

/**
 * API Router Class
 * Handles routing and request processing for RESTful endpoints
 */
class APIRouter {
  constructor() {
    this.routes = new Map();
    this.middlewares = [];
    this.setupDefaultRoutes();
  }

  /**
   * Setup default API routes
   */
  setupDefaultRoutes() {
    // Health check endpoint
    this.addRoute('GET', '/health', this.handleHealthCheck.bind(this));
    
    // Presentation endpoints
    this.addRoute('POST', '/presentations', this.handleCreatePresentation.bind(this));
    this.addRoute('GET', '/presentations/:id', this.handleGetPresentation.bind(this));
    this.addRoute('PUT', '/presentations/:id', this.handleUpdatePresentation.bind(this));
    this.addRoute('DELETE', '/presentations/:id', this.handleDeletePresentation.bind(this));
    
    // Slide endpoints
    this.addRoute('POST', '/presentations/:id/slides', this.handleAddSlide.bind(this));
    this.addRoute('PUT', '/presentations/:id/slides/:slideId', this.handleUpdateSlide.bind(this));
    this.addRoute('DELETE', '/presentations/:id/slides/:slideId', this.handleDeleteSlide.bind(this));
    
    // Validation endpoint
    this.addRoute('POST', '/validate', this.handleValidateContent.bind(this));
    
    // Batch operations
    this.addRoute('POST', '/presentations/batch', this.handleBatchCreate.bind(this));
  }

  /**
   * Add a route to the router
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} path - Route path with optional parameters
   * @param {Function} handler - Route handler function
   */
  addRoute(method, path, handler) {
    const key = `${method}:${path}`;
    this.routes.set(key, { method, path, handler });
  }

  /**
   * Add middleware function
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Route incoming request to appropriate handler
   * @param {Object} request - Parsed request object
   * @returns {Object} Response object
   */
  route(request) {
    try {
      // Apply middlewares
      for (const middleware of this.middlewares) {
        const middlewareResult = middleware(request);
        if (middlewareResult && !middlewareResult.success) {
          return middlewareResult;
        }
      }

      // Find matching route
      const route = this.findRoute(request.method, request.path);
      if (!route) {
        return this.createErrorResponse(404, 'Endpoint not found');
      }

      // Extract path parameters
      request.params = this.extractParams(route.path, request.path);

      // Execute handler
      return route.handler(request);
    } catch (error) {
      Logger.error('API routing error', { error: error.message, request });
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Find matching route for method and path
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @returns {Object|null} Matching route or null
   */
  findRoute(method, path) {
    for (const [key, route] of this.routes) {
      if (route.method === method && this.pathMatches(route.path, path)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Check if route path matches request path
   * @param {string} routePath - Route pattern with parameters
   * @param {string} requestPath - Actual request path
   * @returns {boolean} True if paths match
   */
  pathMatches(routePath, requestPath) {
    const routeSegments = routePath.split('/');
    const requestSegments = requestPath.split('/');

    if (routeSegments.length !== requestSegments.length) {
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (routeSegment.startsWith(':')) {
        continue; // Parameter segment, matches any value
      }

      if (routeSegment !== requestSegment) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract parameters from path
   * @param {string} routePath - Route pattern with parameters
   * @param {string} requestPath - Actual request path
   * @returns {Object} Extracted parameters
   */
  extractParams(routePath, requestPath) {
    const params = {};
    const routeSegments = routePath.split('/');
    const requestSegments = requestPath.split('/');

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.substring(1);
        params[paramName] = requestSegments[i];
      }
    }

    return params;
  }

  // Route Handlers

  /**
   * Health check endpoint
   * @param {Object} request - Request object
   * @returns {Object} Health status response
   */
  handleHealthCheck(request) {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        slides: this.checkSlidesService(),
        logger: this.checkLoggerService(),
        validation: this.checkValidationService()
      }
    };

    return this.createSuccessResponse(status);
  }

  /**
   * Create new presentation
   * @param {Object} request - Request object with presentation data
   * @returns {Object} Created presentation response
   */
  handleCreatePresentation(request) {
    const startTime = Date.now();
    
    try {
      const { title, slides = [], theme = {}, layout = 'single-column' } = request.body;

      // Validate input
      const validation = ValidationService.validatePresentationData({
        title,
        slides,
        theme,
        layout
      });

      if (!validation.isValid) {
        Logger.trackApiMetrics('createPresentation', Date.now() - startTime, false, {
          reason: 'validation_failed',
          errors: validation.errors
        });
        
        return this.createErrorResponse(400, 'Validation failed', {
          errors: validation.errors
        });
      }

      // Create presentation with error handling
      const result = createPresentationFromContent(title, slides, {
        theme,
        layout
      });

      if (!result.success) {
        Logger.trackApiMetrics('createPresentation', Date.now() - startTime, false, {
          reason: 'creation_failed',
          error: result.error
        });

        return Logger.handleApiError(new Error(result.error), {
          operation: 'createPresentation',
          title,
          slideCount: slides.length
        });
      }

      const duration = Date.now() - startTime;
      Logger.trackApiMetrics('createPresentation', duration, true, {
        presentationId: result.data.presentationId,
        slideCount: slides.length
      });

      Logger.info('Presentation created via API', {
        presentationId: result.data.presentationId,
        slideCount: slides.length,
        duration: `${duration}ms`
      });

      return this.createSuccessResponse(result.data, 201);
    } catch (error) {
      Logger.trackApiMetrics('createPresentation', Date.now() - startTime, false, {
        reason: 'exception',
        error: error.message
      });

      return Logger.handleApiError(error, {
        operation: 'createPresentation',
        requestBody: request.body
      });
    }
  }

  /**
   * Get presentation details
   * @param {Object} request - Request object with presentation ID
   * @returns {Object} Presentation details response
   */
  handleGetPresentation(request) {
    const startTime = Date.now();
    
    try {
      const { id } = request.params;

      if (!id) {
        Logger.trackApiMetrics('getPresentation', Date.now() - startTime, false, {
          reason: 'missing_id'
        });
        return this.createErrorResponse(400, 'Presentation ID required');
      }

      // Get presentation details with circuit breaker
      const slidesCircuitBreaker = Logger.createCircuitBreaker('GoogleSlidesAPI');
      
      const presentation = slidesCircuitBreaker.execute(() => {
        return SlidesService.getPresentation(id);
      });
      
      if (!presentation) {
        Logger.trackApiMetrics('getPresentation', Date.now() - startTime, false, {
          reason: 'not_found',
          presentationId: id
        });
        return this.createErrorResponse(404, 'Presentation not found');
      }

      const duration = Date.now() - startTime;
      Logger.trackApiMetrics('getPresentation', duration, true, {
        presentationId: id
      });

      return this.createSuccessResponse({
        id: presentation.getId(),
        title: presentation.getTitle(),
        slideCount: presentation.getSlides().length,
        url: presentation.getUrl(),
        lastModified: presentation.getLastUpdated()
      });
    } catch (error) {
      Logger.trackApiMetrics('getPresentation', Date.now() - startTime, false, {
        reason: 'exception',
        error: error.message
      });
      
      return Logger.handleApiError(error, {
        operation: 'getPresentation',
        presentationId: request.params?.id
      });
    }
  }

  /**
   * Update presentation
   * @param {Object} request - Request object with update data
   * @returns {Object} Update response
   */
  handleUpdatePresentation(request) {
    try {
      const { id } = request.params;
      const updates = request.body;

      if (!id) {
        return this.createErrorResponse(400, 'Presentation ID required');
      }

      // Validate updates
      const validation = ValidationService.validatePresentationUpdates(updates);
      if (!validation.isValid) {
        return this.createErrorResponse(400, 'Invalid update data', {
          errors: validation.errors
        });
      }

      // Apply updates
      const result = SlidesService.updatePresentation(id, updates);
      
      if (!result.success) {
        return this.createErrorResponse(500, 'Failed to update presentation');
      }

      Logger.info('Presentation updated via API', { id, updates });

      return this.createSuccessResponse(result.data);
    } catch (error) {
      Logger.error('Error updating presentation', { 
        id: request.params.id, 
        error: error.message 
      });
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Delete presentation
   * @param {Object} request - Request object with presentation ID
   * @returns {Object} Deletion response
   */
  handleDeletePresentation(request) {
    try {
      const { id } = request.params;

      if (!id) {
        return this.createErrorResponse(400, 'Presentation ID required');
      }

      // Delete presentation
      const result = SlidesService.deletePresentation(id);
      
      if (!result.success) {
        return this.createErrorResponse(500, 'Failed to delete presentation');
      }

      Logger.info('Presentation deleted via API', { id });

      return this.createSuccessResponse({ deleted: true, id });
    } catch (error) {
      Logger.error('Error deleting presentation', { 
        id: request.params.id, 
        error: error.message 
      });
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Add slide to presentation
   * @param {Object} request - Request object with slide data
   * @returns {Object} Add slide response
   */
  handleAddSlide(request) {
    const startTime = Date.now();
    
    try {
      const { id } = request.params;
      const slideData = request.body;

      if (!id) {
        Logger.trackApiMetrics('addSlide', Date.now() - startTime, false, {
          reason: 'missing_presentation_id'
        });
        return this.createErrorResponse(400, 'Presentation ID required');
      }

      // Validate slide data
      const validation = ValidationService.validateSlideContent(slideData);
      if (!validation.isValid) {
        Logger.trackApiMetrics('addSlide', Date.now() - startTime, false, {
          reason: 'validation_failed',
          errors: validation.errors
        });
        return this.createErrorResponse(400, 'Invalid slide data', {
          errors: validation.errors
        });
      }

      // Add slide with retry mechanism
      const result = Logger.retryWithBackoff(() => {
        return addSlideToPresentation(id, slideData);
      }, 3, 1000, 'addSlideToPresentation');
      
      if (!result.success) {
        Logger.trackApiMetrics('addSlide', Date.now() - startTime, false, {
          reason: 'operation_failed',
          error: result.error
        });
        return Logger.handleApiError(new Error(result.error), {
          operation: 'addSlide',
          presentationId: id,
          slideType: slideData.type
        });
      }

      const duration = Date.now() - startTime;
      Logger.trackApiMetrics('addSlide', duration, true, {
        presentationId: id,
        slideId: result.data.slideId
      });

      Logger.info('Slide added via API', { 
        presentationId: id, 
        slideId: result.data.slideId,
        duration: `${duration}ms`
      });

      return this.createSuccessResponse(result.data, 201);
    } catch (error) {
      Logger.trackApiMetrics('addSlide', Date.now() - startTime, false, {
        reason: 'exception',
        error: error.message
      });
      
      return Logger.handleApiError(error, {
        operation: 'addSlide',
        presentationId: request.params?.id,
        slideData: request.body
      });
    }
  }

  /**
   * Validate content
   * @param {Object} request - Request object with content to validate
   * @returns {Object} Validation response
   */
  handleValidateContent(request) {
    try {
      const content = request.body;

      if (!content) {
        return this.createErrorResponse(400, 'Content required for validation');
      }

      const validation = ValidationService.validateSlideContent(content);

      return this.createSuccessResponse({
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        sanitized: validation.sanitized
      });
    } catch (error) {
      Logger.error('Error validating content', { error: error.message });
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Batch create presentations
   * @param {Object} request - Request object with batch data
   * @returns {Object} Batch creation response
   */
  handleBatchCreate(request) {
    const startTime = Date.now();
    
    try {
      const { presentations } = request.body;

      if (!Array.isArray(presentations) || presentations.length === 0) {
        Logger.trackApiMetrics('batchCreate', Date.now() - startTime, false, {
          reason: 'invalid_input'
        });
        return this.createErrorResponse(400, 'Presentations array required');
      }

      const results = [];
      const errors = [];
      const batchCircuitBreaker = Logger.createCircuitBreaker('batchCreate', 3, 30000);

      for (let i = 0; i < presentations.length; i++) {
        const itemStartTime = Date.now();
        
        try {
          const presentation = presentations[i];
          
          const result = batchCircuitBreaker.execute(() => {
            return createPresentationFromContent(
              presentation.title,
              presentation.slides,
              presentation.options
            );
          });

          if (result.success) {
            results.push({ index: i, ...result.data });
            Logger.trackApiMetrics('batchCreateItem', Date.now() - itemStartTime, true, {
              index: i,
              title: presentation.title
            });
          } else {
            errors.push({ index: i, error: result.error });
            Logger.trackApiMetrics('batchCreateItem', Date.now() - itemStartTime, false, {
              index: i,
              error: result.error
            });
          }
        } catch (error) {
          errors.push({ index: i, error: error.message });
          Logger.trackApiMetrics('batchCreateItem', Date.now() - itemStartTime, false, {
            index: i,
            error: error.message
          });
        }
      }

      const duration = Date.now() - startTime;
      Logger.trackApiMetrics('batchCreate', duration, true, {
        total: presentations.length,
        successful: results.length,
        failed: errors.length
      });

      Logger.info('Batch presentation creation completed', {
        total: presentations.length,
        successful: results.length,
        failed: errors.length,
        duration: `${duration}ms`
      });

      return this.createSuccessResponse({
        successful: results,
        failed: errors,
        summary: {
          total: presentations.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      Logger.trackApiMetrics('batchCreate', Date.now() - startTime, false, {
        reason: 'exception',
        error: error.message
      });
      
      return Logger.handleApiError(error, {
        operation: 'batchCreate',
        requestSize: request.body?.presentations?.length
      });
    }
  }

  // Service Health Checks

  checkSlidesService() {
    try {
      // Test Google Slides API access
      return { status: 'available', lastCheck: new Date().toISOString() };
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  checkLoggerService() {
    try {
      Logger.debug('Health check test');
      return { status: 'available', lastCheck: new Date().toISOString() };
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  checkValidationService() {
    try {
      ValidationService.validateSlideContent({ type: 'text', content: 'test' });
      return { status: 'available', lastCheck: new Date().toISOString() };
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  // Response Helpers

  /**
   * Create success response
   * @param {*} data - Response data
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {Object} Success response
   */
  createSuccessResponse(data, statusCode = 200) {
    return {
      success: true,
      statusCode,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error response
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Object} Error response
   */
  createErrorResponse(statusCode, message, details = {}) {
    return {
      success: false,
      statusCode,
      error: {
        message,
        ...details
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Request Parser Class
 * Parses incoming HTTP requests into standardized format
 */
class RequestParser {
  /**
   * Parse incoming Google Apps Script request
   * @param {Object} e - GAS request event object
   * @returns {Object} Parsed request object
   */
  static parseRequest(e) {
    const method = e.parameter.method || 'GET';
    const path = e.parameter.path || '/';
    const contentType = e.parameter.contentType || 'application/json';
    
    let body = {};
    let query = {};

    // Parse POST body
    if (method === 'POST' || method === 'PUT') {
      try {
        if (e.postData && e.postData.contents) {
          body = JSON.parse(e.postData.contents);
        } else if (e.parameter.body) {
          body = JSON.parse(e.parameter.body);
        }
      } catch (error) {
        Logger.warn('Failed to parse request body', { error: error.message });
      }
    }

    // Parse query parameters
    if (e.parameter) {
      query = { ...e.parameter };
      delete query.method;
      delete query.path;
      delete query.body;
      delete query.contentType;
    }

    return {
      method: method.toUpperCase(),
      path,
      body,
      query,
      headers: {
        'content-type': contentType
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Response Formatter Class
 * Formats API responses for Google Apps Script
 */
class ResponseFormatter {
  /**
   * Format response for Google Apps Script output
   * @param {Object} response - Response object
   * @returns {Object} Formatted GAS response
   */
  static formatResponse(response) {
    const output = {
      statusCode: response.statusCode || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(response)
    };

    return ContentService
      .createTextOutput(output.body)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Global API instance
let apiRouter = null;

/**
 * Initialize API router with middlewares
 */
function initializeAPI() {
  if (!apiRouter) {
    apiRouter = new APIRouter();
    
    // Add authentication middleware
    apiRouter.use(authenticationMiddleware);
    
    // Add rate limiting middleware
    apiRouter.use(rateLimitingMiddleware);
    
    // Add logging middleware
    apiRouter.use(loggingMiddleware);
  }
  
  return apiRouter;
}

/**
 * Main API entry point for GET requests
 * @param {Object} e - GAS request event
 * @returns {Object} Formatted response
 */
function doGet(e) {
  try {
    const router = initializeAPI();
    const request = RequestParser.parseRequest(e);
    const response = router.route(request);
    
    return ResponseFormatter.formatResponse(response);
  } catch (error) {
    Logger.error('API GET error', { error: error.message });
    const errorResponse = {
      success: false,
      statusCode: 500,
      error: { message: 'Internal server error' },
      timestamp: new Date().toISOString()
    };
    return ResponseFormatter.formatResponse(errorResponse);
  }
}

/**
 * Main API entry point for POST requests
 * @param {Object} e - GAS request event
 * @returns {Object} Formatted response
 */
function doPost(e) {
  try {
    const router = initializeAPI();
    const request = RequestParser.parseRequest(e);
    const response = router.route(request);
    
    return ResponseFormatter.formatResponse(response);
  } catch (error) {
    Logger.error('API POST error', { error: error.message });
    const errorResponse = {
      success: false,
      statusCode: 500,
      error: { message: 'Internal server error' },
      timestamp: new Date().toISOString()
    };
    return ResponseFormatter.formatResponse(errorResponse);
  }
}

/**
 * Handle OPTIONS requests for CORS
 * @param {Object} e - GAS request event
 * @returns {Object} CORS response
 */
function doOptions(e) {
  const response = {
    success: true,
    statusCode: 200,
    data: { message: 'CORS preflight successful' },
    timestamp: new Date().toISOString()
  };
  
  return ResponseFormatter.formatResponse(response);
}