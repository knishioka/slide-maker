/**
 * Unit tests for Validation system
 * Tests input validation, sanitization, and error handling
 */

describe('Validator', () => {
  let validator;
  
  beforeEach(() => {
    validator = {
      // Content type definitions
      CONTENT_TYPES: {
        TEXT: 'text',
        IMAGE: 'image',
        SHAPE: 'shape',
        MERMAID: 'mermaid',
        TITLE: 'title',
        BODY: 'body'
      },
      
      // Font size constraints
      FONT_SIZE_LIMITS: {
        MIN: 8,
        MAX: 72
      },
      
      // Position constraints
      POSITION_LIMITS: {
        MIN_X: 0,
        MIN_Y: 0,
        MAX_X: 10000,
        MAX_Y: 10000,
        MIN_WIDTH: 10,
        MIN_HEIGHT: 10
      },
      
      // Color pattern for hex colors
      COLOR_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      
      // Font families allowed
      ALLOWED_FONTS: ['Arial', 'Helvetica', 'Times New Roman', 'Calibri', 'Georgia', 'Verdana'],
      
      validateSlideContent: function (content) {
        const errors = [];
        const sanitizedContent = {};
        
        try {
          // Validate content type
          if (!content || typeof content !== 'object') {
            errors.push('Content must be a valid object');
            return { isValid: false, errors, sanitizedContent: null };
          }
          
          // Check required type field
          if (!content.type || !Object.values(this.CONTENT_TYPES).includes(content.type)) {
            errors.push('Invalid content type');
          } else {
            sanitizedContent.type = content.type;
          }
          
          // Validate content field
          if (content.type === this.CONTENT_TYPES.TEXT || 
              content.type === this.CONTENT_TYPES.TITLE || 
              content.type === this.CONTENT_TYPES.BODY) {
            if (!content.content || typeof content.content !== 'string') {
              errors.push('Text content is required and must be a string');
            } else {
              sanitizedContent.content = this.sanitizeInput(content.content);
            }
          }
          
          // Validate image URL
          if (content.type === this.CONTENT_TYPES.IMAGE) {
            if (!content.url || typeof content.url !== 'string') {
              errors.push('Image URL is required');
            } else if (!this.isValidUrl(content.url)) {
              errors.push('Invalid image URL format');
            } else {
              sanitizedContent.url = content.url;
            }
          }
          
          // Validate style if present
          if (content.style) {
            const styleValidation = this.validateStyle(content.style);
            if (!styleValidation.isValid) {
              errors.push(...styleValidation.errors);
            } else {
              sanitizedContent.style = styleValidation.sanitizedStyle;
            }
          }
          
          // Validate position if present
          if (content.position) {
            const positionValidation = this.validatePosition(content.position);
            if (!positionValidation.isValid) {
              errors.push(...positionValidation.errors);
            } else {
              sanitizedContent.position = positionValidation.sanitizedPosition;
            }
          }
          
        } catch (error) {
          errors.push(`Validation error: ${error.message}`);
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          sanitizedContent: errors.length === 0 ? sanitizedContent : null
        };
      },
      
      validateStyle: function (style) {
        const errors = [];
        const sanitizedStyle = {};
        
        // Validate font size
        if (style.fontSize !== undefined) {
          if (typeof style.fontSize !== 'number' || 
              style.fontSize < this.FONT_SIZE_LIMITS.MIN || 
              style.fontSize > this.FONT_SIZE_LIMITS.MAX) {
            errors.push('Font size out of range');
          } else {
            sanitizedStyle.fontSize = Math.round(style.fontSize);
          }
        }
        
        // Validate font family
        if (style.fontFamily !== undefined) {
          if (typeof style.fontFamily !== 'string' || 
              !this.ALLOWED_FONTS.includes(style.fontFamily)) {
            errors.push('Invalid font family');
          } else {
            sanitizedStyle.fontFamily = style.fontFamily;
          }
        }
        
        // Validate color
        if (style.color !== undefined) {
          if (typeof style.color !== 'string' || 
              !this.COLOR_PATTERN.test(style.color)) {
            errors.push('Invalid color format');
          } else {
            sanitizedStyle.color = style.color.toUpperCase();
          }
        }
        
        // Validate boolean properties
        if (style.bold !== undefined) {
          sanitizedStyle.bold = Boolean(style.bold);
        }
        
        if (style.italic !== undefined) {
          sanitizedStyle.italic = Boolean(style.italic);
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          sanitizedStyle
        };
      },
      
      validatePosition: function (position) {
        const errors = [];
        const sanitizedPosition = {};
        
        // Validate x coordinate
        if (position.x !== undefined) {
          if (typeof position.x !== 'number' || 
              position.x < this.POSITION_LIMITS.MIN_X || 
              position.x > this.POSITION_LIMITS.MAX_X) {
            errors.push('X position out of bounds');
          } else {
            sanitizedPosition.x = Math.round(position.x);
          }
        }
        
        // Validate y coordinate
        if (position.y !== undefined) {
          if (typeof position.y !== 'number' || 
              position.y < this.POSITION_LIMITS.MIN_Y || 
              position.y > this.POSITION_LIMITS.MAX_Y) {
            errors.push('Y position out of bounds');
          } else {
            sanitizedPosition.y = Math.round(position.y);
          }
        }
        
        // Validate width
        if (position.width !== undefined) {
          if (typeof position.width !== 'number' || 
              position.width < this.POSITION_LIMITS.MIN_WIDTH) {
            errors.push('Width too small');
          } else {
            sanitizedPosition.width = Math.round(position.width);
          }
        }
        
        // Validate height
        if (position.height !== undefined) {
          if (typeof position.height !== 'number' || 
              position.height < this.POSITION_LIMITS.MIN_HEIGHT) {
            errors.push('Height too small');
          } else {
            sanitizedPosition.height = Math.round(position.height);
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          sanitizedPosition
        };
      },
      
      sanitizeInput: function (input) {
        if (input === null || input === undefined) {
          return '';
        }
        
        if (typeof input !== 'string') {
          input = String(input);
        }
        
        // Remove HTML tags
        input = input.replace(/<[^>]*>/g, '');
        
        // Remove script tags and their content
        input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove potentially dangerous characters
        input = input.replace(/[<>'"&]/g, (match) => {
          const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
          };
          return escapeMap[match];
        });
        
        // Trim whitespace
        return input.trim();
      },
      
      isValidUrl: function (url) {
        try {
          const urlPattern = /^https?:\/\/.+/i;
          return urlPattern.test(url);
        } catch (error) {
          return false;
        }
      },
      
      validatePresentationTitle: function (title) {
        const errors = [];
        
        if (!title || typeof title !== 'string') {
          errors.push('Title must be a non-empty string');
          return { isValid: false, errors, sanitizedTitle: null };
        }
        
        const sanitizedTitle = this.sanitizeInput(title);
        
        if (sanitizedTitle.length === 0) {
          errors.push('Title cannot be empty after sanitization');
        }
        
        if (sanitizedTitle.length > 100) {
          errors.push('Title too long (max 100 characters)');
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          sanitizedTitle: errors.length === 0 ? sanitizedTitle : null
        };
      },
      
      validateLayoutConfig: function (config) {
        const errors = [];
        const sanitizedConfig = {};
        
        const VALID_LAYOUTS = ['single-column', 'double-column', 'title-content', 'blank'];
        
        if (!config || typeof config !== 'object') {
          errors.push('Layout config must be an object');
          return { isValid: false, errors, sanitizedConfig: null };
        }
        
        // Validate layout type
        if (!config.type || !VALID_LAYOUTS.includes(config.type)) {
          errors.push('Invalid layout type');
        } else {
          sanitizedConfig.type = config.type;
        }
        
        // Validate numeric properties
        const numericProps = ['margin', 'columnGap', 'itemSpacing', 'maxItemsPerSlide'];
        numericProps.forEach(prop => {
          if (config[prop] !== undefined) {
            if (typeof config[prop] !== 'number' || config[prop] < 0) {
              errors.push(`Invalid ${prop}: must be a non-negative number`);
            } else {
              sanitizedConfig[prop] = Math.round(config[prop]);
            }
          }
        });
        
        return {
          isValid: errors.length === 0,
          errors,
          sanitizedConfig: errors.length === 0 ? sanitizedConfig : null
        };
      }
    };
  });
  
  describe('validateSlideContent', () => {
    it('should validate correct slide content', () => {
      const validContent = {
        type: 'text',
        content: 'Valid content text',
        style: { 
          fontSize: 24, 
          fontFamily: 'Arial',
          color: '#000000'
        },
        position: { x: 100, y: 200, width: 400, height: 100 }
      };
      
      const result = validator.validateSlideContent(validContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitizedContent.type).toBe('text');
      expect(result.sanitizedContent.content).toBe('Valid content text');
    });
    
    it('should reject invalid content types', () => {
      const invalidContent = {
        type: 'unsupported-type',
        content: 'Some content'
      };
      
      const result = validator.validateSlideContent(invalidContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content type');
    });
    
    it('should sanitize dangerous input', () => {
      const dangerousContent = {
        type: 'text',
        content: '<script>alert("xss")</script>Hello <b>World</b>',
        style: { fontSize: 24 }
      };
      
      const result = validator.validateSlideContent(dangerousContent);
      
      expect(result.sanitizedContent.content).not.toContain('<script>');
      expect(result.sanitizedContent.content).toBe('Hello World');
    });
    
    it('should validate font size ranges', () => {
      const invalidFontSize = {
        type: 'text',
        content: 'Test',
        style: { fontSize: 5 } // Too small
      };
      
      const result = validator.validateSlideContent(invalidFontSize);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Font size out of range');
    });
    
    it('should validate position boundaries', () => {
      const invalidPosition = {
        type: 'text',
        content: 'Test',
        position: { x: -100, y: 200 } // Negative x
      };
      
      const result = validator.validateSlideContent(invalidPosition);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('X position out of bounds');
    });

    it('should handle missing required fields', () => {
      const missingContent = {
        type: 'text'
        // Missing content field
      };
      
      const result = validator.validateSlideContent(missingContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text content is required and must be a string');
    });

    it('should validate image content correctly', () => {
      const validImage = {
        type: 'image',
        url: 'https://example.com/image.jpg',
        position: { x: 100, y: 100, width: 200, height: 150 }
      };
      
      const result = validator.validateSlideContent(validImage);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent.url).toBe('https://example.com/image.jpg');
    });

    it('should reject invalid image URLs', () => {
      const invalidImage = {
        type: 'image',
        url: 'not-a-valid-url'
      };
      
      const result = validator.validateSlideContent(invalidImage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid image URL format');
    });

    it('should handle null or undefined content', () => {
      expect(validator.validateSlideContent(null).isValid).toBe(false);
      expect(validator.validateSlideContent(undefined).isValid).toBe(false);
      expect(validator.validateSlideContent('string').isValid).toBe(false);
    });
  });
  
  describe('validateStyle', () => {
    it('should validate correct style properties', () => {
      const validStyle = {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#FF0000',
        bold: true,
        italic: false
      };
      
      const result = validator.validateStyle(validStyle);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedStyle.fontSize).toBe(24);
      expect(result.sanitizedStyle.color).toBe('#FF0000');
      expect(result.sanitizedStyle.bold).toBe(true);
    });

    it('should reject invalid font sizes', () => {
      const invalidStyles = [
        { fontSize: 5 },   // Too small
        { fontSize: 100 }, // Too large
        { fontSize: 'large' }, // Not a number
        { fontSize: -10 }  // Negative
      ];
      
      invalidStyles.forEach(style => {
        const result = validator.validateStyle(style);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Font size out of range');
      });
    });

    it('should reject invalid font families', () => {
      const invalidStyle = { fontFamily: 'InvalidFont' };
      
      const result = validator.validateStyle(invalidStyle);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid font family');
    });

    it('should reject invalid color formats', () => {
      const invalidColors = [
        { color: 'red' },        // Named color
        { color: '#GG0000' },    // Invalid hex
        { color: '#12345' },     // Wrong length
        { color: 'rgb(255,0,0)' } // RGB format
      ];
      
      invalidColors.forEach(style => {
        const result = validator.validateStyle(style);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid color format');
      });
    });

    it('should accept valid color formats', () => {
      const validColors = [
        { color: '#FF0000' },  // 6-digit hex
        { color: '#f00' },     // 3-digit hex
        { color: '#AbCdEf' }   // Mixed case
      ];
      
      validColors.forEach(style => {
        const result = validator.validateStyle(style);
        expect(result.isValid).toBe(true);
        expect(result.sanitizedStyle.color).toMatch(/^#[A-F0-9]+$/);
      });
    });

    it('should convert boolean properties correctly', () => {
      const style = {
        bold: 'true',  // String
        italic: 0      // Number
      };
      
      const result = validator.validateStyle(style);
      
      expect(result.sanitizedStyle.bold).toBe(true);
      expect(result.sanitizedStyle.italic).toBe(false);
    });

    it('should round fractional font sizes', () => {
      const style = { fontSize: 23.7 };
      
      const result = validator.validateStyle(style);
      
      expect(result.sanitizedStyle.fontSize).toBe(24);
    });
  });
  
  describe('validatePosition', () => {
    it('should validate correct position properties', () => {
      const validPosition = {
        x: 100,
        y: 200,
        width: 300,
        height: 150
      };
      
      const result = validator.validatePosition(validPosition);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPosition.x).toBe(100);
      expect(result.sanitizedPosition.y).toBe(200);
    });

    it('should reject negative coordinates', () => {
      const invalidPositions = [
        { x: -10 },
        { y: -5 },
        { x: -1, y: -1 }
      ];
      
      invalidPositions.forEach(position => {
        const result = validator.validatePosition(position);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject too small dimensions', () => {
      const invalidDimensions = [
        { width: 5 },   // Too small
        { height: 3 },  // Too small
        { width: 0 },   // Zero
        { height: -10 } // Negative
      ];
      
      invalidDimensions.forEach(position => {
        const result = validator.validatePosition(position);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject coordinates that are too large', () => {
      const position = { x: 15000, y: 15000 }; // Beyond limits
      
      const result = validator.validatePosition(position);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('X position out of bounds');
      expect(result.errors).toContain('Y position out of bounds');
    });

    it('should round fractional values', () => {
      const position = {
        x: 100.7,
        y: 200.3,
        width: 300.9,
        height: 150.1
      };
      
      const result = validator.validatePosition(position);
      
      expect(result.sanitizedPosition.x).toBe(101);
      expect(result.sanitizedPosition.y).toBe(200);
      expect(result.sanitizedPosition.width).toBe(301);
      expect(result.sanitizedPosition.height).toBe(150);
    });

    it('should handle partial position data', () => {
      const partialPosition = { x: 100 }; // Only x coordinate
      
      const result = validator.validatePosition(partialPosition);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPosition.x).toBe(100);
      expect(result.sanitizedPosition.y).toBeUndefined();
    });
  });
  
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = validator.sanitizeInput(input);
      
      expect(result).toBe('Hello World');
    });
    
    it('should handle null and undefined inputs', () => {
      expect(validator.sanitizeInput(null)).toBe('');
      expect(validator.sanitizeInput(undefined)).toBe('');
    });

    it('should escape dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = validator.sanitizeInput(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toBe('alert(&quot;xss&quot;)');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = validator.sanitizeInput(input);
      
      expect(result).toBe('Hello World');
    });

    it('should convert non-string inputs to strings', () => {
      expect(validator.sanitizeInput(123)).toBe('123');
      expect(validator.sanitizeInput(true)).toBe('true');
    });

    it('should handle complex HTML with script tags', () => {
      const input = '<div>Safe content</div><script>malicious()</script><p>More safe content</p>';
      const result = validator.sanitizeInput(input);
      
      expect(result).toBe('Safe contentMore safe content');
      expect(result).not.toContain('malicious');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org/path/to/file.jpg',
        'https://subdomain.example.com/image.png'
      ];
      
      validUrls.forEach(url => {
        expect(validator.isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        '',
        null,
        undefined
      ];
      
      invalidUrls.forEach(url => {
        expect(validator.isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('validatePresentationTitle', () => {
    it('should validate correct titles', () => {
      const result = validator.validatePresentationTitle('My Presentation');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTitle).toBe('My Presentation');
    });

    it('should reject empty titles', () => {
      const emptyTitles = ['', '   ', null, undefined];
      
      emptyTitles.forEach(title => {
        const result = validator.validatePresentationTitle(title);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'A'.repeat(101); // 101 characters
      const result = validator.validatePresentationTitle(longTitle);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title too long (max 100 characters)');
    });

    it('should sanitize title content', () => {
      const dirtyTitle = '<script>alert("xss")</script>My Title';
      const result = validator.validatePresentationTitle(dirtyTitle);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTitle).toBe('alert(&quot;xss&quot;)My Title');
    });
  });

  describe('validateLayoutConfig', () => {
    it('should validate correct layout configuration', () => {
      const validConfig = {
        type: 'double-column',
        margin: 60,
        columnGap: 40,
        itemSpacing: 15,
        maxItemsPerSlide: 8
      };
      
      const result = validator.validateLayoutConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedConfig.type).toBe('double-column');
      expect(result.sanitizedConfig.margin).toBe(60);
    });

    it('should reject invalid layout types', () => {
      const invalidConfig = { type: 'invalid-layout' };
      const result = validator.validateLayoutConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid layout type');
    });

    it('should reject negative numeric values', () => {
      const invalidConfig = {
        type: 'single-column',
        margin: -10
      };
      
      const result = validator.validateLayoutConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid margin: must be a non-negative number');
    });

    it('should round fractional numeric values', () => {
      const config = {
        type: 'single-column',
        margin: 60.7,
        itemSpacing: 15.3
      };
      
      const result = validator.validateLayoutConfig(config);
      
      expect(result.sanitizedConfig.margin).toBe(61);
      expect(result.sanitizedConfig.itemSpacing).toBe(15);
    });

    it('should handle partial configuration', () => {
      const partialConfig = { type: 'blank' };
      const result = validator.validateLayoutConfig(partialConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedConfig.type).toBe('blank');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle validation errors gracefully', () => {
      // Mock a validation function that throws
      const originalValidateStyle = validator.validateStyle;
      validator.validateStyle = () => {
        throw new Error('Validation failed');
      };
      
      const content = {
        type: 'text',
        content: 'Test',
        style: { fontSize: 24 }
      };
      
      const result = validator.validateSlideContent(content);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Validation error: Validation failed');
      
      // Restore original function
      validator.validateStyle = originalValidateStyle;
    });

    it('should handle circular references in validation', () => {
      const circularContent = {
        type: 'text',
        content: 'Test'
      };
      circularContent.self = circularContent;
      
      // Should not throw an error
      expect(() => validator.validateSlideContent(circularContent)).not.toThrow();
    });

    it('should handle very large inputs', () => {
      const largeContent = {
        type: 'text',
        content: 'A'.repeat(10000), // Very long content
        style: { fontSize: 24 }
      };
      
      const result = validator.validateSlideContent(largeContent);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent.content.length).toBe(10000);
    });
  });
});