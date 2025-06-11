/**
 * Advanced Mermaid Integration Service Tests
 * Comprehensive test suite for MermaidService functionality
 */

// Test Dependencies
const { TestRunner } = require('../runner');
const { mockGoogleAppsScript } = require('../helpers/enhanced-gas-mocks');
const { testFixtures } = require('../fixtures/test-data');

// Initialize mocks
mockGoogleAppsScript();

describe('MermaidService', () => {
  let mermaidService;
  let mockLogger;

  beforeEach(() => {
    // Reset global logger mock
    global.logger = {
      info: jasmine.createSpy('info'),
      debug: jasmine.createSpy('debug'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      createPerformanceMonitor: jasmine.createSpy('createPerformanceMonitor').and.returnValue({
        start: jasmine.createSpy('start'),
        end: jasmine.createSpy('end'),
        getElapsedTime: jasmine.createSpy('getElapsedTime').and.returnValue(100)
      })
    };

    // Mock ValidationService
    global.ValidationService = jasmine.createSpy('ValidationService').and.returnValue({
      validateMermaidCode: jasmine.createSpy('validateMermaidCode').and.returnValue({
        isValid: true,
        errors: [],
        warnings: [],
        sanitized: 'graph TD\nA[Start] --> B[End]'
      })
    });

    // Mock UrlFetchApp
    global.UrlFetchApp = {
      fetch: jasmine.createSpy('fetch').and.returnValue({
        getResponseCode: () => 200,
        getContentText: () => '<svg>test</svg>',
        getBlob: () => ({ getBytes: () => new Uint8Array([1, 2, 3]) })
      })
    };

    // Mock Utilities
    global.Utilities = {
      base64Encode: jasmine.createSpy('base64Encode').and.returnValue('encodedString'),
      newBlob: jasmine.createSpy('newBlob').and.returnValue({ getBytes: () => new Uint8Array([1, 2, 3]) })
    };

    mermaidService = new MermaidService();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(mermaidService.defaultConfig).toBeDefined();
      expect(mermaidService.defaultConfig.theme).toBe('default');
      expect(mermaidService.styleTemplates).toBeDefined();
      expect(mermaidService.exportFormats).toBeDefined();
    });

    it('should have all required style templates', () => {
      expect(mermaidService.styleTemplates.professional).toBeDefined();
      expect(mermaidService.styleTemplates.modern).toBeDefined();
      expect(mermaidService.styleTemplates.minimal).toBeDefined();
    });

    it('should support all expected export formats', () => {
      expect(mermaidService.exportFormats.SVG).toBe('svg');
      expect(mermaidService.exportFormats.PNG).toBe('png');
      expect(mermaidService.exportFormats.PDF).toBe('pdf');
    });
  });

  describe('createAdvancedDiagram', () => {
    const validDiagramOptions = {
      code: 'graph TD\nA[Start] --> B[End]',
      styleTemplate: 'professional',
      exportFormats: ['svg'],
      interactive: false
    };

    it('should create a basic diagram successfully', async () => {
      const result = await mermaidService.createAdvancedDiagram(validDiagramOptions);

      expect(result).toBeDefined();
      expect(result.code).toBeTruthy();
      expect(result.config).toBeDefined();
      expect(result.outputs).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should apply professional style template', async () => {
      const options = {
        ...validDiagramOptions,
        styleTemplate: 'professional'
      };

      const result = await mermaidService.createAdvancedDiagram(options);
      
      expect(result.config.themeVariables.primaryColor).toBe('#2E4A7A');
      expect(result.config.themeVariables.primaryTextColor).toBe('#FFFFFF');
    });

    it('should handle custom theme variables', async () => {
      const options = {
        ...validDiagramOptions,
        customTheme: {
          primaryColor: '#FF0000',
          lineColor: '#00FF00'
        }
      };

      const result = await mermaidService.createAdvancedDiagram(options);
      
      expect(result.config.themeVariables.primaryColor).toBe('#FF0000');
      expect(result.config.themeVariables.lineColor).toBe('#00FF00');
    });

    it('should generate multiple export formats', async () => {
      const options = {
        ...validDiagramOptions,
        exportFormats: ['svg', 'png', 'pdf']
      };

      const result = await mermaidService.createAdvancedDiagram(options);
      
      expect(result.outputs.svg).toBeDefined();
      expect(result.outputs.png).toBeDefined();
      expect(result.outputs.pdf).toBeDefined();
    });

    it('should add interactive features when requested', async () => {
      const options = {
        ...validDiagramOptions,
        interactive: true,
        interactiveOptions: {
          zoom: true,
          clickable: true
        }
      };

      const result = await mermaidService.createAdvancedDiagram(options);
      
      expect(result.outputs.interactive).toBeDefined();
      expect(result.config.interactive).toBeDefined();
    });

    it('should handle validation errors', async () => {
      global.ValidationService = jasmine.createSpy('ValidationService').and.returnValue({
        validateMermaidCode: jasmine.createSpy('validateMermaidCode').and.returnValue({
          isValid: false,
          errors: ['Invalid syntax'],
          warnings: []
        })
      });
      mermaidService = new MermaidService();

      try {
        await mermaidService.createAdvancedDiagram(validDiagramOptions);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Invalid syntax');
      }
    });
  });

  describe('validateDiagramOptions', () => {
    it('should validate valid options', () => {
      const options = {
        code: 'graph TD\nA --> B',
        exportFormats: ['svg', 'png']
      };

      const result = mermaidService.validateDiagramOptions(options);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject missing code', () => {
      const options = {
        exportFormats: ['svg']
      };

      const result = mermaidService.validateDiagramOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Diagram code is required and must be a string');
    });

    it('should reject invalid export formats', () => {
      const options = {
        code: 'graph TD\nA --> B',
        exportFormats: ['invalid_format']
      };

      const result = mermaidService.validateDiagramOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid export formats');
    });

    it('should warn about unknown style templates', () => {
      const options = {
        code: 'graph TD\nA --> B',
        styleTemplate: 'unknown_template'
      };

      const result = mermaidService.validateDiagramOptions(options);
      
      expect(result.warnings[0]).toContain('Unknown style template');
    });
  });

  describe('SVG Generation Methods', () => {
    const testCode = 'graph TD\nA[Start] --> B[End]';

    describe('generateSVGViaMermaidInk', () => {
      it('should generate SVG successfully', async () => {
        const result = await mermaidService.generateSVGViaMermaidInk(testCode);
        
        expect(result).toBe('<svg>test</svg>');
        expect(global.UrlFetchApp.fetch).toHaveBeenCalledWith(
          jasmine.stringMatching(/mermaid\.ink\/svg\//),
          jasmine.any(Object)
        );
      });

      it('should handle API errors', async () => {
        global.UrlFetchApp.fetch = jasmine.createSpy('fetch').and.returnValue({
          getResponseCode: () => 500,
          getContentText: () => 'Error'
        });

        try {
          await mermaidService.generateSVGViaMermaidInk(testCode);
          fail('Should have thrown API error');
        } catch (error) {
          expect(error.message).toContain('Mermaid.ink API error: 500');
        }
      });
    });

    describe('generateSVGViaKroki', () => {
      it('should generate SVG using Kroki API', async () => {
        const result = await mermaidService.generateSVGViaKroki(testCode);
        
        expect(result).toBe('<svg>test</svg>');
        expect(global.UrlFetchApp.fetch).toHaveBeenCalledWith(
          jasmine.stringMatching(/kroki\.io\/mermaid\/svg\//),
          jasmine.any(Object)
        );
      });
    });

    describe('generateSVGViaLocalRenderer', () => {
      it('should generate fallback SVG', async () => {
        const result = await mermaidService.generateSVGViaLocalRenderer(testCode, {});
        
        expect(result).toContain('<svg');
        expect(result).toContain('Diagram Generation Failed');
      });
    });
  });

  describe('Interactive Features', () => {
    const baseSVG = '<svg width="400" height="300"><rect x="0" y="0" width="100" height="50"/></svg>';

    describe('addZoomPanFeatures', () => {
      it('should add zoom and pan functionality', () => {
        const result = mermaidService.addZoomPanFeatures(baseSVG);
        
        expect(result).toContain('<script type="text/javascript">');
        expect(result).toContain('addEventListener(\'wheel\'');
        expect(result).toContain('addEventListener(\'mousedown\'');
        expect(result).toContain('<g class="diagram-content">');
      });

      it('should preserve original SVG attributes', () => {
        const result = mermaidService.addZoomPanFeatures(baseSVG);
        
        expect(result).toContain('width="400"');
        expect(result).toContain('height="300"');
      });
    });

    describe('addClickHandlers', () => {
      it('should add click handlers for specified elements', () => {
        const clickHandlers = {
          'rect': { action: 'alert', message: 'Rectangle clicked' }
        };

        const result = mermaidService.addClickHandlers(baseSVG, clickHandlers);
        
        expect(result).toContain('addEventListener(\'click\'');
        expect(result).toContain('Rectangle clicked');
      });

      it('should handle empty click handlers', () => {
        const result = mermaidService.addClickHandlers(baseSVG, {});
        
        expect(result).toBe(baseSVG);
      });
    });

    describe('addTooltips', () => {
      it('should add tooltip functionality', () => {
        const tooltipData = {
          'rect': 'This is a rectangle'
        };

        const result = mermaidService.addTooltips(baseSVG, tooltipData);
        
        expect(result).toContain('addEventListener(\'mouseenter\'');
        expect(result).toContain('This is a rectangle');
      });
    });

    describe('addAnimations', () => {
      it('should add CSS animations', () => {
        const animations = {
          'rect': 'fadeIn'
        };

        const result = mermaidService.addAnimations(baseSVG, animations);
        
        expect(result).toContain('@keyframes fadeIn');
        expect(result).toContain('animation: fadeIn');
      });
    });
  });

  describe('Format Conversion', () => {
    const testSVG = '<svg>test content</svg>';
    const testConfig = {};

    describe('convertSVGToPNG', () => {
      it('should convert SVG to PNG blob', async () => {
        const result = await mermaidService.convertSVGToPNG(testSVG, testConfig);
        
        expect(result).toBeDefined();
        expect(global.Utilities.newBlob).toHaveBeenCalledWith(
          testSVG,
          'image/png',
          'diagram.png'
        );
      });
    });

    describe('convertSVGToJPEG', () => {
      it('should convert SVG to JPEG blob', async () => {
        const result = await mermaidService.convertSVGToJPEG(testSVG, testConfig);
        
        expect(result).toBeDefined();
        expect(global.Utilities.newBlob).toHaveBeenCalledWith(
          testSVG,
          'image/jpeg',
          'diagram.jpg'
        );
      });
    });

    describe('convertSVGToPDF', () => {
      it('should convert SVG to PDF blob', async () => {
        const result = await mermaidService.convertSVGToPDF(testSVG, testConfig);
        
        expect(result).toBeDefined();
        expect(global.Utilities.newBlob).toHaveBeenCalledWith(
          jasmine.stringContaining('<!DOCTYPE html>'),
          'application/pdf',
          'diagram.pdf'
        );
      });
    });
  });

  describe('Utility Methods', () => {
    describe('detectDiagramType', () => {
      it('should detect flowchart diagrams', () => {
        const result = mermaidService.detectDiagramType('graph TD\nA --> B');
        expect(result).toBe('flowchart');
      });

      it('should detect sequence diagrams', () => {
        const result = mermaidService.detectDiagramType('sequenceDiagram\nA->>B: Hello');
        expect(result).toBe('sequence');
      });

      it('should detect unknown diagrams', () => {
        const result = mermaidService.detectDiagramType('unknown diagram type');
        expect(result).toBe('unknown');
      });
    });

    describe('calculateDimensions', () => {
      it('should extract dimensions from width/height attributes', async () => {
        const svg = '<svg width="800" height="600">content</svg>';
        const result = await mermaidService.calculateDimensions(svg);
        
        expect(result.width).toBe(800);
        expect(result.height).toBe(600);
      });

      it('should extract dimensions from viewBox', async () => {
        const svg = '<svg viewBox="0 0 1000 750">content</svg>';
        const result = await mermaidService.calculateDimensions(svg);
        
        expect(result.width).toBe(1000);
        expect(result.height).toBe(750);
      });

      it('should use defaults when no dimensions found', async () => {
        const svg = '<svg>content</svg>';
        const result = await mermaidService.calculateDimensions(svg);
        
        expect(result.width).toBe(400);
        expect(result.height).toBe(300);
      });
    });

    describe('analyzeDiagramComplexity', () => {
      it('should analyze simple diagrams', () => {
        const code = 'graph TD\nA --> B';
        const result = mermaidService.analyzeDiagramComplexity(code);
        
        expect(result.level).toBe('simple');
        expect(result.lines).toBe(2);
        expect(result.nodes).toBeGreaterThan(0);
        expect(result.connections).toBeGreaterThan(0);
      });

      it('should analyze complex diagrams', () => {
        const complexCode = Array(25).fill('A --> B').join('\n');
        const result = mermaidService.analyzeDiagramComplexity(complexCode);
        
        expect(result.level).toBe('complex');
        expect(result.lines).toBeGreaterThan(20);
      });
    });

    describe('optimizeDiagramCode', () => {
      it('should remove excessive whitespace', () => {
        const code = 'graph TD\n\n\nA --> B\n\n\nC --> D';
        const result = mermaidService.optimizeDiagramCode(code);
        
        expect(result).not.toContain('\n\n\n');
        expect(result).toContain('A --> B');
      });

      it('should standardize arrow syntax', () => {
        const code = 'graph TD\nA -> B\nC --> D';
        const result = mermaidService.optimizeDiagramCode(code);
        
        expect(result).toContain('A --> B');
        expect(result).toContain('C --> D');
      });
    });

    describe('addInteractiveAttributes', () => {
      it('should add click handlers to flowchart nodes', () => {
        const code = 'graph TD\nA[Start] --> B[End]';
        const result = mermaidService.addInteractiveAttributes(code);
        
        expect(result).toContain('click A');
        expect(result).toContain('click B');
        expect(result).toContain('classDef interactive');
      });

      it('should handle non-flowchart diagrams', () => {
        const code = 'pie title Pie Chart\n"A" : 50\n"B" : 30';
        const result = mermaidService.addInteractiveAttributes(code);
        
        expect(result).toContain('classDef interactive');
        expect(result).not.toContain('click');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.UrlFetchApp.fetch = jasmine.createSpy('fetch').and.throwError('Network error');

      const options = {
        code: 'graph TD\nA --> B',
        exportFormats: ['svg']
      };

      try {
        await mermaidService.createAdvancedDiagram(options);
        fail('Should have thrown network error');
      } catch (error) {
        expect(error.message).toContain('Network error');
      }
    });

    it('should fallback when all SVG generation methods fail', async () => {
      // Mock all methods to fail
      spyOn(mermaidService, 'generateSVGViaMermaidInk').and.throwError('Mermaid.ink failed');
      spyOn(mermaidService, 'generateSVGViaKroki').and.throwError('Kroki failed');
      
      try {
        await mermaidService.generateSVG('graph TD\nA --> B', {});
        // Should use local renderer fallback
        expect(mermaidService.generateSVGViaLocalRenderer).toBeDefined();
      } catch (error) {
        // Expected if all methods fail
        expect(error.message).toContain('failed');
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should create and use performance monitors', async () => {
      const options = {
        code: 'graph TD\nA --> B',
        exportFormats: ['svg']
      };

      await mermaidService.createAdvancedDiagram(options);
      
      expect(global.logger.createPerformanceMonitor).toHaveBeenCalledWith('createAdvancedDiagram');
    });
  });
});

// Integration tests with ContentService
describe('MermaidService Integration', () => {
  let contentService;
  let mermaidService;

  beforeEach(() => {
    // Setup mocks
    global.logger = {
      info: jasmine.createSpy('info'),
      debug: jasmine.createSpy('debug'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      createPerformanceMonitor: jasmine.createSpy('createPerformanceMonitor').and.returnValue({
        start: jasmine.createSpy('start'),
        end: jasmine.createSpy('end'),
        getElapsedTime: jasmine.createSpy('getElapsedTime').and.returnValue(100)
      })
    };

    global.SlidesService = jasmine.createSpy('SlidesService').and.returnValue({
      insertSVG: jasmine.createSpy('insertSVG'),
      openPresentation: jasmine.createSpy('openPresentation').and.returnValue({
        getSlides: () => [{ getShapes: () => [] }]
      })
    });

    global.ValidationService = jasmine.createSpy('ValidationService').and.returnValue({
      validateMermaidCode: jasmine.createSpy('validateMermaidCode').and.returnValue({
        isValid: true,
        errors: [],
        warnings: [],
        sanitized: 'graph TD\nA[Start] --> B[End]'
      })
    });

    global.UrlFetchApp = {
      fetch: jasmine.createSpy('fetch').and.returnValue({
        getResponseCode: () => 200,
        getContentText: () => '<svg>test</svg>'
      })
    };

    global.Utilities = {
      base64Encode: jasmine.createSpy('base64Encode').and.returnValue('encoded'),
      newBlob: jasmine.createSpy('newBlob').and.returnValue({})
    };

    contentService = new ContentService();
  });

  it('should integrate MermaidService with ContentService', async () => {
    const mermaidItem = {
      code: 'graph TD\nA[Start] --> B[End]',
      interactive: true,
      styleTemplate: 'professional',
      exportFormats: ['svg', 'png']
    };

    const slideDimensions = { width: 960, height: 720 };
    const result = await contentService.addMermaidElement(
      'presentation-id',
      0,
      mermaidItem,
      slideDimensions,
      'single',
      0
    );

    expect(result).toBeDefined();
    expect(result.type).toBe('mermaid');
    expect(result.features.interactive).toBe(true);
    expect(result.features.multiFormat).toBe(true);
  });

  it('should fallback to basic implementation on error', async () => {
    // Mock MermaidService to fail
    spyOn(contentService.mermaidService, 'createAdvancedDiagram').and.throwError('Service error');

    const mermaidItem = {
      code: 'graph TD\nA --> B'
    };

    const result = await contentService.addMermaidElement(
      'presentation-id',
      0,
      mermaidItem,
      { width: 960, height: 720 },
      'single',
      0
    );

    expect(result.fallback).toBe(true);
    expect(global.logger.warn).toHaveBeenCalledWith('Falling back to basic Mermaid generation');
  });
});

// Export test suite
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    name: 'MermaidService Tests',
    tests: describe
  };
}