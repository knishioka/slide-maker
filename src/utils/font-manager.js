/**
 * Font Management System
 * Comprehensive font handling, loading, and optimization for Google Slides
 */
class FontManager {
  constructor() {
    this.loadedFonts = new Set();
    this.fontFamilies = new Map();
    this.fontMetrics = new Map();
    this.initializeSystemFonts();
  }

  /**
   * Initialize system and web-safe fonts
   */
  initializeSystemFonts() {
    const systemFonts = [
      {
        family: 'Arial',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
        weights: [400, 700],
        fallback: 'sans-serif',
        metrics: { xHeight: 0.519, capHeight: 0.716, ascent: 0.905, descent: 0.212 },
        webSafe: true,
        googleFont: false
      },
      {
        family: 'Helvetica',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
        weights: [400, 700],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.523, capHeight: 0.718, ascent: 0.931, descent: 0.213 },
        webSafe: true,
        googleFont: false
      },
      {
        family: 'Times New Roman',
        category: 'serif',
        variants: ['regular', 'bold', 'italic'],
        weights: [400, 700],
        fallback: 'serif',
        metrics: { xHeight: 0.448, capHeight: 0.662, ascent: 0.891, descent: 0.216 },
        webSafe: true,
        googleFont: false
      },
      {
        family: 'Georgia',
        category: 'serif',
        variants: ['regular', 'bold', 'italic'],
        weights: [400, 700],
        fallback: 'Times, serif',
        metrics: { xHeight: 0.481, capHeight: 0.692, ascent: 0.917, descent: 0.219 },
        webSafe: true,
        googleFont: false
      },
      {
        family: 'Courier New',
        category: 'monospace',
        variants: ['regular', 'bold'],
        weights: [400, 700],
        fallback: 'monospace',
        metrics: { xHeight: 0.426, capHeight: 0.571, ascent: 0.832, descent: 0.300 },
        webSafe: true,
        googleFont: false
      }
    ];

