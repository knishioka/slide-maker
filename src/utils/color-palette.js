/**
 * Color Palette Management Utilities
 * Advanced color manipulation, palette generation, and accessibility validation
 */
class ColorPaletteUtils {
  /**
   * Convert hex color to RGB values
   * @param {string} hex - Hex color code
   * @returns {Object} RGB values
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert RGB to hex color
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {string} Hex color code
   */
  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Convert hex color to HSL values
   * @param {string} hex - Hex color code
   * @returns {Object} HSL values
   */
  static hexToHsl(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    let { r, g, b } = rgb;
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Convert HSL to hex color
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color code
   */
  static hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return this.rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  }

  /**
   * Calculate relative luminance of a color
   * @param {string} hex - Hex color code
   * @returns {number} Relative luminance (0-1)
   */
  static getLuminance(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const linearize = (c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const r = linearize(rgb.r);
    const g = linearize(rgb.g);
    const b = linearize(rgb.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} Contrast ratio (1-21)
   */
  static getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG accessibility standards
   * @param {string} foreground - Foreground color (hex)
   * @param {string} background - Background color (hex)
   * @param {string} level - WCAG level ('AA' or 'AAA')
   * @param {boolean} largeText - Is large text (14pt bold or 18pt+)
   * @returns {Object} Accessibility validation result
   */
  static validateAccessibility(foreground, background, level = 'AA', largeText = false) {
    const contrastRatio = this.getContrastRatio(foreground, background);
    
    let requiredRatio;
    if (level === 'AAA') {
      requiredRatio = largeText ? 4.5 : 7.0;
    } else {
      requiredRatio = largeText ? 3.0 : 4.5;
    }

    const passes = contrastRatio >= requiredRatio;

    return {
      passes,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      requiredRatio,
      level,
      largeText,
      recommendation: passes ? 'Passes accessibility guidelines' : this.getAccessibilityRecommendation(contrastRatio, requiredRatio)
    };
  }

  /**
   * Get accessibility improvement recommendation
   * @param {number} currentRatio - Current contrast ratio
   * @param {number} requiredRatio - Required contrast ratio
   * @returns {string} Recommendation text
   */
  static getAccessibilityRecommendation(currentRatio, requiredRatio) {
    const gap = requiredRatio - currentRatio;
    if (gap > 3) {
      return 'Consider using significantly darker or lighter colors';
    } else if (gap > 1.5) {
      return 'Adjust color darkness/lightness by 20-30%';
    } else {
      return 'Small adjustment needed - try adjusting lightness by 10-15%';
    }
  }

  /**
   * Generate color palette variations from a base color
   * @param {string} baseColor - Base hex color
   * @param {Object} options - Generation options
   * @returns {Object} Color palette with variations
   */
  static generatePalette(baseColor, options = {}) {
    const {
      steps = 9,
      lightnessRange = { min: 10, max: 95 },
      saturationAdjustment = 0,
      includeGrayscale = true
    } = options;

    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return null;

    const palette = {
      base: baseColor,
      variations: {},
      semantic: {},
      accessibility: {}
    };

    // Generate lightness variations
    const lightnessStep = (lightnessRange.max - lightnessRange.min) / (steps - 1);
    for (let i = 0; i < steps; i++) {
      const lightness = lightnessRange.min + (lightnessStep * i);
      const adjustedSaturation = Math.max(0, Math.min(100, hsl.s + saturationAdjustment));
      const variantColor = this.hslToHex(hsl.h, adjustedSaturation, lightness);
      
      palette.variations[`${(i + 1) * 100}`] = variantColor;
    }

    // Generate semantic colors
    palette.semantic = {
      primary: baseColor,
      secondary: this.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(95, hsl.l + 20)),
      accent: this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      success: this.hslToHex(120, 60, 50),
      warning: this.hslToHex(45, 90, 60),
      error: this.hslToHex(0, 70, 50),
      info: this.hslToHex(210, 80, 60)
    };

    // Generate grayscale palette
    if (includeGrayscale) {
      palette.grayscale = {};
      for (let i = 0; i < steps; i++) {
        const lightness = lightnessRange.min + (lightnessStep * i);
        palette.grayscale[`${(i + 1) * 100}`] = this.hslToHex(0, 0, lightness);
      }
    }

    // Generate accessibility-optimized text colors
    palette.accessibility = {
      textOnLight: this.findAccessibleTextColor(palette.variations['100']),
      textOnDark: this.findAccessibleTextColor(palette.variations['900']),
      lightBackground: palette.variations['100'],
      darkBackground: palette.variations['900']
    };

    return palette;
  }

  /**
   * Find accessible text color for a given background
   * @param {string} backgroundColor - Background color (hex)
   * @param {string} level - WCAG level ('AA' or 'AAA')
   * @returns {string} Accessible text color (hex)
   */
  static findAccessibleTextColor(backgroundColor, level = 'AA') {
    const candidates = ['#000000', '#ffffff', '#333333', '#666666', '#999999', '#cccccc'];
    
    for (const textColor of candidates) {
      const validation = this.validateAccessibility(textColor, backgroundColor, level);
      if (validation.passes) {
        return textColor;
      }
    }

    // If no candidate passes, generate a suitable color
    const bgLuminance = this.getLuminance(backgroundColor);
    return bgLuminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Generate complementary color scheme
   * @param {string} baseColor - Base hex color
   * @returns {Object} Complementary color scheme
   */
  static generateComplementaryScheme(baseColor) {
    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return null;

    return {
      primary: baseColor,
      complementary: this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      triadic: [
        this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
      ],
      analogous: [
        this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
      ],
      splitComplementary: [
        this.hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l)
      ]
    };
  }

  /**
   * Generate monochromatic color scheme
   * @param {string} baseColor - Base hex color
   * @param {number} steps - Number of variations
   * @returns {Array} Monochromatic color array
   */
  static generateMonochromaticScheme(baseColor, steps = 7) {
    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return [];

    const colors = [];
    const lightnessStep = 80 / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const lightness = 10 + (lightnessStep * i);
      colors.push(this.hslToHex(hsl.h, hsl.s, lightness));
    }

    return colors;
  }

