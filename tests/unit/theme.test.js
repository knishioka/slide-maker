/**
 * Theme Management System Tests
 * Comprehensive test suite for ThemeService, ColorPaletteUtils, and FontManager
 */

// Mock console for testing
const console = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {}
};

/**
 * Mock PropertiesService for Google Apps Script environment
 */
const mockPropertiesService = {
  getScriptProperties: () => ({
    getProperty: () => null,
    setProperty: () => {},
    deleteProperty: () => {}
  })
};

/**
 * Test suite for ThemeService
 */
function testThemeService() {
  console.log('Running ThemeService tests...');
  
  const tests = {
    initialization: () => {
      const themeService = new ThemeService();
      
      // Test that default themes are loaded
      const themes = themeService.getThemes();
      assert(themes.length >= 3, 'Should have at least 3 default themes');
      
      // Test that active theme is set
      const activeTheme = themeService.getActiveTheme();
      assert(activeTheme !== null, 'Should have an active theme');
      assert(activeTheme.name === 'Modern Corporate', 'Default active theme should be Modern Corporate');
      
      return true;
    },

    themeCreation: () => {
      const themeService = new ThemeService();
      
      const customTheme = {
        name: 'Test Theme',
        colors: {
          primary: '#ff0000',
          background: '#ffffff',
          text: {
            primary: '#000000',
            secondary: '#666666'
          }
        },
        typography: {
          fontFamily: {
            primary: 'Arial'
          }
        }
      };
      
      const theme = themeService.createTheme(customTheme);
      
      assert(theme.id, 'Created theme should have an ID');
      assert(theme.name === 'Test Theme', 'Theme name should match');
      assert(theme.colors.primary === '#ff0000', 'Primary color should match');
      
      // Test that theme is stored
      const retrievedTheme = themeService.getTheme(theme.id);
      assert(retrievedTheme !== null, 'Theme should be retrievable');
      assert(retrievedTheme.name === 'Test Theme', 'Retrieved theme name should match');
      
      return true;
    },

    themeValidation: () => {
      const themeService = new ThemeService();
      
      // Test invalid theme creation
      try {
        themeService.createTheme({});
        assert(false, 'Should throw error for invalid theme');
      } catch (error) {
        assert(error.message.includes('Theme validation failed'), 'Should throw validation error');
      }
      
      // Test valid theme validation
      const validTheme = {
        name: 'Valid Theme',
        colors: {
          primary: '#0066cc',
          background: '#ffffff',
          text: {
            primary: '#000000'
          }
        }
      };
      
      const theme = themeService.createTheme(validTheme);
      assert(theme.id, 'Valid theme should be created successfully');
      
      return true;
    },

    activeThemeManagement: () => {
      const themeService = new ThemeService();
      
      // Create a test theme
      const testTheme = themeService.createTheme({
        name: 'Active Test Theme',
        colors: {
          primary: '#00ff00',
          background: '#ffffff',
          text: { primary: '#000000' }
        }
      });
      
      // Set as active
      const success = themeService.setActiveTheme(testTheme.id);
      assert(success === true, 'Should successfully set active theme');
      
      const activeTheme = themeService.getActiveTheme();
      assert(activeTheme.id === testTheme.id, 'Active theme should match set theme');
      
      // Test setting non-existent theme
      const failResult = themeService.setActiveTheme('non-existent-id');
      assert(failResult === false, 'Should fail to set non-existent theme');
      
      return true;
    },

    themeCloning: () => {
      const themeService = new ThemeService();
      
      // Get a default theme to clone
      const themes = themeService.getThemes();
      const sourceTheme = themes[0];
      
      const modifications = {
        colors: {
          primary: '#purple'
        }
      };
      
      const clonedTheme = themeService.cloneTheme(
        sourceTheme.id, 
        modifications, 
        'Cloned Test Theme'
      );
      
      assert(clonedTheme.id !== sourceTheme.id, 'Cloned theme should have different ID');
      assert(clonedTheme.name === 'Cloned Test Theme', 'Cloned theme should have new name');
      assert(clonedTheme.colors.primary === '#purple', 'Modifications should be applied');
      assert(clonedTheme.colors.background === sourceTheme.colors.background, 'Unmodified properties should be preserved');
      
      return true;
    },

    exportImport: () => {
      const themeService = new ThemeService();
      
      // Create a theme to export
      const originalTheme = themeService.createTheme({
        name: 'Export Test Theme',
        colors: {
          primary: '#export',
          background: '#ffffff',
          text: { primary: '#000000' }
        }
      });
      
      // Export theme
      const exportedJson = themeService.exportTheme(originalTheme.id);
      assert(typeof exportedJson === 'string', 'Export should return JSON string');
      
      // Import theme
      const importedTheme = themeService.importTheme(exportedJson);
      assert(importedTheme.id !== originalTheme.id, 'Imported theme should have new ID');
      assert(importedTheme.name === originalTheme.name, 'Imported theme should preserve name');
      assert(importedTheme.colors.primary === originalTheme.colors.primary, 'Imported theme should preserve colors');
      
      return true;
    },

    themeDeletion: () => {
      const themeService = new ThemeService();
      
      // Create a theme to delete
      const testTheme = themeService.createTheme({
        name: 'Delete Test Theme',
        colors: {
          primary: '#delete',
          background: '#ffffff',
          text: { primary: '#000000' }
        }
      });
      
      // Verify theme exists
      assert(themeService.getTheme(testTheme.id) !== null, 'Theme should exist before deletion');
      
      // Delete theme
      const success = themeService.deleteTheme(testTheme.id);
      assert(success === true, 'Should successfully delete theme');
      
      // Verify theme is deleted
      assert(themeService.getTheme(testTheme.id) === null, 'Theme should not exist after deletion');
      
      // Test deleting active theme (should fail)
      const activeTheme = themeService.getActiveTheme();
      try {
        themeService.deleteTheme(activeTheme.id);
        assert(false, 'Should not allow deleting active theme');
      } catch (error) {
        assert(error.message.includes('Cannot delete active theme'), 'Should throw appropriate error');
      }
      
      return true;
    }
  };

  return runTestSuite('ThemeService', tests);
}

