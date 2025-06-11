/**
 * Theme Management Service
 * Comprehensive theme system for Google Slides content generation
 * Handles theme creation, management, persistence, and application
 */
class ThemeService {
  /**
   * Initialize ThemeService with design system integration
   */
  constructor() {
    this.themes = new Map();
    this.activeTheme = null;
    this.userPreferences = {};
    this.initializeDefaultThemes();
  }

  /**
   * Initialize default theme collection
   */
  initializeDefaultThemes() {
    const defaultThemes = [
      {
        id: 'modern-corporate',
        name: 'Modern Corporate',
        category: 'business',
        colors: {
          primary: '#1976d2',
          secondary: '#42a5f5',
          accent: '#ffc107',
          background: '#ffffff',
          surface: '#f5f5f5',
          text: {
            primary: '#212121',
            secondary: '#757575',
            disabled: '#bdbdbd',
            inverse: '#ffffff'
          },
          semantic: {
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196f3'
          }
        },
        typography: {
          fontFamily: {
            primary: 'Roboto',
            secondary: 'Arial',
            monospace: 'Roboto Mono'
          },
          fontSizes: {
            title: { default: 44, min: 36, max: 60 },
            heading: { default: 32, min: 28, max: 40 },
            subheading: { default: 28, min: 24, max: 32 },
            body: { default: 24, min: 20, max: 28 },
            caption: { default: 20, min: 18, max: 24 },
            footnote: { default: 16, min: 14, max: 18 }
          },
          fontWeights: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 700
          },
          lineHeights: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8
          }
        },
        spacing: {
          base: 8,
          scale: [4, 8, 16, 24, 32, 48, 64, 96],
          margins: {
            slide: { top: 48, right: 64, bottom: 48, left: 64 },
            content: { top: 24, right: 32, bottom: 24, left: 32 }
          }
        },
        effects: {
          shadows: {
            light: '0 2px 4px rgba(0,0,0,0.1)',
            medium: '0 4px 8px rgba(0,0,0,0.15)',
            heavy: '0 8px 16px rgba(0,0,0,0.2)'
          },
          borderRadius: {
            small: 4,
            medium: 8,
            large: 16
          },
          transitions: {
            fast: '0.15s ease-out',
            normal: '0.25s ease-out',
            slow: '0.4s ease-out'
          }
        },
        accessibility: {
          minimumContrast: 4.5,
          largeTextContrast: 3.0,
          focusRingColor: '#1976d2',
          focusRingWidth: 2
        },
        metadata: {
          version: '1.0.0',
          author: 'Google Slides Generator',
          created: new Date().toISOString(),
          tags: ['corporate', 'professional', 'blue']
        }
      },
      {
        id: 'warm-presentation',
        name: 'Warm Presentation',
        category: 'presentation',
        colors: {
          primary: '#e65100',
          secondary: '#ff9800',
          accent: '#ffc107',
          background: '#fff3e0',
          surface: '#ffffff',
          text: {
            primary: '#bf360c',
            secondary: '#8d6e63',
            disabled: '#bcaaa4',
            inverse: '#ffffff'
          },
          semantic: {
            success: '#8bc34a',
            warning: '#ff9800',
            error: '#f44336',
            info: '#03a9f4'
          }
        },
        typography: {
          fontFamily: {
            primary: 'Open Sans',
            secondary: 'Lato',
            monospace: 'Source Code Pro'
          },
          fontSizes: {
            title: { default: 48, min: 40, max: 64 },
            heading: { default: 36, min: 30, max: 44 },
            subheading: { default: 30, min: 26, max: 36 },
            body: { default: 26, min: 22, max: 30 },
            caption: { default: 22, min: 20, max: 26 },
            footnote: { default: 18, min: 16, max: 20 }
          },
          fontWeights: {
            light: 300,
            regular: 400,
            medium: 600,
            bold: 700
          },
          lineHeights: {
            tight: 1.1,
            normal: 1.4,
            relaxed: 1.7
          }
        },
        spacing: {
          base: 8,
          scale: [6, 12, 18, 30, 42, 54, 72, 108],
          margins: {
            slide: { top: 54, right: 72, bottom: 54, left: 72 },
            content: { top: 30, right: 36, bottom: 30, left: 36 }
          }
        },
        effects: {
          shadows: {
            light: '0 3px 6px rgba(230,81,0,0.1)',
            medium: '0 6px 12px rgba(230,81,0,0.15)',
            heavy: '0 12px 24px rgba(230,81,0,0.2)'
          },
          borderRadius: {
            small: 6,
            medium: 12,
            large: 24
          },
          transitions: {
            fast: '0.2s ease-out',
            normal: '0.3s ease-out',
            slow: '0.5s ease-out'
          }
        },
        accessibility: {
          minimumContrast: 4.5,
          largeTextContrast: 3.0,
          focusRingColor: '#e65100',
          focusRingWidth: 3
        },
        metadata: {
          version: '1.0.0',
          author: 'Google Slides Generator',
          created: new Date().toISOString(),
          tags: ['warm', 'presentation', 'orange', 'friendly']
        }
      },
      {
        id: 'minimal-dark',
        name: 'Minimal Dark',
        category: 'modern',
        colors: {
          primary: '#90caf9',
          secondary: '#81c784',
          accent: '#ffb74d',
          background: '#121212',
          surface: '#1e1e1e',
          text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
            disabled: '#737373',
            inverse: '#212121'
          },
          semantic: {
            success: '#81c784',
            warning: '#ffb74d',
            error: '#ef5350',
            info: '#64b5f6'
          }
        },
        typography: {
          fontFamily: {
            primary: 'Inter',
            secondary: 'System UI',
            monospace: 'JetBrains Mono'
          },
          fontSizes: {
            title: { default: 42, min: 34, max: 56 },
            heading: { default: 30, min: 26, max: 38 },
            subheading: { default: 26, min: 22, max: 30 },
            body: { default: 22, min: 18, max: 26 },
            caption: { default: 18, min: 16, max: 22 },
            footnote: { default: 14, min: 12, max: 16 }
          },
          fontWeights: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 600
          },
          lineHeights: {
            tight: 1.3,
            normal: 1.6,
            relaxed: 2.0
          }
        },
        spacing: {
          base: 8,
          scale: [4, 8, 12, 20, 32, 52, 84, 136],
          margins: {
            slide: { top: 40, right: 60, bottom: 40, left: 60 },
            content: { top: 20, right: 28, bottom: 20, left: 28 }
          }
        },
        effects: {
          shadows: {
            light: '0 2px 8px rgba(0,0,0,0.3)',
            medium: '0 4px 16px rgba(0,0,0,0.4)',
            heavy: '0 8px 32px rgba(0,0,0,0.5)'
          },
          borderRadius: {
            small: 2,
            medium: 4,
            large: 8
          },
          transitions: {
            fast: '0.1s ease-in-out',
            normal: '0.2s ease-in-out',
            slow: '0.3s ease-in-out'
          }
        },
        accessibility: {
          minimumContrast: 7.0,
          largeTextContrast: 4.5,
          focusRingColor: '#90caf9',
          focusRingWidth: 2
        },
        metadata: {
          version: '1.0.0',
          author: 'Google Slides Generator',
          created: new Date().toISOString(),
          tags: ['dark', 'minimal', 'modern', 'tech']
        }
      }
    ];

    // Load default themes into collection
    defaultThemes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });

    // Set default active theme
    this.activeTheme = defaultThemes[0];
  }

  /**
   * Create a new custom theme
   * @param {Object} themeConfig - Theme configuration
   * @returns {Object} Created theme
   */
  createTheme(themeConfig) {
    const theme = {
      id: themeConfig.id || this.generateThemeId(),
      name: themeConfig.name || 'Custom Theme',
      category: themeConfig.category || 'custom',
      colors: this.validateColorPalette(themeConfig.colors),
      typography: this.validateTypography(themeConfig.typography),
      spacing: this.validateSpacing(themeConfig.spacing),
      effects: this.validateEffects(themeConfig.effects),
      accessibility: this.validateAccessibility(themeConfig.accessibility),
      metadata: {
        version: themeConfig.version || '1.0.0',
        author: themeConfig.author || 'User',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: themeConfig.tags || []
      }
    };

    // Validate theme completeness
    const validationResult = this.validateTheme(theme);
    if (!validationResult.isValid) {
      throw new Error(`Theme validation failed: ${validationResult.errors.join(', ')}`);
    }

    this.themes.set(theme.id, theme);
    return theme;
  }

  /**
   * Get theme by ID
   * @param {string} themeId - Theme identifier
   * @returns {Object|null} Theme object or null if not found
   */
  getTheme(themeId) {
    return this.themes.get(themeId) || null;
  }

  /**
   * Get all themes with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} Array of themes
   */
  getThemes(filters = {}) {
    let themes = Array.from(this.themes.values());

    if (filters.category) {
      themes = themes.filter(theme => theme.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      themes = themes.filter(theme =>
        theme.metadata.tags.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.author) {
      themes = themes.filter(theme => theme.metadata.author === filters.author);
    }

    return themes.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Set active theme
   * @param {string} themeId - Theme identifier
   * @returns {boolean} Success status
   */
  setActiveTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      return false;
    }

    this.activeTheme = theme;
    this.updateUserPreference('activeTheme', themeId);
    return true;
  }

  /**
   * Get currently active theme
   * @returns {Object} Active theme
   */
  getActiveTheme() {
    return this.activeTheme;
  }

  /**
   * Apply theme to slide configuration
   * @param {Object} slideConfig - Slide configuration
   * @param {string} themeId - Theme to apply (optional, uses active theme if not specified)
   * @returns {Object} Themed slide configuration
   */
  applyTheme(slideConfig, themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.activeTheme;
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    return {
      ...slideConfig,
      theme: {
        colors: theme.colors,
        typography: theme.typography,
        spacing: theme.spacing,
        effects: theme.effects
      },
      styling: this.generateStylingRules(theme),
      accessibility: theme.accessibility
    };
  }

  /**
   * Generate CSS styling rules from theme
   * @param {Object} theme - Theme object
   * @returns {Object} CSS styling rules
   */
  generateStylingRules(theme) {
    return {
      background: {
        backgroundColor: theme.colors.background,
        backgroundImage: 'none'
      },
      text: {
        title: {
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily.primary,
          fontSize: `${theme.typography.fontSizes.title.default}px`,
          fontWeight: theme.typography.fontWeights.bold,
          lineHeight: theme.typography.lineHeights.tight
        },
        heading: {
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily.primary,
          fontSize: `${theme.typography.fontSizes.heading.default}px`,
          fontWeight: theme.typography.fontWeights.medium,
          lineHeight: theme.typography.lineHeights.normal
        },
        body: {
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily.primary,
          fontSize: `${theme.typography.fontSizes.body.default}px`,
          fontWeight: theme.typography.fontWeights.regular,
          lineHeight: theme.typography.lineHeights.normal
        }
      },
      elements: {
        surface: {
          backgroundColor: theme.colors.surface,
          borderRadius: `${theme.effects.borderRadius.medium}px`,
          boxShadow: theme.effects.shadows.light
        },
        accent: {
          backgroundColor: theme.colors.primary,
          color: theme.colors.text.inverse
        }
      }
    };
  }

  /**
   * Validate color palette structure
   * @param {Object} colors - Color configuration
   * @returns {Object} Validated color palette
   */
  validateColorPalette(colors = {}) {
    const defaultColors = {
      primary: '#2196f3',
      secondary: '#42a5f5',
      accent: '#ffc107',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#bdbdbd',
        inverse: '#ffffff'
      },
      semantic: {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3'
      }
    };

    return {
      ...defaultColors,
      ...colors,
      text: { ...defaultColors.text, ...colors.text },
      semantic: { ...defaultColors.semantic, ...colors.semantic }
    };
  }

  /**
   * Validate typography configuration
   * @param {Object} typography - Typography configuration
   * @returns {Object} Validated typography
   */
  validateTypography(typography = {}) {
    const defaultTypography = {
      fontFamily: {
        primary: 'Arial',
        secondary: 'Helvetica',
        monospace: 'Monaco'
      },
      fontSizes: {
        title: { default: 44, min: 36, max: 60 },
        heading: { default: 32, min: 28, max: 40 },
        subheading: { default: 28, min: 24, max: 32 },
        body: { default: 24, min: 20, max: 28 },
        caption: { default: 20, min: 18, max: 24 },
        footnote: { default: 16, min: 14, max: 18 }
      },
      fontWeights: {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700
      },
      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8
      }
    };

    return {
      ...defaultTypography,
      ...typography,
      fontFamily: { ...defaultTypography.fontFamily, ...typography.fontFamily },
      fontSizes: { ...defaultTypography.fontSizes, ...typography.fontSizes },
      fontWeights: { ...defaultTypography.fontWeights, ...typography.fontWeights },
      lineHeights: { ...defaultTypography.lineHeights, ...typography.lineHeights }
    };
  }

  /**
   * Validate spacing configuration
   * @param {Object} spacing - Spacing configuration
   * @returns {Object} Validated spacing
   */
  validateSpacing(spacing = {}) {
    const defaultSpacing = {
      base: 8,
      scale: [4, 8, 16, 24, 32, 48, 64, 96],
      margins: {
        slide: { top: 48, right: 64, bottom: 48, left: 64 },
        content: { top: 24, right: 32, bottom: 24, left: 32 }
      }
    };

    return {
      ...defaultSpacing,
      ...spacing,
      margins: {
        ...defaultSpacing.margins,
        ...spacing.margins
      }
    };
  }

  /**
   * Validate effects configuration
   * @param {Object} effects - Effects configuration
   * @returns {Object} Validated effects
   */
  validateEffects(effects = {}) {
    const defaultEffects = {
      shadows: {
        light: '0 2px 4px rgba(0,0,0,0.1)',
        medium: '0 4px 8px rgba(0,0,0,0.15)',
        heavy: '0 8px 16px rgba(0,0,0,0.2)'
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 16
      },
      transitions: {
        fast: '0.15s ease-out',
        normal: '0.25s ease-out',
        slow: '0.4s ease-out'
      }
    };

    return {
      ...defaultEffects,
      ...effects,
      shadows: { ...defaultEffects.shadows, ...effects.shadows },
      borderRadius: { ...defaultEffects.borderRadius, ...effects.borderRadius },
      transitions: { ...defaultEffects.transitions, ...effects.transitions }
    };
  }

  /**
   * Validate accessibility configuration
   * @param {Object} accessibility - Accessibility configuration
   * @returns {Object} Validated accessibility settings
   */
  validateAccessibility(accessibility = {}) {
    const defaultAccessibility = {
      minimumContrast: 4.5,
      largeTextContrast: 3.0,
      focusRingColor: '#2196f3',
      focusRingWidth: 2
    };

    return {
      ...defaultAccessibility,
      ...accessibility
    };
  }

  /**
   * Validate complete theme structure
   * @param {Object} theme - Theme object
   * @returns {Object} Validation result
   */
  validateTheme(theme) {
    const errors = [];

    // Required fields validation
    if (!theme.id) errors.push('Theme ID is required');
    if (!theme.name) errors.push('Theme name is required');
    if (!theme.colors) errors.push('Theme colors are required');
    if (!theme.typography) errors.push('Theme typography is required');

    // Color contrast validation
    if (theme.colors && theme.accessibility) {
      // Implementation would include actual contrast ratio calculations
      // For now, we'll assume basic validation
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique theme ID
   * @returns {string} Unique theme identifier
   */
  generateThemeId() {
    return `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update user preference
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   */
  updateUserPreference(key, value) {
    this.userPreferences[key] = value;
    // In production, this would persist to storage
  }

  /**
   * Export theme to JSON
   * @param {string} themeId - Theme identifier
   * @returns {string} JSON representation of theme
   */
  exportTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   * @param {string} themeJson - JSON theme data
   * @returns {Object} Imported theme
   */
  importTheme(themeJson) {
    let themeData;
    try {
      themeData = JSON.parse(themeJson);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    return this.createTheme(themeData);
  }

  /**
   * Clone existing theme with modifications
   * @param {string} sourceThemeId - Source theme ID
   * @param {Object} modifications - Theme modifications
   * @param {string} newName - New theme name
   * @returns {Object} Cloned theme
   */
  cloneTheme(sourceThemeId, modifications = {}, newName = null) {
    const sourceTheme = this.getTheme(sourceThemeId);
    if (!sourceTheme) {
      throw new Error(`Source theme not found: ${sourceThemeId}`);
    }

    const clonedTheme = {
      ...sourceTheme,
      ...modifications,
      id: this.generateThemeId(),
      name: newName || `${sourceTheme.name} (Copy)`,
      metadata: {
        ...sourceTheme.metadata,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'User'
      }
    };

    return this.createTheme(clonedTheme);
  }

  /**
   * Delete theme
   * @param {string} themeId - Theme identifier
   * @returns {boolean} Success status
   */
  deleteTheme(themeId) {
    if (!this.themes.has(themeId)) {
      return false;
    }

    // Prevent deletion of active theme
    if (this.activeTheme && this.activeTheme.id === themeId) {
      throw new Error('Cannot delete active theme');
    }

    this.themes.delete(themeId);
    return true;
  }

  /**
   * Get theme statistics
   * @returns {Object} Theme usage statistics
   */
  getThemeStats() {
    const themes = Array.from(this.themes.values());
    const categories = {};
    const authors = {};

    themes.forEach(theme => {
      categories[theme.category] = (categories[theme.category] || 0) + 1;
      authors[theme.metadata.author] = (authors[theme.metadata.author] || 0) + 1;
    });

    return {
      totalThemes: themes.length,
      categories,
      authors,
      activeTheme: this.activeTheme ? this.activeTheme.id : null
    };
  }
}

// Export for Google Apps Script environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeService;
} else if (typeof global !== 'undefined') {
  global.ThemeService = ThemeService;
}