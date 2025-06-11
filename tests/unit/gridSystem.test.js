/**
 * GridSystem Unit Tests
 * Comprehensive testing for advanced grid system functionality
 */

const GridSystem = require('../../src/services/gridSystem');

describe('GridSystem', () => {
  let gridSystem;

  beforeEach(() => {
    gridSystem = new GridSystem();
  });

  describe('Advanced Grid Creation', () => {
    test('should create basic grid with default settings', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 12
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.width).toBe(1920);
      expect(grid.height).toBe(1080);
      expect(grid.columns).toBe(12);
      expect(grid.columnWidth).toBeGreaterThan(0);
      expect(typeof grid.getGridPosition).toBe('function');
      expect(typeof grid.getColumnSpan).toBe('function');
    });

    test('should handle custom grid areas', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 12,
        areas: {
          header: '1 / 1 / 2 / 13',
          main: '2 / 1 / 6 / 10',
          sidebar: '2 / 10 / 6 / 13'
        }
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.gridAreas).toHaveProperty('header');
      expect(grid.gridAreas).toHaveProperty('main');
      expect(grid.gridAreas).toHaveProperty('sidebar');
      
      expect(grid.gridAreas.header.rowStart).toBe(1);
      expect(grid.gridAreas.header.colStart).toBe(1);
      expect(grid.gridAreas.header.rowEnd).toBe(2);
      expect(grid.gridAreas.header.colEnd).toBe(13);
    });

    test('should calculate content dimensions correctly', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 12,
        gap: 20,
        margins: { top: 40, right: 60, bottom: 40, left: 60 }
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.contentWidth).toBe(1800); // 1920 - 60 - 60
      expect(grid.contentHeight).toBe(1000); // 1080 - 40 - 40
      expect(grid.columnWidth).toBe(130); // (1800 - 220) / 12
    });
  });

  describe('Grid Area Parsing', () => {
    test('should parse CSS Grid-like area definitions', () => {
      const areas = {
        header: '1 / 1 / 2 / 13',
        sidebar: '2 / 1 / 6 / 4',
        main: '2 / 4 / 6 / 13'
      };

      const parsed = gridSystem.parseGridAreas(areas);

      expect(parsed.header).toEqual({
        rowStart: 1, colStart: 1, rowEnd: 2, colEnd: 13
      });
      expect(parsed.sidebar).toEqual({
        rowStart: 2, colStart: 1, rowEnd: 6, colEnd: 4
      });
      expect(parsed.main).toEqual({
        rowStart: 2, colStart: 4, rowEnd: 6, colEnd: 13
      });
    });

    test('should handle invalid area definitions gracefully', () => {
      const areas = {
        valid: '1 / 1 / 2 / 3',
        invalid: '1 / 1 / 2', // Missing fourth value
        empty: ''
      };

      const parsed = gridSystem.parseGridAreas(areas);

      expect(parsed).toHaveProperty('valid');
      expect(parsed).not.toHaveProperty('invalid');
      expect(parsed).not.toHaveProperty('empty');
    });

    test('should return empty object for null areas', () => {
      const parsed = gridSystem.parseGridAreas(null);
      expect(parsed).toEqual({});
    });
  });

  describe('Position Calculations', () => {
    test('should calculate grid position correctly', () => {
      const area = { rowStart: 1, colStart: 1, rowEnd: 3, colEnd: 5 };
      const columnWidth = 100;
      const gap = 10;
      const margins = { top: 20, left: 30 };

      const position = gridSystem.calculateGridPosition(area, columnWidth, gap, margins);

      expect(position.x).toBe(30); // left margin
      expect(position.width).toBe(430); // 4 columns + 3 gaps
      expect(position.y).toBe(20); // top margin
      expect(position.height).toBe(220); // 2 rows + 1 gap
    });

    test('should calculate column span correctly', () => {
      const columnWidth = 100;
      const gap = 10;

      const singleSpan = gridSystem.calculateColumnSpan(1, 2, columnWidth, gap);
      expect(singleSpan.width).toBe(100);
      expect(singleSpan.spanCount).toBe(1);

      const tripleSpan = gridSystem.calculateColumnSpan(2, 5, columnWidth, gap);
      expect(tripleSpan.width).toBe(320); // 3 columns + 2 gaps
      expect(tripleSpan.spanCount).toBe(3);
    });

    test('should calculate row span correctly', () => {
      const contentHeight = 600;
      const totalRows = 6;

      const singleRow = gridSystem.calculateRowSpan(1, 2, contentHeight, totalRows);
      expect(singleRow.height).toBe(100); // 600 / 6
      expect(singleRow.spanCount).toBe(1);

      const doubleRow = gridSystem.calculateRowSpan(2, 4, contentHeight, totalRows);
      expect(doubleRow.height).toBe(200); // 2 * 100
      expect(doubleRow.spanCount).toBe(2);
    });
  });

  describe('Responsive Configuration', () => {
    test('should determine correct breakpoint for width', () => {
      const mobileConfig = gridSystem.getResponsiveConfiguration(480);
      expect(mobileConfig.breakpoint).toBe('mobile');
      expect(mobileConfig.columns).toBe(1);

      const tabletConfig = gridSystem.getResponsiveConfiguration(800);
      expect(tabletConfig.breakpoint).toBe('tablet');
      expect(tabletConfig.columns).toBe(2);

      const desktopConfig = gridSystem.getResponsiveConfiguration(1200);
      expect(desktopConfig.breakpoint).toBe('desktop');
      expect(desktopConfig.columns).toBe(3);
    });

    test('should adapt grid to mobile breakpoint', () => {
      const originalConfig = {
        columns: 4,
        areas: {
          header: '1 / 1 / 2 / 5',
          main: '2 / 1 / 6 / 3',
          sidebar: '2 / 3 / 6 / 5'
        }
      };

      const mobileConfig = gridSystem.adaptGridToBreakpoint(
        { key: 'mobile' }, 
        originalConfig
      );

      expect(mobileConfig.columns).toBe(1);
      expect(mobileConfig.areas.header).toBe('1 / 1 / 2 / 2');
      expect(mobileConfig.areas.main).toBe('2 / 1 / 3 / 2');
      expect(mobileConfig.areas.sidebar).toBe('3 / 1 / 4 / 2');
    });

    test('should preserve desktop layout for large screens', () => {
      const originalConfig = {
        columns: 4,
        areas: {
          header: '1 / 1 / 2 / 5',
          main: '2 / 1 / 6 / 3',
          sidebar: '2 / 3 / 6 / 5'
        }
      };

      const desktopConfig = gridSystem.adaptGridToBreakpoint(
        { key: 'desktop' }, 
        originalConfig
      );

      expect(desktopConfig.areas).toEqual(originalConfig.areas);
    });
  });

  describe('Layout Templates', () => {
    test('should provide predefined layout templates', () => {
      const templates = gridSystem.getLayoutTemplates();

      expect(templates).toHaveProperty('hero-content');
      expect(templates).toHaveProperty('sidebar-main');
      expect(templates).toHaveProperty('three-section');
      expect(templates).toHaveProperty('feature-showcase');

      expect(templates['hero-content'].areas).toHaveProperty('hero');
      expect(templates['hero-content'].areas).toHaveProperty('content');
    });

    test('should include template descriptions', () => {
      const templates = gridSystem.getLayoutTemplates();

      Object.values(templates).forEach(template => {
        expect(template).toHaveProperty('description');
        expect(typeof template.description).toBe('string');
        expect(template.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Grid Validation', () => {
    test('should validate valid grid configuration', () => {
      const validConfig = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 12,
        areas: {
          header: '1 / 1 / 2 / 13',
          main: '2 / 1 / 6 / 13'
        }
      };

      const validation = gridSystem.validateGridConfig(validConfig);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidConfig = {
        columns: 12
        // Missing slideDimensions
      };

      const validation = gridSystem.validateGridConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('slideDimensions is required');
    });

    test('should warn about unusual column counts', () => {
      const warningConfig = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 30 // Unusual column count
      };

      const validation = gridSystem.validateGridConfig(warningConfig);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('Column count should be between 1 and 24');
    });

    test('should detect invalid area definitions', () => {
      const invalidConfig = {
        slideDimensions: { width: 1920, height: 1080 },
        areas: {
          header: '1 / 1 / 2', // Missing fourth value
          main: 'invalid format'
        }
      };

      const validation = gridSystem.validateGridConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero dimensions gracefully', () => {
      const config = {
        slideDimensions: { width: 0, height: 0 },
        columns: 12
      };

      expect(() => {
        gridSystem.createAdvancedGrid(config);
      }).not.toThrow();
    });

    test('should handle single column grid', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 1
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.columns).toBe(1);
      expect(grid.columnWidth).toBe(grid.contentWidth);
    });

    test('should handle very large column count', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 100
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.columns).toBe(100);
      expect(grid.columnWidth).toBeGreaterThan(0);
    });

    test('should handle empty areas object', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        areas: {}
      };

      const grid = gridSystem.createAdvancedGrid(config);

      expect(grid.gridAreas).toEqual({});
    });
  });

  describe('Performance Considerations', () => {
    test('should handle complex grid configurations efficiently', () => {
      const complexConfig = {
        slideDimensions: { width: 3840, height: 2160 }, // 4K resolution
        columns: 24,
        areas: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [
            `area${i}`,
            `${i + 1} / 1 / ${i + 2} / 25`
          ])
        )
      };

      const startTime = Date.now();
      const grid = gridSystem.createAdvancedGrid(complexConfig);
      const endTime = Date.now();

      expect(grid.gridAreas).toBeDefined();
      expect(Object.keys(grid.gridAreas)).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should provide consistent results across multiple calls', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        columns: 12,
        gap: 16
      };

      const grid1 = gridSystem.createAdvancedGrid(config);
      const grid2 = gridSystem.createAdvancedGrid(config);

      expect(grid1.columnWidth).toBe(grid2.columnWidth);
      expect(grid1.contentWidth).toBe(grid2.contentWidth);
      expect(grid1.contentHeight).toBe(grid2.contentHeight);
    });
  });
});