/**
 * Test suite for ColorPaletteUtils
 */
function testColorPaletteUtils() {
  console.log('Running ColorPaletteUtils tests...');
  
  const tests = {
    colorConversion: () => {
      // Test hex to RGB conversion
      const rgb = ColorPaletteUtils.hexToRgb('#ff0000');
      assert(rgb.r === 255 && rgb.g === 0 && rgb.b === 0, 'Should convert red hex to RGB correctly');
      
      // Test RGB to hex conversion
      const hex = ColorPaletteUtils.rgbToHex(255, 0, 0);
      assert(hex === '#ff0000', 'Should convert RGB to hex correctly');
      
      // Test hex to HSL conversion
      const hsl = ColorPaletteUtils.hexToHsl('#ff0000');
      assert(hsl.h === 0 && hsl.s === 100 && hsl.l === 50, 'Should convert red hex to HSL correctly');
      
      // Test HSL to hex conversion
      const hexFromHsl = ColorPaletteUtils.hslToHex(0, 100, 50);
      assert(hexFromHsl === '#ff0000', 'Should convert HSL to hex correctly');
      
      return true;
    },

    luminanceCalculation: () => {
      // Test luminance calculation
      const whiteLuminance = ColorPaletteUtils.getLuminance('#ffffff');
      const blackLuminance = ColorPaletteUtils.getLuminance('#000000');
      
      assert(whiteLuminance > blackLuminance, 'White should have higher luminance than black');
      assert(whiteLuminance <= 1, 'Luminance should not exceed 1');
      assert(blackLuminance >= 0, 'Luminance should not be negative');
      
      return true;
    },

    contrastRatio: () => {
      // Test contrast ratio calculation
      const whiteBlackContrast = ColorPaletteUtils.getContrastRatio('#ffffff', '#000000');
      assert(whiteBlackContrast === 21, 'White/black contrast should be 21:1');
      
      const sameColorContrast = ColorPaletteUtils.getContrastRatio('#ff0000', '#ff0000');
      assert(sameColorContrast === 1, 'Same color contrast should be 1:1');
      
      return true;
    },

    accessibilityValidation: () => {
      // Test WCAG AA validation
      const validation = ColorPaletteUtils.validateAccessibility('#000000', '#ffffff', 'AA', false);
      assert(validation.passes === true, 'Black text on white should pass WCAG AA');
      assert(validation.contrastRatio >= 4.5, 'Contrast ratio should meet WCAG AA standard');
      
      // Test failing combination
      const failValidation = ColorPaletteUtils.validateAccessibility('#ffff00', '#ffffff', 'AA', false);
      assert(failValidation.passes === false, 'Yellow text on white should fail WCAG AA');
      
      return true;
    },

    paletteGeneration: () => {
      // Test palette generation
      const palette = ColorPaletteUtils.generatePalette('#0066cc');
      assert(palette !== null, 'Should generate palette successfully');
      assert(palette.base === '#0066cc', 'Base color should match input');
      assert(palette.variations, 'Should have color variations');
      assert(palette.semantic, 'Should have semantic colors');
      assert(palette.accessibility, 'Should have accessibility colors');
      
      // Test variations
      assert(Object.keys(palette.variations).length === 9, 'Should have 9 color variations');
      
      return true;
    },

    complementaryScheme: () => {
      // Test complementary color scheme
      const scheme = ColorPaletteUtils.generateComplementaryScheme('#0066cc');
      assert(scheme !== null, 'Should generate complementary scheme');
      assert(scheme.primary === '#0066cc', 'Primary should match input');
      assert(scheme.complementary, 'Should have complementary color');
      assert(scheme.triadic && scheme.triadic.length === 2, 'Should have 2 triadic colors');
      assert(scheme.analogous && scheme.analogous.length === 2, 'Should have 2 analogous colors');
      
      return true;
    },

    brandPalette: () => {
      // Test brand palette generation
      const brandColors = ['#0066cc', '#ff6600'];
      const palette = ColorPaletteUtils.generateBrandPalette(brandColors);
      
      assert(palette !== null, 'Should generate brand palette');
      assert(palette.brand, 'Should have brand colors');
      assert(palette.extended, 'Should have extended colors');
      assert(Object.keys(palette.brand).length === 2, 'Should have 2 brand colors');
      
      return true;
    }
  };

  return runTestSuite('ColorPaletteUtils', tests);
}

