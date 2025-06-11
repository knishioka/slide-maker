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
      'pie',
      'journey',
      'gitgraph',
      'mindmap',
      'timeline'
    ];

    this.SECURITY_PATTERNS = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /location\./gi,
      /fetch\s*\(/gi,
      /xmlhttprequest/gi,
      /iframe/gi
    ];

    this.MALICIOUS_KEYWORDS = [
      'alert',
      'confirm',
      'prompt',
      'document.cookie',
      'localStorage',
      'sessionStorage',
      'innerHTML',
      'outerHTML',
      'importScripts',
      'postMessage'
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
    if (!content || typeof content !== 'string') {
      return false;
    }

    const normalizedContent = content.toLowerCase();

    for (const pattern of this.SECURITY_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }

    for (const keyword of this.MALICIOUS_KEYWORDS) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Perform deep security validation on content
   * @param {string} content - Content to validate
   * @param {string} contentType - Type of content (svg, mermaid, text)
   * @returns {Object} Security validation result
   */
  performSecurityValidation(content, contentType = 'text') {
    const issues = [];
    const warnings = [];

    if (this.containsSuspiciousContent(content)) {
      issues.push(`Potentially malicious content detected in ${contentType}`);
    }

    if (content.length > 100000) {
      warnings.push(`${contentType} content is very large and may impact performance`);
    }

    const urlPattern = /https?:\/\/[^\s<>"]+/gi;
    const urls = content.match(urlPattern) || [];
    
    for (const url of urls) {
      if (!this.isValidUrl(url)) {
        warnings.push(`Invalid URL detected: ${url}`);
      } else if (!url.startsWith('https://')) {
        warnings.push(`Non-HTTPS URL detected: ${url}`);
      }
    }

    if (contentType === 'svg') {
      const dangerousSvgElements = ['foreignObject', 'use', 'script', 'animation'];
      for (const element of dangerousSvgElements) {
        if (content.toLowerCase().includes(`<${element}`)) {
          issues.push(`Potentially dangerous SVG element: ${element}`);
        }
      }
    }

    return {
      isSecure: issues.length === 0,
      issues,
      warnings,
      threatLevel: this.calculateThreatLevel(issues, warnings)
    };
  }

  /**
   * Calculate threat level based on security issues
   * @param {Array} issues - Security issues
   * @param {Array} warnings - Security warnings
   * @returns {string} Threat level (low, medium, high, critical)
   */
  calculateThreatLevel(issues, warnings) {
    if (issues.length === 0 && warnings.length === 0) {
      return 'none';
    }

    if (issues.length === 0) {
      return warnings.length > 2 ? 'low' : 'minimal';
    }

    if (issues.some(issue => issue.includes('script') || issue.includes('malicious'))) {
      return 'critical';
    }

    if (issues.length > 2) {
      return 'high';
    }

    return 'medium';
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

    let sanitized = text
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .trim();

    for (const keyword of this.MALICIOUS_KEYWORDS) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitized = sanitized.replace(regex, '[FILTERED]');
    }

    return sanitized;
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

  /**
   * Validate content structure for accessibility
   * @param {Object} content - Content to validate
   * @returns {Object} Accessibility validation result
   */
  validateAccessibility(content) {
    const issues = [];
    const suggestions = [];

    if (content.type === 'image' && !content.altText) {
      issues.push('Image missing alternative text for screen readers');
    }

    if (content.type === 'text' && content.fontSize && content.fontSize < 14) {
      suggestions.push('Consider using larger font size for better readability (minimum 14pt)');
    }

    if (content.color && content.backgroundColor) {
      const contrastRatio = this.calculateContrastRatio(content.color, content.backgroundColor);
      if (contrastRatio < 4.5) {
        issues.push('Text color and background color have insufficient contrast for accessibility');
      }
    }

    if (content.type === 'table' && content.data) {
      const hasHeaders = content.data.length > 0 && 
        content.data[0].every(cell => typeof cell === 'string' && cell.trim().length > 0);
      
      if (!hasHeaders) {
        suggestions.push('Consider adding header row to table for better accessibility');
      }
    }

    return {
      isAccessible: issues.length === 0,
      issues,
      suggestions,
      score: this.calculateAccessibilityScore(issues, suggestions)
    };
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} Contrast ratio
   */
  calculateContrastRatio(color1, color2) {
    const getLuminance = (hexColor) => {
      const rgb = this.hexToRgb(hexColor);
      if (!rgb) return 0;

      const sRGB = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color string
   * @returns {Object|null} RGB object or null
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculate accessibility score
   * @param {Array} issues - Accessibility issues
   * @param {Array} suggestions - Accessibility suggestions
   * @returns {number} Score from 0-100
   */
  calculateAccessibilityScore(issues, suggestions) {
    const baseScore = 100;
    const issueDeduction = issues.length * 20;
    const suggestionDeduction = suggestions.length * 5;
    
    return Math.max(0, baseScore - issueDeduction - suggestionDeduction);
  }

  /**
   * Validate content performance impact
   * @param {Object} content - Content to validate
   * @returns {Object} Performance validation result
   */
  validatePerformance(content) {
    const issues = [];
    const recommendations = [];

    if (content.type === 'image') {
      if (content.source && typeof content.source === 'string' && content.source.startsWith('http')) {
        recommendations.push('Consider using optimized images to improve loading performance');
      }
    }

    if (content.type === 'mermaid' && content.code) {
      const complexity = this.assessMermaidComplexity(content.code);
      if (complexity > 50) {
        issues.push('Mermaid diagram is very complex and may impact rendering performance');
      } else if (complexity > 25) {
        recommendations.push('Consider simplifying Mermaid diagram for better performance');
      }
    }

    if (content.type === 'table' && content.data) {
      const cellCount = content.data.reduce((total, row) => total + row.length, 0);
      if (cellCount > 200) {
        issues.push('Table has too many cells and may impact slide performance');
      } else if (cellCount > 100) {
        recommendations.push('Consider breaking large table into smaller sections');
      }
    }

    return {
      isOptimal: issues.length === 0,
      issues,
      recommendations,
      performanceScore: this.calculatePerformanceScore(issues, recommendations)
    };
  }

  /**
   * Assess Mermaid diagram complexity
   * @param {string} mermaidCode - Mermaid code
   * @returns {number} Complexity score
   */
  assessMermaidComplexity(mermaidCode) {
    const lines = mermaidCode.split('\n').length;
    const nodes = (mermaidCode.match(/\w+\[/g) || []).length;
    const connections = (mermaidCode.match(/-->/g) || []).length;
    
    return lines + nodes * 2 + connections;
  }

  /**
   * Calculate performance score
   * @param {Array} issues - Performance issues
   * @param {Array} recommendations - Performance recommendations
   * @returns {number} Score from 0-100
   */
  calculatePerformanceScore(issues, recommendations) {
    const baseScore = 100;
    const issueDeduction = issues.length * 25;
    const recommendationDeduction = recommendations.length * 5;
    
    return Math.max(0, baseScore - issueDeduction - recommendationDeduction);
  }

  // 外部データソース統合のための新しいバリデーション機能

  /**
   * 外部データソース設定のバリデーション
   * @param {Object} dataSourceConfig - データソース設定
   * @returns {Object} バリデーション結果
   */
  validateDataSourceConfig(dataSourceConfig) {
    const errors = [];
    const warnings = [];

    if (!dataSourceConfig || typeof dataSourceConfig !== 'object') {
      errors.push('データソース設定が必要です');
      return { isValid: false, errors, warnings };
    }

    // ソースタイプの検証
    const validSourceTypes = ['google-sheets', 'api', 'csv', 'json'];
    if (!dataSourceConfig.sourceType || !validSourceTypes.includes(dataSourceConfig.sourceType)) {
      errors.push(`無効なソースタイプです。有効な値: ${validSourceTypes.join(', ')}`);
    }

    // Google Sheets特有の検証
    if (dataSourceConfig.sourceType === 'google-sheets') {
      if (!dataSourceConfig.spreadsheetId) {
        errors.push('Google SheetsのスプレッドシートIDが必要です');
      } else if (typeof dataSourceConfig.spreadsheetId !== 'string') {
        errors.push('スプレッドシートIDは文字列である必要があります');
      }

      if (!dataSourceConfig.range) {
        warnings.push('範囲が指定されていません。デフォルト範囲を使用します');
      }
    }

    // API特有の検証
    if (dataSourceConfig.sourceType === 'api') {
      if (!dataSourceConfig.url) {
        errors.push('API URLが必要です');
      } else if (!this.isValidUrl(dataSourceConfig.url)) {
        errors.push('無効なAPI URLです');
      }

      // HTTPSの推奨
      if (dataSourceConfig.url && !dataSourceConfig.url.startsWith('https://')) {
        warnings.push('セキュリティのためHTTPS URLの使用を推奨します');
      }
    }

    // CSV特有の検証
    if (dataSourceConfig.sourceType === 'csv') {
      if (!dataSourceConfig.csvContent && !dataSourceConfig.csvUrl) {
        errors.push('CSVコンテンツまたはCSV URLが必要です');
      }

      if (dataSourceConfig.csvUrl && !this.isValidUrl(dataSourceConfig.csvUrl)) {
        errors.push('無効なCSV URLです');
      }
    }

    // 共通のオプション検証
    if (dataSourceConfig.options) {
      if (dataSourceConfig.options.maxRows && 
          (typeof dataSourceConfig.options.maxRows !== 'number' || dataSourceConfig.options.maxRows < 1)) {
        warnings.push('最大行数は1以上の数値である必要があります');
      }

      if (dataSourceConfig.options.maxSize && 
          (typeof dataSourceConfig.options.maxSize !== 'number' || dataSourceConfig.options.maxSize < 1024)) {
        warnings.push('最大サイズは1024バイト以上である必要があります');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeDataSourceConfig(dataSourceConfig)
    };
  }

  /**
   * データ変換設定のバリデーション
   * @param {Object} transformConfig - データ変換設定
   * @returns {Object} バリデーション結果
   */
  validateDataTransformConfig(transformConfig) {
    const errors = [];
    const warnings = [];

    if (!transformConfig || typeof transformConfig !== 'object') {
      return { isValid: true, errors, warnings, sanitized: {} }; // オプショナル
    }

    // コンテンツタイプの検証
    const validContentTypes = ['table', 'chart', 'text', 'list', 'card'];
    if (transformConfig.contentType && !validContentTypes.includes(transformConfig.contentType)) {
      errors.push(`無効なコンテンツタイプです。有効な値: ${validContentTypes.join(', ')}`);
    }

    // スキーマの検証
    if (transformConfig.schema && typeof transformConfig.schema !== 'object') {
      errors.push('スキーマはオブジェクトである必要があります');
    }

    // フィルタの検証
    if (transformConfig.filter && typeof transformConfig.filter !== 'object') {
      warnings.push('フィルタはオブジェクトである必要があります');
    }

    // ソート設定の検証
    if (transformConfig.sort) {
      if (typeof transformConfig.sort !== 'object') {
        warnings.push('ソート設定はオブジェクトである必要があります');
      } else if (transformConfig.sort.field && typeof transformConfig.sort.field !== 'string') {
        warnings.push('ソートフィールドは文字列である必要があります');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeDataTransformConfig(transformConfig)
    };
  }

  /**
   * 外部データの内容検証
   * @param {*} data - 検証対象データ
   * @param {Object} options - 検証オプション
   * @returns {Object} 検証結果
   */
  validateExternalData(data, options = {}) {
    const errors = [];
    const warnings = [];

    if (data == null) {
      errors.push('データが空またはnullです');
      return { isValid: false, errors, warnings };
    }

    // データサイズチェック
    const dataSize = this.calculateDataSize(data);
    const maxSize = options.maxSize || 1024 * 1024; // 1MB default

    if (dataSize > maxSize) {
      errors.push(`データサイズが制限を超過しています: ${dataSize} > ${maxSize}`);
    } else if (dataSize > maxSize * 0.8) {
      warnings.push(`データサイズが大きいです: ${dataSize} bytes`);
    }

    // 配列データの検証
    if (Array.isArray(data)) {
      const maxRows = options.maxRows || 10000;
      if (data.length > maxRows) {
        errors.push(`行数が制限を超過しています: ${data.length} > ${maxRows}`);
      }

      // 各要素の型チェック
      const dataTypes = new Set();
      data.slice(0, 100).forEach((item, index) => { // 最初の100件のみチェック
        dataTypes.add(typeof item);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const fieldCount = Object.keys(item).length;
          if (fieldCount > 50) {
            warnings.push(`行 ${index}: フィールド数が多すぎます (${fieldCount})`);
          }
        }
      });

      if (dataTypes.size > 1) {
        warnings.push('データ型が混在しています。一貫性を確保してください');
      }
    }

    // セキュリティチェック
    const securityResult = this.performSecurityValidation(JSON.stringify(data), 'external-data');
    if (!securityResult.isSecure) {
      errors.push(...securityResult.issues);
    }
    warnings.push(...securityResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        dataSize,
        recordCount: Array.isArray(data) ? data.length : 1,
        dataTypes: Array.isArray(data) ? Array.from(new Set(data.map(item => typeof item))) : [typeof data],
        securityThreatLevel: securityResult.threatLevel
      }
    };
  }

  /**
   * APIレスポンスの検証
   * @param {Object} response - APIレスポンス
   * @param {Object} options - 検証オプション
   * @returns {Object} 検証結果
   */
  validateApiResponse(response, options = {}) {
    const errors = [];
    const warnings = [];

    if (!response) {
      errors.push('APIレスポンスが空です');
      return { isValid: false, errors, warnings };
    }

    // レスポンスサイズチェック
    const responseSize = JSON.stringify(response).length;
    const maxSize = options.maxResponseSize || 10 * 1024 * 1024; // 10MB

    if (responseSize > maxSize) {
      errors.push(`APIレスポンスサイズが制限を超過: ${responseSize} > ${maxSize}`);
    }

    // 一般的なAPIエラー構造のチェック
    if (response.error || response.errors) {
      warnings.push('APIレスポンスにエラー情報が含まれています');
    }

    // ステータスコードチェック（存在する場合）
    if (response.status && typeof response.status === 'number') {
      if (response.status >= 400) {
        errors.push(`APIエラーステータス: ${response.status}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        responseSize,
        hasErrorField: !!(response.error || response.errors),
        topLevelFields: Object.keys(response)
      }
    };
  }

  /**
   * データソース設定のサニタイズ
   * @param {Object} config - 設定オブジェクト
   * @returns {Object} サニタイズされた設定
   */
  sanitizeDataSourceConfig(config) {
    const sanitized = {
      sourceType: config.sourceType,
      options: config.options || {}
    };

    if (config.sourceType === 'google-sheets') {
      sanitized.spreadsheetId = this.sanitizeText(config.spreadsheetId || '');
      sanitized.range = this.sanitizeText(config.range || 'A1:Z1000');
    }

    if (config.sourceType === 'api') {
      sanitized.url = config.url;
      if (config.headers) {
        sanitized.headers = {};
        Object.keys(config.headers).forEach(key => {
          sanitized.headers[this.sanitizeText(key)] = this.sanitizeText(config.headers[key]);
        });
      }
    }

    if (config.sourceType === 'csv') {
      if (config.csvContent) {
        sanitized.csvContent = this.sanitizeText(config.csvContent);
      }
      if (config.csvUrl) {
        sanitized.csvUrl = config.csvUrl;
      }
    }

    return sanitized;
  }

  /**
   * データ変換設定のサニタイズ
   * @param {Object} config - 変換設定
   * @returns {Object} サニタイズされた設定
   */
  sanitizeDataTransformConfig(config) {
    const sanitized = {};

    if (config.contentType) {
      sanitized.contentType = config.contentType;
    }

    if (config.schema && typeof config.schema === 'object') {
      sanitized.schema = config.schema;
    }

    if (config.mapping && typeof config.mapping === 'object') {
      sanitized.mapping = config.mapping;
    }

    if (config.filter && typeof config.filter === 'object') {
      sanitized.filter = config.filter;
    }

    if (config.sort && typeof config.sort === 'object') {
      sanitized.sort = config.sort;
    }

    return sanitized;
  }

  /**
   * データサイズの計算
   * @param {*} data - データ
   * @returns {number} バイト数
   */
  calculateDataSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 外部データソース接続の健全性チェック
   * @param {Object} config - データソース設定
   * @returns {Object} 健全性チェック結果
   */
  async validateDataSourceHealth(config) {
    const checks = [];
    let overallHealth = 'healthy';

    try {
      if (config.sourceType === 'api' && config.url) {
        // API疎通確認（実際には実行しない、設定の妥当性のみチェック）
        if (!this.isValidUrl(config.url)) {
          checks.push({ type: 'connectivity', status: 'error', message: '無効なURL' });
          overallHealth = 'error';
        } else {
          checks.push({ type: 'connectivity', status: 'ok', message: 'URL形式は有効' });
        }
      }

      if (config.sourceType === 'google-sheets' && config.spreadsheetId) {
        // スプレッドシートIDの形式チェック
        const idPattern = /^[a-zA-Z0-9-_]{44}$/;
        if (!idPattern.test(config.spreadsheetId)) {
          checks.push({ type: 'authentication', status: 'warning', message: 'スプレッドシートIDの形式が疑わしい' });
          if (overallHealth === 'healthy') overallHealth = 'warning';
        } else {
          checks.push({ type: 'authentication', status: 'ok', message: 'スプレッドシートID形式は有効' });
        }
      }

      // 認証設定チェック
      if (config.authToken) {
        if (typeof config.authToken !== 'string' || config.authToken.length < 10) {
          checks.push({ type: 'authentication', status: 'error', message: '認証トークンが無効' });
          overallHealth = 'error';
        } else {
          checks.push({ type: 'authentication', status: 'ok', message: '認証トークンが設定済み' });
        }
      }

    } catch (error) {
      checks.push({ type: 'general', status: 'error', message: `健全性チェックエラー: ${error.message}` });
      overallHealth = 'error';
    }

    return {
      overallHealth,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

// Global export for Google Apps Script
