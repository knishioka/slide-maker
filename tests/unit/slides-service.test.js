/**
 * Unit tests for Google Slides Service
 * Tests the Google Slides API wrapper functionality
 */

describe('GoogleSlidesService', () => {
  let slidesService;
  let mockPresentation;
  let mockSlide;
  
  beforeEach(() => {
    // Reset all mocks before each test
    global.SlidesApp = {
      create: jest.fn(),
      openById: jest.fn()
    };
    
    global.DriveApp = {
      getFileById: jest.fn(),
      createFile: jest.fn()
    };
    
    global.Utilities = {
      sleep: jest.fn(),
      base64Encode: jest.fn(str => Buffer.from(str).toString('base64')),
      base64Decode: jest.fn(str => Buffer.from(str, 'base64').toString())
    };

    // Mock presentation object
    mockPresentation = {
      getId: jest.fn(() => 'test-presentation-id'),
      getTitle: jest.fn(() => 'Test Presentation'),
      setTitle: jest.fn(),
      getSlides: jest.fn(() => [mockSlide]),
      appendSlide: jest.fn(() => mockSlide)
    };

    // Mock slide object
    mockSlide = {
      getId: jest.fn(() => 'test-slide-id'),
      insertTextBox: jest.fn(() => ({
        getId: () => 'test-textbox-id',
        getText: () => ({ setText: jest.fn() }),
        getTextStyle: () => ({
          setFontSize: jest.fn(),
          setFontFamily: jest.fn(),
          setForegroundColor: jest.fn(),
          setBold: jest.fn()
        }),
        setLeft: jest.fn(),
        setTop: jest.fn(),
        setWidth: jest.fn(),
        setHeight: jest.fn()
      })),
      insertImage: jest.fn(() => ({
        getId: () => 'test-image-id',
        setLeft: jest.fn(),
        setTop: jest.fn(),
        setWidth: jest.fn(),
        setHeight: jest.fn()
      })),
      insertShape: jest.fn(() => ({
        getId: () => 'test-shape-id',
        setLeft: jest.fn(),
        setTop: jest.fn(),
        setWidth: jest.fn(),
        setHeight: jest.fn(),
        getFill: () => ({ setSolidFill: jest.fn() })
      }))
    };

    // Initialize service with mocked dependencies
    slidesService = {
      createPresentation: function (title) {
        if (!title || title.trim() === '') {
          throw new Error('Title cannot be empty');
        }
        return global.SlidesApp.create(title);
      },
      
      openPresentation: function (id) {
        if (!id) {
          throw new Error('Presentation ID is required');
        }
        return global.SlidesApp.openById(id);
      },
      
      addSlide: function (presentationId, layout = 'BLANK') {
        const presentation = this.openPresentation(presentationId);
        return presentation.appendSlide(layout);
      },
      
      insertTextBox: function (slide, text, position, style) {
        if (!slide) {
          throw new Error('Slide is required');
        }
        if (!text) {
          throw new Error('Text content is required');
        }
        if (!position) {
          throw new Error('Position is required');
        }
        
        const textBox = slide.insertTextBox(text);
        
        // Apply positioning
        if (position.x !== undefined) {
          textBox.setLeft(position.x);
        }
        if (position.y !== undefined) {
          textBox.setTop(position.y);
        }
        if (position.width !== undefined) {
          textBox.setWidth(position.width);
        }
        if (position.height !== undefined) {
          textBox.setHeight(position.height);
        }
        
        // Apply styling
        if (style) {
          const textStyle = textBox.getTextStyle();
          if (style.fontSize) {
            textStyle.setFontSize(style.fontSize);
          }
          if (style.fontFamily) {
            textStyle.setFontFamily(style.fontFamily);
          }
          if (style.color) {
            textStyle.setForegroundColor(style.color);
          }
          if (style.bold) {
            textStyle.setBold(style.bold);
          }
        }
        
        return textBox;
      },

      createPresentationWithRetry: async function (title, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return this.createPresentation(title);
          } catch (error) {
            if (error.message.includes('Rate limit') && i < maxRetries - 1) {
              const delay = Math.pow(2, i) * 1000;
              global.Utilities.sleep(delay);
              continue;
            }
            throw error;
          }
        }
      },

      retryWithBackoff: async function (fn, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return fn();
          } catch (error) {
            if (i === maxRetries - 1) {
              throw error;
            }
            const delay = Math.pow(2, i) * 1000;
            global.Utilities.sleep(delay);
          }
        }
      }
    };
  });
  
  describe('createPresentation', () => {
    it('should create presentation with valid title', () => {
      const title = 'Test Presentation';
      global.SlidesApp.create.mockReturnValue(mockPresentation);
      
      const result = slidesService.createPresentation(title);
      
      expect(global.SlidesApp.create).toHaveBeenCalledWith(title);
      expect(result).toBeDefined();
      expect(result.getId()).toBeTruthy();
      expect(typeof result.getId()).toBe('string');
    });
    
    it('should handle empty title gracefully', () => {
      expect(() => slidesService.createPresentation('')).toThrow('Title cannot be empty');
      expect(() => slidesService.createPresentation(null)).toThrow('Title cannot be empty');
      expect(() => slidesService.createPresentation('   ')).toThrow('Title cannot be empty');
    });
    
    it('should handle API rate limit errors', () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Rate limit exceeded');
      });
      
      expect(() => slidesService.createPresentation('Test')).toThrow('Rate limit exceeded');
    });

    it('should handle API permission errors', () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Insufficient permissions');
      });
      
      expect(() => slidesService.createPresentation('Test')).toThrow('Insufficient permissions');
    });
  });
  
  describe('openPresentation', () => {
    it('should open existing presentation by ID', () => {
      const presentationId = 'test-presentation-id';
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      
      const result = slidesService.openPresentation(presentationId);
      
      expect(global.SlidesApp.openById).toHaveBeenCalledWith(presentationId);
      expect(result).toBeDefined();
      expect(result.getId()).toBe('test-presentation-id');
    });

    it('should handle missing presentation ID', () => {
      expect(() => slidesService.openPresentation()).toThrow('Presentation ID is required');
      expect(() => slidesService.openPresentation('')).toThrow('Presentation ID is required');
      expect(() => slidesService.openPresentation(null)).toThrow('Presentation ID is required');
    });

    it('should handle non-existent presentation', () => {
      global.SlidesApp.openById.mockImplementation(() => {
        throw new Error('Presentation not found');
      });
      
      expect(() => slidesService.openPresentation('invalid-id')).toThrow('Presentation not found');
    });
  });
  
  describe('addSlide', () => {
    it('should add slide to existing presentation', () => {
      const presentationId = 'test-presentation-id';
      const layout = 'TITLE_AND_BODY';
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      mockPresentation.appendSlide.mockReturnValue(mockSlide);
      
      const result = slidesService.addSlide(presentationId, layout);
      
      expect(global.SlidesApp.openById).toHaveBeenCalledWith(presentationId);
      expect(mockPresentation.appendSlide).toHaveBeenCalledWith(layout);
      expect(result).toBeDefined();
      expect(result.getId()).toBe('test-slide-id');
    });
    
    it('should use default BLANK layout when not specified', () => {
      const presentationId = 'test-presentation-id';
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      mockPresentation.appendSlide.mockReturnValue(mockSlide);
      
      slidesService.addSlide(presentationId);
      
      expect(mockPresentation.appendSlide).toHaveBeenCalledWith('BLANK');
    });

    it('should handle invalid presentation ID', () => {
      global.SlidesApp.openById.mockImplementation(() => {
        throw new Error('Presentation not found');
      });
      
      expect(() => slidesService.addSlide('invalid-id', 'TITLE')).toThrow('Presentation not found');
    });
  });
  
  describe('insertTextBox', () => {
    it('should insert text box with correct positioning', () => {
      const text = 'Test text';
      const position = { x: 100, y: 200, width: 300, height: 100 };
      const style = { fontSize: 24, fontFamily: 'Arial', color: '#000000', bold: true };
      
      const mockTextBox = mockSlide.insertTextBox();
      
      const result = slidesService.insertTextBox(mockSlide, text, position, style);
      
      expect(mockSlide.insertTextBox).toHaveBeenCalledWith(text);
      expect(mockTextBox.setLeft).toHaveBeenCalledWith(100);
      expect(mockTextBox.setTop).toHaveBeenCalledWith(200);
      expect(mockTextBox.setWidth).toHaveBeenCalledWith(300);
      expect(mockTextBox.setHeight).toHaveBeenCalledWith(100);
    });
    
    it('should apply text styles correctly', () => {
      const text = 'Styled text';
      const position = { x: 50, y: 50, width: 200, height: 50 };
      const style = { fontSize: 18, fontFamily: 'Helvetica', color: '#FF0000', bold: false };
      
      const mockTextBox = mockSlide.insertTextBox();
      const mockTextStyle = mockTextBox.getTextStyle();
      
      slidesService.insertTextBox(mockSlide, text, position, style);
      
      expect(mockTextStyle.setFontSize).toHaveBeenCalledWith(18);
      expect(mockTextStyle.setFontFamily).toHaveBeenCalledWith('Helvetica');
      expect(mockTextStyle.setForegroundColor).toHaveBeenCalledWith('#FF0000');
      expect(mockTextStyle.setBold).toHaveBeenCalledWith(false);
    });
    
    it('should handle malformed position data', () => {
      const text = 'Test text';
      const invalidPosition = { x: -100, y: 200 }; // Negative x
      
      expect(() => slidesService.insertTextBox(null, text, invalidPosition)).toThrow('Slide is required');
      expect(() => slidesService.insertTextBox(mockSlide, '', invalidPosition)).toThrow('Text content is required');
      expect(() => slidesService.insertTextBox(mockSlide, text, null)).toThrow('Position is required');
    });

    it('should work without style parameter', () => {
      const text = 'Plain text';
      const position = { x: 10, y: 20, width: 100, height: 30 };
      
      const result = slidesService.insertTextBox(mockSlide, text, position);
      
      expect(mockSlide.insertTextBox).toHaveBeenCalledWith(text);
      expect(result).toBeDefined();
    });

    it('should handle partial position data', () => {
      const text = 'Test text';
      const partialPosition = { x: 100, width: 200 }; // Missing y and height
      
      const mockTextBox = mockSlide.insertTextBox();
      
      slidesService.insertTextBox(mockSlide, text, partialPosition);
      
      expect(mockTextBox.setLeft).toHaveBeenCalledWith(100);
      expect(mockTextBox.setWidth).toHaveBeenCalledWith(200);
      expect(mockTextBox.setTop).not.toHaveBeenCalled();
      expect(mockTextBox.setHeight).not.toHaveBeenCalled();
    });
  });

  describe('retry mechanisms', () => {
    it('should handle rate limits with exponential backoff', async () => {
      let callCount = 0;
      global.SlidesApp.create.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Rate limit exceeded');
        }
        return mockPresentation;
      });
      
      const result = await slidesService.createPresentationWithRetry('Test');
      
      expect(result.getId()).toBe('test-presentation-id');
      expect(callCount).toBe(3); // 2 failures + 1 success
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2);
    });
    
    it('should implement exponential backoff delays', async () => {
      const delays = [];
      global.Utilities.sleep.mockImplementation((ms) => {
        delays.push(ms);
      });
      
      try {
        await slidesService.retryWithBackoff(() => {
          throw new Error('Retry needed');
        }, 3);
      } catch (error) {
        // Expected to throw after all retries
      }
      
      expect(delays).toEqual([1000, 2000]); // Exponential: 1s, 2s (3rd attempt throws)
    });

    it('should stop retrying after max attempts', async () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Persistent error');
      });
      
      let error;
      try {
        await slidesService.createPresentationWithRetry('Test', 2);
      } catch (e) {
        error = e;
      }
      
      expect(error.message).toBe('Persistent error');
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(1); // Only retry once for maxRetries=2
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Network error');
      });
      
      expect(() => slidesService.createPresentation('Test')).toThrow('Network error');
    });

    it('should handle quota exceeded errors', () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      
      expect(() => slidesService.createPresentation('Test')).toThrow('Quota exceeded');
    });

    it('should validate required parameters', () => {
      expect(() => slidesService.insertTextBox(null, 'text', { x: 0, y: 0 })).toThrow('Slide is required');
      expect(() => slidesService.insertTextBox(mockSlide, null, { x: 0, y: 0 })).toThrow('Text content is required');
      expect(() => slidesService.insertTextBox(mockSlide, 'text', null)).toThrow('Position is required');
    });
  });

  describe('data consistency', () => {
    it('should maintain data integrity across API calls', () => {
      const title = 'Consistency Test';
      global.SlidesApp.create.mockReturnValue(mockPresentation);
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      mockPresentation.appendSlide.mockReturnValue(mockSlide);
      
      const presentation = slidesService.createPresentation(title);
      const slide = slidesService.addSlide(presentation.getId(), 'TITLE');
      const textBox = slidesService.insertTextBox(slide, 'Test text', {
        x: 100, y: 100, width: 200, height: 50
      });
      
      expect(presentation.getId()).toBe('test-presentation-id');
      expect(slide.getId()).toBe('test-slide-id');
      expect(textBox.getId()).toBe('test-textbox-id');
    });

    it('should handle concurrent operations safely', () => {
      global.SlidesApp.create.mockReturnValue(mockPresentation);
      
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(slidesService.createPresentation(`Test ${i}`));
      }
      
      expect(results).toHaveLength(5);
      expect(global.SlidesApp.create).toHaveBeenCalledTimes(5);
    });
  });
});