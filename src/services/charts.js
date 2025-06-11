/**
 * Chart Generation Service
 * Provides comprehensive chart creation capabilities for Google Slides
 * Supports multiple chart types with theme integration and data validation
 */
class ChartService {
  /**
   * Initialize ChartService with chart configuration and constraints
   */
  constructor() {
    this.validationService = new ValidationService();
    
    this.SUPPORTED_CHART_TYPES = [
      'bar',
      'column',
      'line',
      'area',
      'pie',
      'scatter',
      'table',
      'combo',
      'gauge',
      'radar',
      'timeline',
      'bubble',
      'candlestick',
      'histogram',
      'treemap',
      'waterfall'
    ];

    this.CHART_CONSTRAINTS = {
      MIN_DATA_POINTS: 1,
      MAX_DATA_POINTS: 1000,
      MIN_SERIES: 1,
      MAX_SERIES: 20,
      MIN_WIDTH: 200,
      MAX_WIDTH: 1200,
      MIN_HEIGHT: 150,
      MAX_HEIGHT: 800,
      MAX_TITLE_LENGTH: 100,
      MAX_AXIS_LABEL_LENGTH: 50
    };

    this.DEFAULT_CHART_OPTIONS = {
      width: 600,
      height: 400,
      backgroundColor: '#ffffff',
      legend: 'bottom',
      titleFontSize: 16,
      axisFontSize: 12,
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
      gridlines: true,
      animation: true
    };

    this.CHART_TYPE_DEFAULTS = {
      bar: { orientation: 'horizontal', stacked: false },
      column: { orientation: 'vertical', stacked: false },
      line: { smooth: true, pointSize: 3 },
      area: { stacked: false, smooth: true },
      pie: { is3D: false, pieHole: 0 },
      scatter: { pointSize: 5, trendlines: false },
      table: { alternatingRowStyle: true, sortColumn: -1 },
      combo: { seriesType: 'columns', series: {} },
      gauge: { min: 0, max: 100, redFrom: 80, redTo: 100 },
      radar: { pointSize: 5, lineWidth: 2 },
      bubble: { bubble: { textStyle: { fontSize: 11 } } },
      histogram: { legend: 'none', bucketSize: 10 },
      treemap: { minColor: '#009688', midColor: '#f7f7f7', maxColor: '#ee8100' }
    };
  }

