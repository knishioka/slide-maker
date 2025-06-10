/**
 * Integration tests for Slide Generation
 * Tests the complete slide creation flow with multiple components
 */

describe('Slide Generation Integration', () => {
  let slideGenerator;
  let mockSlidesService;
  let mockValidator;
  let mockLogger;
  
  beforeEach(() => {
    // Mock slides service
    mockSlidesService = {
      createPresentation: jest.fn(),
      addSlide: jest.fn(),
      insertTextBox: jest.fn(),
      insertImage: jest.fn(),
      insertShape: jest.fn()
    };
    
    // Mock validator
    mockValidator = {
      validateSlideContent: jest.fn(),
      validatePresentationTitle: jest.fn(),
      validateLayoutConfig: jest.fn()
    };
    
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    
    // Mock presentation and slide objects
    const mockPresentation = {
      getId: () => 'test-presentation-id',
      getTitle: () => 'Test Presentation',
      getSlides: () => []
    };
    
    const mockSlide = {
      getId: () => 'test-slide-id',
      insertTextBox: jest.fn(() => ({ getId: () => 'test-textbox-id' })),
      insertImage: jest.fn(() => ({ getId: () => 'test-image-id' })),
      insertShape: jest.fn(() => ({ getId: () => 'test-shape-id' }))
    };
    
    mockSlidesService.createPresentation.mockReturnValue(mockPresentation);
    mockSlidesService.addSlide.mockReturnValue(mockSlide);
    
    // Initialize slide generator
    slideGenerator = {
      slidesService: mockSlidesService,
      validator: mockValidator,
      logger: mockLogger,
      
      createSlides: async function (content, options = {}) {
        const results = {
          presentationId: null,
          slides: [],
          success: false,
          errors: [],
          warnings: [],
          layout: options.layout || 'single-column'
        };
        
        try {
          // Validate presentation title
          const title = options.title || 'Generated Presentation';
          const titleValidation = this.validator.validatePresentationTitle(title);
          
          if (!titleValidation.isValid) {
            results.errors.push(...titleValidation.errors);
            return results;
          }
          
          this.logger.info('Starting slide generation', { 
            contentItems: content.length, 
            layout: results.layout 
          });
          
          // Create presentation
          const presentation = this.slidesService.createPresentation(titleValidation.sanitizedTitle);
          results.presentationId = presentation.getId();
          
          // Validate layout configuration
          const layoutConfig = this.getLayoutConfig(results.layout);
          const layoutValidation = this.validator.validateLayoutConfig(layoutConfig);
          
          if (!layoutValidation.isValid) {
            results.errors.push(...layoutValidation.errors);
            return results;
          }
          
          // Process content items
          const processedSlides = await this.processContentItems(
            content, 
            results.presentationId, 
            layoutValidation.sanitizedConfig
          );
          
          results.slides = processedSlides.slides;
          results.errors.push(...processedSlides.errors);
          results.warnings.push(...processedSlides.warnings);
          
          // Check if any slides were created successfully
          results.success = results.slides.length > 0;
          
          this.logger.info('Slide generation completed', {
            presentationId: results.presentationId,
            slidesCreated: results.slides.length,
            errors: results.errors.length,
            warnings: results.warnings.length
          });
          
        } catch (error) {
          this.logger.error('Slide generation failed', { error: error.message });
          results.errors.push(error.message);
        }
        
        return results;
      },
      
      processContentItems: async function (content, presentationId, layoutConfig) {
        const results = { slides: [], errors: [], warnings: [] };
        const maxItemsPerSlide = layoutConfig.maxItemsPerSlide || 5;
        
        for (let i = 0; i < content.length; i += maxItemsPerSlide) {
          try {
            const slideContent = content.slice(i, i + maxItemsPerSlide);
            const slide = await this.createSlideFromContent(
              presentationId, 
              slideContent, 
              layoutConfig
            );
            
            if (slide) {
              results.slides.push(slide);
            }
          } catch (error) {
            this.logger.warn('Failed to create slide', { 
              slideIndex: Math.floor(i / maxItemsPerSlide),
              error: error.message 
            });
            results.errors.push(`Slide ${Math.floor(i / maxItemsPerSlide) + 1}: ${error.message}`);
          }
        }
        
        return results;
      },
      
      createSlideFromContent: async function (presentationId, slideContent, layoutConfig) {
        // Add slide to presentation
        const slide = this.slidesService.addSlide(presentationId, 'BLANK');
        const slideId = slide.getId();
        
        this.logger.debug('Creating slide', { slideId, itemCount: slideContent.length });
        
        // Process each content item
        const elements = [];
        let yOffset = layoutConfig.margin || 60;
        
        for (const [index, item] of slideContent.entries()) {
          try {
            // Validate content item
            const validation = this.validator.validateSlideContent(item);
            
            if (!validation.isValid) {
              this.logger.warn('Invalid content item', { 
                index, 
                errors: validation.errors 
              });
              continue;
            }
            
            const sanitizedItem = validation.sanitizedContent;
            const position = this.calculateItemPosition(
              index, 
              sanitizedItem, 
              layoutConfig, 
              yOffset
            );
            
            // Create slide element based on type
            let element;
            switch (sanitizedItem.type) {
              case 'text':
              case 'title':
              case 'body':
                element = this.slidesService.insertTextBox(
                  slide, 
                  sanitizedItem.content, 
                  position, 
                  sanitizedItem.style
                );
                break;
                
              case 'image':
                element = this.slidesService.insertImage(
                  slide, 
                  sanitizedItem.url, 
                  position
                );
                break;
                
              case 'shape':
                element = this.slidesService.insertShape(
                  slide, 
                  sanitizedItem.shapeType || 'RECTANGLE', 
                  position
                );
                break;
                
              default:
                this.logger.warn('Unsupported content type', { type: sanitizedItem.type });
                continue;
            }
            
            if (element) {
              elements.push({
                id: element.getId(),
                type: sanitizedItem.type,
                position
              });
              
              yOffset += (position.height || 50) + (layoutConfig.itemSpacing || 20);
            }
            
          } catch (error) {
            this.logger.error('Failed to create slide element', { 
              index, 
              error: error.message 
            });
          }
        }
        
        return {
          id: slideId,
          elements,
          layout: layoutConfig.type
        };
      },
      
      calculateItemPosition: function (index, item, layoutConfig, yOffset) {
        const margin = layoutConfig.margin || 60;
        const position = { x: margin, y: yOffset };
        
        // Apply layout-specific positioning
        switch (layoutConfig.type) {
          case 'double-column':
            const columnGap = layoutConfig.columnGap || 40;
            const columnWidth = (720 - (margin * 2) - columnGap) / 2; // Assuming 720px slide width
            
            if (index % 2 === 1) {
              position.x = margin + columnWidth + columnGap;
            }
            position.width = columnWidth;
            break;
            
          case 'single-column':
          default:
            position.width = 720 - (margin * 2);
            break;
        }
        
        // Set default height based on content type
        switch (item.type) {
          case 'title':
            position.height = 80;
            break;
          case 'body':
          case 'text':
            position.height = 50;
            break;
          case 'image':
            position.height = 200;
            break;
          default:
            position.height = 50;
        }
        
        // Override with item-specific position if provided
        if (item.position) {
          Object.assign(position, item.position);
        }
        
        return position;
      },
      
      getLayoutConfig: function (layoutType) {
        const configs = {
          'single-column': {
            type: 'single-column',
            margin: 60,
            itemSpacing: 20,
            maxItemsPerSlide: 5
          },
          'double-column': {
            type: 'double-column',
            margin: 60,
            columnGap: 40,
            itemSpacing: 15,
            maxItemsPerSlide: 8
          },
          'title-content': {
            type: 'title-content',
            margin: 80,
            titleHeight: 120,
            contentMargin: 80,
            maxItemsPerSlide: 3
          }
        };
        
        return configs[layoutType] || configs['single-column'];
      }
    };
  });
  
  describe('complete slide creation flow', () => {
    it('should create presentation with multiple slides', async () => {
      // Setup successful validations
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Test Presentation'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 2
        }
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Test content'
        }
      });
      
      const content = [
        { type: 'title', content: 'Test Presentation Title' },
        { type: 'body', content: 'This is the main content of the slide' },
        { type: 'text', content: 'Additional text content' }
      ];
      
      const result = await slideGenerator.createSlides(content);
      
      expect(result.presentationId).toBe('test-presentation-id');
      expect(result.slides).toHaveLength(2); // 3 items with maxItemsPerSlide = 2
      expect(result.success).toBe(true);
      expect(mockSlidesService.createPresentation).toHaveBeenCalledWith('Test Presentation');
      expect(mockSlidesService.addSlide).toHaveBeenCalledTimes(2);
    });
    
    it('should handle large content datasets gracefully', async () => {
      // Setup mocks for large dataset
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Large Dataset Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 10
        }
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Content item'
        }
      });
      
      // Generate large content array (50 items)
      const largeContent = Array.from({ length: 50 }, (_, i) => ({
        type: 'text',
        content: `Content item ${i + 1}`
      }));
      
      const startTime = Date.now();
      const result = await slideGenerator.createSlides(largeContent);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.slides.length).toBe(5); // 50 items / 10 per slide = 5 slides
      expect(endTime - startTime).toBeLessThan(5000); // Should complete quickly
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting slide generation',
        expect.objectContaining({ contentItems: 50 })
      );
    });
    
    it('should recover from partial failures', async () => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Recovery Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 5
        }
      });
      
      // Mock validation to fail for middle item
      mockValidator.validateSlideContent
        .mockReturnValueOnce({
          isValid: true,
          sanitizedContent: { type: 'title', content: 'Valid Title' }
        })
        .mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid content type']
        })
        .mockReturnValueOnce({
          isValid: true,
          sanitizedContent: { type: 'body', content: 'Valid Body' }
        });
      
      const contentWithError = [
        { type: 'title', content: 'Valid Title' },
        { type: 'invalid-type', content: 'This will fail' },
        { type: 'body', content: 'Valid Body' }
      ];
      
      const result = await slideGenerator.createSlides(contentWithError);
      
      expect(result.success).toBe(true); // Should continue despite errors
      expect(result.slides.length).toBeGreaterThan(0); // Some slides created
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid content item',
        expect.objectContaining({ errors: ['Invalid content type'] })
      );
    });

    it('should handle validation failures gracefully', async () => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: false,
        errors: ['Title cannot be empty']
      });
      
      const content = [{ type: 'text', content: 'Test' }];
      const result = await slideGenerator.createSlides(content, { title: '' });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Title cannot be empty');
      expect(result.presentationId).toBeNull();
      expect(mockSlidesService.createPresentation).not.toHaveBeenCalled();
    });

    it('should handle slide service errors', async () => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Error Test'
      });
      
      mockSlidesService.createPresentation.mockImplementation(() => {
        throw new Error('API Error');
      });
      
      const content = [{ type: 'text', content: 'Test' }];
      const result = await slideGenerator.createSlides(content);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Slide generation failed',
        expect.objectContaining({ error: 'API Error' })
      );
    });
  });
  
  describe('layout integration', () => {
    beforeEach(() => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Layout Test'
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Test content'
        }
      });
    });
    
    it('should apply single-column layout correctly', async () => {
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 5
        }
      });
      
      const content = [
        { type: 'title', content: 'Title' },
        { type: 'body', content: 'Body 1' },
        { type: 'body', content: 'Body 2' }
      ];
      
      const result = await slideGenerator.createSlides(content, {
        layout: 'single-column'
      });
      
      expect(result.layout).toBe('single-column');
      expect(result.success).toBe(true);
      
      // Verify layout configuration was used
      expect(mockValidator.validateLayoutConfig).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'single-column' })
      );
    });
    
    it('should apply double-column layout correctly', async () => {
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'double-column',
          margin: 60,
          columnGap: 40,
          itemSpacing: 15,
          maxItemsPerSlide: 8
        }
      });
      
      const content = Array.from({ length: 4 }, (_, i) => ({
        type: 'body',
        content: `Item ${i + 1}`
      }));
      
      const result = await slideGenerator.createSlides(content, {
        layout: 'double-column'
      });
      
      expect(result.layout).toBe('double-column');
      expect(result.success).toBe(true);
      
      // Verify double-column configuration
      expect(mockValidator.validateLayoutConfig).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'double-column',
          columnGap: 40
        })
      );
    });

    it('should handle invalid layout configuration', async () => {
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: false,
        errors: ['Invalid layout type']
      });
      
      const content = [{ type: 'text', content: 'Test' }];
      const result = await slideGenerator.createSlides(content, {
        layout: 'invalid-layout'
      });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid layout type');
    });
  });

  describe('content type handling', () => {
    beforeEach(() => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Content Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 5
        }
      });
    });

    it('should handle text content correctly', async () => {
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Text content',
          style: { fontSize: 24 }
        }
      });
      
      const content = [{ type: 'text', content: 'Text content' }];
      const result = await slideGenerator.createSlides(content);
      
      expect(result.success).toBe(true);
      expect(mockSlidesService.insertTextBox).toHaveBeenCalledWith(
        expect.anything(),
        'Text content',
        expect.objectContaining({ x: 60, y: 60 }),
        { fontSize: 24 }
      );
    });

    it('should handle image content correctly', async () => {
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'image',
          url: 'https://example.com/image.jpg'
        }
      });
      
      const content = [{ type: 'image', url: 'https://example.com/image.jpg' }];
      const result = await slideGenerator.createSlides(content);
      
      expect(result.success).toBe(true);
      expect(mockSlidesService.insertImage).toHaveBeenCalledWith(
        expect.anything(),
        'https://example.com/image.jpg',
        expect.objectContaining({ x: 60, y: 60 })
      );
    });

    it('should handle shape content correctly', async () => {
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'shape',
          shapeType: 'RECTANGLE'
        }
      });
      
      const content = [{ type: 'shape', shapeType: 'RECTANGLE' }];
      const result = await slideGenerator.createSlides(content);
      
      expect(result.success).toBe(true);
      expect(mockSlidesService.insertShape).toHaveBeenCalledWith(
        expect.anything(),
        'RECTANGLE',
        expect.objectContaining({ x: 60, y: 60 })
      );
    });

    it('should skip unsupported content types', async () => {
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'unsupported',
          content: 'Test'
        }
      });
      
      const content = [{ type: 'unsupported', content: 'Test' }];
      const result = await slideGenerator.createSlides(content);
      
      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unsupported content type',
        { type: 'unsupported' }
      );
    });
  });

  describe('positioning calculations', () => {
    beforeEach(() => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Position Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'double-column',
          margin: 60,
          columnGap: 40,
          itemSpacing: 15,
          maxItemsPerSlide: 4
        }
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Test'
        }
      });
    });

    it('should calculate double-column positions correctly', async () => {
      const content = [
        { type: 'text', content: 'Item 1' }, // Left column
        { type: 'text', content: 'Item 2' }, // Right column
        { type: 'text', content: 'Item 3' }, // Left column
        { type: 'text', content: 'Item 4' }  // Right column
      ];
      
      await slideGenerator.createSlides(content, { layout: 'double-column' });
      
      const calls = mockSlidesService.insertTextBox.mock.calls;
      
      // First item (index 0) - left column
      expect(calls[0][2]).toMatchObject({ x: 60 }); // Left margin
      
      // Second item (index 1) - right column
      expect(calls[1][2]).toMatchObject({ x: 370 }); // Right column position
      
      // Third item (index 2) - left column again
      expect(calls[2][2]).toMatchObject({ x: 60 });
      
      // Fourth item (index 3) - right column again
      expect(calls[3][2]).toMatchObject({ x: 370 });
    });

    it('should handle custom positioning from content', async () => {
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Test',
          position: { x: 100, y: 200, width: 300, height: 150 }
        }
      });
      
      const content = [{ 
        type: 'text', 
        content: 'Test',
        position: { x: 100, y: 200, width: 300, height: 150 }
      }];
      
      await slideGenerator.createSlides(content);
      
      expect(mockSlidesService.insertTextBox).toHaveBeenCalledWith(
        expect.anything(),
        'Test',
        expect.objectContaining({
          x: 100,
          y: 200,
          width: 300,
          height: 150
        }),
        undefined
      );
    });
  });

  describe('performance and reliability', () => {
    it('should handle concurrent slide creation', async () => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Concurrent Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 5
        }
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Concurrent content'
        }
      });
      
      const content = [{ type: 'text', content: 'Test' }];
      
      // Create multiple slide generation processes
      const promises = Array.from({ length: 3 }, (_, i) => 
        slideGenerator.createSlides(content, { title: `Test ${i}` }));
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should log appropriate events during generation', async () => {
      mockValidator.validatePresentationTitle.mockReturnValue({
        isValid: true,
        sanitizedTitle: 'Logging Test'
      });
      
      mockValidator.validateLayoutConfig.mockReturnValue({
        isValid: true,
        sanitizedConfig: {
          type: 'single-column',
          margin: 60,
          itemSpacing: 20,
          maxItemsPerSlide: 5
        }
      });
      
      mockValidator.validateSlideContent.mockReturnValue({
        isValid: true,
        sanitizedContent: {
          type: 'text',
          content: 'Test content'
        }
      });
      
      const content = [{ type: 'text', content: 'Test' }];
      await slideGenerator.createSlides(content);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting slide generation',
        expect.objectContaining({ contentItems: 1 })
      );
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Slide generation completed',
        expect.objectContaining({ 
          presentationId: 'test-presentation-id',
          slidesCreated: 1
        })
      );
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Creating slide',
        expect.objectContaining({ slideId: 'test-slide-id' })
      );
    });
  });
});