  /**
   * Optimize color palette for accessibility
   * @param {Object} palette - Color palette object
   * @param {string} level - WCAG level ('AA' or 'AAA')
   * @returns {Object} Optimized color palette
   */
  static optimizeForAccessibility(palette, level = 'AA') {
    const optimized = { ...palette };

    // Optimize text colors
    if (palette.text) {
      Object.keys(palette.text).forEach(key => {
        const textColor = palette.text[key];
        const backgroundColor = palette.background || '#ffffff';
        
        const validation = this.validateAccessibility(textColor, backgroundColor, level);
        if (!validation.passes) {
          optimized.text[key] = this.findAccessibleTextColor(backgroundColor, level);
        }
      });
    }

    // Optimize semantic colors
    if (palette.semantic) {
      Object.keys(palette.semantic).forEach(key => {
        const color = palette.semantic[key];
        const backgroundColor = palette.background || '#ffffff';
        
        const validation = this.validateAccessibility(color, backgroundColor, level);
        if (!validation.passes) {
          // Adjust lightness to meet accessibility requirements
          const hsl = this.hexToHsl(color);
          if (hsl) {
            const adjustedLightness = this.getLuminance(backgroundColor) > 0.5 ? 
              Math.max(10, hsl.l - 30) : Math.min(90, hsl.l + 30);
            optimized.semantic[key] = this.hslToHex(hsl.h, hsl.s, adjustedLightness);
          }
        }
      });
    }

    return optimized;
  }

