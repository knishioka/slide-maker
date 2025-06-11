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

    // Import the actual SlidesService from our codebase
    const SlidesService = require('../../src/services/slides.js');
    
    // Mock the logger dependency
    global.logger = {
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      createPerformanceMonitor: jest.fn(() => ({
        start: jest.fn(),
        end: jest.fn()
      }))
    };

    slidesService = new SlidesService();
  });
  
  describe('createPresentation', () => {
    it('should create presentation with valid title', () => {
      const title = 'Test Presentation';
      global.SlidesApp.create.mockReturnValue(mockPresentation);
      
      const result = slidesService.createPresentation(title);
      
      expect(global.SlidesApp.create).toHaveBeenCalledWith(title);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns presentation ID
    });
    
    it('should handle empty title gracefully', () => {
      global.SlidesApp.create.mockImplementation((title) => {
        if (!title || typeof title !== 'string') {
          throw new Error('Title is required');
        }
        return mockPresentation;
      });
      
      expect(() => slidesService.createPresentation('')).toThrow();
      expect(() => slidesService.createPresentation(null)).toThrow();
      expect(() => slidesService.createPresentation(undefined)).toThrow();
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

    it('should handle non-existent presentation', () => {
      global.SlidesApp.openById.mockImplementation(() => {
        throw new Error('Presentation not found');
      });
      
      expect(() => slidesService.openPresentation('invalid-id')).toThrow('Presentation not found');
    });
  });
  
  describe('addSlide', () => {
    beforeEach(() => {
      // Mock getLayouts method for SlidesService
      mockPresentation.getLayouts = jest.fn(() => [
        { getLayoutType: () => 'BLANK' },
        { getLayoutType: () => 'TITLE_ONLY' },
        { getLayoutType: () => 'TITLE_AND_BODY' }
      ]);
    });
    
    it('should add slide to existing presentation', () => {
      const presentationId = 'test-presentation-id';
      const layout = 'TITLE_AND_BODY';
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      mockPresentation.appendSlide.mockReturnValue(mockSlide);
      
      const result = slidesService.addSlide(presentationId, layout);
      
      expect(global.SlidesApp.openById).toHaveBeenCalledWith(presentationId);
      expect(result).toBeDefined();
      expect(result.getId()).toBe('test-slide-id');
    });
    
    it('should use default BLANK layout when not specified', () => {
      const presentationId = 'test-presentation-id';
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      mockPresentation.appendSlide.mockReturnValue(mockSlide);
      
      slidesService.addSlide(presentationId);
      
      expect(mockPresentation.getLayouts).toHaveBeenCalled();
    });

    it('should handle invalid presentation ID', () => {
      global.SlidesApp.openById.mockImplementation(() => {
        throw new Error('Presentation not found');
      });
      
      expect(() => slidesService.addSlide('invalid-id', 'TITLE')).toThrow('Presentation not found');
    });
  });
  
  describe('insertTextBox', () => {
    beforeEach(() => {
      // Mock getSlides for SlidesService which uses slideIndex
      mockPresentation.getSlides = jest.fn(() => [mockSlide]);
    });
    
    it('should insert text box with correct positioning', () => {
      const presentationId = 'test-presentation-id';
      const slideIndex = 0;
      const text = 'Test text';
      const position = { x: 100, y: 200, width: 300, height: 100 };
      const style = { fontSize: 24, fontFamily: 'Arial', color: '#000000', bold: true };
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      const mockTextBox = {
        getId: () => 'test-textbox-id',
        getText: () => ({
          getTextStyle: () => ({
            setFontSize: jest.fn(),
            setFontFamily: jest.fn(),
            setForegroundColor: jest.fn(),
            setBold: jest.fn(),
            setItalic: jest.fn()
          }),
          getParagraphStyle: () => ({
            setLineSpacing: jest.fn(),
            setParagraphAlignment: jest.fn()
          })
        })
      };
      mockSlide.insertTextBox.mockReturnValue(mockTextBox);
      
      const result = slidesService.insertTextBox(presentationId, slideIndex, text, position, style);
      
      expect(mockSlide.insertTextBox).toHaveBeenCalledWith(text, 100, 200, 300, 100);
      expect(result).toBeDefined();
    });
    
    it('should apply text styles correctly', () => {
      const presentationId = 'test-presentation-id';
      const slideIndex = 0;
      const text = 'Styled text';
      const position = { x: 50, y: 50, width: 200, height: 50 };
      const style = { fontSize: 18, fontFamily: 'Helvetica', color: '#FF0000', bold: false };
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      const mockTextStyle = {
        setFontSize: jest.fn(),
        setFontFamily: jest.fn(),
        setForegroundColor: jest.fn(),
        setBold: jest.fn(),
        setItalic: jest.fn()
      };
      const mockTextBox = {
        getId: () => 'test-textbox-id',
        getText: () => ({
          getTextStyle: () => mockTextStyle,
          getParagraphStyle: () => ({
            setLineSpacing: jest.fn(),
            setParagraphAlignment: jest.fn()
          })
        })
      };
      mockSlide.insertTextBox.mockReturnValue(mockTextBox);
      
      slidesService.insertTextBox(presentationId, slideIndex, text, position, style);
      
      expect(mockTextStyle.setFontSize).toHaveBeenCalledWith(18);
      expect(mockTextStyle.setFontFamily).toHaveBeenCalledWith('Helvetica');
      expect(mockTextStyle.setForegroundColor).toHaveBeenCalledWith('#FF0000');
      expect(mockTextStyle.setBold).toHaveBeenCalledWith(false);
    });
    
    it('should handle invalid parameters', () => {
      const presentationId = 'test-presentation-id';
      const slideIndex = 999; // Invalid slide index
      const text = 'Test text';
      const position = { x: 100, y: 200, width: 300, height: 100 };
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      
      // Mock empty slides array to trigger index error
      mockPresentation.getSlides.mockReturnValue([]);
      
      expect(() => slidesService.insertTextBox(presentationId, slideIndex, text, position)).toThrow();
    });

    it('should work without style parameter', () => {
      const presentationId = 'test-presentation-id';
      const slideIndex = 0;
      const text = 'Plain text';
      const position = { x: 10, y: 20, width: 100, height: 30 };
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      const mockTextBox = {
        getId: () => 'test-textbox-id',
        getText: () => ({
          getTextStyle: () => ({
            setFontSize: jest.fn(),
            setFontFamily: jest.fn()
          }),
          getParagraphStyle: () => ({})
        })
      };
      mockSlide.insertTextBox.mockReturnValue(mockTextBox);
      
      const result = slidesService.insertTextBox(presentationId, slideIndex, text, position);
      
      expect(mockSlide.insertTextBox).toHaveBeenCalledWith(text, 10, 20, 100, 30);
      expect(result).toBeDefined();
    });

    it('should handle complete position data', () => {
      const presentationId = 'test-presentation-id';
      const slideIndex = 0;
      const text = 'Test text';
      const position = { x: 100, y: 150, width: 200, height: 80 };
      
      global.SlidesApp.openById.mockReturnValue(mockPresentation);
      const mockTextBox = {
        getId: () => 'test-textbox-id',
        getText: () => ({
          getTextStyle: () => ({}),
          getParagraphStyle: () => ({})
        })
      };
      mockSlide.insertTextBox.mockReturnValue(mockTextBox);
      
      slidesService.insertTextBox(presentationId, slideIndex, text, position);
      
      expect(mockSlide.insertTextBox).toHaveBeenCalledWith(text, 100, 150, 200, 80);
    });
  });

  describe('retry mechanisms', () => {
    it('should handle rate limits with exponential backoff', () => {
      let callCount = 0;
      global.SlidesApp.create.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Rate limit exceeded');
        }
        return mockPresentation;
      });
      
      const result = slidesService.createPresentation('Test');
      
      expect(typeof result).toBe('string'); // Returns presentation ID
      expect(callCount).toBe(3); // 2 failures + 1 success via executeWithRetry
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2);
    });
    
    it('should implement exponential backoff delays', () => {
      const delays = [];
      global.Utilities.sleep.mockImplementation((ms) => {
        delays.push(ms);
      });
      
      // Create a function that always throws
      const alwaysFailsFn = () => {
        throw new Error('Retry needed');
      };
      
      try {
        slidesService.executeWithRetry(alwaysFailsFn, 3);
      } catch (error) {
        // Expected to throw after all retries
      }
      
      expect(delays).toEqual([1000, 2000]); // Exponential: 1s, 2s (3rd attempt throws)
    });

    it('should stop retrying after max attempts', () => {
      global.SlidesApp.create.mockImplementation(() => {
        throw new Error('Persistent error');
      });
      
      let error;
      try {
        slidesService.createPresentation('Test');
      } catch (e) {
        error = e;
      }
      
      expect(error.message).toBe('Persistent error');
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(2); // Default maxRetries=3, so 2 sleeps
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
    beforeEach(() => {\n      mockPresentation.getLayouts = jest.fn(() => [\n        { getLayoutType: () => 'BLANK' }\n      ]);\n      mockPresentation.getSlides = jest.fn(() => [mockSlide]);\n    });\n    \n    it('should maintain data integrity across API calls', () => {\n      const title = 'Consistency Test';\n      global.SlidesApp.create.mockReturnValue(mockPresentation);\n      global.SlidesApp.openById.mockReturnValue(mockPresentation);\n      mockPresentation.appendSlide.mockReturnValue(mockSlide);\n      \n      const presentationId = slidesService.createPresentation(title);\n      const slide = slidesService.addSlide(presentationId, 'TITLE');\n      \n      const mockTextBox = {\n        getId: () => 'test-textbox-id',\n        getText: () => ({ getTextStyle: () => ({}), getParagraphStyle: () => ({}) })\n      };\n      mockSlide.insertTextBox.mockReturnValue(mockTextBox);\n      \n      const textBox = slidesService.insertTextBox(presentationId, 0, 'Test text', {\n        x: 100, y: 100, width: 200, height: 50\n      });\n      \n      expect(typeof presentationId).toBe('string');\n      expect(slide.getId()).toBe('test-slide-id');\n      expect(textBox.getId()).toBe('test-textbox-id');\n    });\n\n    it('should handle concurrent operations safely', () => {\n      global.SlidesApp.create.mockReturnValue(mockPresentation);\n      \n      const results = [];\n      for (let i = 0; i < 5; i++) {\n        results.push(slidesService.createPresentation(`Test ${i}`));\n      }\n      \n      expect(results).toHaveLength(5);\n      expect(global.SlidesApp.create).toHaveBeenCalledTimes(5);\n    });\n  });\n\n  describe('advanced features', () => {\n    beforeEach(() => {\n      mockPresentation.getSlides = jest.fn(() => [mockSlide]);\n      mockPresentation.getLayouts = jest.fn(() => [{ getLayoutType: () => 'BLANK' }]);\n    });\n\n    it('should insert images correctly', () => {\n      const presentationId = 'test-presentation-id';\n      const slideIndex = 0;\n      const imageUrl = 'https://example.com/image.jpg';\n      const position = { x: 100, y: 200, width: 300, height: 200 };\n      \n      global.SlidesApp.openById.mockReturnValue(mockPresentation);\n      const mockImage = { getId: () => 'test-image-id' };\n      mockSlide.insertImage.mockReturnValue(mockImage);\n      \n      const result = slidesService.insertImage(presentationId, slideIndex, imageUrl, position);\n      \n      expect(mockSlide.insertImage).toHaveBeenCalledWith(imageUrl, 100, 200, 300, 200);\n      expect(result.getId()).toBe('test-image-id');\n    });\n\n    it('should calculate optimal font size', () => {\n      const slideWidth = 960;\n      const slideHeight = 540;\n      const textLength = 100;\n      \n      const fontSize = slidesService.calculateOptimalFontSize(slideWidth, slideHeight, textLength);\n      \n      expect(typeof fontSize).toBe('number');\n      expect(fontSize).toBeGreaterThan(0);\n    });\n\n    it('should calculate layout positions', () => {\n      const slideDimensions = { width: 960, height: 540 };\n      \n      const singlePosition = slidesService.calculateLayoutPosition('single', slideDimensions, 0);\n      expect(singlePosition).toEqual({\n        x: 60,\n        y: 60,\n        width: 840,\n        height: 80\n      });\n\n      const doublePosition = slidesService.calculateLayoutPosition('double', slideDimensions, 1);\n      expect(doublePosition.x).toBeGreaterThan(400); // Should be in right column\n    });\n\n    it('should get presentation info', () => {\n      const presentationId = 'test-presentation-id';\n      global.SlidesApp.openById.mockReturnValue({\n        ...mockPresentation,\n        getName: () => 'Test Presentation',\n        getUrl: () => `https://docs.google.com/presentation/d/${presentationId}/edit`,\n        getPageWidth: () => 960,\n        getPageHeight: () => 540\n      });\n      \n      const info = slidesService.getPresentationInfo(presentationId);\n      \n      expect(info).toEqual({\n        id: 'test-presentation-id',\n        name: 'Test Presentation',\n        url: `https://docs.google.com/presentation/d/${presentationId}/edit`,\n        slideCount: 1,\n        width: 960,\n        height: 540\n      });\n    });\n\n    it('should export presentation in different formats', () => {\n      const presentationId = 'test-presentation-id';\n      const mockBlob = { getBytes: () => new Uint8Array([80, 68, 70]) };\n      \n      global.SlidesApp.openById.mockReturnValue({\n        ...mockPresentation,\n        getAs: jest.fn(() => mockBlob)\n      });\n      \n      const result = slidesService.exportPresentation(presentationId, 'PDF');\n      \n      expect(result).toBe(mockBlob);\n    });\n  });
});