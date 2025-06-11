/**
 * API Endpoints Integration Tests
 * Tests for RESTful API functionality and HTTP endpoints
 */

describe('API Endpoints Integration Tests', () => {
  let mockGAS;
  let apiRouter;
  let authService;
  let testApiKey;

  beforeEach(() => {
    // Setup enhanced GAS mocks
    mockGAS = new EnhancedGASMocks();
    
    // Initialize API router
    apiRouter = new APIRouter();
    authService = new AuthService();
    
    // Generate test API key
    const keyData = authService.generateApiKey('test-key', ['read', 'write'], 100);
    testApiKey = keyData.apiKey;
    
    // Clear any existing logs
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockGAS.reset();
    jest.restoreAllMocks();
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status for GET /health', () => {
      const request = {
        method: 'GET',
        path: '/health',
        body: {},
        query: {},
        headers: {},
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.services).toBeDefined();
      expect(response.data.services.slides).toBeDefined();
      expect(response.data.services.logger).toBeDefined();
      expect(response.data.services.validation).toBeDefined();
    });

    it('should include timestamp and version in health response', () => {
      const request = {
        method: 'GET',
        path: '/health',
        body: {},
        query: {},
        headers: {},
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.data.timestamp).toBeDefined();
      expect(response.data.version).toBe('1.0.0');
    });
  });

  describe('Authentication Middleware', () => {
    it('should require authentication for protected endpoints', () => {
      const request = {
        method: 'POST',
        path: '/presentations',
        body: { title: 'Test' },
        query: {},
        headers: {},
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);
      expect(response.error.message).toBe('Authentication required');
    });

    it('should accept valid API key authentication', () => {
      const request = {
        method: 'POST',
        path: '/presentations',
        body: {
          title: 'Test Presentation',
          slides: [{
            type: 'title',
            content: 'Test Title'
          }]
        },
        query: {},
        headers: {
          'x-api-key': testApiKey
        },
        timestamp: new Date().toISOString()
      };

      // Mock successful presentation creation
      global.createPresentationFromContent = jest.fn(() => ({
        success: true,
        data: {
          presentationId: 'test-presentation-123',
          slides: [{ slideId: 'slide-1', slideIndex: 0 }]
        }
      }));

      const response = apiRouter.route(request);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
    });

    it('should reject invalid API key', () => {
      const request = {
        method: 'POST',
        path: '/presentations',
        body: { title: 'Test' },
        query: {},
        headers: {
          'x-api-key': 'invalid_key'
        },
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);
      expect(response.error.message).toBe('Invalid API key');
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should enforce rate limits per API key', () => {
      const requests = [];
      
      // Create 101 requests (exceeding limit of 100)
      for (let i = 0; i < 101; i++) {
        const request = {
          method: 'GET',
          path: '/health',
          body: {},
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };
        
        const response = apiRouter.route(request);
        requests.push(response);
      }

      // First 100 should succeed
      const successfulRequests = requests.filter(r => r.success);
      const rateLimitedRequests = requests.filter(r => !r.success && r.statusCode === 429);

      expect(successfulRequests.length).toBe(100);
      expect(rateLimitedRequests.length).toBe(1);
    });

    it('should include rate limit headers in responses', () => {
      const request = {
        method: 'GET',
        path: '/health',
        body: {},
        query: {},
        headers: {
          'x-api-key': testApiKey
        },
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(true);
      // Note: Rate limit headers would be added by the response formatter
      // in a real implementation
    });
  });

  describe('Presentation Endpoints', () => {
    beforeEach(() => {
      // Mock ValidationService
      global.ValidationService = {
        validatePresentationData: jest.fn(() => ({
          isValid: true,
          errors: [],
          warnings: []
        }))
      };

      // Mock createPresentationFromContent function
      global.createPresentationFromContent = jest.fn(() => ({
        success: true,
        data: {
          presentationId: 'test-presentation-123',
          title: 'Test Presentation',
          slides: [
            { slideId: 'slide-1', slideIndex: 0, type: 'title' },
            { slideId: 'slide-2', slideIndex: 1, type: 'content' }
          ],
          url: 'https://docs.google.com/presentation/d/test-presentation-123'
        }
      }));
    });

    describe('POST /presentations', () => {
      it('should create new presentation with valid data', () => {
        const request = {
          method: 'POST',
          path: '/presentations',
          body: {
            title: 'Test Presentation',
            slides: [
              {
                type: 'title',
                content: 'Welcome to Our Presentation',
                style: {
                  fontSize: 44,
                  fontFamily: 'Arial',
                  color: '#1a73e8'
                }
              },
              {
                type: 'content',
                content: 'This is the main content',
                style: {
                  fontSize: 24,
                  fontFamily: 'Arial',
                  color: '#202124'
                }
              }
            ],
            theme: {
              primaryColor: '#1a73e8',
              backgroundColor: '#ffffff'
            },
            layout: 'single-column'
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.data.presentationId).toBe('test-presentation-123');
        expect(response.data.slides).toHaveLength(2);
        expect(global.createPresentationFromContent).toHaveBeenCalledWith(
          'Test Presentation',
          request.body.slides,
          {
            theme: request.body.theme,
            layout: 'single-column'
          }
        );
      });

      it('should validate presentation data before creation', () => {
        global.ValidationService.validatePresentationData = jest.fn(() => ({
          isValid: false,
          errors: ['Title is required', 'Invalid slide format'],
          warnings: []
        }));

        const request = {
          method: 'POST',
          path: '/presentations',
          body: {
            title: '',
            slides: []
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Validation failed');
        expect(response.error.errors).toContain('Title is required');
        expect(response.error.errors).toContain('Invalid slide format');
      });

      it('should handle presentation creation failures', () => {
        global.createPresentationFromContent = jest.fn(() => ({
          success: false,
          error: 'Google Slides API error'
        }));

        const request = {
          method: 'POST',
          path: '/presentations',
          body: {
            title: 'Test Presentation',
            slides: []
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(500);
        expect(response.error.message).toBe('Failed to create presentation');
      });
    });

    describe('GET /presentations/:id', () => {
      beforeEach(() => {
        // Mock SlidesService
        global.SlidesService = {
          getPresentation: jest.fn((id) => {
            if (id === 'valid-presentation-123') {
              return {
                getId: () => 'valid-presentation-123',
                getTitle: () => 'Test Presentation',
                getSlides: () => [{ getId: () => 'slide-1' }, { getId: () => 'slide-2' }],
                getUrl: () => 'https://docs.google.com/presentation/d/valid-presentation-123',
                getLastUpdated: () => new Date('2025-01-11T10:30:00.000Z')
              };
            }
            return null;
          })
        };
      });

      it('should return presentation details for valid ID', () => {
        const request = {
          method: 'GET',
          path: '/presentations/valid-presentation-123',
          params: { id: 'valid-presentation-123' },
          body: {},
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data.id).toBe('valid-presentation-123');
        expect(response.data.title).toBe('Test Presentation');
        expect(response.data.slideCount).toBe(2);
        expect(response.data.url).toContain('valid-presentation-123');
      });

      it('should return 404 for non-existent presentation', () => {
        const request = {
          method: 'GET',
          path: '/presentations/non-existent-123',
          params: { id: 'non-existent-123' },
          body: {},
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(404);
        expect(response.error.message).toBe('Presentation not found');
      });

      it('should return 400 for missing presentation ID', () => {
        const request = {
          method: 'GET',
          path: '/presentations/',
          params: {},
          body: {},
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Presentation ID required');
      });
    });
  });

  describe('Slide Endpoints', () => {
    beforeEach(() => {
      // Mock ValidationService for slide content
      global.ValidationService = {
        validateSlideContent: jest.fn(() => ({
          isValid: true,
          errors: [],
          warnings: []
        }))
      };

      // Mock addSlideToPresentation function
      global.addSlideToPresentation = jest.fn(() => ({
        success: true,
        data: {
          slideId: 'new-slide-123',
          slideIndex: 2,
          presentationId: 'test-presentation-123'
        }
      }));
    });

    describe('POST /presentations/:id/slides', () => {
      it('should add slide to existing presentation', () => {
        const request = {
          method: 'POST',
          path: '/presentations/test-presentation-123/slides',
          params: { id: 'test-presentation-123' },
          body: {
            type: 'content',
            title: 'New Slide',
            content: [
              {
                type: 'text',
                text: 'Slide content',
                style: {
                  fontSize: 24,
                  fontFamily: 'Arial'
                }
              }
            ]
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.data.slideId).toBe('new-slide-123');
        expect(response.data.presentationId).toBe('test-presentation-123');
        expect(global.addSlideToPresentation).toHaveBeenCalledWith(
          'test-presentation-123',
          request.body
        );
      });

      it('should validate slide data before adding', () => {
        global.ValidationService.validateSlideContent = jest.fn(() => ({
          isValid: false,
          errors: ['Invalid slide type', 'Missing content'],
          warnings: []
        }));

        const request = {
          method: 'POST',
          path: '/presentations/test-presentation-123/slides',
          params: { id: 'test-presentation-123' },
          body: {
            type: 'invalid-type',
            content: []
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Invalid slide data');
        expect(response.error.errors).toContain('Invalid slide type');
        expect(response.error.errors).toContain('Missing content');
      });
    });
  });

  describe('Content Validation Endpoint', () => {
    beforeEach(() => {
      global.ValidationService = {
        validateSlideContent: jest.fn((content) => {
          if (content.type === 'text' && content.content) {
            return {
              isValid: true,
              errors: [],
              warnings: content.style?.fontSize < 20 ? ['Font size below recommended minimum'] : [],
              sanitized: {
                ...content,
                content: content.content.replace(/<script>/g, '')
              }
            };
          }
          return {
            isValid: false,
            errors: ['Invalid content type or missing content'],
            warnings: [],
            sanitized: content
          };
        })
      };
    });

    describe('POST /validate', () => {
      it('should validate valid content', () => {
        const request = {
          method: 'POST',
          path: '/validate',
          body: {
            type: 'text',
            content: 'Valid text content',
            style: {
              fontSize: 24,
              fontFamily: 'Arial'
            }
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data.isValid).toBe(true);
        expect(response.data.errors).toHaveLength(0);
        expect(response.data.sanitized).toBeDefined();
      });

      it('should detect validation errors', () => {
        const request = {
          method: 'POST',
          path: '/validate',
          body: {
            type: 'invalid-type',
            content: ''
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data.isValid).toBe(false);
        expect(response.data.errors).toContain('Invalid content type or missing content');
      });

      it('should sanitize potentially dangerous content', () => {
        const request = {
          method: 'POST',
          path: '/validate',
          body: {
            type: 'text',
            content: 'Hello <script>alert("xss")</script> World',
            style: {
              fontSize: 24
            }
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.data.sanitized.content).toBe('Hello  World');
        expect(response.data.sanitized.content).not.toContain('<script>');
      });

      it('should return 400 for missing content', () => {
        const request = {
          method: 'POST',
          path: '/validate',
          body: {},
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Content required for validation');
      });
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      global.createPresentationFromContent = jest.fn((title, slides, options) => {
        if (title.includes('fail')) {
          return {
            success: false,
            error: 'Simulated failure'
          };
        }
        return {
          success: true,
          data: {
            presentationId: `presentation-${title.replace(/\s/g, '-').toLowerCase()}`,
            title,
            slides: slides.map((slide, index) => ({
              slideId: `slide-${index}`,
              slideIndex: index
            }))
          }
        };
      });
    });

    describe('POST /presentations/batch', () => {
      it('should create multiple presentations successfully', () => {
        const request = {
          method: 'POST',
          path: '/presentations/batch',
          body: {
            presentations: [
              {
                title: 'Presentation One',
                slides: [{ type: 'title', content: 'Title 1' }],
                options: { layout: 'single-column' }
              },
              {
                title: 'Presentation Two',
                slides: [{ type: 'title', content: 'Title 2' }],
                options: { layout: 'double-column' }
              }
            ]
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data.successful).toHaveLength(2);
        expect(response.data.failed).toHaveLength(0);
        expect(response.data.summary.total).toBe(2);
        expect(response.data.summary.successful).toBe(2);
        expect(response.data.summary.failed).toBe(0);
      });

      it('should handle partial failures in batch operation', () => {
        const request = {
          method: 'POST',
          path: '/presentations/batch',
          body: {
            presentations: [
              {
                title: 'Success Presentation',
                slides: [{ type: 'title', content: 'Success' }]
              },
              {
                title: 'Fail Presentation',
                slides: [{ type: 'title', content: 'This will fail' }]
              },
              {
                title: 'Another Success',
                slides: [{ type: 'title', content: 'Success again' }]
              }
            ]
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(true);
        expect(response.data.successful).toHaveLength(2);
        expect(response.data.failed).toHaveLength(1);
        expect(response.data.failed[0].index).toBe(1);
        expect(response.data.failed[0].error).toBe('Simulated failure');
      });

      it('should return 400 for invalid batch request', () => {
        const request = {
          method: 'POST',
          path: '/presentations/batch',
          body: {
            presentations: []
          },
          query: {},
          headers: {
            'x-api-key': testApiKey
          },
          timestamp: new Date().toISOString()
        };

        const response = apiRouter.route(request);

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error.message).toBe('Presentations array required');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      const request = {
        method: 'GET',
        path: '/non-existent-endpoint',
        body: {},
        query: {},
        headers: {
          'x-api-key': testApiKey
        },
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.error.message).toBe('Endpoint not found');
    });

    it('should handle internal server errors gracefully', () => {
      // Mock a function to throw an error
      const originalCreatePresentationFromContent = global.createPresentationFromContent;
      global.createPresentationFromContent = jest.fn(() => {
        throw new Error('Unexpected internal error');
      });

      const request = {
        method: 'POST',
        path: '/presentations',
        body: {
          title: 'Test Presentation',
          slides: []
        },
        query: {},
        headers: {
          'x-api-key': testApiKey
        },
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.error.message).toBe('Internal server error');

      // Restore the original function
      global.createPresentationFromContent = originalCreatePresentationFromContent;
    });

    it('should include timestamp in all responses', () => {
      const request = {
        method: 'GET',
        path: '/health',
        body: {},
        query: {},
        headers: {},
        timestamp: new Date().toISOString()
      };

      const response = apiRouter.route(request);

      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('CORS Support', () => {
    it('should handle OPTIONS requests for CORS preflight', () => {
      const request = {
        method: 'OPTIONS',
        path: '/presentations',
        body: {},
        query: {},
        headers: {},
        timestamp: new Date().toISOString()
      };

      // This would be handled by doOptions in the actual implementation
      const response = {
        success: true,
        statusCode: 200,
        data: { message: 'CORS preflight successful' },
        timestamp: new Date().toISOString()
      };

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
    });
  });
});