  /**
   * Create chart and insert into slide
   * @param {string} presentationId - Presentation ID
   * @param {number} slideIndex - Slide index
   * @param {Object} chartConfig - Chart configuration
   * @param {Object} position - Chart position {x, y, width, height}
   * @param {Object} theme - Theme configuration
   * @returns {Promise<Object>} Chart creation result
   */
  async createChart(presentationId, slideIndex, chartConfig, position, theme = null) {
    const monitor = logger.createPerformanceMonitor('createChart');
    monitor.start();

    try {
      logger.info('Creating chart', { 
        presentationId, 
        slideIndex, 
        chartType: chartConfig.chartType 
      });

      // Validate chart configuration
      const validation = this.validateChartConfig(chartConfig);
      if (!validation.isValid) {
        throw new Error(`Chart validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('Chart validation warnings', { warnings: validation.warnings });
      }

      // Apply theme to chart options
      const themedOptions = this.applyThemeToChart(validation.sanitized, theme);

      // Generate chart using Google Charts API
      const chartBlob = await this.generateChartImage(
        validation.sanitized.chartType,
        validation.sanitized.data,
        themedOptions
      );

      // Insert chart image into slide
      const slidesService = new SlidesService();
      const image = slidesService.insertImage(
        presentationId,
        slideIndex,
        chartBlob,
        position
      );

      logger.info('Chart created successfully', {
        presentationId,
        slideIndex,
        chartType: validation.sanitized.chartType
      });

      return {
        type: 'chart',
        chartType: validation.sanitized.chartType,
        position,
        image,
        dataPoints: this.countDataPoints(validation.sanitized.data),
        options: themedOptions
      };

    } catch (error) {
      logger.error('Chart creation failed', { presentationId, slideIndex, chartConfig }, error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  /**
   * Generate chart image using Google Charts API
   * @param {string} chartType - Chart type
   * @param {Array} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Promise<Blob>} Chart image blob
   */
  async generateChartImage(chartType, data, options) {
    try {
      logger.debug('Generating chart image', { chartType, dataLength: data.length });

      // Create data table
      const dataTable = this.createDataTable(data);

      // Create chart based on type
      const chart = this.createChartByType(chartType, options);

      // Configure chart with data and options
      this.configureChart(chart, dataTable, options);

      // Convert chart to image blob
      const chartBlob = chart.getAs('image/png');

      logger.debug('Chart image generated successfully', {
        chartType,
        blobSize: chartBlob.getBytes().length
      });

      return chartBlob;

    } catch (error) {
      logger.error('Chart image generation failed', { chartType, data, options }, error);
      throw new Error(`Failed to generate ${chartType} chart: ${error.message}`);
    }
  }

  /**
   * Create Google Charts DataTable from data array
   * @param {Array} data - Chart data (2D array)
   * @returns {GoogleAppsScript.Charts.DataTable} Data table
   */
  createDataTable(data) {
    const dataTable = Charts.newDataTable();

    if (data.length === 0) {
      throw new Error('Chart data cannot be empty');
    }

    // Add columns (first row defines column structure)
    const headers = data[0];
    headers.forEach((header, index) => {
      if (index === 0) {
        // First column is typically string (categories)
        dataTable.addColumn(Charts.ColumnType.STRING, String(header));
      } else {
        // Subsequent columns are numeric
        dataTable.addColumn(Charts.ColumnType.NUMBER, String(header));
      }
    });

    // Add data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const processedRow = row.map((value, index) => {
        if (index === 0) {
          return String(value); // First column as string
        } else {
          // Convert to number, handle non-numeric values
          const numValue = parseFloat(value);
          return isNaN(numValue) ? 0 : numValue;
        }
      });
      dataTable.addRow(processedRow);
    }

    return dataTable.build();
  }

  /**
   * Create chart object based on chart type
   * @param {string} chartType - Chart type
   * @param {Object} options - Chart options
   * @returns {GoogleAppsScript.Charts.Chart} Chart object
   */
  createChartByType(chartType, options) {
    const chartFactories = {
      bar: () => Charts.newBarChart(),
      column: () => Charts.newColumnChart(),
      line: () => Charts.newLineChart(),
      area: () => Charts.newAreaChart(),
      pie: () => Charts.newPieChart(),
      scatter: () => Charts.newScatterChart(),
      table: () => Charts.newTableChart(),
      combo: () => Charts.newComboChart(),
      gauge: () => Charts.newGaugeChart(),
      radar: () => Charts.newRadarChart(),
      timeline: () => Charts.newTimelineChart(),
      bubble: () => Charts.newBubbleChart(),
      candlestick: () => Charts.newCandlestickChart(),
      histogram: () => Charts.newHistogramChart(),
      treemap: () => Charts.newTreeMapChart(),
      waterfall: () => Charts.newWaterfallChart()
    };

    const factory = chartFactories[chartType];
    if (!factory) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }

    return factory();
  }

  /**
   * Configure chart with data table and options
   * @param {GoogleAppsScript.Charts.Chart} chart - Chart object
   * @param {GoogleAppsScript.Charts.DataTable} dataTable - Data table
   * @param {Object} options - Chart options
   */
  configureChart(chart, dataTable, options) {
    // Set data table
    chart.setDataTable(dataTable);

    // Apply general options
    if (options.title) {
      chart.setTitle(options.title);
    }

    if (options.width && options.height) {
      chart.setDimensions(options.width, options.height);
    }

    if (options.backgroundColor) {
      chart.setBackgroundColor(options.backgroundColor);
    }

    if (options.colors && Array.isArray(options.colors)) {
      chart.setColors(options.colors);
    }

    if (options.legend) {
      chart.setLegendPosition(this.convertLegendPosition(options.legend));
    }

    // Apply chart-type specific options
    this.applyTypeSpecificOptions(chart, options);
  }

  /**
   * Apply chart-type specific configuration options
   * @param {GoogleAppsScript.Charts.Chart} chart - Chart object
   * @param {Object} options - Chart options
   */
  applyTypeSpecificOptions(chart, options) {
    // Bar and Column chart options
    if (chart.setStacked && options.stacked !== undefined) {
      chart.setStacked(options.stacked);
    }

    // Line and Area chart options
    if (chart.setCurveStyle && options.smooth) {
      chart.setCurveStyle(Charts.CurveStyle.SMOOTH);
    }

    if (chart.setPointStyle && options.pointSize) {
      chart.setPointStyle(Charts.PointStyle.MEDIUM);
    }

    // Pie chart options
    if (chart.set3D && options.is3D) {
      chart.set3D(options.is3D);
    }

    // Table chart options
    if (chart.useAlternatingRowStyle && options.alternatingRowStyle) {
      chart.useAlternatingRowStyle(options.alternatingRowStyle);
    }

    if (chart.setInitialSortingAscending && options.sortColumn >= 0) {
      chart.setInitialSortingAscending(options.sortColumn);
    }

    // Range-based chart options (Gauge, etc.)
    if (chart.setRange && options.min !== undefined && options.max !== undefined) {
      chart.setRange(options.min, options.max);
    }
  }

  /**
   * Convert legend position string to Charts enum
   * @param {string} position - Legend position
   * @returns {GoogleAppsScript.Charts.Position} Charts position enum
   */
  convertLegendPosition(position) {
    const positions = {
      'top': Charts.Position.TOP,
      'bottom': Charts.Position.BOTTOM,
      'left': Charts.Position.LEFT,
      'right': Charts.Position.RIGHT,
      'none': Charts.Position.NONE
    };

    return positions[position.toLowerCase()] || Charts.Position.BOTTOM;
  }

  /**
   * Apply theme configuration to chart options
   * @param {Object} chartConfig - Chart configuration
   * @param {Object} theme - Theme configuration
   * @returns {Object} Themed chart options
   */
  applyThemeToChart(chartConfig, theme) {
    const options = {
      ...this.DEFAULT_CHART_OPTIONS,
      ...this.CHART_TYPE_DEFAULTS[chartConfig.chartType],
      ...chartConfig.options
    };

    if (theme) {
      // Apply theme colors
      if (theme.colorPalette && Array.isArray(theme.colorPalette)) {
        options.colors = theme.colorPalette.slice(0, this.CHART_CONSTRAINTS.MAX_SERIES);
      }

      // Apply theme fonts
      if (theme.fontFamily) {
        options.titleFontFamily = theme.fontFamily;
        options.axisFontFamily = theme.fontFamily;
        options.legendFontFamily = theme.fontFamily;
      }

      // Apply theme font sizes
      if (theme.titleFontSize) {
        options.titleFontSize = Math.min(theme.titleFontSize, 24);
      }

      if (theme.bodyFontSize) {
        options.axisFontSize = Math.min(theme.bodyFontSize * 0.8, 14);
      }

      // Apply theme background color
      if (theme.backgroundColor) {
        options.backgroundColor = theme.backgroundColor;
      }

      // Apply primary color for single-series charts
      if (theme.primaryColor && chartConfig.chartType === 'pie') {
        options.colors = [theme.primaryColor, theme.secondaryColor || '#cccccc'];
      }
    }

    // Merge with chart-specific title
    if (chartConfig.title) {
      options.title = chartConfig.title;
    }

    return options;
  }

  /**
   * Validate chart configuration
   * @param {Object} chartConfig - Chart configuration to validate
   * @returns {Object} Validation result
   */
  validateChartConfig(chartConfig) {
    const errors = [];
    const warnings = [];

    // Validate chart type
    if (!chartConfig.chartType) {
      errors.push('Chart type is required');
    } else if (!this.SUPPORTED_CHART_TYPES.includes(chartConfig.chartType)) {
      errors.push(`Unsupported chart type: ${chartConfig.chartType}. Supported types: ${this.SUPPORTED_CHART_TYPES.join(', ')}`);
    }

    // Validate data
    if (!chartConfig.data || !Array.isArray(chartConfig.data)) {
      errors.push('Chart data must be provided as an array');
    } else {
      const dataValidation = this.validateChartData(chartConfig.data, chartConfig.chartType);
      errors.push(...dataValidation.errors);
      warnings.push(...dataValidation.warnings);
    }

    // Validate title
    if (chartConfig.title && chartConfig.title.length > this.CHART_CONSTRAINTS.MAX_TITLE_LENGTH) {
      errors.push(`Chart title must be ${this.CHART_CONSTRAINTS.MAX_TITLE_LENGTH} characters or less`);
    }

    // Validate options
    if (chartConfig.options) {
      const optionsValidation = this.validateChartOptions(chartConfig.options);
      errors.push(...optionsValidation.errors);
      warnings.push(...optionsValidation.warnings);
    }

    // Sanitize configuration
    const sanitized = this.sanitizeChartConfig(chartConfig);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  /**
   * Validate chart data
   * @param {Array} data - Chart data array
   * @param {string} chartType - Chart type
   * @returns {Object} Data validation result
   */
  validateChartData(data, chartType) {
    const errors = [];
    const warnings = [];

    if (data.length < 2) {
      errors.push('Chart data must have at least 2 rows (header + data)');
      return { errors, warnings };
    }

    if (data.length > this.CHART_CONSTRAINTS.MAX_DATA_POINTS + 1) {
      warnings.push(`Chart has ${data.length - 1} data points. Large datasets may impact performance.`);
    }

    // Validate header row
    const headers = data[0];
    if (!Array.isArray(headers) || headers.length < 2) {
      errors.push('Chart data must have at least 2 columns (category + value)');
      return { errors, warnings };
    }

    if (headers.length > this.CHART_CONSTRAINTS.MAX_SERIES + 1) {
      warnings.push(`Chart has ${headers.length - 1} data series. Consider reducing for better readability.`);
    }

    // Validate data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) {
        errors.push(`Row ${i} must be an array`);
        continue;
      }

      if (row.length !== headers.length) {
        errors.push(`Row ${i} has ${row.length} columns, expected ${headers.length}`);
      }

      // Validate numeric data in value columns
      for (let j = 1; j < row.length; j++) {
        const value = row[j];
        if (typeof value !== 'number' && isNaN(parseFloat(value))) {
          warnings.push(`Row ${i}, Column ${j}: "${value}" is not numeric and will be treated as 0`);
        }
      }
    }

    // Chart-specific validations
    if (chartType === 'pie' && headers.length > 2) {
      warnings.push('Pie charts work best with single data series (2 columns)');
    }

    if (chartType === 'scatter' && headers.length < 3) {
      errors.push('Scatter charts require at least 3 columns (category, x-value, y-value)');
    }

    if (chartType === 'bubble' && headers.length < 4) {
      errors.push('Bubble charts require at least 4 columns (category, x-value, y-value, size)');
    }

    return { errors, warnings };
  }

  /**
   * Validate chart options
   * @param {Object} options - Chart options to validate
   * @returns {Object} Options validation result
   */
  validateChartOptions(options) {
    const errors = [];
    const warnings = [];

    // Validate dimensions
    if (options.width !== undefined) {
      const width = parseInt(options.width);
      if (isNaN(width) || width < this.CHART_CONSTRAINTS.MIN_WIDTH || width > this.CHART_CONSTRAINTS.MAX_WIDTH) {
        errors.push(`Chart width must be between ${this.CHART_CONSTRAINTS.MIN_WIDTH} and ${this.CHART_CONSTRAINTS.MAX_WIDTH} pixels`);
      }
    }

    if (options.height !== undefined) {
      const height = parseInt(options.height);
      if (isNaN(height) || height < this.CHART_CONSTRAINTS.MIN_HEIGHT || height > this.CHART_CONSTRAINTS.MAX_HEIGHT) {
        errors.push(`Chart height must be between ${this.CHART_CONSTRAINTS.MIN_HEIGHT} and ${this.CHART_CONSTRAINTS.MAX_HEIGHT} pixels`);
      }
    }

    // Validate colors
    if (options.colors && Array.isArray(options.colors)) {
      options.colors.forEach((color, index) => {
        if (!this.validationService.isValidColor(color)) {
          errors.push(`Color ${index + 1} "${color}" is not a valid hex color`);
        }
      });
    }

    // Validate background color
    if (options.backgroundColor && !this.validationService.isValidColor(options.backgroundColor)) {
      errors.push(`Background color "${options.backgroundColor}" is not a valid hex color`);
    }

    // Validate legend position
    if (options.legend && !['top', 'bottom', 'left', 'right', 'none'].includes(options.legend.toLowerCase())) {
      errors.push('Legend position must be one of: top, bottom, left, right, none');
    }

    // Validate font sizes
    if (options.titleFontSize !== undefined) {
      const fontSize = parseInt(options.titleFontSize);
      if (isNaN(fontSize) || fontSize < 8 || fontSize > 48) {
        errors.push('Title font size must be between 8 and 48 points');
      }
    }

    return { errors, warnings };
  }

  /**
   * Sanitize chart configuration
   * @param {Object} chartConfig - Chart configuration to sanitize
   * @returns {Object} Sanitized configuration
   */
  sanitizeChartConfig(chartConfig) {
    const sanitized = {
      chartType: chartConfig.chartType,
      data: this.sanitizeChartData(chartConfig.data),
      title: this.validationService.sanitizeText(chartConfig.title || ''),
      options: this.sanitizeChartOptions(chartConfig.options || {})
    };

    return sanitized;
  }

  /**
   * Sanitize chart data
   * @param {Array} data - Chart data to sanitize
   * @returns {Array} Sanitized data
   */
  sanitizeChartData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((row, rowIndex) => {
      if (!Array.isArray(row)) {
        return [];
      }

      return row.map((cell, cellIndex) => {
        if (cellIndex === 0) {
          // First column - category labels (strings)
          return this.validationService.sanitizeText(String(cell));
        } else {
          // Subsequent columns - numeric values
          const numValue = parseFloat(cell);
          return isNaN(numValue) ? 0 : numValue;
        }
      });
    });
  }

  /**
   * Sanitize chart options
   * @param {Object} options - Chart options to sanitize
   * @returns {Object} Sanitized options
   */
  sanitizeChartOptions(options) {
    const sanitized = {};

    // Sanitize dimensions
    if (options.width !== undefined) {
      const width = parseInt(options.width);
      if (!isNaN(width)) {
        sanitized.width = Math.max(this.CHART_CONSTRAINTS.MIN_WIDTH, 
          Math.min(width, this.CHART_CONSTRAINTS.MAX_WIDTH));
      }
    }

    if (options.height !== undefined) {
      const height = parseInt(options.height);
      if (!isNaN(height)) {
        sanitized.height = Math.max(this.CHART_CONSTRAINTS.MIN_HEIGHT, 
          Math.min(height, this.CHART_CONSTRAINTS.MAX_HEIGHT));
      }
    }

    // Sanitize colors
    if (options.colors && Array.isArray(options.colors)) {
      sanitized.colors = options.colors.filter(color => this.validationService.isValidColor(color));
    }

    // Sanitize background color
    if (options.backgroundColor && this.validationService.isValidColor(options.backgroundColor)) {
      sanitized.backgroundColor = options.backgroundColor;
    }

    // Sanitize text options
    if (options.legend && typeof options.legend === 'string') {
      sanitized.legend = options.legend.toLowerCase();
    }

    // Sanitize boolean options
    ['stacked', 'smooth', 'is3D', 'gridlines', 'animation', 'alternatingRowStyle'].forEach(prop => {
      if (options[prop] !== undefined) {
        sanitized[prop] = Boolean(options[prop]);
      }
    });

    // Sanitize numeric options
    ['titleFontSize', 'axisFontSize', 'pointSize', 'lineWidth', 'min', 'max'].forEach(prop => {
      if (options[prop] !== undefined) {
        const numValue = parseFloat(options[prop]);
        if (!isNaN(numValue)) {
          sanitized[prop] = numValue;
        }
      }
    });

    return sanitized;
  }

  /**
   * Count total data points in chart data
   * @param {Array} data - Chart data
   * @returns {number} Number of data points
   */
  countDataPoints(data) {
    if (!Array.isArray(data) || data.length <= 1) {
      return 0;
    }

    return (data.length - 1) * (data[0].length - 1);
  }

  /**
   * Get recommended chart type based on data structure
   * @param {Array} data - Chart data
   * @returns {Object} Chart type recommendation
   */
  getRecommendedChartType(data) {
    if (!Array.isArray(data) || data.length < 2) {
      return { type: 'column', confidence: 0, reason: 'Insufficient data' };
    }

    const headers = data[0];
    const dataRows = data.slice(1);
    const seriesCount = headers.length - 1;
    const dataPointCount = dataRows.length;

    // Single series recommendations
    if (seriesCount === 1) {
      if (dataPointCount <= 8) {
        return { type: 'pie', confidence: 0.8, reason: 'Small dataset, single series - pie chart shows proportions well' };
      } else {
        return { type: 'column', confidence: 0.7, reason: 'Single series with many points - column chart shows trends' };
      }
    }

    // Multiple series recommendations
    if (seriesCount <= 3) {
      if (dataPointCount > 20) {
        return { type: 'line', confidence: 0.8, reason: 'Multiple series, many points - line chart shows trends over time' };
      } else {
        return { type: 'column', confidence: 0.7, reason: 'Multiple series, moderate points - column chart compares values' };
      }
    }

    // Many series
    return { type: 'table', confidence: 0.6, reason: 'Many data series - table format may be more readable' };
  }

  /**
   * Generate chart preview for testing/validation
   * @param {Object} chartConfig - Chart configuration
   * @param {Object} theme - Theme configuration
   * @returns {Object} Preview information
   */
  generateChartPreview(chartConfig, theme = null) {
    try {
      const validation = this.validateChartConfig(chartConfig);
      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      const themedOptions = this.applyThemeToChart(validation.sanitized, theme);
      const dataPoints = this.countDataPoints(validation.sanitized.data);
      const recommendation = this.getRecommendedChartType(validation.sanitized.data);

      return {
        isValid: true,
        chartType: validation.sanitized.chartType,
        dataPoints,
        seriesCount: validation.sanitized.data[0].length - 1,
        estimatedSize: `${themedOptions.width}x${themedOptions.height}px`,
        recommendation,
        options: themedOptions,
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Preview generation failed: ${error.message}`],
        warnings: []
      };
    }
  }
}

// Global export for Google Apps Script