/**
 * API Router Unit Tests
 * Tests for the APIRouter class functionality
 */

describe('APIRouter Unit Tests', () => {
  let apiRouter;
  let mockRequest;
  let mockAuthService;

  beforeEach(() => {
    // Initialize APIRouter
    apiRouter = new APIRouter();
    
    // Mock auth service
    mockAuthService = {
      validateApiKey: jest.fn(() => ({
        isValid: true,
        keyData: { id: 'test-key', permissions: ['read', 'write'] }
      }))
    };

    // Basic mock request structure
    mockRequest = {
      method: 'GET',
      path: '/test',
      body: {},
      query: {},
      headers: {},
      timestamp: new Date().toISOString()
    };

    jest.clearAllMocks();
  });

  describe('Route Registration', () => {
    it('should register routes correctly', () => {
      const handler = jest.fn();
      apiRouter.addRoute('GET', '/test', handler);

      expect(apiRouter.routes.has('GET:/test')).toBe(true);
    });

    it('should register multiple routes with different methods', () => {
      const getHandler = jest.fn();
      const postHandler = jest.fn();

      apiRouter.addRoute('GET', '/api/test', getHandler);
      apiRouter.addRoute('POST', '/api/test', postHandler);

      expect(apiRouter.routes.has('GET:/api/test')).toBe(true);
      expect(apiRouter.routes.has('POST:/api/test')).toBe(true);
    });

    it('should register default routes during initialization', () => {
      expect(apiRouter.routes.has('GET:/health')).toBe(true);
      expect(apiRouter.routes.has('POST:/presentations')).toBe(true);
      expect(apiRouter.routes.has('GET:/presentations/:id')).toBe(true);
      expect(apiRouter.routes.has('POST:/validate')).toBe(true);
    });
  });

  describe('Middleware System', () => {
    it('should add and execute middleware', () => {
      const middleware = jest.fn(() => null);
      apiRouter.use(middleware);

      const request = { ...mockRequest, path: '/health' };
      apiRouter.route(request);

      expect(middleware).toHaveBeenCalledWith(request);
    });

    it('should stop processing if middleware returns error', () => {
      const middlewareError = {
        success: false,
        statusCode: 403,
        error: { message: 'Forbidden' }
      };

      const middleware = jest.fn(() => middlewareError);
      apiRouter.use(middleware);

      const request = { ...mockRequest, path: '/health' };
      const response = apiRouter.route(request);

      expect(middleware).toHaveBeenCalledWith(request);
      expect(response).toEqual(middlewareError);
    });

    it('should execute multiple middlewares in order', () => {
      const middleware1 = jest.fn(() => null);
      const middleware2 = jest.fn(() => null);

      apiRouter.use(middleware1);
      apiRouter.use(middleware2);

      const request = { ...mockRequest, path: '/health' };
      apiRouter.route(request);

      expect(middleware1).toHaveBeenCalledBefore(middleware2);
    });
  });

  describe('Path Matching', () => {
    it('should match exact paths', () => {
      expect(apiRouter.pathMatches('/health', '/health')).toBe(true);
      expect(apiRouter.pathMatches('/presentations', '/presentations')).toBe(true);
    });

    it('should not match different paths', () => {
      expect(apiRouter.pathMatches('/health', '/status')).toBe(false);
      expect(apiRouter.pathMatches('/presentations', '/slides')).toBe(false);
    });

    it('should match parameterized paths', () => {
      expect(apiRouter.pathMatches('/presentations/:id', '/presentations/123')).toBe(true);
      expect(apiRouter.pathMatches('/presentations/:id/slides/:slideId', '/presentations/123/slides/456')).toBe(true);
    });

    it('should not match parameterized paths with wrong structure', () => {
      expect(apiRouter.pathMatches('/presentations/:id', '/presentations')).toBe(false);
      expect(apiRouter.pathMatches('/presentations/:id', '/presentations/123/extra')).toBe(false);
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract single parameter', () => {
      const params = apiRouter.extractParams('/presentations/:id', '/presentations/123');
      expect(params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const params = apiRouter.extractParams(
        '/presentations/:id/slides/:slideId',
        '/presentations/123/slides/456'
      );
      expect(params).toEqual({ id: '123', slideId: '456' });
    });

    it('should return empty object for paths without parameters', () => {
      const params = apiRouter.extractParams('/health', '/health');
      expect(params).toEqual({});
    });

    it('should handle special characters in parameters', () => {
      const params = apiRouter.extractParams('/presentations/:id', '/presentations/1BxAB-CyDz_E123');
      expect(params).toEqual({ id: '1BxAB-CyDz_E123' });
    });
  });

  describe('Route Finding', () => {
    it('should find exact route match', () => {
      const route = apiRouter.findRoute('GET', '/health');
      expect(route).toBeDefined();
      expect(route.method).toBe('GET');
      expect(route.path).toBe('/health');
    });

    it('should find parameterized route match', () => {
      const route = apiRouter.findRoute('GET', '/presentations/123');
      expect(route).toBeDefined();
      expect(route.method).toBe('GET');
      expect(route.path).toBe('/presentations/:id');
    });

    it('should return null for non-existent routes', () => {
      const route = apiRouter.findRoute('GET', '/non-existent');
      expect(route).toBeNull();
    });

    it('should distinguish between different HTTP methods', () => {
      const getRoute = apiRouter.findRoute('GET', '/presentations/123');
      const putRoute = apiRouter.findRoute('PUT', '/presentations/123');

      expect(getRoute).toBeDefined();
      expect(putRoute).toBeDefined();
      expect(getRoute.path).toBe('/presentations/:id');
      expect(putRoute.path).toBe('/presentations/:id');
    });
  });

  describe('Response Helpers', () => {
    it('should create success response with default status code', () => {
      const data = { message: 'Success' };
      const response = apiRouter.createSuccessResponse(data);

      expect(response).toEqual({
        success: true,
        statusCode: 200,
        data,
        timestamp: expect.any(String)
      });
    });

    it('should create success response with custom status code', () => {
      const data = { id: '123' };
      const response = apiRouter.createSuccessResponse(data, 201);

      expect(response).toEqual({
        success: true,
        statusCode: 201,
        data,
        timestamp: expect.any(String)
      });
    });

    it('should create error response', () => {
      const response = apiRouter.createErrorResponse(400, 'Bad Request', { field: 'title' });

      expect(response).toEqual({
        success: false,
        statusCode: 400,
        error: {
          message: 'Bad Request',
          field: 'title'
        },
        timestamp: expect.any(String)
      });
    });

    it('should create error response without details', () => {
      const response = apiRouter.createErrorResponse(500, 'Internal Error');

      expect(response).toEqual({
        success: false,
        statusCode: 500,
        error: {
          message: 'Internal Error'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Health Check Handler', () => {
    beforeEach(() => {
      // Mock service health checks
      apiRouter.checkSlidesService = jest.fn(() => ({ 
        status: 'available', 
        lastCheck: new Date().toISOString() 
      }));
      apiRouter.checkLoggerService = jest.fn(() => ({ 
        status: 'available', 
        lastCheck: new Date().toISOString() 
      }));
      apiRouter.checkValidationService = jest.fn(() => ({ 
        status: 'available', 
        lastCheck: new Date().toISOString() 
      }));
    });

    it('should return health status', () => {
      const request = { ...mockRequest, path: '/health' };
      const response = apiRouter.handleHealthCheck(request);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.version).toBe('1.0.0');
      expect(response.data.services).toBeDefined();
    });

    it('should include all service statuses', () => {
      const request = { ...mockRequest, path: '/health' };
      const response = apiRouter.handleHealthCheck(request);

      expect(response.data.services.slides).toBeDefined();
      expect(response.data.services.logger).toBeDefined();
      expect(response.data.services.validation).toBeDefined();
    });

    it('should include timestamp in health response', () => {
      const request = { ...mockRequest, path: '/health' };
      const response = apiRouter.handleHealthCheck(request);

      expect(response.data.timestamp).toBeDefined();
      expect(new Date(response.data.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Presentation Handlers', () => {
    beforeEach(() => {
      // Mock ValidationService
      global.ValidationService = {
        validatePresentationData: jest.fn(() => ({
          isValid: true,
          errors: [],
          warnings: []
        }))
      };

      // Mock createPresentationFromContent
      global.createPresentationFromContent = jest.fn(() => ({
        success: true,
        data: {
          presentationId: 'test-123',
          slides: []
        }
      }));

      // Mock Logger
      global.Logger = {
        info: jest.fn(),
        error: jest.fn()
      };
    });

    describe('Create Presentation Handler', () => {
      it('should create presentation with valid data', () => {
        const request = {
          ...mockRequest,
          method: 'POST',
          path: '/presentations',
          body: {
            title: 'Test Presentation',
            slides: [],
            theme: {},
            layout: 'single-column'
          }
        };

        const response = apiRouter.handleCreatePresentation(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.data.presentationId).toBe('test-123');
        expect(global.createPresentationFromContent).toHaveBeenCalled();
      });

      it('should return validation errors', () => {
        global.ValidationService.validatePresentationData = jest.fn(() => ({
          isValid: false,
          errors: ['Title is required']
        }));

        const request = {
          ...mockRequest,
          method: 'POST',
          path: '/presentations',
          body: { title: '' }
        };

        const response = apiRouter.handleCreatePresentation(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Validation failed');
        expect(response.error.errors).toContain('Title is required');
      });

      it('should handle creation failures', () => {
        global.createPresentationFromContent = jest.fn(() => ({
          success: false,
          error: 'API Error'
        }));

        const request = {
          ...mockRequest,
          method: 'POST',
          path: '/presentations',
          body: { title: 'Test' }
        };

        const response = apiRouter.handleCreatePresentation(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(500);
        expect(response.error.message).toBe('Failed to create presentation');
      });
    });

    describe('Get Presentation Handler', () => {
      beforeEach(() => {
        global.SlidesService = {
          getPresentation: jest.fn((id) => {
            if (id === 'valid-123') {
              return {
                getId: () => 'valid-123',
                getTitle: () => 'Test Presentation',
                getSlides: () => [{ getId: () => 'slide-1' }],
                getUrl: () => 'https://docs.google.com/presentation/d/valid-123',
                getLastUpdated: () => new Date()
              };
            }
            return null;
          })
        };
      });

      it('should return presentation details', () => {
        const request = {
          ...mockRequest,
          method: 'GET',
          path: '/presentations/valid-123',
          params: { id: 'valid-123' }
        };

        const response = apiRouter.handleGetPresentation(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data.id).toBe('valid-123');
        expect(response.data.title).toBe('Test Presentation');
      });

      it('should return 404 for non-existent presentation', () => {
        const request = {
          ...mockRequest,
          method: 'GET',
          path: '/presentations/invalid-123',
          params: { id: 'invalid-123' }
        };

        const response = apiRouter.handleGetPresentation(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(404);
        expect(response.error.message).toBe('Presentation not found');
      });

      it('should return 400 for missing ID', () => {
        const request = {
          ...mockRequest,
          method: 'GET',
          path: '/presentations/',
          params: {}
        };

        const response = apiRouter.handleGetPresentation(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Presentation ID required');
      });
    });
  });

  describe('Validation Handler', () => {
    beforeEach(() => {
      global.ValidationService = {
        validateSlideContent: jest.fn((content) => ({
          isValid: true,
          errors: [],
          warnings: [],
          sanitized: content
        }))
      };
    });

    it('should validate content successfully', () => {
      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/validate',
        body: {
          type: 'text',
          content: 'Test content'
        }
      };

      const response = apiRouter.handleValidateContent(request);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data.isValid).toBe(true);
      expect(global.ValidationService.validateSlideContent).toHaveBeenCalledWith(request.body);
    });

    it('should return validation results', () => {
      global.ValidationService.validateSlideContent = jest.fn(() => ({
        isValid: false,
        errors: ['Invalid type'],
        warnings: ['Consider different approach'],
        sanitized: { type: 'text', content: 'sanitized' }
      }));

      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/validate',
        body: { type: 'invalid' }
      };

      const response = apiRouter.handleValidateContent(request);

      expect(response.success).toBe(true);
      expect(response.data.isValid).toBe(false);
      expect(response.data.errors).toContain('Invalid type');
      expect(response.data.warnings).toContain('Consider different approach');
      expect(response.data.sanitized).toBeDefined();
    });

    it('should return 400 for missing content', () => {
      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/validate',
        body: {}
      };

      const response = apiRouter.handleValidateContent(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error.message).toBe('Content required for validation');
    });
  });

  describe('Batch Operations Handler', () => {
    beforeEach(() => {
      global.createPresentationFromContent = jest.fn((title, slides, options) => ({
        success: true,
        data: {
          presentationId: `id-${title.replace(/\s/g, '-').toLowerCase()}`,
          title,
          slides: []
        }
      }));

      global.Logger = {
        info: jest.fn()
      };
    });

    it('should handle successful batch creation', () => {
      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/presentations/batch',
        body: {
          presentations: [
            { title: 'Presentation One', slides: [] },
            { title: 'Presentation Two', slides: [] }
          ]
        }
      };

      const response = apiRouter.handleBatchCreate(request);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data.successful).toHaveLength(2);
      expect(response.data.failed).toHaveLength(0);
      expect(response.data.summary.total).toBe(2);
      expect(response.data.summary.successful).toBe(2);
      expect(response.data.summary.failed).toBe(0);
    });

    it('should handle partial failures in batch', () => {
      global.createPresentationFromContent = jest.fn((title) => {
        if (title.includes('fail')) {
          return { success: false, error: 'Creation failed' };
        }
        return { success: true, data: { presentationId: 'id-success', title } };
      });

      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/presentations/batch',
        body: {
          presentations: [
            { title: 'Success Presentation', slides: [] },
            { title: 'Fail Presentation', slides: [] }
          ]
        }
      };

      const response = apiRouter.handleBatchCreate(request);

      expect(response.success).toBe(true);
      expect(response.data.successful).toHaveLength(1);
      expect(response.data.failed).toHaveLength(1);
      expect(response.data.failed[0].error).toBe('Creation failed');
    });

    it('should return 400 for empty presentations array', () => {
      const request = {
        ...mockRequest,
        method: 'POST',
        path: '/presentations/batch',
        body: { presentations: [] }
      };

      const response = apiRouter.handleBatchCreate(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error.message).toBe('Presentations array required');
    });
  });

  describe('Error Handling', () => {
    it('should handle router-level exceptions', () => {
      // Mock a route handler that throws an error
      apiRouter.addRoute('GET', '/error-test', () => {
        throw new Error('Handler error');
      });

      const request = {
        ...mockRequest,
        method: 'GET',
        path: '/error-test'
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.error.message).toBe('Internal server error');
    });

    it('should return 404 for non-existent routes', () => {
      const request = {
        ...mockRequest,
        method: 'GET',
        path: '/non-existent'
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.error.message).toBe('Endpoint not found');
    });
  });
});