/**
 * Test suite for FontManager
 */
function testFontManager() {
  console.log('Running FontManager tests...');
  
  const tests = {
    initialization: () => {
      const fontManager = new FontManager();
      
      // Test that system fonts are loaded
      const systemFonts = fontManager.getAvailableFonts({ webSafe: true });
      assert(systemFonts.length > 0, 'Should have system fonts');
      
      // Test that Google fonts are loaded
      const googleFonts = fontManager.getAvailableFonts({ googleFont: true });
      assert(googleFonts.length > 0, 'Should have Google fonts');
      
      return true;
    },

    fontInfo: () => {
      const fontManager = new FontManager();
      
      // Test getting font info
      const arialInfo = fontManager.getFontInfo('Arial');
      assert(arialInfo !== null, 'Should find Arial font info');
      assert(arialInfo.family === 'Arial', 'Font family should match');
      assert(arialInfo.category === 'sans-serif', 'Arial should be sans-serif');
      assert(arialInfo.webSafe === true, 'Arial should be web safe');
      
      // Test non-existent font
      const nonExistentInfo = fontManager.getFontInfo('NonExistentFont');
      assert(nonExistentInfo === null, 'Should return null for non-existent font');
      
      return true;
    },

    fontFiltering: () => {
      const fontManager = new FontManager();
      
      // Test category filtering
      const serifFonts = fontManager.getAvailableFonts({ category: 'serif' });
      assert(serifFonts.length > 0, 'Should have serif fonts');
      assert(serifFonts.every(font => font.category === 'serif'), 'All fonts should be serif');
      
      // Test web safe filtering
      const webSafeFonts = fontManager.getAvailableFonts({ webSafe: true });
      assert(webSafeFonts.length > 0, 'Should have web safe fonts');
      assert(webSafeFonts.every(font => font.webSafe === true), 'All fonts should be web safe');
      
      return true;
    },

    fontStack: () => {
      const fontManager = new FontManager();
      
      // Test font stack generation
      const arialStack = fontManager.getFontStack('Arial');
      assert(arialStack.includes('Arial'), 'Stack should include Arial');
      assert(arialStack.includes('sans-serif'), 'Stack should include fallback');
      
      // Test generic stack
      const genericStack = fontManager.getGenericFontStack('serif');
      assert(genericStack.includes('serif'), 'Generic stack should include serif');
      
      return true;
    },

    fontSizeCalculation: () => {
      const fontManager = new FontManager();
      
      // Test optimal font size calculation
      const config = {
        contentLength: 100,
        containerWidth: 800,
        containerHeight: 600,
        importance: 'normal'
      };
      
      const fontSize = fontManager.calculateOptimalFontSize(config);
      assert(fontSize >= 16, 'Font size should be at least 16px');
      assert(fontSize <= 32, 'Font size should not exceed 32px for normal text');
      
      // Test title importance
      const titleConfig = { ...config, importance: 'title' };
      const titleSize = fontManager.calculateOptimalFontSize(titleConfig);
      assert(titleSize > fontSize, 'Title font should be larger than normal text');
      
      return true;
    },

    fontPairings: () => {
      const fontManager = new FontManager();
      
      // Test font pairing recommendations
      const pairings = fontManager.getFontPairings('Roboto');
      assert(pairings.recommended, 'Should have recommended pairings');
      assert(pairings.recommended.headings, 'Should have heading font recommendations');
      assert(pairings.recommended.body, 'Should have body font recommendations');
      assert(pairings.primary === 'Roboto', 'Primary should match input');
      
      return true;
    },

    accessibilityValidation: () => {
      const fontManager = new FontManager();
      
      // Test font accessibility validation
      const goodConfig = {
        fontSize: 16,
        lineHeight: 1.5,
        fontWeight: 400
      };
      
      const validation = fontManager.validateFontAccessibility(goodConfig);
      assert(validation.isAccessible === true, 'Good config should pass accessibility');
      assert(validation.score > 50, 'Good config should have decent score');
      
      // Test poor config
      const poorConfig = {
        fontSize: 10,
        lineHeight: 1.0,
        fontWeight: 100
      };
      
      const poorValidation = fontManager.validateFontAccessibility(poorConfig);
      assert(poorValidation.isAccessible === false, 'Poor config should fail accessibility');
      assert(poorValidation.issues.length > 0, 'Poor config should have issues');
      
      return true;
    },

    cssGeneration: () => {
      const fontManager = new FontManager();
      
      // Test CSS generation
      const config = {
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5
      };
      
      const css = fontManager.generateFontCSS(config);
      assert(css.fontFamily.includes('Roboto'), 'CSS should include font family');
      assert(css.fontSize === '16px', 'CSS should include font size');
      assert(css.fontWeight === '400', 'CSS should include font weight');
      assert(css.lineHeight === '1.5', 'CSS should include line height');
      
      return true;
    },

    textDimensions: () => {
      const fontManager = new FontManager();
      
      // Test text dimension calculation
      const dimensions = fontManager.calculateTextDimensions('Hello World', {
        fontFamily: 'Arial',
        fontSize: 16
      });
      
      assert(dimensions.width > 0, 'Width should be positive');
      assert(dimensions.height > 0, 'Height should be positive');
      assert(dimensions.lines === 1, 'Single line text should have 1 line');
      
      // Test wrapped text
      const wrappedDimensions = fontManager.calculateTextDimensions('This is a very long text that should wrap', {
        fontFamily: 'Arial',
        fontSize: 16,
        maxWidth: 100
      });
      
      assert(wrappedDimensions.lines > 1, 'Long text should wrap to multiple lines');
      assert(wrappedDimensions.width <= 100, 'Wrapped text should respect max width');
      
      return true;
    }
  };

  return runTestSuite('FontManager', tests);
}

