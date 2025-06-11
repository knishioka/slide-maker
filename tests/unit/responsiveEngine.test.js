/**
 * ResponsiveEngine Unit Tests
 * Comprehensive testing for responsive design and breakpoint management
 */

const ResponsiveEngine = require('../../src/services/responsiveEngine');

describe('ResponsiveEngine', () => {
  let responsiveEngine;

  beforeEach(() => {
    responsiveEngine = new ResponsiveEngine();
  });

  describe('Breakpoint Detection', () => {
    test('should detect extra small breakpoint', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(320, 568);
      
      expect(breakpoint.key).toBe('xs');
      expect(breakpoint.label).toBe('Extra Small');
      expect(breakpoint.columns).toBe(1);
      expect(breakpoint.fontSize).toBe(0.7);
    });

    test('should detect small breakpoint', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(600, 400);
      
      expect(breakpoint.key).toBe('sm');
      expect(breakpoint.label).toBe('Small');
      expect(breakpoint.columns).toBe(1);
      expect(breakpoint.fontSize).toBe(0.8);
    });

    test('should detect medium breakpoint', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(900, 600);
      
      expect(breakpoint.key).toBe('md');
      expect(breakpoint.label).toBe('Medium');
      expect(breakpoint.columns).toBe(2);
      expect(breakpoint.fontSize).toBe(0.9);
    });

    test('should detect large breakpoint', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(1200, 800);
      
      expect(breakpoint.key).toBe('lg');
      expect(breakpoint.label).toBe('Large');
      expect(breakpoint.columns).toBe(3);
      expect(breakpoint.fontSize).toBe(1.0);
    });

    test('should detect extra large breakpoint', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(1600, 1200);
      
      expect(breakpoint.key).toBe('xl');
      expect(breakpoint.label).toBe('Extra Large');
      expect(breakpoint.columns).toBe(4);
      expect(breakpoint.fontSize).toBe(1.1);
    });

    test('should include aspect ratio in breakpoint info', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(1920, 1080);
      
      expect(breakpoint.aspectRatio).toBeCloseTo(1.78, 2); // 16:9 ratio
    });

    test('should default to medium for edge cases', () => {
      const breakpoint = responsiveEngine.getCurrentBreakpoint(0, 0);
      
      expect(breakpoint.key).toBe('md');
    });
  });

  describe('Responsive Layout Creation', () => {
    test('should create responsive layout with adaptations', () => {
      const baseConfig = {
        columns: 4,
        gap: 20,
        margins: { top: 40, right: 60, bottom: 40, left: 60 },
        areas: {
          header: '1 / 1 / 2 / 5',
          main: '2 / 1 / 6 / 4',
          sidebar: '2 / 4 / 6 / 5'
        }
      };
      
      const slideDimensions = { width: 768, height: 432 }; // Small screen
      
      const responsiveLayout = responsiveEngine.createResponsiveLayout(baseConfig, slideDimensions);
      
      expect(responsiveLayout.breakpoint.key).toBe('sm');
      expect(responsiveLayout.responsive.columns).toBe(1);
      expect(responsiveLayout.adaptedConfig.columns).toBe(1);
    });

    test('should preserve large screen layouts', () => {
      const baseConfig = {
        columns: 4,
        gap: 20,
        areas: {
          header: '1 / 1 / 2 / 5',
          main: '2 / 1 / 6 / 4',
          sidebar: '2 / 4 / 6 / 5'
        }
      };
      
      const slideDimensions = { width: 1920, height: 1080 }; // Large screen
      
      const responsiveLayout = responsiveEngine.createResponsiveLayout(baseConfig, slideDimensions);
      
      expect(responsiveLayout.breakpoint.key).toBe('xl');
      expect(responsiveLayout.adaptedConfig.columns).toBe(4);
      expect(responsiveLayout.adaptedConfig.areas).toEqual(baseConfig.areas);
    });

    test('should include scaling factors', () => {
      const baseConfig = { columns: 2 };
      const slideDimensions = { width: 1200, height: 800 };
      
      const responsiveLayout = responsiveEngine.createResponsiveLayout(baseConfig, slideDimensions);
      
      expect(responsiveLayout.scalingFactors).toBeDefined();
      expect(responsiveLayout.scalingFactors.fontSize).toBeGreaterThan(0);
      expect(responsiveLayout.scalingFactors.spacing).toBeGreaterThan(0);
      expect(responsiveLayout.scalingFactors.contentDensity).toBeGreaterThan(0);
    });
  });

  describe('Scaling Factor Calculations', () => {
    test('should calculate proper scaling for different dimensions', () => {
      const breakpoint = { key: 'lg', fontSize: 1.0, spacing: 1.0, margins: 1.0 };
      const standardDimensions = { width: 1920, height: 1080 };
      
      const standardFactors = responsiveEngine.calculateScalingFactors(breakpoint, {});
      
      expect(standardFactors.uniform).toBeCloseTo(1.0, 2);
      expect(standardFactors.fontSize).toBeCloseTo(1.0, 2);
      
      // Test smaller dimensions
      const smallBreakpoint = { key: 'sm', fontSize: 0.8, spacing: 0.9, margins: 0.8 };
      const smallFactors = responsiveEngine.calculateScalingFactors(smallBreakpoint, {});
      
      expect(smallFactors.fontSize).toBeLessThan(standardFactors.fontSize);
    });

    test('should apply content density adjustments', () => {
      const lowDensityBreakpoint = { key: 'xs' };
      const highDensityBreakpoint = { key: 'xl' };
      
      const lowFactors = responsiveEngine.calculateScalingFactors(lowDensityBreakpoint, {});
      const highFactors = responsiveEngine.calculateScalingFactors(highDensityBreakpoint, {});
      
      expect(lowFactors.contentDensity).toBe(0.7);
      expect(highFactors.contentDensity).toBe(1.3);
    });
  });

  describe('Grid Area Redistribution', () => {
    test('should redistribute areas for single column layout', () => {
      const originalAreas = {
        header: '1 / 1 / 2 / 13',
        left: '2 / 1 / 6 / 7',
        right: '2 / 7 / 6 / 13'
      };
      
      const redistributed = responsiveEngine.redistributeGridAreas(originalAreas, 1);
      
      expect(redistributed.header).toBe('1 / 1 / 2 / 2');
      expect(redistributed.left).toBe('2 / 1 / 3 / 2');
      expect(redistributed.right).toBe('3 / 1 / 4 / 2');
    });

    test('should redistribute areas for two column layout', () => {
      const originalAreas = {
        header: '1 / 1 / 2 / 13',
        item1: '2 / 1 / 4 / 5',
        item2: '2 / 5 / 4 / 9',
        item3: '2 / 9 / 4 / 13',
        footer: '4 / 1 / 5 / 13'
      };
      
      const redistributed = responsiveEngine.redistributeGridAreas(originalAreas, 2);
      
      // Check that items are distributed between two columns
      expect(redistributed.header).toBe('1 / 1 / 2 / 2'); // Left column
      expect(redistributed.item1).toBe('2 / 2 / 3 / 3'); // Right column
      expect(redistributed.item2).toBe('2 / 1 / 3 / 2'); // Left column
    });

    test('should preserve areas for three or more columns', () => {
      const originalAreas = {
        header: '1 / 1 / 2 / 13',
        main: '2 / 1 / 6 / 10',
        sidebar: '2 / 10 / 6 / 13'
      };
      
      const redistributed = responsiveEngine.redistributeGridAreas(originalAreas, 3);
      
      expect(redistributed).toEqual(originalAreas);
    });
  });

  describe('Spacing Scaling', () => {
    test('should scale numeric spacing values', () => {
      const baseSpacing = {
        margin: 20,
        padding: 10,
        gap: 16
      };
      
      const scaled = responsiveEngine.scaleSpacing(baseSpacing, 0.8);
      
      expect(scaled.margin).toBe(16);
      expect(scaled.padding).toBe(8);
      expect(scaled.gap).toBe(13); // Rounded
    });

    test('should scale nested spacing objects', () => {
      const baseSpacing = {
        margins: {
          top: 20,
          right: 30,
          bottom: 20,
          left: 30
        },
        gaps: {
          row: 16,
          column: 12
        }
      };
      
      const scaled = responsiveEngine.scaleSpacing(baseSpacing, 1.5);
      
      expect(scaled.margins.top).toBe(30);
      expect(scaled.margins.right).toBe(45);
      expect(scaled.gaps.row).toBe(24);
      expect(scaled.gaps.column).toBe(18);
    });

    test('should preserve non-numeric values', () => {
      const baseSpacing = {
        margin: 20,
        unit: 'px',
        auto: 'auto',
        inherit: 'inherit'
      };
      
      const scaled = responsiveEngine.scaleSpacing(baseSpacing, 2.0);
      
      expect(scaled.margin).toBe(40);
      expect(scaled.unit).toBe('px');
      expect(scaled.auto).toBe('auto');
      expect(scaled.inherit).toBe('inherit');
    });
  });

  describe('Content Optimization', () => {
    test('should optimize content for mobile readability', () => {
      const content = [
        {
          type: 'body',
          text: 'This is a very long piece of text that should be truncated for mobile viewing to improve readability and user experience.',
          fontSize: 16
        },
        {
          type: 'table',
          columns: 5,
          data: [['A', 'B', 'C', 'D', 'E'], ['1', '2', '3', '4', '5']]
        }
      ];
      
      const optimized = responsiveEngine.optimizeContentForMobile(content, {});
      
      expect(optimized[0].text.length).toBeLessThan(content[0].text.length);
      expect(optimized[0].truncated).toBe(true);
      expect(optimized[0].fontSize).toBeGreaterThan(content[0].fontSize);
      expect(optimized[1].type).toBe('list'); // Table converted to list
    });

    test('should preserve short content', () => {
      const content = [
        {
          type: 'body',
          text: 'Short text',
          fontSize: 16
        }
      ];
      
      const optimized = responsiveEngine.optimizeContentForMobile(content, {});
      
      expect(optimized[0].text).toBe('Short text');
      expect(optimized[0].truncated).toBeUndefined();
    });
  });

  describe('Media Query Generation', () => {
    test('should generate CSS-like media queries', () => {
      const queries = responsiveEngine.generateMediaQueries();
      
      expect(queries).toHaveProperty('xs');
      expect(queries).toHaveProperty('sm');
      expect(queries).toHaveProperty('md');
      expect(queries).toHaveProperty('lg');
      expect(queries).toHaveProperty('xl');
      
      expect(queries.xs.condition).toBe('(max-width: 480px)');
      expect(queries.xl.condition).toBe('(min-width: 1441px)');
    });

    test('should include layout rules in queries', () => {
      const customRules = {
        xs: { display: 'block' },
        lg: { display: 'grid' }
      };
      
      const queries = responsiveEngine.generateMediaQueries(customRules);
      
      expect(queries.xs.rules.display).toBe('block');
      expect(queries.lg.rules.display).toBe('grid');
    });
  });

  describe('Layout Type Optimization', () => {
    test('should recommend single column for mobile', () => {
      const content = [
        { text: 'Item 1' },
        { text: 'Item 2' },
        { text: 'Item 3' }
      ];
      
      const mobileLayout = responsiveEngine.getOptimalLayoutForBreakpoint('xs', {});
      const smallLayout = responsiveEngine.getOptimalLayoutForBreakpoint('sm', {});
      
      expect(mobileLayout).toBe('single-column');
      expect(smallLayout).toBe('single-column');
    });

    test('should recommend appropriate layouts for larger screens', () => {
      const mediumLayout = responsiveEngine.getOptimalLayoutForBreakpoint('md', {});
      const largeLayout = responsiveEngine.getOptimalLayoutForBreakpoint('lg', {});
      const xlargeLayout = responsiveEngine.getOptimalLayoutForBreakpoint('xl', {});
      
      expect(['double-column', 'quad-grid', 'responsive-grid']).toContain(mediumLayout);
      expect(['double-column', 'triple-column', 'quad-grid', 'feature-showcase', 'responsive-grid']).toContain(largeLayout);
      expect(['double-column', 'triple-column', 'quad-grid', 'feature-showcase', 'responsive-grid']).toContain(xlargeLayout);
    });
  });

  describe('Performance Optimization', () => {
    test('should provide performance recommendations for mobile', () => {
      const recommendations = responsiveEngine.getPerformanceRecommendations('xs', 10);
      
      expect(recommendations.optimizations.images).toBe(true);
      expect(recommendations.optimizations.animations).toBe(false);
      expect(recommendations.recommendations).toContain('Enable image compression for mobile');
    });

    test('should recommend virtual scrolling for large content sets', () => {
      const recommendations = responsiveEngine.getPerformanceRecommendations('lg', 25);
      
      expect(recommendations.recommendations).toContain('Implement virtual scrolling');
      expect(recommendations.recommendations).toContain('Consider lazy loading for content');
    });

    test('should suggest pagination for mobile with many items', () => {
      const recommendations = responsiveEngine.getPerformanceRecommendations('sm', 8);
      
      expect(recommendations.recommendations).toContain('Consider pagination for mobile devices');
    });
  });

  describe('Text Processing Utilities', () => {
    test('should truncate text intelligently', () => {
      const longText = 'This is a very long sentence that needs to be truncated at a word boundary for better readability.';
      
      const truncated = responsiveEngine.truncateText(longText, 50);
      
      expect(truncated.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(truncated.endsWith('...')).toBe(true);
      expect(truncated.includes(' ')).toBe(true); // Should break at word boundary
    });

    test('should preserve short text', () => {
      const shortText = 'Short text';
      
      const result = responsiveEngine.truncateText(shortText, 50);
      
      expect(result).toBe(shortText);
    });

    test('should convert table to list format', () => {
      const tableItem = {
        data: [
          ['Name', 'Age', 'City'],
          ['John', '25', 'NYC'],
          ['Jane', '30', 'LA']
        ]
      };
      
      const listText = responsiveEngine.convertTableToList(tableItem);
      
      expect(listText).toContain('📋 Name | Age | City');
      expect(listText).toContain('• John: 25: NYC');
      expect(listText).toContain('• Jane: 30: LA');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined breakpoint gracefully', () => {
      const config = responsiveEngine.getResponsiveConfig('invalid-breakpoint');
      
      expect(config).toEqual(responsiveEngine.defaultResponsiveConfig.md);
    });

    test('should handle null content in optimization', () => {
      const optimized = responsiveEngine.optimizeContentForMobile(null, {});
      
      expect(Array.isArray(optimized)).toBe(true);
      expect(optimized.length).toBe(0);
    });

    test('should handle empty areas in redistribution', () => {
      const redistributed = responsiveEngine.redistributeGridAreas({}, 1);
      
      expect(redistributed).toEqual({});
    });
  });
});