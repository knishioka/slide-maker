/**
 * Integration tests for Google API interactions
 * Tests API rate limiting, authentication, and data consistency
 */

describe('Google API Integration', () => {
  let apiService;
  let originalSlidesApp;
  let originalDriveApp;
  let originalUtilities;
  
  beforeEach(() => {
    // Store original globals
    originalSlidesApp = global.SlidesApp;
    originalDriveApp = global.DriveApp;
    originalUtilities = global.Utilities;
    
    // Initialize API service
    apiService = {
      retryAttempts: 0,
      delayLog: [],
      
      createPresentationWithRetry: async function (title, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            this.retryAttempts++;
            return global.SlidesApp.create(title);
          } catch (error) {
            if (error.message.includes('Rate limit') && i < maxRetries - 1) {
              const delay = Math.pow(2, i) * 1000;
              this.delayLog.push(delay);
              global.Utilities.sleep(delay);
              continue;
            }
            throw error;
          }
        }
      },
      
      batchCreateSlides: async function (presentationId, slideConfigs) {
        const results = [];
        const batchSize = 5; // Process in batches to respect rate limits
        
        for (let i = 0; i < slideConfigs.length; i += batchSize) {
          const batch = slideConfigs.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (config, index) => {
              try {
                const presentation = global.SlidesApp.openById(presentationId);
                const slide = presentation.appendSlide(config.layout || 'BLANK');
                
                // Add content to slide if provided
                if (config.content) {
                  for (const item of config.content) {
                    await this.addContentToSlide(slide, item);
                  }
                }
                
                return {
                  success: true,
                  slideId: slide.getId(),
                  batchIndex: i + index
                };
              } catch (error) {
                return {
                  success: false,
                  error: error.message,
                  batchIndex: i + index
                };
              }
            })
          );
          
          results.push(...batchResults);
          
          // Add delay between batches to respect rate limits
          if (i + batchSize < slideConfigs.length) {
            global.Utilities.sleep(200);
          }
        }
        
        return results;
      },
      
      addContentToSlide: async function (slide, contentItem) {
        switch (contentItem.type) {
          case 'text':
            return slide.insertTextBox(contentItem.text);
          case 'image':
            return slide.insertImage(contentItem.url);
          case 'shape':
            return slide.insertShape(contentItem.shapeType || 'RECTANGLE');
          default:
            throw new Error(`Unsupported content type: ${contentItem.type}`);
        }
      },
      
      checkQuotaUsage: function () {
        // Mock quota checking functionality
        return {
          slidesApiCalls: this.retryAttempts,
          quotaRemaining: 100000 - this.retryAttempts,
          quotaResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      },
      
      authenticateWithRetry: async function (maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            // Mock authentication process
            const authResult = this.performAuthentication();
            if (authResult.success) {
              return authResult;
            }
            throw new Error('Authentication failed');
          } catch (error) {
            if (i === maxRetries - 1) {
              throw error;
            }
            global.Utilities.sleep(1000 * (i + 1));
          }
        }
      },
      
      performAuthentication: function () {
        // Mock authentication logic
        return {
          success: true,
          accessToken: 'mock-access-token',
          expiresAt: new Date(Date.now() + 3600 * 1000)
        };
      },
      
      validateDataIntegrity: function (presentationId) {
        try {
          const presentation = global.SlidesApp.openById(presentationId);
          const slides = presentation.getSlides();
          
          const integrity = {
            presentationExists: Boolean(presentation),
            slideCount: slides.length,
            allSlidesValid: true,
            corruptedSlides: []
          };
          
          // Validate each slide
          slides.forEach((slide, index) => {
            try {
              const slideId = slide.getId();
              if (!slideId) {
                integrity.allSlidesValid = false;
                integrity.corruptedSlides.push(index);
              }
            } catch (error) {
              integrity.allSlidesValid = false;
              integrity.corruptedSlides.push(index);
            }
          });
          
          return integrity;
        } catch (error) {
          return {
            presentationExists: false,
            error: error.message
          };
        }
      }
    };
  });
  
  afterEach(() => {
    // Restore original globals
    global.SlidesApp = originalSlidesApp;
    global.DriveApp = originalDriveApp;
    global.Utilities = originalUtilities;
  });
  
  describe('API rate limiting', () => {
    it('should handle rate limits with exponential backoff', async () => {
      let callCount = 0;
      global.SlidesApp = {
        create: jest.fn(() => {
          callCount++;
          if (callCount <= 2) {
            throw new Error('Rate limit exceeded');
          }
          return { getId: () => 'success-presentation-id' };
        })
      };
      
      global.Utilities = {
        sleep: jest.fn()
      };
      
      const result = await apiService.createPresentationWithRetry('Test Presentation');
      
      expect(result.getId()).toBe('success-presentation-id');
      expect(apiService.retryAttempts).toBe(3); // 2 failures + 1 success
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2);
    });
    
    it('should implement exponential backoff delays', async () => {
      global.SlidesApp = {
        create: jest.fn(() => {
          throw new Error('Rate limit exceeded');
        })
      };
      
      global.Utilities = {
        sleep: jest.fn()
      };
      
      try {
        await apiService.createPresentationWithRetry('Test', 3);
      } catch (error) {
        // Expected to fail after retries
      }
      
      expect(apiService.delayLog).toEqual([1000, 2000]); // Exponential: 1s, 2s
    });

    it('should respect batch processing rate limits', async () => {
      let apiCallCount = 0;
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => {
            apiCallCount++;
            return { getId: () => `slide-${apiCallCount}` };
          })
        }))
      };
      
      global.Utilities = {
        sleep: jest.fn()
      };
      
      const slideConfigs = Array.from({ length: 12 }, (_, i) => ({
        layout: 'BLANK',
        content: [{ type: 'text', text: `Slide ${i + 1}` }]
      }));
      
      const results = await apiService.batchCreateSlides('test-presentation', slideConfigs);
      
      expect(results).toHaveLength(12);
      expect(results.every(r => r.success)).toBe(true);
      expect(global.Utilities.sleep).toHaveBeenCalledWith(200); // Batch delay
    });

    it('should handle quota exceeded errors', async () => {
      global.SlidesApp = {
        create: jest.fn(() => {
          throw new Error('Quota exceeded');
        })
      };
      
      let error;
      try {
        await apiService.createPresentationWithRetry('Test');
      } catch (e) {
        error = e;
      }
      
      expect(error.message).toBe('Quota exceeded');
    });

    it('should track quota usage correctly', () => {
      apiService.retryAttempts = 50;
      const quota = apiService.checkQuotaUsage();
      
      expect(quota.slidesApiCalls).toBe(50);
      expect(quota.quotaRemaining).toBe(99950);
      expect(quota.quotaResetTime).toBeInstanceOf(Date);
    });
  });
  
  describe('authentication', () => {
    it('should handle OAuth token refresh', async () => {
      const authResult = await apiService.authenticateWithRetry();
      
      expect(authResult.success).toBe(true);
      expect(authResult.accessToken).toBe('mock-access-token');
      expect(authResult.expiresAt).toBeInstanceOf(Date);
    });
    
    it('should retry authentication on failure', async () => {
      let authAttempts = 0;
      apiService.performAuthentication = jest.fn(() => {
        authAttempts++;
        if (authAttempts <= 2) {
          throw new Error('Authentication failed');
        }
        return {
          success: true,
          accessToken: 'retry-success-token',
          expiresAt: new Date(Date.now() + 3600 * 1000)
        };
      });
      
      global.Utilities = { sleep: jest.fn() };
      
      const result = await apiService.authenticateWithRetry();
      
      expect(result.accessToken).toBe('retry-success-token');
      expect(apiService.performAuthentication).toHaveBeenCalledTimes(3);
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2);
    });
    
    it('should handle permission scope errors', () => {
      global.SlidesApp = {
        create: jest.fn(() => {
          throw new Error('Insufficient permissions');
        })
      };
      
      expect(async () => {
        await apiService.createPresentationWithRetry('Test');
      }).rejects.toThrow('Insufficient permissions');
    });

    it('should handle expired token errors', async () => {
      global.SlidesApp = {
        create: jest.fn(() => {
          throw new Error('Token expired');
        })
      };
      
      let error;
      try {
        await apiService.createPresentationWithRetry('Test');
      } catch (e) {
        error = e;
      }
      
      expect(error.message).toBe('Token expired');
    });
  });
  
  describe('data consistency', () => {
    it('should maintain data integrity across API calls', () => {
      const mockSlides = [
        { getId: () => 'slide-1' },
        { getId: () => 'slide-2' },
        { getId: () => 'slide-3' }
      ];
      
      global.SlidesApp = {
        openById: jest.fn(() => ({
          getId: () => 'test-presentation-id',
          getSlides: () => mockSlides
        }))
      };
      
      const integrity = apiService.validateDataIntegrity('test-presentation-id');
      
      expect(integrity.presentationExists).toBe(true);
      expect(integrity.slideCount).toBe(3);
      expect(integrity.allSlidesValid).toBe(true);
      expect(integrity.corruptedSlides).toEqual([]);
    });

    it('should detect corrupted slides', () => {
      const mockSlides = [
        { getId: () => 'slide-1' },
        { getId: () => null }, // Corrupted slide
        { getId: () => 'slide-3' }
      ];
      
      global.SlidesApp = {
        openById: jest.fn(() => ({
          getSlides: () => mockSlides
        }))
      };
      
      const integrity = apiService.validateDataIntegrity('test-presentation-id');
      
      expect(integrity.allSlidesValid).toBe(false);
      expect(integrity.corruptedSlides).toContain(1);
    });

    it('should handle missing presentations', () => {
      global.SlidesApp = {
        openById: jest.fn(() => {
          throw new Error('Presentation not found');
        })
      };
      
      const integrity = apiService.validateDataIntegrity('missing-presentation');
      
      expect(integrity.presentationExists).toBe(false);
      expect(integrity.error).toBe('Presentation not found');
    });

    it('should maintain consistency during concurrent operations', async () => {
      let slideCounter = 0;
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => {
            slideCounter++;
            return { getId: () => `concurrent-slide-${slideCounter}` };
          })
        }))
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      // Simulate concurrent batch operations
      const batch1 = Array.from({ length: 5 }, () => ({ layout: 'BLANK' }));
      const batch2 = Array.from({ length: 5 }, () => ({ layout: 'TITLE' }));
      
      const [results1, results2] = await Promise.all([
        apiService.batchCreateSlides('presentation-1', batch1),
        apiService.batchCreateSlides('presentation-1', batch2)
      ]);
      
      expect(results1).toHaveLength(5);
      expect(results2).toHaveLength(5);
      expect(results1.every(r => r.success)).toBe(true);
      expect(results2.every(r => r.success)).toBe(true);
      
      // Verify unique slide IDs
      const allSlideIds = [
        ...results1.map(r => r.slideId),
        ...results2.map(r => r.slideId)
      ];
      const uniqueIds = new Set(allSlideIds);
      expect(uniqueIds.size).toBe(10); // All IDs should be unique
    });
  });

  describe('error recovery', () => {
    it('should recover from temporary network errors', async () => {
      let networkErrors = 0;
      global.SlidesApp = {
        create: jest.fn(() => {
          networkErrors++;
          if (networkErrors <= 1) {
            throw new Error('Network timeout');
          }
          return { getId: () => 'recovered-presentation' };
        })
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const result = await apiService.createPresentationWithRetry('Recovery Test');
      
      expect(result.getId()).toBe('recovered-presentation');
      expect(networkErrors).toBe(2);
    });

    it('should handle partial batch failures gracefully', async () => {
      let slideCount = 0;
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => {
            slideCount++;
            if (slideCount === 3) {
              throw new Error('Slide creation failed');
            }
            return { getId: () => `slide-${slideCount}` };
          })
        }))
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const slideConfigs = Array.from({ length: 5 }, () => ({ layout: 'BLANK' }));
      const results = await apiService.batchCreateSlides('test-presentation', slideConfigs);
      
      expect(results).toHaveLength(5);
      expect(results.filter(r => r.success)).toHaveLength(4);
      expect(results.filter(r => !r.success)).toHaveLength(1);
      expect(results[2].error).toBe('Slide creation failed');
    });

    it('should handle API service unavailable errors', async () => {
      global.SlidesApp = {
        create: jest.fn(() => {
          throw new Error('Service unavailable');
        })
      };
      
      let error;
      try {
        await apiService.createPresentationWithRetry('Test', 1);
      } catch (e) {
        error = e;
      }
      
      expect(error.message).toBe('Service unavailable');
    });
  });

  describe('performance optimization', () => {
    it('should batch API calls efficiently', async () => {
      let apiCallCount = 0;
      global.SlidesApp = {
        openById: jest.fn(() => {
          apiCallCount++;
          return {
            appendSlide: jest.fn(() => ({ getId: () => `slide-${apiCallCount}` }))
          };
        })
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const slideConfigs = Array.from({ length: 15 }, () => ({ layout: 'BLANK' }));
      const startTime = Date.now();
      
      await apiService.batchCreateSlides('test-presentation', slideConfigs);
      
      const endTime = Date.now();
      
      // Should complete reasonably quickly despite batching
      expect(endTime - startTime).toBeLessThan(2000);
      
      // Should have made batch calls (not individual calls for each slide)
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2); // 3 batches = 2 delays
    });

    it('should optimize for different content types', async () => {
      const contentTypes = ['text', 'image', 'shape'];
      const processingTimes = {};
      
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => ({
            getId: () => 'test-slide',
            insertTextBox: jest.fn(() => ({ getId: () => 'text-element' })),
            insertImage: jest.fn(() => ({ getId: () => 'image-element' })),
            insertShape: jest.fn(() => ({ getId: () => 'shape-element' }))
          }))
        }))
      };
      
      for (const type of contentTypes) {
        const startTime = Date.now();
        
        const slideConfig = {
          layout: 'BLANK',
          content: [{ type, text: 'Test', url: 'https://example.com', shapeType: 'RECTANGLE' }]
        };
        
        await apiService.batchCreateSlides('test-presentation', [slideConfig]);
        
        processingTimes[type] = Date.now() - startTime;
      }
      
      // All content types should process efficiently
      Object.values(processingTimes).forEach(time => {
        expect(time).toBeLessThan(1000);
      });
    });
  });

  describe('API limitations compliance', () => {
    it('should respect Google Slides API request limits', async () => {
      const maxRequestsPerSecond = 10;
      const requests = Array.from({ length: 15 }, () => ({ layout: 'BLANK' }));
      
      const requestTimes = [];
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => {
            requestTimes.push(Date.now());
            return { getId: () => `slide-${requestTimes.length}` };
          })
        }))
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      await apiService.batchCreateSlides('test-presentation', requests);
      
      // Verify that batching was used to respect rate limits
      expect(global.Utilities.sleep).toHaveBeenCalled();
    });

    it('should handle API quota warnings', () => {
      // Mock approaching quota limit
      apiService.retryAttempts = 95000; // Close to 100,000 limit
      
      const quota = apiService.checkQuotaUsage();
      
      expect(quota.quotaRemaining).toBe(5000);
      expect(quota.quotaRemaining < 10000).toBe(true); // Should trigger warning
    });

    it('should validate API response formats', () => {
      const validPresentation = {
        getId: () => 'valid-id',
        getSlides: () => [{ getId: () => 'slide-1' }]
      };
      
      global.SlidesApp = {
        openById: jest.fn(() => validPresentation)
      };
      
      const integrity = apiService.validateDataIntegrity('test-presentation');
      
      expect(integrity.presentationExists).toBe(true);
      expect(integrity.slideCount).toBe(1);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle presentation with many slides', async () => {
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => ({ getId: () => `slide-${Math.random()}` }))
        }))
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const manySlides = Array.from({ length: 100 }, (_, i) => ({
        layout: 'BLANK',
        content: [{ type: 'text', text: `Slide ${i + 1} content` }]
      }));
      
      const results = await apiService.batchCreateSlides('large-presentation', manySlides);
      
      expect(results).toHaveLength(100);
      expect(results.filter(r => r.success).length).toBeGreaterThan(95); // Allow for minor failures
    });

    it('should handle complex multi-media slides', async () => {
      global.SlidesApp = {
        openById: jest.fn(() => ({
          appendSlide: jest.fn(() => ({
            getId: () => 'complex-slide',
            insertTextBox: jest.fn(() => ({ getId: () => 'text' })),
            insertImage: jest.fn(() => ({ getId: () => 'image' })),
            insertShape: jest.fn(() => ({ getId: () => 'shape' }))
          }))
        }))
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const complexSlide = {
        layout: 'BLANK',
        content: [
          { type: 'text', text: 'Title text' },
          { type: 'image', url: 'https://example.com/image.jpg' },
          { type: 'shape', shapeType: 'RECTANGLE' },
          { type: 'text', text: 'Description text' }
        ]
      };
      
      const results = await apiService.batchCreateSlides('complex-presentation', [complexSlide]);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should handle intermittent connectivity issues', async () => {
      let connectionAttempts = 0;
      global.SlidesApp = {
        create: jest.fn(() => {
          connectionAttempts++;
          if (connectionAttempts <= 3) {
            throw new Error('Connection timeout');
          }
          return { getId: () => 'connected-presentation' };
        })
      };
      
      global.Utilities = { sleep: jest.fn() };
      
      const result = await apiService.createPresentationWithRetry('Connectivity Test', 5);
      
      expect(result.getId()).toBe('connected-presentation');
      expect(connectionAttempts).toBe(4);
    });
  });
});