/**
 * Test suite for theme integration
 */
function testThemeIntegration() {
  console.log('Running Theme Integration tests...');
  
  const tests = {
    themeApplication: () => {
      // Mock layout service for integration testing
      const mockSlidesService = {
        getSlideDimensions: () => ({ width: 960, height: 540 })
      };
      
      const themeService = new ThemeService();
      const layoutService = new LayoutService(mockSlidesService, themeService);
      
      // Test theme conversion
      const activeTheme = themeService.getActiveTheme();
      const layoutConfig = layoutService.convertThemeToLayoutConfig(activeTheme);
      
      assert(layoutConfig.name === activeTheme.name, 'Layout config should preserve theme name');
      assert(layoutConfig.colors, 'Layout config should have colors');
      assert(layoutConfig.typography, 'Layout config should have typography');
      
      return true;
    },

    elementTheming: () => {
      const mockSlidesService = {
        getSlideDimensions: () => ({ width: 960, height: 540 })
      };
      
      const themeService = new ThemeService();
      const layoutService = new LayoutService(mockSlidesService, themeService);
      
      // Test element theming
      const elements = [
        {
          type: 'text',
          level: 'title',
          content: 'Test Title'
        },
        {
          type: 'text',
          level: 'body',
          content: 'Test Body'
        }
      ];
      
      const theme = themeService.getActiveTheme();
      const themedElements = layoutService.applyThemeToElements(elements, theme);
      
      assert(themedElements.length === elements.length, 'Should preserve element count');
      assert(themedElements[0].style, 'Elements should have style applied');
      assert(themedElements[0].style.color, 'Elements should have text color');
      assert(themedElements[0].style.fontFamily, 'Elements should have font family');
      
      return true;
    },

    themeCompatibility: () => {
      const mockSlidesService = {
        getSlideDimensions: () => ({ width: 960, height: 540 })
      };
      
      const themeService = new ThemeService();
      const layoutService = new LayoutService(mockSlidesService, themeService);
      
      // Test theme compatibility validation
      const theme = themeService.getActiveTheme();
      const validation = layoutService.validateThemeCompatibility(theme, 'single-column');
      
      assert(validation.compatible === true, 'Default theme should be compatible');
      assert(validation.score > 70, 'Default theme should have good compatibility score');
      
      return true;
    }
  };

  return runTestSuite('Theme Integration', tests);
}