  /**
   * Convert color to CSS-compatible format
   * @param {string} color - Color in any supported format
   * @param {string} format - Output format ('hex', 'rgb', 'hsl')
   * @param {number} alpha - Alpha channel (0-1)
   * @returns {string} CSS color value
   */
  static toCssColor(color, format = 'hex', alpha = 1) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    switch (format) {
      case 'rgb':
        return alpha < 1 ? 
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` :
          `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      
      case 'hsl':
        const hsl = this.hexToHsl(color);
        return alpha < 1 ?
          `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})` :
          `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      
      default:
        return color;
    }
  }

  /**
   * Generate color palette from brand colors
   * @param {Array} brandColors - Array of brand colors (hex)
   * @param {Object} options - Generation options
   * @returns {Object} Complete brand color palette
   */
  static generateBrandPalette(brandColors, options = {}) {
    const {
      includeNeutrals = true,
      includeSemantics = true,
      accessibilityLevel = 'AA'
    } = options;

    if (!brandColors || brandColors.length === 0) {
      throw new Error('At least one brand color is required');
    }

    const palette = {
      brand: {},
      extended: {},
      neutrals: {},
      semantic: {},
      accessibility: {}
    };

    // Process brand colors
    brandColors.forEach((color, index) => {
      const name = `brand-${index + 1}`;
      palette.brand[name] = color;
      palette.extended[name] = this.generatePalette(color, { steps: 9 });
    });

    // Generate neutral colors
    if (includeNeutrals) {
      const primaryColor = brandColors[0];
      const hsl = this.hexToHsl(primaryColor);
      palette.neutrals = this.generatePalette(
        this.hslToHex(hsl.h, 5, 50), // Desaturated version of primary
        { steps: 9, saturationAdjustment: -40 }
      );
    }

    // Generate semantic colors
    if (includeSemantics) {
      palette.semantic = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      };
    }

    // Optimize for accessibility
    palette.accessibility = this.optimizeForAccessibility(palette, accessibilityLevel);

    return palette;
  }
}

/**
 * Color Palette Generator Class
 * High-level interface for creating and managing color palettes
 */
class ColorPaletteGenerator {
  constructor() {
    this.savedPalettes = new Map();
  }

  /**
   * Create a new color palette
   * @param {string} name - Palette name
   * @param {Object} config - Palette configuration
   * @returns {Object} Generated palette
   */
  createPalette(name, config) {
    const {
      baseColors = [],
      type = 'custom',
      options = {}
    } = config;

    let palette;

    switch (type) {
      case 'monochromatic':
        palette = ColorPaletteUtils.generateMonochromaticScheme(baseColors[0], options.steps);
        break;
      case 'complementary':
        palette = ColorPaletteUtils.generateComplementaryScheme(baseColors[0]);
        break;
      case 'brand':
        palette = ColorPaletteUtils.generateBrandPalette(baseColors, options);
        break;
      default:
        palette = ColorPaletteUtils.generatePalette(baseColors[0], options);
    }

    const paletteData = {
      id: this.generatePaletteId(),
      name,
      type,
      colors: palette,
      config,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    this.savedPalettes.set(paletteData.id, paletteData);
    return paletteData;
  }

  /**
   * Get saved palette by ID
   * @param {string} paletteId - Palette identifier
   * @returns {Object|null} Palette data or null if not found
   */
  getPalette(paletteId) {
    return this.savedPalettes.get(paletteId) || null;
  }

  /**
   * Get all saved palettes
   * @returns {Array} Array of saved palettes
   */
  getAllPalettes() {
    return Array.from(this.savedPalettes.values());
  }

  /**
   * Delete saved palette
   * @param {string} paletteId - Palette identifier
   * @returns {boolean} Success status
   */
  deletePalette(paletteId) {
    return this.savedPalettes.delete(paletteId);
  }

  /**
   * Generate unique palette ID
   * @returns {string} Unique palette identifier
   */
  generatePaletteId() {
    return `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export palette to JSON
   * @param {string} paletteId - Palette identifier
   * @returns {string} JSON representation
   */
  exportPalette(paletteId) {
    const palette = this.getPalette(paletteId);
    if (!palette) {
      throw new Error(`Palette not found: ${paletteId}`);
    }
    return JSON.stringify(palette, null, 2);
  }

  /**
   * Import palette from JSON
   * @param {string} paletteJson - JSON palette data
   * @returns {Object} Imported palette
   */
  importPalette(paletteJson) {
    const paletteData = JSON.parse(paletteJson);
    paletteData.id = this.generatePaletteId();
    paletteData.imported = new Date().toISOString();
    
    this.savedPalettes.set(paletteData.id, paletteData);
    return paletteData;
  }
}

// Export for Google Apps Script environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ColorPaletteUtils, ColorPaletteGenerator };
} else if (typeof global !== 'undefined') {
  global.ColorPaletteUtils = ColorPaletteUtils;
  global.ColorPaletteGenerator = ColorPaletteGenerator;
}