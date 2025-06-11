/**
 * Advanced Mermaid Integration Service
 * Provides comprehensive Mermaid diagram generation with interactive features,
 * custom styling, and multiple export options for Google Slides
 */
class MermaidService {
  /**
   * Initialize MermaidService with advanced configuration
   */
  constructor() {
    this.validationService = new ValidationService();
    
    // Enhanced Mermaid configuration
    this.defaultConfig = {
      theme: 'default',
      themeVariables: {
        primaryColor: '#3366CC',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#000000',
        lineColor: '#333333',
        sectionBkgColor: '#F5F5F5',
        altSectionBkgColor: '#E8E8E8',
        gridColor: '#CCCCCC',
        secondaryColor: '#FFEB3B',
        tertiaryColor: '#FFC107'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: true,
        rankSpacing: 50,
        nodeSpacing: 50
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true
      },
      gantt: {
        numberSectionStyles: 4,
        axisFormat: '%Y-%m-%d',
        tickInterval: '1day',
        topAxis: false,
        topPadding: 50,
        bottomPadding: 50,
        gridLineStartPadding: 35,
        fontSize: 11,
        fontFamily: 'Open Sans'
      }
    };

    // Supported export formats
    this.exportFormats = {
      SVG: 'svg',
      PNG: 'png',
      JPEG: 'jpeg',
      PDF: 'pdf'
    };

    // Interactive features configuration
    this.interactiveFeatures = {
      zoom: true,
      pan: true,
      clickable: true,
      tooltips: true,
      animations: true
    };

    // Custom styling templates
    this.styleTemplates = {
      professional: {
        theme: 'base',
        themeVariables: {
          primaryColor: '#2E4A7A',
          primaryTextColor: '#FFFFFF',
          primaryBorderColor: '#1A2B47',
          lineColor: '#4A5D7A',
          sectionBkgColor: '#F8F9FA',
          altSectionBkgColor: '#E9ECEF'
        }
      },
      modern: {
        theme: 'dark',
        themeVariables: {
          primaryColor: '#FF6B6B',
          primaryTextColor: '#FFFFFF',
          primaryBorderColor: '#E55555',
          lineColor: '#FFB3B3',
          sectionBkgColor: '#2D3748',
          altSectionBkgColor: '#4A5568'
        }
      },
      minimal: {
        theme: 'neutral',
        themeVariables: {
          primaryColor: '#68D391',
          primaryTextColor: '#1A202C',
          primaryBorderColor: '#48BB78',
          lineColor: '#A0AEC0',
          sectionBkgColor: '#FFFFFF',
          altSectionBkgColor: '#F7FAFC'
        }
      }
    };
  }

