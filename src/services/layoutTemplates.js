/**
 * Layout Templates for Google Slides Layout Engine
 * Pre-built layout patterns and template management system
 */
class LayoutTemplates {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize comprehensive layout template library
   * @returns {Object} Template library
   */
  initializeTemplates() {
    return {
      // Basic layouts
      'single-column': {
        name: 'Single Column',
        description: 'Simple single column layout for focused content',
        category: 'basic',
        areas: {
          content: '1 / 1 / 6 / 13'
        },
        defaultContent: ['body'],
        responsive: {
          xs: { areas: { content: '1 / 1 / 6 / 2' } },
          sm: { areas: { content: '1 / 1 / 6 / 2' } }
        }
      },

      'double-column': {
        name: 'Double Column',
        description: 'Two equal columns for balanced content',
        category: 'basic',
        areas: {
          left: '1 / 1 / 6 / 7',
          right: '1 / 7 / 6 / 13'
        },
        defaultContent: ['body', 'body'],
        responsive: {
          xs: { 
            areas: { 
              left: '1 / 1 / 3 / 2', 
              right: '3 / 1 / 6 / 2' 
            } 
          },
          sm: { 
            areas: { 
              left: '1 / 1 / 3 / 2', 
              right: '3 / 1 / 6 / 2' 
            } 
          }
        }
      },

      'triple-column': {
        name: 'Triple Column',
        description: 'Three equal columns for multi-faceted content',
        category: 'basic',
        areas: {
          left: '1 / 1 / 6 / 5',
          center: '1 / 5 / 6 / 9',
          right: '1 / 9 / 6 / 13'
        },
        defaultContent: ['body', 'body', 'body'],
        responsive: {
          xs: { 
            areas: { 
              left: '1 / 1 / 2 / 2', 
              center: '2 / 1 / 4 / 2', 
              right: '4 / 1 / 6 / 2' 
            } 
          },
          sm: { 
            areas: { 
              left: '1 / 1 / 2 / 2', 
              center: '2 / 1 / 4 / 2', 
              right: '4 / 1 / 6 / 2' 
            } 
          },
          md: {
            areas: {
              left: '1 / 1 / 3 / 7',
              center: '3 / 1 / 6 / 7',
              right: '1 / 7 / 6 / 13'
            }
          }
        }
      },

      // Header-based layouts
      'title-content': {
        name: 'Title and Content',
        description: 'Large title with content section below',
        category: 'header',
        areas: {
          title: '1 / 1 / 2 / 13',
          content: '2 / 1 / 6 / 13'
        },
        defaultContent: ['title', 'body'],
        responsive: {
          xs: { areas: { title: '1 / 1 / 2 / 2', content: '2 / 1 / 6 / 2' } }
        }
      },

      'hero-content': {
        name: 'Hero Section',
        description: 'Prominent hero area with supporting content',
        category: 'header',
        areas: {
          hero: '1 / 1 / 4 / 13',
          content: '4 / 1 / 6 / 13'
        },
        defaultContent: ['title', 'body'],
        styling: {
          hero: { background: 'gradient', fontSize: 1.5 },
          content: { fontSize: 1.0 }
        }
      },

      'header-two-column': {
        name: 'Header with Two Columns',
        description: 'Header spanning full width with two columns below',
        category: 'header',
        areas: {
          header: '1 / 1 / 2 / 13',
          left: '2 / 1 / 6 / 7',
          right: '2 / 7 / 6 / 13'
        },
        defaultContent: ['heading', 'body', 'body'],
        responsive: {
          xs: {
            areas: {
              header: '1 / 1 / 2 / 2',
              left: '2 / 1 / 4 / 2',
              right: '4 / 1 / 6 / 2'
            }
          }
        }
      },

      // Sidebar layouts
      'sidebar-main': {
        name: 'Sidebar and Main',
        description: 'Navigation sidebar with main content area',
        category: 'sidebar',
        areas: {
          sidebar: '1 / 1 / 6 / 4',
          main: '1 / 4 / 6 / 13'
        },
        defaultContent: ['list', 'body'],
        styling: {
          sidebar: { background: 'accent', fontSize: 0.9 },
          main: { fontSize: 1.0 }
        },
        responsive: {
          xs: {
            areas: {
              sidebar: '1 / 1 / 2 / 2',
              main: '2 / 1 / 6 / 2'
            }
          },
          sm: {
            areas: {
              sidebar: '1 / 1 / 2 / 2',
              main: '2 / 1 / 6 / 2'
            }
          }
        }
      },

      'right-sidebar': {
        name: 'Main with Right Sidebar',
        description: 'Main content with supplementary right sidebar',
        category: 'sidebar',
        areas: {
          main: '1 / 1 / 6 / 10',
          sidebar: '1 / 10 / 6 / 13'
        },
        defaultContent: ['body', 'caption'],
        responsive: {
          xs: {
            areas: {
              main: '1 / 1 / 4 / 2',
              sidebar: '4 / 1 / 6 / 2'
            }
          }
        }
      },

      // Grid layouts
      'quad-grid': {
        name: 'Four-Square Grid',
        description: 'Four equal quadrants in a 2x2 grid',
        category: 'grid',
        areas: {
          topLeft: '1 / 1 / 3 / 7',
          topRight: '1 / 7 / 3 / 13',
          bottomLeft: '3 / 1 / 6 / 7',
          bottomRight: '3 / 7 / 6 / 13'
        },
        defaultContent: ['body', 'body', 'body', 'body'],
        responsive: {
          xs: {
            areas: {
              topLeft: '1 / 1 / 2 / 2',
              topRight: '2 / 1 / 3 / 2',
              bottomLeft: '3 / 1 / 4 / 2',
              bottomRight: '4 / 1 / 6 / 2'
            }
          },
          sm: {
            areas: {
              topLeft: '1 / 1 / 2 / 2',
              topRight: '2 / 1 / 3 / 2',
              bottomLeft: '3 / 1 / 4 / 2',
              bottomRight: '4 / 1 / 6 / 2'
            }
          }
        }
      },

      'feature-showcase': {
        name: 'Feature Showcase',
        description: 'Title with three feature highlights below',
        category: 'grid',
        areas: {
          title: '1 / 1 / 2 / 13',
          feature1: '2 / 1 / 5 / 5',
          feature2: '2 / 5 / 5 / 9',
          feature3: '2 / 9 / 5 / 13',
          description: '5 / 1 / 6 / 13'
        },
        defaultContent: ['title', 'body', 'body', 'body', 'caption'],
        responsive: {
          xs: {
            areas: {
              title: '1 / 1 / 2 / 2',
              feature1: '2 / 1 / 3 / 2',
              feature2: '3 / 1 / 4 / 2',
              feature3: '4 / 1 / 5 / 2',
              description: '5 / 1 / 6 / 2'
            }
          }
        }
      },

      // Dashboard layouts
      'dashboard-overview': {
        name: 'Dashboard Overview',
        description: 'Dashboard-style layout with metrics and charts',
        category: 'dashboard',
        areas: {
          header: '1 / 1 / 2 / 13',
          kpi1: '2 / 1 / 4 / 4',
          kpi2: '2 / 4 / 4 / 7',
          kpi3: '2 / 7 / 4 / 10',
          kpi4: '2 / 10 / 4 / 13',
          chart: '4 / 1 / 6 / 8',
          summary: '4 / 8 / 6 / 13'
        },
        defaultContent: ['heading', 'body', 'body', 'body', 'body', 'chart', 'caption'],
        styling: {
          kpi1: { background: 'primary', color: 'white' },
          kpi2: { background: 'secondary', color: 'white' },
          kpi3: { background: 'success', color: 'white' },
          kpi4: { background: 'warning', color: 'dark' }
        }
      },

      // Presentation layouts
      'comparison-layout': {
        name: 'Comparison Layout',
        description: 'Side-by-side comparison with central divider',
        category: 'presentation',
        areas: {
          title: '1 / 1 / 2 / 13',
          leftTitle: '2 / 1 / 3 / 6',
          rightTitle: '2 / 8 / 3 / 13',
          leftContent: '3 / 1 / 6 / 6',
          divider: '2 / 6 / 6 / 8',
          rightContent: '3 / 8 / 6 / 13'
        },
        defaultContent: ['title', 'heading', 'heading', 'body', 'divider', 'body'],
        styling: {
          divider: { background: 'accent', width: 2 }
        }
      },

      'timeline-layout': {
        name: 'Timeline Layout',
        description: 'Vertical timeline with events and descriptions',
        category: 'presentation',
        areas: {
          title: '1 / 1 / 2 / 13',
          timeline: '2 / 6 / 6 / 8',
          event1: '2 / 1 / 3 / 6',
          event2: '3 / 8 / 4 / 13',
          event3: '4 / 1 / 5 / 6',
          event4: '5 / 8 / 6 / 13'
        },
        defaultContent: ['title', 'divider', 'body', 'body', 'body', 'body'],
        styling: {
          timeline: { background: 'primary', width: 4 }
        }
      },

      // Content-focused layouts
      'article-layout': {
        name: 'Article Layout',
        description: 'Article-style layout with title, subtitle, and body',
        category: 'content',
        areas: {
          title: '1 / 2 / 2 / 12',
          subtitle: '2 / 2 / 3 / 12',
          body: '3 / 2 / 6 / 12'
        },
        defaultContent: ['title', 'heading', 'body'],
        styling: {
          title: { alignment: 'center', fontSize: 1.5 },
          subtitle: { alignment: 'center', fontSize: 1.1 },
          body: { fontSize: 1.0, lineHeight: 1.6 }
        }
      },

      'magazine-layout': {
        name: 'Magazine Layout',
        description: 'Magazine-style asymmetric layout',
        category: 'content',
        areas: {
          headline: '1 / 1 / 3 / 8',
          image: '1 / 8 / 4 / 13',
          body1: '3 / 1 / 5 / 5',
          body2: '3 / 5 / 5 / 8',
          sidebar: '4 / 8 / 6 / 13',
          footer: '5 / 1 / 6 / 8'
        },
        defaultContent: ['title', 'image', 'body', 'body', 'caption', 'footnote']
      }
    };
  }

