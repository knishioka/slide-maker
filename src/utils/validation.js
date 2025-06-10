/**
 * Input Validation and Sanitization Utilities
 * Provides comprehensive validation for Google Slides content generation
 */
class ValidationService {
  /**
   * Initialize ValidationService with validation constraints and rules
   */
  constructor() {
    this.SLIDE_CONSTRAINTS = {
      MIN_WIDTH: 320,
      MAX_WIDTH: 1920,
      MIN_HEIGHT: 240,
      MAX_HEIGHT: 1080,
      MIN_FONT_SIZE: 8,
      MAX_FONT_SIZE: 144,
      MAX_TEXT_LENGTH: 5000,
      MAX_SLIDES_PER_PRESENTATION: 100
    };

    this.ALLOWED_FONTS = [
      'Arial',
      'Calibri',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Verdana',
      'Tahoma',
      'Trebuchet MS'
    ];

    this.ALLOWED_LAYOUTS = ['single', 'double', 'custom'];

    this.MERMAID_TYPES = [
      'flowchart',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram',
      'erDiagram',
      'gantt',
      'pie'
    ];
  }

  /**
   * Validate presentation creation parameters
   * @param {Object} params - Presentation parameters
   * @returns {Object} Validation result
   */
  validatePresentationParams(params) {
    const errors = [];
    const warnings = [];

    if (!params.title || typeof params.title !== 'string') {
      errors.push('Presentation title is required and must be a string');
    } else if (params.title.length > 100) {
      errors.push('Presentation title must be 100 characters or less');
    }

    if (params.title && this.containsHtmlTags(params.title)) {
      warnings.push('Presentation title contains HTML tags which will be stripped');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: {
        title: this.sanitizeText(params.title || 'Untitled Presentation')
      }
    };
  }

  /**
   * Validate slide content parameters
   * @param {Object} content - Slide content object
   * @returns {Object} Validation result
   */
  validateSlideContent(content) {
    const errors = [];
    const warnings = [];

    if (!content || typeof content !== 'object') {
      errors.push('Slide content must be an object');
      return { isValid: false, errors, warnings };
    }

    if (content.text && typeof content.text !== 'string') {
      errors.push('Text content must be a string');
    } else if (content.text && content.text.length > this.SLIDE_CONSTRAINTS.MAX_TEXT_LENGTH) {
      errors.push(
        `Text content must be ${this.SLIDE_CONSTRAINTS.MAX_TEXT_LENGTH} characters or less`
      );
    }

    if (content.layout && !this.ALLOWED_LAYOUTS.includes(content.layout)) {
      errors.push(`Layout must be one of: ${this.ALLOWED_LAYOUTS.join(', ')}`);
    }

    if (content.fontFamily && !this.ALLOWED_FONTS.includes(content.fontFamily)) {
      warnings.push(`Font '${content.fontFamily}' is not in the recommended list`);
    }

    if (content.fontSize) {
      const fontSize = parseFloat(content.fontSize);
      if (
        isNaN(fontSize) ||
        fontSize < this.SLIDE_CONSTRAINTS.MIN_FONT_SIZE ||
        fontSize > this.SLIDE_CONSTRAINTS.MAX_FONT_SIZE
      ) {
        errors.push(
          `Font size must be between ${this.SLIDE_CONSTRAINTS.MIN_FONT_SIZE} and ${this.SLIDE_CONSTRAINTS.MAX_FONT_SIZE} points`
        );
      }
    }

    if (content.color && !this.isValidColor(content.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)');
    }

    if (content.position && !this.isValidPosition(content.position)) {
      errors.push('Position must contain valid x, y, width, and height values');
    }

    const sanitized = this.sanitizeSlideContent(content);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  /**
   * Validate image parameters
   * @param {Object} imageParams - Image parameters
   * @returns {Object} Validation result
   */
  validateImageParams(imageParams) {
    const errors = [];
    const warnings = [];

    if (!imageParams.source) {
      errors.push('Image source is required');
    } else if (typeof imageParams.source === 'string') {
      if (!this.isValidUrl(imageParams.source)) {
        errors.push('Image source must be a valid URL');
      }
    }

    if (imageParams.position && !this.isValidPosition(imageParams.position)) {
      errors.push('Image position must contain valid x, y, width, and height values');
    }

    if (imageParams.altText && typeof imageParams.altText !== 'string') {
      warnings.push('Alternative text should be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: {
        source: imageParams.source,
        position: imageParams.position,
        altText: this.sanitizeText(imageParams.altText || '')
      }
    };
  }

  /**
   * Validate table data
   * @param {Array} tableData - 2D array of table data
   * @returns {Object} Validation result
   */
  validateTableData(tableData) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(tableData)) {
      errors.push('Table data must be an array');
      return { isValid: false, errors, warnings };
    }

    if (tableData.length === 0) {
      warnings.push('Table data is empty');
    }