/**
 * Helper function to run a test suite
 * @param {string} suiteName - Name of the test suite
 * @param {Object} tests - Object containing test functions
 * @returns {Object} Test results
 */
function runTestSuite(suiteName, tests) {
  const results = {
    suiteName,
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };

  for (const [testName, testFunction] of Object.entries(tests)) {
    results.total++;
    try {
      const success = testFunction();
      if (success) {
        results.passed++;
        console.log(`✓ ${suiteName}.${testName}`);
      } else {
        results.failed++;
        results.failures.push(`${testName}: Test returned false`);
        console.log(`✗ ${suiteName}.${testName}: Test returned false`);
      }
    } catch (error) {
      results.failed++;
      results.failures.push(`${testName}: ${error.message}`);
      console.log(`✗ ${suiteName}.${testName}: ${error.message}`);
    }
  }

  console.log(`\n${suiteName} Results: ${results.passed}/${results.total} passed\n`);
  return results;
}

/**
 * Simple assertion function
 * @param {boolean} condition - Condition to test
 * @param {string} message - Error message if assertion fails
 */
function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Run all theme-related tests
 * @returns {Object} Complete test results
 */
function runAllThemeTests() {
  console.log('Starting Theme Management System Tests\n');
  
  const results = {
    suites: [],
    totalPassed: 0,
    totalFailed: 0,
    totalTests: 0
  };

  // Run all test suites
  const suiteResults = [
    testThemeService(),
    testColorPaletteUtils(),
    testFontManager(),
    testThemeIntegration()
  ];

  suiteResults.forEach(result => {
    results.suites.push(result);
    results.totalPassed += result.passed;
    results.totalFailed += result.failed;
    results.totalTests += result.total;
  });

  // Print summary
  console.log('='.repeat(50));
  console.log('THEME MANAGEMENT SYSTEM TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.totalPassed}`);
  console.log(`Failed: ${results.totalFailed}`);
  console.log(`Success Rate: ${((results.totalPassed / results.totalTests) * 100).toFixed(1)}%`);

  if (results.totalFailed > 0) {
    console.log('\nFailures:');
    results.suites.forEach(suite => {
      if (suite.failures.length > 0) {
        console.log(`\n${suite.suiteName}:`);
        suite.failures.forEach(failure => console.log(`  - ${failure}`));
      }
    });
  }

  console.log('='.repeat(50));
  
  return results;
}

// Export test functions for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllThemeTests,
    testThemeService,
    testColorPaletteUtils,
    testFontManager,
    testThemeIntegration
  };
}