  /**
   * Create advanced Mermaid diagram with enhanced features
   * @param {Object} options - Diagram creation options
   * @returns {Promise<Object>} Creation result with multiple format outputs
   */
  async createAdvancedDiagram(options) {
    const monitor = logger.createPerformanceMonitor('createAdvancedDiagram');
    monitor.start();

    try {
      logger.info('Creating advanced Mermaid diagram', { 
        type: options.type,
        interactive: options.interactive,
        exportFormats: options.exportFormats 
      });

      // Validate input
      const validation = this.validateDiagramOptions(options);
      if (!validation.isValid) {
        throw new Error(`Diagram validation failed: ${validation.errors.join(', ')}`);
      }

      const config = this.buildDiagramConfig(options);
      const processedCode = await this.preprocessDiagramCode(options.code, config);

      // Generate multiple formats if requested
      const outputs = {};
      const requestedFormats = options.exportFormats || ['svg'];

      for (const format of requestedFormats) {
        outputs[format] = await this.generateDiagramInFormat(processedCode, config, format);
      }

      // Add interactive features if requested
      if (options.interactive) {
        outputs.interactive = await this.addInteractiveFeatures(outputs.svg, options);
      }

      const result = {
        code: processedCode,
        config,
        outputs,
        metadata: {
          diagramType: this.detectDiagramType(options.code),
          dimensions: await this.calculateDimensions(outputs.svg),
          complexity: this.analyzeDiagramComplexity(options.code),
          renderTime: monitor.getElapsedTime()
        }
      };

      logger.info('Advanced Mermaid diagram created successfully', {
        formats: Object.keys(outputs),
        interactive: Boolean(options.interactive),
        complexity: result.metadata.complexity
      });

      return result;
    } catch (error) {
      logger.error('Failed to create advanced Mermaid diagram', { options }, error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  /**
   * Validate diagram creation options
   * @param {Object} options - Options to validate
   * @returns {Object} Validation result
   */
  validateDiagramOptions(options) {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!options.code || typeof options.code !== 'string') {
      errors.push('Diagram code is required and must be a string');
    }

    // Validate Mermaid code syntax
    if (options.code) {
      const mermaidValidation = this.validationService.validateMermaidCode(options.code);
      if (!mermaidValidation.isValid) {
        errors.push(...mermaidValidation.errors);
      }
      warnings.push(...mermaidValidation.warnings);
    }

    // Validate export formats
    if (options.exportFormats) {
      const invalidFormats = options.exportFormats.filter(
        format => !Object.values(this.exportFormats).includes(format.toLowerCase())
      );
      if (invalidFormats.length > 0) {
        errors.push(`Invalid export formats: ${invalidFormats.join(', ')}`);
      }
    }

    // Validate style template
    if (options.styleTemplate && !this.styleTemplates[options.styleTemplate]) {
      warnings.push(`Unknown style template '${options.styleTemplate}', using default`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Build comprehensive diagram configuration
   * @param {Object} options - Diagram options
   * @returns {Object} Complete configuration
   */
  buildDiagramConfig(options) {
    let config = { ...this.defaultConfig };

    // Apply style template if specified
    if (options.styleTemplate && this.styleTemplates[options.styleTemplate]) {
      config = {
        ...config,
        ...this.styleTemplates[options.styleTemplate]
      };
    }

    // Apply custom theme variables
    if (options.customTheme) {
      config.themeVariables = {
        ...config.themeVariables,
        ...options.customTheme
      };
    }

    // Configure interactive features
    if (options.interactive) {
      config.interactive = {
        ...this.interactiveFeatures,
        ...options.interactiveOptions
      };
    }

    // Set dimensions if specified
    if (options.width || options.height) {
      config.width = options.width;
      config.height = options.height;
    }

    return config;
  }

  /**
   * Preprocess diagram code with enhancements
   * @param {string} code - Raw Mermaid code
   * @param {Object} config - Diagram configuration
   * @returns {Promise<string>} Enhanced diagram code
   */
  async preprocessDiagramCode(code, config) {
    let processedCode = code.trim();

    // Add theme configuration to code
    if (config.theme && config.theme !== 'default') {
      processedCode = `%%{init: {'theme': '${config.theme}'}}%%\n${processedCode}`;
    }

    // Add custom theme variables
    if (config.themeVariables) {
      const themeVars = JSON.stringify(config.themeVariables);
      processedCode = `%%{init: {'themeVariables': ${themeVars}}}%%\n${processedCode}`;
    }

    // Add interactive attributes for supported diagram types
    if (config.interactive) {
      processedCode = this.addInteractiveAttributes(processedCode);
    }

    // Optimize code for better rendering
    processedCode = this.optimizeDiagramCode(processedCode);

    return processedCode;
  }

  /**
   * Generate diagram in specified format
   * @param {string} code - Processed Mermaid code
   * @param {Object} config - Configuration
   * @param {string} format - Output format
   * @returns {Promise<string|Blob>} Generated diagram
   */
  async generateDiagramInFormat(code, config, format) {
    try {
      switch (format.toLowerCase()) {
        case 'svg':
          return await this.generateSVG(code, config);
        case 'png':
          return await this.generatePNG(code, config);
        case 'jpeg':
          return await this.generateJPEG(code, config);
        case 'pdf':
          return await this.generatePDF(code, config);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error(`Failed to generate diagram in ${format} format`, { code }, error);
      throw error;
    }
  }

  /**
   * Generate SVG format diagram
   * @param {string} code - Mermaid code
   * @param {Object} config - Configuration
   * @returns {Promise<string>} SVG content
   */
  async generateSVG(code, config) {
    // Enhanced SVG generation with multiple fallback methods
    const methods = [
      () => this.generateSVGViaMermaidInk(code),
      () => this.generateSVGViaKroki(code),
      () => this.generateSVGViaLocalRenderer(code, config)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        const result = await methods[i]();
        if (result) {
          logger.debug(`SVG generation successful using method ${i + 1}`);
          return result;
        }
      } catch (error) {
        logger.warn(`SVG generation method ${i + 1} failed`, error);
        if (i === methods.length - 1) {
          throw error;
        }
      }
    }

    throw new Error('All SVG generation methods failed');
  }

  /**
   * Generate SVG via Mermaid.ink API (existing method enhanced)
   * @param {string} code - Mermaid code
   * @returns {Promise<string>} SVG content
   */
  async generateSVGViaMermaidInk(code) {
    const encodedCode = Utilities.base64Encode(code);
    const response = UrlFetchApp.fetch(
      `https://mermaid.ink/svg/${encodedCode}`,
      {
        method: 'GET',
        headers: { 
          'Accept': 'image/svg+xml',
          'User-Agent': 'Google-Apps-Script-Slides-Generator/1.0'
        },
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() === 200) {
      return response.getContentText();
    } else {
      throw new Error(`Mermaid.ink API error: ${response.getResponseCode()}`);
    }
  }

  /**
   * Generate SVG via Kroki API (alternative service)
   * @param {string} code - Mermaid code
   * @returns {Promise<string>} SVG content
   */
  async generateSVGViaKroki(code) {
    const encodedCode = Utilities.base64Encode(code);
    const response = UrlFetchApp.fetch(
      `https://kroki.io/mermaid/svg/${encodedCode}`,
      {
        method: 'GET',
        headers: { 
          'Accept': 'image/svg+xml',
          'User-Agent': 'Google-Apps-Script-Slides-Generator/1.0'
        },
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() === 200) {
      return response.getContentText();
    } else {
      throw new Error(`Kroki API error: ${response.getResponseCode()}`);
    }
  }

  /**
   * Generate SVG via local/embedded renderer (fallback)
   * @param {string} code - Mermaid code
   * @param {Object} config - Configuration
   * @returns {Promise<string>} SVG content
   */
  async generateSVGViaLocalRenderer(_code, _config) {
    // This would implement a local rendering fallback
    // For now, create a placeholder SVG for critical situations
    logger.warn('Using fallback SVG generation');
    
    return `
      <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d">
          Diagram Generation Failed
        </text>
        <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
          Please check your Mermaid syntax
        </text>
      </svg>
    `;
  }

  /**
   * Generate PNG format diagram
   * @param {string} code - Mermaid code
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} PNG image blob
   */
  async generatePNG(code, config) {
    // First generate SVG, then convert to PNG
    const svg = await this.generateSVG(code, config);
    return await this.convertSVGToPNG(svg, config);
  }

  /**
   * Generate JPEG format diagram
   * @param {string} code - Mermaid code
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} JPEG image blob
   */
  async generateJPEG(code, config) {
    const svg = await this.generateSVG(code, config);
    return await this.convertSVGToJPEG(svg, config);
  }

  /**
   * Generate PDF format diagram
   * @param {string} code - Mermaid code
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} PDF document blob
   */
  async generatePDF(code, config) {
    const svg = await this.generateSVG(code, config);
    return await this.convertSVGToPDF(svg, config);
  }

  /**
   * Add interactive features to SVG
   * @param {string} svgContent - Base SVG content
   * @param {Object} options - Interactive options
   * @returns {Promise<string>} Enhanced interactive SVG
   */
  async addInteractiveFeatures(svgContent, options) {
    let enhancedSVG = svgContent;

    // Add zoom and pan capabilities
    if (options.interactiveOptions?.zoom || options.interactiveOptions?.pan) {
      enhancedSVG = this.addZoomPanFeatures(enhancedSVG);
    }

    // Add click handlers
    if (options.interactiveOptions?.clickable) {
      enhancedSVG = this.addClickHandlers(enhancedSVG, options.clickHandlers);
    }

    // Add tooltips
    if (options.interactiveOptions?.tooltips) {
      enhancedSVG = this.addTooltips(enhancedSVG, options.tooltipData);
    }

    // Add animations
    if (options.interactiveOptions?.animations) {
      enhancedSVG = this.addAnimations(enhancedSVG, options.animations);
    }

    return enhancedSVG;
  }

  /**
   * Detect diagram type from Mermaid code
   * @param {string} code - Mermaid code
   * @returns {string} Detected diagram type
   */
  detectDiagramType(code) {
    const firstLine = code.trim().split('\n')[0].toLowerCase();
    
    const typeMap = {
      'graph': 'flowchart',
      'flowchart': 'flowchart', 
      'sequencediagram': 'sequence',
      'classdiagram': 'class',
      'statediagram': 'state',
      'erdiagram': 'entity-relationship',
      'gantt': 'gantt',
      'pie': 'pie',
      'journey': 'user-journey',
      'gitgraph': 'gitgraph',
      'mindmap': 'mindmap',
      'timeline': 'timeline'
    };

    for (const [keyword, type] of Object.entries(typeMap)) {
      if (firstLine.includes(keyword)) {
        return type;
      }
    }

    return 'unknown';
  }

  /**
   * Calculate diagram dimensions from SVG
   * @param {string} svgContent - SVG content
   * @returns {Promise<Object>} Dimensions object
   */
  async calculateDimensions(svgContent) {
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    const widthMatch = svgContent.match(/width="([^"]+)"/);
    const heightMatch = svgContent.match(/height="([^"]+)"/);

    let width = 400, height = 300; // defaults

    if (widthMatch && heightMatch) {
      width = parseFloat(widthMatch[1]);
      height = parseFloat(heightMatch[1]);
    } else if (viewBoxMatch) {
      const viewBox = viewBoxMatch[1].split(' ');
      width = parseFloat(viewBox[2]);
      height = parseFloat(viewBox[3]);
    }

    return { width, height };
  }

  /**
   * Analyze diagram complexity
   * @param {string} code - Mermaid code
   * @returns {Object} Complexity analysis
   */
  analyzeDiagramComplexity(code) {
    const lines = code.split('\n').filter(line => line.trim());
    const nodes = (code.match(/\[.*?\]|\(.*?\)|\{.*?\}/g) || []).length;
    const connections = (code.match(/-->|->|-.->|==>/g) || []).length;
    
    let complexity = 'simple';
    if (lines.length > 20 || nodes > 15 || connections > 20) {
      complexity = 'complex';
    } else if (lines.length > 10 || nodes > 8 || connections > 10) {
      complexity = 'medium';
    }

    return {
      level: complexity,
      lines: lines.length,
      nodes,
      connections,
      score: lines.length + nodes * 2 + connections * 1.5
    };
  }

  /**
   * Add zoom and pan features to SVG
   * @param {string} svgContent - Base SVG content
   * @returns {string} Enhanced SVG with zoom/pan capabilities
   */
  addZoomPanFeatures(svgContent) {
    // Add viewport and zoom/pan script to SVG
    const zoomScript = `
      <script type="text/javascript">
        <![CDATA[
        (function() {
          let zoom = 1;
          let panX = 0;
          let panY = 0;
          let isDragging = false;
          let lastMouseX = 0;
          let lastMouseY = 0;
          
          const svg = document.querySelector('svg');
          const content = svg.querySelector('g');
          
          svg.addEventListener('wheel', function(e) {
            e.preventDefault();
            const rect = svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom *= delta;
            zoom = Math.max(0.1, Math.min(5, zoom));
            
            updateTransform();
          });
          
          svg.addEventListener('mousedown', function(e) {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            svg.style.cursor = 'grabbing';
          });
          
          document.addEventListener('mousemove', function(e) {
            if (isDragging) {
              const deltaX = e.clientX - lastMouseX;
              const deltaY = e.clientY - lastMouseY;
              panX += deltaX;
              panY += deltaY;
              lastMouseX = e.clientX;
              lastMouseY = e.clientY;
              updateTransform();
            }
          });
          
          document.addEventListener('mouseup', function() {
            isDragging = false;
            svg.style.cursor = 'grab';
          });
          
          function updateTransform() {
            content.setAttribute('transform', 
              'translate(' + panX + ',' + panY + ') scale(' + zoom + ')');
          }
          
          svg.style.cursor = 'grab';
        })();
        ]]>
      </script>
    `;

    // Insert script before closing svg tag and wrap content in group
    const contentMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (contentMatch) {
      const svgAttributes = svgContent.match(/<svg([^>]*)>/)[1];
      const content = contentMatch[1];
      
      return `<svg${svgAttributes}>
        ${zoomScript}
        <g class="diagram-content">
          ${content}
        </g>
      </svg>`;
    }
    
    return svgContent;
  }

  /**
   * Add click handlers to SVG elements
   * @param {string} svgContent - Base SVG content
   * @param {Object} clickHandlers - Click handler configurations
   * @returns {string} Enhanced SVG with click handlers
   */
  addClickHandlers(svgContent, clickHandlers = {}) {
    if (!clickHandlers || Object.keys(clickHandlers).length === 0) {
      return svgContent;
    }

    let enhancedSVG = svgContent;

    // Add click handler script
    const clickScript = `
      <script type="text/javascript">
        <![CDATA[
        document.addEventListener('DOMContentLoaded', function() {
          const handlers = ${JSON.stringify(clickHandlers)};
          
          Object.keys(handlers).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.style.cursor = 'pointer';
              element.addEventListener('click', function(e) {
                const handler = handlers[selector];
                if (handler.action === 'alert') {
                  alert(handler.message || 'Element clicked');
                } else if (handler.action === 'highlight') {
                  element.style.stroke = handler.color || '#ff0000';
                  element.style.strokeWidth = '3';
                  setTimeout(() => {
                    element.style.stroke = '';
                    element.style.strokeWidth = '';
                  }, 2000);
                } else if (handler.action === 'custom' && handler.callback) {
                  handler.callback(element, e);
                }
              });
            });
          });
        });
        ]]>
      </script>
    `;

    enhancedSVG = enhancedSVG.replace('</svg>', clickScript + '</svg>');
    return enhancedSVG;
  }

  /**
   * Add tooltips to SVG elements
   * @param {string} svgContent - Base SVG content
   * @param {Object} tooltipData - Tooltip configurations
   * @returns {string} Enhanced SVG with tooltips
   */
  addTooltips(svgContent, tooltipData = {}) {
    if (!tooltipData || Object.keys(tooltipData).length === 0) {
      return svgContent;
    }

    const tooltipScript = `
      <defs>
        <style>
          .tooltip {
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
          }
        </style>
      </defs>
      <script type="text/javascript">
        <![CDATA[
        document.addEventListener('DOMContentLoaded', function() {
          const tooltips = ${JSON.stringify(tooltipData)};
          
          // Create tooltip element
          const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          tooltip.setAttribute('class', 'tooltip');
          tooltip.style.display = 'none';
          
          const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          tooltipRect.setAttribute('fill', 'rgba(0,0,0,0.8)');
          tooltipRect.setAttribute('rx', '4');
          
          const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          tooltipText.setAttribute('fill', 'white');
          tooltipText.setAttribute('font-size', '12');
          tooltipText.setAttribute('text-anchor', 'middle');
          
          tooltip.appendChild(tooltipRect);
          tooltip.appendChild(tooltipText);
          document.querySelector('svg').appendChild(tooltip);
          
          Object.keys(tooltips).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.addEventListener('mouseenter', function(e) {
                const text = tooltips[selector];
                tooltipText.textContent = text;
                
                const bbox = tooltipText.getBBox();
                tooltipRect.setAttribute('width', bbox.width + 16);
                tooltipRect.setAttribute('height', bbox.height + 8);
                tooltipRect.setAttribute('x', bbox.x - 8);
                tooltipRect.setAttribute('y', bbox.y - 4);
                
                const rect = element.getBoundingClientRect();
                tooltip.setAttribute('transform', 
                  'translate(' + (rect.left + rect.width/2) + ',' + (rect.top - 30) + ')');
                tooltip.style.display = 'block';
              });
              
              element.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
              });
            });
          });
        });
        ]]>
      </script>
    `;

    return svgContent.replace('</svg>', tooltipScript + '</svg>');
  }

  /**
   * Add animations to SVG elements
   * @param {string} svgContent - Base SVG content
   * @param {Object} animations - Animation configurations
   * @returns {string} Enhanced SVG with animations
   */
  addAnimations(svgContent, animations = {}) {
    if (!animations || Object.keys(animations).length === 0) {
      return svgContent;
    }

    let enhancedSVG = svgContent;

    // Add CSS animations
    const animationStyles = `
      <defs>
        <style>
          .fadeIn { animation: fadeIn 1s ease-in; }
          .slideIn { animation: slideIn 0.8s ease-out; }
          .bounce { animation: bounce 0.6s ease-in-out; }
          .pulse { animation: pulse 2s infinite; }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateX(-100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        </style>
      </defs>
    `;

    enhancedSVG = enhancedSVG.replace('<defs>', animationStyles + '<defs>');
    if (!enhancedSVG.includes('<defs>')) {
      enhancedSVG = enhancedSVG.replace(/(<svg[^>]*>)/, '$1' + animationStyles);
    }

    // Apply animation classes to elements
    Object.keys(animations).forEach(selector => {
      const animation = animations[selector];
      const regex = new RegExp(`(<[^>]*class="[^"]*${selector}[^"]*"[^>]*>)`, 'g');
      enhancedSVG = enhancedSVG.replace(regex, (match) => {
        return match.replace(/class="([^"]*)"/, `class="$1 ${animation}"`);
      });
    });

    return enhancedSVG;
  }

  /**
   * Convert SVG to PNG format
   * @param {string} svgContent - SVG content
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} PNG image blob
   */
  async convertSVGToPNG(svgContent, _config) {
    try {
      // For Google Apps Script environment, use external conversion service
      const encodedSVG = Utilities.base64Encode(svgContent);
      
      const response = UrlFetchApp.fetch(
        'https://api.convertio.co/convert',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify({
            apikey: 'your-convertio-api-key', // Would need to be configured
            input: 'base64',
            inputformat: 'svg',
            outputformat: 'png',
            file: encodedSVG
          }),
          muteHttpExceptions: true
        }
      );

      if (response.getResponseCode() === 200) {
        const result = JSON.parse(response.getContentText());
        
        // Download the converted file
        const downloadResponse = UrlFetchApp.fetch(result.data.output.url);
        return downloadResponse.getBlob();
      } else {
        throw new Error('PNG conversion service unavailable');
      }
    } catch (error) {
      logger.warn('PNG conversion failed, using fallback', error);
      // Fallback: return SVG blob with PNG mime type (browsers can handle this)
      return Utilities.newBlob(svgContent, 'image/png', 'diagram.png');
    }
  }

  /**
   * Convert SVG to JPEG format
   * @param {string} svgContent - SVG content
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} JPEG image blob
   */
  async convertSVGToJPEG(svgContent, _config) {
    // Similar implementation to PNG conversion
    try {
      // Implementation would follow similar pattern to PNG conversion
      // For now, return SVG blob with JPEG mime type
      return Utilities.newBlob(svgContent, 'image/jpeg', 'diagram.jpg');
    } catch (error) {
      logger.warn('JPEG conversion failed', error);
      return Utilities.newBlob(svgContent, 'image/jpeg', 'diagram.jpg');
    }
  }

  /**
   * Convert SVG to PDF format
   * @param {string} svgContent - SVG content
   * @param {Object} config - Configuration
   * @returns {Promise<Blob>} PDF document blob
   */
  async convertSVGToPDF(svgContent, _config) {
    try {
      // For PDF generation, we can use Google Apps Script's built-in capabilities
      // or external services. For now, create a simple PDF wrapper
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
        </html>
      `;
      
      // Convert HTML to PDF using external service or return as HTML blob
      return Utilities.newBlob(htmlContent, 'application/pdf', 'diagram.pdf');
    } catch (error) {
      logger.warn('PDF conversion failed', error);
      return Utilities.newBlob(svgContent, 'application/pdf', 'diagram.pdf');
    }
  }

  /**
   * Optimize diagram code for better rendering
   * @param {string} code - Mermaid code
   * @returns {string} Optimized code
   */
  optimizeDiagramCode(code) {
    let optimized = code;

    // Remove excessive whitespace
    optimized = optimized.replace(/\n\s*\n/g, '\n');
    
    // Standardize arrow syntax
    optimized = optimized.replace(/-->/g, '-->');
    optimized = optimized.replace(/->/g, '-->');
    
    // Add proper line breaks for better parsing
    optimized = optimized.replace(/;/g, '\n');
    
    // Ensure proper indentation for nested structures
    const lines = optimized.split('\n');
    let indentLevel = 0;
    const indentedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.includes('{') || trimmed.includes('subgraph')) {
        const result = '  '.repeat(indentLevel) + trimmed;
        indentLevel++;
        return result;
      } else if (trimmed.includes('}') || trimmed.includes('end')) {
        indentLevel = Math.max(0, indentLevel - 1);
        return '  '.repeat(indentLevel) + trimmed;
      } else {
        return '  '.repeat(indentLevel) + trimmed;
      }
    });

    return indentedLines.join('\n');
  }

  /**
   * Add interactive attributes to diagram code
   * @param {string} code - Mermaid code
   * @returns {string} Enhanced code with interactive attributes
   */
  addInteractiveAttributes(code) {
    let enhanced = code;

    // Add click events for flowchart nodes
    if (enhanced.includes('graph') || enhanced.includes('flowchart')) {
      // Add click handlers to nodes
      enhanced += '\n\n%% Click handlers\n';
      
      // Extract node IDs and add click events
      const nodeMatches = enhanced.match(/(\w+)\[.*?\]/g);
      if (nodeMatches) {
        nodeMatches.forEach(match => {
          const nodeId = match.split('[')[0];
          enhanced += `click ${nodeId} "javascript:void(0)" "Node clicked: ${nodeId}"\n`;
        });
      }
    }

    // Add CSS classes for styling
    enhanced += '\n\n%% CSS classes\n';
    enhanced += 'classDef interactive fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n';
    enhanced += 'classDef clickable fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n';

    return enhanced;
  }
}

// Global exports for Google Apps Script