    let maxColumns = 0;
    tableData.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        errors.push(`Row ${rowIndex} must be an array`);
        return;
      }

      maxColumns = Math.max(maxColumns, row.length);

      row.forEach((cell, cellIndex) => {
        if (typeof cell !== 'string' && typeof cell !== 'number') {
          warnings.push(`Cell at row ${rowIndex}, column ${cellIndex} will be converted to string`);
        }
      });
    });

    if (maxColumns > 10) {
      warnings.push('Tables with more than 10 columns may not display well on slides');
    }

    if (tableData.length > 20) {
      warnings.push('Tables with more than 20 rows may not display well on slides');
    }

    const sanitized = tableData.map(row => row.map(cell => this.sanitizeText(String(cell))));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  /**
   * Validate Mermaid diagram code
   * @param {string} mermaidCode - Mermaid diagram code
   * @returns {Object} Validation result
   */
  validateMermaidCode(mermaidCode) {
    const errors = [];
    const warnings = [];

    if (!mermaidCode || typeof mermaidCode !== 'string') {
      errors.push('Mermaid code is required and must be a string');
      return { isValid: false, errors, warnings };
    }

    if (mermaidCode.length > 10000) {
      errors.push('Mermaid code is too long (maximum 10,000 characters)');
    }

    const trimmedCode = mermaidCode.trim();
    const firstLine = trimmedCode.split('\n')[0].toLowerCase();

    const hasValidType = this.MERMAID_TYPES.some(type => firstLine.includes(type.toLowerCase()));

    if (!hasValidType) {
      warnings.push('Mermaid diagram type not explicitly declared or not recognized');
    }

    if (this.containsSuspiciousContent(mermaidCode)) {
      errors.push('Mermaid code contains potentially malicious content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeMermaidCode(mermaidCode)
    };
  }

  /**
   * Validate SVG content
   * @param {string} svgContent - SVG content
   * @returns {Object} Validation result
   */
  validateSVGContent(svgContent) {
    const errors = [];
    const warnings = [];

    if (!svgContent || typeof svgContent !== 'string') {
      errors.push('SVG content is required and must be a string');
      return { isValid: false, errors, warnings };
    }

    if (!svgContent.trim().toLowerCase().startsWith('<svg')) {
      errors.push('Content must be a valid SVG starting with <svg> tag');
    }

    if (!svgContent.trim().toLowerCase().endsWith('</svg>')) {
      errors.push('SVG content must end with </svg> tag');
    }

    if (this.containsSuspiciousContent(svgContent)) {
      errors.push('SVG content contains potentially malicious content');
    }

    if (svgContent.length > 100000) {
      warnings.push('SVG content is very large and may cause performance issues');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeSVGContent(svgContent)
    };
  }

  /**
   * Check if string is a valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if string is a valid hex color
   * @param {string} color - Color string to validate
   * @returns {boolean} True if valid color
   */
  isValidColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Check if position object is valid
   * @param {Object} position - Position object {x, y, width, height}
   * @returns {boolean} True if valid position
   */
  isValidPosition(position) {
    if (!position || typeof position !== 'object') {
      return false;
    }

    const requiredKeys = ['x', 'y', 'width', 'height'];
    return requiredKeys.every(
      key => typeof position[key] === 'number' && !isNaN(position[key]) && position[key] >= 0
    );
  }

  /**
   * Check if content contains HTML tags
   * @param {string} text - Text to check
   * @returns {boolean} True if contains HTML tags
   */
  containsHtmlTags(text) {
    const htmlTagRegex = /<[^>]*>/g;
    return htmlTagRegex.test(text);
  }

  /**
   * Check for suspicious content that might be malicious
   * @param {string} content - Content to check
   * @returns {boolean} True if suspicious content found
   */
  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Sanitize text content
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .trim();
  }

  /**
   * Sanitize slide content object
   * @param {Object} content - Content to sanitize
   * @returns {Object} Sanitized content
   */
  sanitizeSlideContent(content) {
    const sanitized = {};

    if (content.text) {
      sanitized.text = this.sanitizeText(content.text);
    }

    if (content.title) {
      sanitized.title = this.sanitizeText(content.title);
    }

    if (content.layout && this.ALLOWED_LAYOUTS.includes(content.layout)) {
      sanitized.layout = content.layout;
    }

    if (content.fontFamily && this.ALLOWED_FONTS.includes(content.fontFamily)) {
      sanitized.fontFamily = content.fontFamily;
    }

    if (content.fontSize) {
      const fontSize = parseFloat(content.fontSize);
      if (
        !isNaN(fontSize) &&
        fontSize >= this.SLIDE_CONSTRAINTS.MIN_FONT_SIZE &&
        fontSize <= this.SLIDE_CONSTRAINTS.MAX_FONT_SIZE
      ) {
        sanitized.fontSize = fontSize;
      }
    }

    if (content.color && this.isValidColor(content.color)) {
      sanitized.color = content.color;
    }

    if (content.position && this.isValidPosition(content.position)) {
      sanitized.position = content.position;
    }

    return sanitized;
  }

  /**
   * Sanitize Mermaid code
   * @param {string} code - Mermaid code to sanitize
   * @returns {string} Sanitized code
   */
  sanitizeMermaidCode(code) {
    return code
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Sanitize SVG content
   * @param {string} svg - SVG content to sanitize
   * @returns {string} Sanitized SVG
   */
  sanitizeSVGContent(svg) {
    return svg
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/href\s*=\s*["']javascript:/gi, 'href="#"')
      .trim();
  }

  /**
   * Validate and sanitize bulk content
   * @param {Array} contentArray - Array of content objects
   * @returns {Object} Validation result with sanitized content
   */
  validateBulkContent(contentArray) {
    if (!Array.isArray(contentArray)) {
      return {
        isValid: false,
        errors: ['Content must be provided as an array'],
        warnings: [],
        sanitized: []
      };
    }

    const results = contentArray.map((content, index) => {
      const result = this.validateSlideContent(content);
      result.index = index;
      return result;
    });

    const errors = results.flatMap(r => r.errors.map(e => `Item ${r.index}: ${e}`));
    const warnings = results.flatMap(r => r.warnings.map(w => `Item ${r.index}: ${w}`));
    const sanitized = results.map(r => r.sanitized);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized,
      itemResults: results
    };
  }
}

// Global export for Google Apps Script