  /**
   * Get template by name
   * @param {string} templateName - Template identifier
   * @returns {Object} Template configuration
   */
  getTemplate(templateName) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    return { ...template, id: templateName };
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Array} Templates in category
   */
  getTemplatesByCategory(category) {
    return Object.entries(this.templates)
      .filter(([_, template]) => template.category === category)
      .map(([id, template]) => ({ ...template, id }));
  }

  /**
   * Get all available categories
   * @returns {Array} Available categories
   */
  getCategories() {
    const categories = [...new Set(Object.values(this.templates).map(t => t.category))];
    return categories.map(category => ({
      id: category,
      name: this.formatCategoryName(category),
      count: this.getTemplatesByCategory(category).length
    }));
  }

  /**
   * Search templates by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching templates
   */
  searchTemplates(criteria) {
    const { category, content, responsive, keyword } = criteria;
    
    return Object.entries(this.templates).filter(([id, template]) => {
      // Category filter
      if (category && template.category !== category) return false;
      
      // Content type filter
      if (content && !template.defaultContent.includes(content)) return false;
      
      // Responsive support filter
      if (responsive && !template.responsive) return false;
      
      // Keyword search
      if (keyword) {
        const searchText = `${template.name} ${template.description}`.toLowerCase();
        if (!searchText.includes(keyword.toLowerCase())) return false;
      }
      
      return true;
    }).map(([id, template]) => ({ ...template, id }));
  }

  /**
   * Create template configuration for layout engine
   * @param {string} templateName - Template name
   * @param {Object} options - Customization options
   * @returns {Object} Layout engine configuration
   */
  createLayoutConfig(templateName, options = {}) {
    const template = this.getTemplate(templateName);
    const {
      theme = 'default',
      customAreas = {},
      responsiveBreakpoint = null,
      content = template.defaultContent
    } = options;

    // Merge custom areas with template areas
    const areas = { ...template.areas, ...customAreas };

    // Apply responsive configuration if specified
    let finalAreas = areas;
    if (responsiveBreakpoint && template.responsive && template.responsive[responsiveBreakpoint]) {
      finalAreas = { ...areas, ...template.responsive[responsiveBreakpoint].areas };
    }

    return {
      templateId: templateName,
      templateName: template.name,
      layoutType: 'custom-grid',
      areas: finalAreas,
      content: this.mapContentToAreas(content, finalAreas),
      styling: template.styling || {},
      responsive: template.responsive || {},
      theme
    };
  }

  /**
   * Map content items to grid areas
   * @param {Array} content - Content items
   * @param {Object} areas - Grid areas
   * @returns {Array} Mapped content with area assignments
   */
  mapContentToAreas(content, areas) {
    const areaNames = Object.keys(areas);
    const mappedContent = [];

    areaNames.forEach((areaName, index) => {
      const contentItem = content[index] || { type: 'body', text: '' };
      mappedContent.push({
        ...contentItem,
        area: areaName,
        gridArea: areas[areaName]
      });
    });

    return mappedContent;
  }

  /**
   * Validate template configuration
   * @param {Object} template - Template to validate
   * @returns {Object} Validation result
   */
  validateTemplate(template) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!template.name) errors.push('Template name is required');
    if (!template.areas || Object.keys(template.areas).length === 0) {
      errors.push('Template must have at least one area');
    }

    // Validate grid area definitions
    if (template.areas) {
      Object.entries(template.areas).forEach(([name, area]) => {
        if (typeof area === 'string') {
          const parts = area.split('/').map(p => p.trim());
          if (parts.length !== 4) {
            errors.push(`Invalid area definition for ${name}: ${area}`);
          }
        }
      });
    }

    // Check responsive configurations
    if (template.responsive) {
      Object.entries(template.responsive).forEach(([breakpoint, config]) => {
        if (config.areas) {
          Object.entries(config.areas).forEach(([name, area]) => {
            if (!template.areas[name]) {
              warnings.push(`Responsive area ${name} not found in base template`);
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate preview data for template
   * @param {string} templateName - Template name
   * @returns {Object} Preview configuration
   */
  generatePreview(templateName) {
    const template = this.getTemplate(templateName);
    const areas = Object.keys(template.areas);
    
    const previewContent = areas.map((areaName, index) => {
      const contentType = template.defaultContent[index] || 'body';
      return {
        area: areaName,
        type: contentType,
        text: this.generateSampleText(contentType, areaName),
        preview: true
      };
    });

    return {
      templateId: templateName,
      name: template.name,
      description: template.description,
      areas: template.areas,
      content: previewContent,
      styling: template.styling || {}
    };
  }

  /**
   * Generate sample text for preview
   * @param {string} contentType - Type of content
   * @param {string} areaName - Area name for context
   * @returns {string} Sample text
   */
  generateSampleText(contentType, areaName) {
    const samples = {
      title: 'Sample Presentation Title',
      heading: `${areaName.charAt(0).toUpperCase() + areaName.slice(1)} Section`,
      body: 'This is sample body content that demonstrates how text will appear in this layout area. Content will wrap and flow naturally within the defined space.',
      caption: 'Sample caption text with additional details',
      footnote: 'Footnote information and attribution',
      list: '• First item\n• Second item\n• Third item'
    };

    return samples[contentType] || samples.body;
  }

  /**
   * Format category name for display
   * @param {string} category - Category identifier
   * @returns {string} Formatted name
   */
  formatCategoryName(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get template usage recommendations
   * @param {Object} requirements - Usage requirements
   * @returns {Array} Recommended templates
   */
  getRecommendations(requirements) {
    const { contentCount, contentTypes, screenSize, purpose } = requirements;

    let recommendations = [];

    // Content count-based recommendations
    if (contentCount === 1) {
      recommendations.push('single-column', 'article-layout');
    } else if (contentCount === 2) {
      recommendations.push('double-column', 'comparison-layout');
    } else if (contentCount <= 4) {
      recommendations.push('quad-grid', 'feature-showcase');
    }

    // Content type-based recommendations
    if (contentTypes.includes('title')) {
      recommendations.push('title-content', 'hero-content');
    }

    if (contentTypes.includes('chart')) {
      recommendations.push('dashboard-overview', 'sidebar-main');
    }

    // Screen size considerations
    if (screenSize === 'mobile') {
      recommendations = recommendations.filter(name => {
        const template = this.templates[name];
        return template.responsive && template.responsive.xs;
      });
    }

    return [...new Set(recommendations)].slice(0, 5);
  }
}

// Export for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutTemplates;
}