    const googleFonts = [
      {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['100', '300', 'regular', '500', '700', '900'],
        weights: [100, 300, 400, 500, 700, 900],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.528, capHeight: 0.710, ascent: 0.927, descent: 0.244 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap'
      },
      {
        family: 'Open Sans',
        category: 'sans-serif',
        variants: ['300', 'regular', '500', '600', '700', '800'],
        weights: [300, 400, 500, 600, 700, 800],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.548, capHeight: 0.714, ascent: 1.068, descent: 0.293 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap'
      },
      {
        family: 'Lato',
        category: 'sans-serif',
        variants: ['100', '300', 'regular', '700', '900'],
        weights: [100, 300, 400, 700, 900],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.545, capHeight: 0.723, ascent: 0.987, descent: 0.213 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap'
      },
      {
        family: 'Montserrat',
        category: 'sans-serif',
        variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'],
        weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.548, capHeight: 0.700, ascent: 0.968, descent: 0.251 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap'
      },
      {
        family: 'Source Sans Pro',
        category: 'sans-serif',
        variants: ['200', '300', 'regular', '600', '700', '900'],
        weights: [200, 300, 400, 600, 700, 900],
        fallback: 'Arial, sans-serif',
        metrics: { xHeight: 0.486, capHeight: 0.660, ascent: 0.984, descent: 0.273 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@200;300;400;600;700;900&display=swap'
      },
      {
        family: 'Playfair Display',
        category: 'serif',
        variants: ['regular', '500', '600', '700', '800', '900'],
        weights: [400, 500, 600, 700, 800, 900],
        fallback: 'Georgia, serif',
        metrics: { xHeight: 0.464, capHeight: 0.708, ascent: 1.003, descent: 0.271 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
      },
      {
        family: 'Merriweather',
        category: 'serif',
        variants: ['300', 'regular', '700', '900'],
        weights: [300, 400, 700, 900],
        fallback: 'Georgia, serif',
        metrics: { xHeight: 0.492, capHeight: 0.692, ascent: 0.984, descent: 0.273 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap'
      },
      {
        family: 'Source Code Pro',
        category: 'monospace',
        variants: ['200', '300', 'regular', '500', '600', '700', '800', '900'],
        weights: [200, 300, 400, 500, 600, 700, 800, 900],
        fallback: 'Courier New, monospace',
        metrics: { xHeight: 0.486, capHeight: 0.660, ascent: 0.984, descent: 0.273 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap'
      },
      {
        family: 'JetBrains Mono',
        category: 'monospace',
        variants: ['100', '200', '300', 'regular', '500', '600', '700', '800'],
        weights: [100, 200, 300, 400, 500, 600, 700, 800],
        fallback: 'Source Code Pro, monospace',
        metrics: { xHeight: 0.522, capHeight: 0.729, ascent: 1.020, descent: 0.300 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap'
      },
      {
        family: 'Inter',
        category: 'sans-serif',
        variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'],
        weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        fallback: 'system-ui, sans-serif',
        metrics: { xHeight: 0.526, capHeight: 0.727, ascent: 0.968, descent: 0.242 },
        webSafe: false,
        googleFont: true,
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap'
      }
    ];

    // Register all fonts
    [...systemFonts, ...googleFonts].forEach(font => {
      this.fontFamilies.set(font.family, font);
      this.fontMetrics.set(font.family, font.metrics);
    });
  }

  /**
   * Get font information by family name
   * @param {string} fontFamily - Font family name
   * @returns {Object|null} Font information
   */
  getFontInfo(fontFamily) {
    return this.fontFamilies.get(fontFamily) || null;
  }

  /**
   * Get all available fonts with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} Array of font information
   */
  getAvailableFonts(filters = {}) {
    let fonts = Array.from(this.fontFamilies.values());

    if (filters.category) {
      fonts = fonts.filter(font => font.category === filters.category);
    }

    if (filters.webSafe !== undefined) {
      fonts = fonts.filter(font => font.webSafe === filters.webSafe);
    }

    if (filters.googleFont !== undefined) {
      fonts = fonts.filter(font => font.googleFont === filters.googleFont);
    }

    return fonts.sort((a, b) => a.family.localeCompare(b.family));
  }

  /**
   * Load Google Font asynchronously
   * @param {string} fontFamily - Google Font family name
   * @returns {Promise<boolean>} Load success status
   */
  async loadGoogleFont(fontFamily) {
    const fontInfo = this.getFontInfo(fontFamily);
    if (!fontInfo || !fontInfo.googleFont) {
      throw new Error(`Font ${fontFamily} is not a Google Font`);
    }

    if (this.loadedFonts.has(fontFamily)) {
      return true; // Already loaded
    }

    try {
      // In browser environment, load font via CSS
      if (typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontInfo.url;
        document.head.appendChild(link);

        // Wait for font to load
        await this.waitForFontLoad(fontFamily);
      }

      this.loadedFonts.add(fontFamily);
      return true;
    } catch (error) {
      console.error(`Failed to load font ${fontFamily}:`, error);
      return false;
    }
  }

  /**
   * Wait for font to be loaded and available
   * @param {string} fontFamily - Font family name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Font load status
   */
  waitForFontLoad(fontFamily, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve(true);
        return;
      }

      // Use Font Loading API if available
      if ('fonts' in document) {
        document.fonts.load(`12px ${fontFamily}`).then(() => {
          resolve(true);
        }).catch(() => {
          reject(new Error(`Font load timeout: ${fontFamily}`));
        });
      } else {
        // Fallback: simple timeout
        setTimeout(() => resolve(true), 1000);
      }

      // Timeout fallback
      setTimeout(() => {
        reject(new Error(`Font load timeout: ${fontFamily}`));
      }, timeout);
    });
  }

  /**
   * Get font stack with fallbacks
   * @param {string} fontFamily - Primary font family
   * @param {string} category - Font category for fallback
   * @returns {string} Complete font stack
   */
  getFontStack(fontFamily, category = null) {
    const fontInfo = this.getFontInfo(fontFamily);
    if (!fontInfo) {
      return this.getGenericFontStack(category || 'sans-serif');
    }

    return `"${fontFamily}", ${fontInfo.fallback}`;
  }

  /**
   * Get generic font stack for category
   * @param {string} category - Font category
   * @returns {string} Generic font stack
   */
  getGenericFontStack(category) {
    const stacks = {
      'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      'serif': 'Georgia, "Times New Roman", Times, serif',
      'monospace': '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
    };

    return stacks[category] || stacks['sans-serif'];
  }

  /**
   * Calculate optimal font size for content
   * @param {Object} config - Font size configuration
   * @returns {number} Optimal font size in points
   */
  calculateOptimalFontSize(config) {
    const {
      contentLength = 100,
      containerWidth = 800,
      containerHeight = 600,
      lineHeight = 1.5,
      maxLines = 10,
      fontFamily = 'Arial',
      importance = 'normal'
    } = config;

    const fontMetrics = this.fontMetrics.get(fontFamily) || 
                      { xHeight: 0.5, capHeight: 0.7, ascent: 0.9, descent: 0.2 };

    // Base calculations
    const avgCharWidth = 0.6; // Average character width ratio
    const charsPerLine = Math.floor(containerWidth / (avgCharWidth * 16)); // Assuming 16px base
    const estimatedLines = Math.ceil(contentLength / charsPerLine);
    
    // Calculate available space per line
    const availableHeight = containerHeight / Math.min(estimatedLines, maxLines);
    const baseSize = availableHeight / (lineHeight * fontMetrics.ascent);

    // Apply importance scaling
    const importanceMultipliers = {
      'title': 1.8,
      'heading': 1.4,
      'subheading': 1.2,
      'normal': 1.0,
      'caption': 0.85,
      'footnote': 0.75
    };

    const multiplier = importanceMultipliers[importance] || 1.0;
    let optimalSize = baseSize * multiplier;

    // Apply constraints
    const constraints = {
      'title': { min: 36, max: 72 },
      'heading': { min: 28, max: 48 },
      'subheading': { min: 24, max: 36 },
      'normal': { min: 16, max: 32 },
      'caption': { min: 14, max: 24 },
      'footnote': { min: 12, max: 18 }
    };

    const constraint = constraints[importance] || constraints['normal'];
    optimalSize = Math.max(constraint.min, Math.min(constraint.max, optimalSize));

    return Math.round(optimalSize);
  }

  /**
   * Generate font pairing recommendations
   * @param {string} primaryFont - Primary font family
   * @returns {Array} Array of recommended font pairings
   */
  getFontPairings(primaryFont) {
    const primaryInfo = this.getFontInfo(primaryFont);
    if (!primaryInfo) {
      return [];
    }

    const pairingRules = {
      'sans-serif': {
        headings: ['Montserrat', 'Roboto', 'Open Sans', 'Lato'],
        body: ['Open Sans', 'Source Sans Pro', 'Lato', 'Arial'],
        accent: ['Playfair Display', 'Merriweather', 'Georgia']
      },
      'serif': {
        headings: ['Playfair Display', 'Merriweather', 'Georgia'],
        body: ['Georgia', 'Times New Roman', 'Merriweather'],
        accent: ['Roboto', 'Montserrat', 'Source Sans Pro']
      },
      'monospace': {
        headings: ['Roboto', 'Montserrat', 'Open Sans'],
        body: ['Open Sans', 'Source Sans Pro', 'Arial'],
        accent: ['Source Code Pro', 'JetBrains Mono']
      }
    };

    const rules = pairingRules[primaryInfo.category] || pairingRules['sans-serif'];
    
    return {
      recommended: {
        headings: rules.headings.filter(font => font !== primaryFont).slice(0, 3),
        body: rules.body.filter(font => font !== primaryFont).slice(0, 3),
        accent: rules.accent.filter(font => font !== primaryFont).slice(0, 2)
      },
      primary: primaryFont,
      category: primaryInfo.category
    };
  }

  /**
   * Validate font accessibility
   * @param {Object} config - Font configuration
   * @returns {Object} Accessibility validation result
   */
  validateFontAccessibility(config) {
    const {
      fontSize = 16,
      fontFamily = 'Arial',
      lineHeight = 1.5,
      letterSpacing = 0,
      fontWeight = 400
    } = config;

    const issues = [];
    const recommendations = [];

    // Minimum size validation
    if (fontSize < 12) {
      issues.push('Font size below recommended minimum (12px)');
      recommendations.push('Increase font size to at least 12px');
    }

    // Line height validation
    if (lineHeight < 1.2) {
      issues.push('Line height too tight for readability');
      recommendations.push('Increase line height to at least 1.2');
    }

    if (lineHeight > 2.0) {
      issues.push('Line height too loose, may affect reading flow');
      recommendations.push('Reduce line height to 1.8 or below');
    }

    // Font family validation
    const fontInfo = this.getFontInfo(fontFamily);
    if (!fontInfo) {
      issues.push('Font family not recognized');
      recommendations.push('Use a web-safe or Google Font');
    }

    // Weight validation
    if (fontWeight < 300) {
      issues.push('Font weight too light for body text');
      recommendations.push('Use font weight 300 or higher');
    }

    return {
      isAccessible: issues.length === 0,
      issues,
      recommendations,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  /**
   * Generate font CSS rules
   * @param {Object} config - Font configuration
   * @returns {Object} CSS font rules
   */
  generateFontCSS(config) {
    const {
      fontFamily,
      fontSize = 16,
      fontWeight = 400,
      lineHeight = 1.5,
      letterSpacing = 0,
      textAlign = 'left',
      textDecoration = 'none',
      fontStyle = 'normal'
    } = config;

    const fontStack = this.getFontStack(fontFamily);

    return {
      fontFamily: fontStack,
      fontSize: `${fontSize}px`,
      fontWeight: fontWeight.toString(),
      lineHeight: lineHeight.toString(),
      letterSpacing: letterSpacing === 0 ? 'normal' : `${letterSpacing}px`,
      textAlign,
      textDecoration,
      fontStyle,
      // Additional properties for better rendering
      fontDisplay: 'swap',
      fontOpticalSizing: 'auto',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    };
  }

  /**
   * Preload fonts for better performance
   * @param {Array} fontFamilies - Array of font families to preload
   * @returns {Promise<Array>} Array of load results
   */
  async preloadFonts(fontFamilies) {
    const loadPromises = fontFamilies.map(async (fontFamily) => {
      try {
        const fontInfo = this.getFontInfo(fontFamily);
        if (fontInfo && fontInfo.googleFont) {
          await this.loadGoogleFont(fontFamily);
          return { fontFamily, success: true };
        }
        return { fontFamily, success: true, cached: true };
      } catch (error) {
        return { fontFamily, success: false, error: error.message };
      }
    });

    return Promise.all(loadPromises);
  }

  /**
   * Get font metrics for layout calculations
   * @param {string} fontFamily - Font family name
   * @returns {Object} Font metrics
   */
  getFontMetrics(fontFamily) {
    return this.fontMetrics.get(fontFamily) || {
      xHeight: 0.5,
      capHeight: 0.7,
      ascent: 0.9,
      descent: 0.2
    };
  }

  /**
   * Calculate text dimensions
   * @param {string} text - Text content
   * @param {Object} fontConfig - Font configuration
   * @returns {Object} Text dimensions
   */
  calculateTextDimensions(text, fontConfig) {
    const {
      fontFamily = 'Arial',
      fontSize = 16,
      lineHeight = 1.5,
      maxWidth = null
    } = fontConfig;

    const metrics = this.getFontMetrics(fontFamily);
    const avgCharWidth = fontSize * 0.6; // Approximation
    
    // Calculate text width
    const textWidth = text.length * avgCharWidth;
    
    // Calculate wrapped dimensions if maxWidth is specified
    if (maxWidth && textWidth > maxWidth) {
      const charsPerLine = Math.floor(maxWidth / avgCharWidth);
      const lines = Math.ceil(text.length / charsPerLine);
      
      return {
        width: maxWidth,
        height: lines * fontSize * lineHeight,
        lines,
        charsPerLine
      };
    }

    return {
      width: textWidth,
      height: fontSize * lineHeight,
      lines: 1,
      charsPerLine: text.length
    };
  }

  /**
   * Export font configuration
   * @param {Array} fontConfigs - Array of font configurations
   * @returns {string} JSON export
   */
  exportFontConfig(fontConfigs) {
    const exportData = {
      fonts: fontConfigs,
      metadata: {
        exported: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import font configuration
   * @param {string} configJson - JSON configuration
   * @returns {Array} Imported font configurations
   */
  importFontConfig(configJson) {
    try {
      const data = JSON.parse(configJson);
      return data.fonts || [];
    } catch (error) {
      throw new Error('Invalid font configuration JSON');
    }
  }
}

// Export for Google Apps Script environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FontManager;
} else if (typeof global !== 'undefined') {
  global.FontManager = FontManager;
}