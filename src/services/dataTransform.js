/**
 * Data Transformation Service
 * Google Slides Content Generator - Data Processing & Transformation
 * 
 * 外部データソースから取得したデータの変換・正規化を行うサービス
 * JSON、CSV、API レスポンスの統一されたデータ形式への変換
 */

const Logger = require('../utils/logger.js');
const ValidationService = require('../utils/validation.js');

/**
 * データ変換サービス
 * - データ形式の統一
 * - 型変換とサニタイゼーション
 * - データマッピング
 * - 集計・フィルタリング
 */
class DataTransformService {
  constructor() {
    // データ型変換設定
    this.typeConverters = {
      string: (value) => String(value || ''),
      number: (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      },
      integer: (value) => {
        const num = parseInt(value);
        return isNaN(num) ? 0 : num;
      },
      boolean: (value) => {
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return ['true', '1', 'yes', 'on'].includes(str);
      },
      date: (value) => {
        if (value instanceof Date) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      },
      array: (value) => Array.isArray(value) ? value : [value],
      object: (value) => {
        if (typeof value === 'object' && value !== null) return value;
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
    };
  }

  /**
   * 統一データ形式への変換
   * @param {*} rawData - 元データ
   * @param {Object} schema - データスキーマ定義
   * @param {Object} options - 変換オプション
   * @returns {Promise<Object>} - 変換済みデータ
   */
  async transformToStandardFormat(rawData, schema, options = {}) {
    try {
      Logger.log('INFO', 'データ変換開始', {
        dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
        schemaFields: Object.keys(schema || {}).length
      });

      // データ形式判定と前処理
      const preprocessedData = await this.preprocessData(rawData, options);
      
      // スキーマ適用
      const transformedData = await this.applySchema(preprocessedData, schema, options);
      
      // 後処理（フィルタリング、集計等）
      const finalData = await this.postprocessData(transformedData, options);

      Logger.log('INFO', 'データ変換完了', {
        originalCount: Array.isArray(rawData) ? rawData.length : 1,
        transformedCount: Array.isArray(finalData) ? finalData.length : 1
      });

      return finalData;

    } catch (error) {
      Logger.log('ERROR', 'データ変換エラー', { error: error.toString() });
      throw new Error(`データ変換失敗: ${error.message}`);
    }
  }

  /**
   * Google Sheets データの変換
   * @param {Array} sheetsData - Google Sheets の生データ
   * @param {Object} options - 変換オプション
   * @returns {Promise<Array>} - 変換済みデータ
   */
  async transformGoogleSheetsData(sheetsData, options = {}) {
    try {
      if (!Array.isArray(sheetsData) || sheetsData.length === 0) {
        return [];
      }

      const {
        hasHeader = true,
        headerRow = 0,
        dataStartRow = 1,
        columnMapping = null,
        includeEmptyRows = false
      } = options;

      Logger.log('INFO', 'Google Sheetsデータ変換開始', {
        totalRows: sheetsData.length,
        hasHeader,
        headerRow,
        dataStartRow
      });

      let headers = [];
      let transformedData = [];

      // ヘッダー行の処理
      if (hasHeader && sheetsData.length > headerRow) {
        headers = sheetsData[headerRow].map((header, index) => {
          const cleanHeader = String(header || '').trim();
          return cleanHeader || `column_${index + 1}`;
        });
      }

      // データ行の変換
      for (let i = dataStartRow; i < sheetsData.length; i++) {
        const row = sheetsData[i];
        
        // 空行スキップ判定
        if (!includeEmptyRows && this.isEmptyRow(row)) {
          continue;
        }

        const transformedRow = await this.transformSheetRow(row, headers, columnMapping, options);
        if (transformedRow) {
          transformedData.push(transformedRow);
        }
      }

      Logger.log('INFO', 'Google Sheetsデータ変換完了', {
        originalRows: sheetsData.length - dataStartRow,
        transformedRows: transformedData.length,
        headers: headers.length
      });

      return transformedData;

    } catch (error) {
      Logger.log('ERROR', 'Google Sheetsデータ変換エラー', { error: error.toString() });
      throw new Error(`Google Sheetsデータ変換失敗: ${error.message}`);
    }
  }

  /**
   * API レスポンスデータの変換
   * @param {Object} apiData - API レスポンスデータ
   * @param {Object} mapping - データマッピング定義
   * @param {Object} options - 変換オプション
   * @returns {Promise<*>} - 変換済みデータ
   */
  async transformApiResponse(apiData, mapping, options = {}) {
    try {
      Logger.log('INFO', 'APIレスポンス変換開始', {
        hasMapping: !!mapping,
        dataKeys: typeof apiData === 'object' ? Object.keys(apiData).length : 0
      });

      // データ抽出パスの処理
      let extractedData = apiData;
      if (mapping && mapping.dataPath) {
        extractedData = this.extractDataByPath(apiData, mapping.dataPath);
      }

      // フィールドマッピングの適用
      let mappedData = extractedData;
      if (mapping && mapping.fieldMapping) {
        mappedData = await this.mapFields(extractedData, mapping.fieldMapping, options);
      }

      // 配列データの場合は各要素を変換
      if (Array.isArray(mappedData)) {
        const transformedArray = [];
        for (const item of mappedData) {
          const transformedItem = await this.transformSingleItem(item, mapping, options);
          if (transformedItem !== null) {
            transformedArray.push(transformedItem);
          }
        }
        mappedData = transformedArray;
      } else {
        mappedData = await this.transformSingleItem(mappedData, mapping, options);
      }

      Logger.log('INFO', 'APIレスポンス変換完了', {
        resultType: Array.isArray(mappedData) ? 'array' : typeof mappedData,
        resultCount: Array.isArray(mappedData) ? mappedData.length : 1
      });

      return mappedData;

    } catch (error) {
      Logger.log('ERROR', 'APIレスポンス変換エラー', { error: error.toString() });
      throw new Error(`APIレスポンス変換失敗: ${error.message}`);
    }
  }

  /**
   * スライドコンテンツ用データの変換
   * @param {*} data - 変換対象データ
   * @param {string} contentType - コンテンツタイプ (table, chart, text, list)
   * @param {Object} options - 変換オプション
   * @returns {Promise<Object>} - スライド用データ
   */
  async transformForSlideContent(data, contentType, options = {}) {
    try {
      Logger.log('INFO', 'スライドコンテンツ変換開始', { contentType });

      let slideData;

      switch (contentType) {
        case 'table':
          slideData = await this.transformToTableData(data, options);
          break;
        case 'chart':
          slideData = await this.transformToChartData(data, options);
          break;
        case 'text':
          slideData = await this.transformToTextData(data, options);
          break;
        case 'list':
          slideData = await this.transformToListData(data, options);
          break;
        case 'card':
          slideData = await this.transformToCardData(data, options);
          break;
        default:
          throw new Error(`未対応のコンテンツタイプ: ${contentType}`);
      }

      // コンテンツの最終検証
      await this.validateSlideContent(slideData, contentType);

      Logger.log('INFO', 'スライドコンテンツ変換完了', { contentType });
      return slideData;

    } catch (error) {
      Logger.log('ERROR', 'スライドコンテンツ変換エラー', { 
        contentType, 
        error: error.toString() 
      });
      throw new Error(`スライドコンテンツ変換失敗: ${error.message}`);
    }
  }

  /**
   * データの前処理
   * @param {*} rawData - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<*>} - 前処理済みデータ
   */
  async preprocessData(rawData, options = {}) {
    // null/undefined チェック
    if (rawData == null) {
      return options.defaultValue || null;
    }

    // 文字列の場合はJSONパースを試行
    if (typeof rawData === 'string') {
      try {
        return JSON.parse(rawData);
      } catch {
        return rawData;
      }
    }

    return rawData;
  }

  /**
   * スキーマの適用
   * @param {*} data - データ
   * @param {Object} schema - スキーマ定義
   * @param {Object} options - オプション
   * @returns {Promise<*>} - スキーマ適用済みデータ
   */
  async applySchema(data, schema, options = {}) {
    if (!schema || typeof schema !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.applySchemaToItem(item, schema, options)));
    } else {
      return this.applySchemaToItem(data, schema, options);
    }
  }

  /**
   * 単一アイテムへのスキーマ適用
   * @param {Object} item - データアイテム
   * @param {Object} schema - スキーマ定義
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - 変換済みアイテム
   */
  async applySchemaToItem(item, schema, options = {}) {
    const result = {};

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      try {
        let value = item[fieldName];
        
        // デフォルト値の適用
        if (value == null && fieldSchema.default !== undefined) {
          value = fieldSchema.default;
        }

        // 必須フィールドチェック
        if (fieldSchema.required && value == null) {
          if (options.strictMode) {
            throw new Error(`必須フィールドが不足: ${fieldName}`);
          }
          continue;
        }

        // 型変換
        if (value != null && fieldSchema.type) {
          const converter = this.typeConverters[fieldSchema.type];
          if (converter) {
            value = converter(value);
          }
        }

        // バリデーション
        if (value != null && fieldSchema.validate) {
          const isValid = await this.validateFieldValue(value, fieldSchema.validate, fieldName);
          if (!isValid && options.strictMode) {
            throw new Error(`フィールド検証失敗: ${fieldName}`);
          }
        }

        result[fieldName] = value;

      } catch (error) {
        Logger.log('WARN', 'フィールド変換エラー', { 
          fieldName, 
          error: error.toString() 
        });
        if (options.strictMode) {
          throw error;
        }
      }
    }

    return result;
  }

  /**
   * データの後処理
   * @param {*} data - データ
   * @param {Object} options - オプション
   * @returns {Promise<*>} - 後処理済みデータ
   */
  async postprocessData(data, options = {}) {
    let result = data;

    // フィルタリング
    if (options.filter && Array.isArray(result)) {
      result = result.filter(item => this.applyFilter(item, options.filter));
    }

    // ソート
    if (options.sort && Array.isArray(result)) {
      result = this.sortData(result, options.sort);
    }

    // 制限
    if (options.limit && Array.isArray(result)) {
      result = result.slice(0, options.limit);
    }

    // 集計
    if (options.aggregate) {
      result = await this.aggregateData(result, options.aggregate);
    }

    return result;
  }

  /**
   * テーブルデータへの変換
   * @param {Array} data - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - テーブルデータ
   */
  async transformToTableData(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('テーブル変換にはArray形式のデータが必要です');
    }

    const maxRows = options.maxRows || 100;
    const maxCols = options.maxCols || 20;

    // ヘッダーの生成
    const headers = options.headers || this.extractHeaders(data);
    
    // データ行の生成
    const rows = data.slice(0, maxRows).map(item => {
      if (Array.isArray(item)) {
        return item.slice(0, maxCols);
      } else if (typeof item === 'object') {
        return headers.slice(0, maxCols).map(header => item[header] || '');
      } else {
        return [String(item)];
      }
    });

    return {
      type: 'table',
      headers: headers.slice(0, maxCols),
      rows: rows,
      metadata: {
        totalRows: data.length,
        totalCols: headers.length,
        truncated: data.length > maxRows || headers.length > maxCols
      }
    };
  }

  /**
   * チャートデータへの変換
   * @param {Array} data - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - チャートデータ
   */
  async transformToChartData(data, options = {}) {
    const chartType = options.chartType || 'bar';
    const xField = options.xField || 'x';
    const yField = options.yField || 'y';

    const chartData = {
      type: 'chart',
      chartType: chartType,
      data: [],
      labels: [],
      metadata: {
        xField,
        yField,
        dataPoints: 0
      }
    };

    if (Array.isArray(data)) {
      for (const item of data) {
        const xValue = item[xField] || item.name || item.label;
        const yValue = this.typeConverters.number(item[yField] || item.value);
        
        if (xValue != null && !isNaN(yValue)) {
          chartData.labels.push(String(xValue));
          chartData.data.push(yValue);
        }
      }
    }

    chartData.metadata.dataPoints = chartData.data.length;
    return chartData;
  }

  /**
   * テキストデータへの変換
   * @param {*} data - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - テキストデータ
   */
  async transformToTextData(data, options = {}) {
    const textField = options.textField || 'text';
    const maxLength = options.maxLength || 1000;

    let text = '';
    
    if (Array.isArray(data)) {
      text = data.map(item => {
        if (typeof item === 'object') {
          return item[textField] || JSON.stringify(item);
        }
        return String(item);
      }).join('\n');
    } else if (typeof data === 'object') {
      text = data[textField] || JSON.stringify(data, null, 2);
    } else {
      text = String(data);
    }

    return {
      type: 'text',
      content: text.substring(0, maxLength),
      metadata: {
        originalLength: text.length,
        truncated: text.length > maxLength
      }
    };
  }

  /**
   * リストデータへの変換
   * @param {Array} data - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - リストデータ
   */
  async transformToListData(data, options = {}) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const itemField = options.itemField || 'title';
    const maxItems = options.maxItems || 50;

    const items = data.slice(0, maxItems).map(item => {
      if (typeof item === 'object') {
        return {
          title: item[itemField] || item.name || item.title || 'Untitled',
          description: item.description || item.summary || '',
          value: item.value || item.count || null
        };
      } else {
        return {
          title: String(item),
          description: '',
          value: null
        };
      }
    });

    return {
      type: 'list',
      items: items,
      metadata: {
        totalItems: data.length,
        truncated: data.length > maxItems
      }
    };
  }

  /**
   * カードデータへの変換
   * @param {*} data - 元データ
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - カードデータ
   */
  async transformToCardData(data, options = {}) {
    const card = {
      type: 'card',
      title: '',
      subtitle: '',
      value: '',
      metadata: {}
    };

    if (typeof data === 'object' && !Array.isArray(data)) {
      card.title = data.title || data.name || 'Card';
      card.subtitle = data.subtitle || data.description || '';
      card.value = data.value || data.count || data.amount || '';
      card.metadata = { ...data };
    } else {
      card.title = String(data);
      card.value = data;
    }

    return card;
  }

  // ヘルパーメソッド群
  isEmptyRow(row) {
    return !Array.isArray(row) || row.every(cell => !cell || String(cell).trim() === '');
  }

  async transformSheetRow(row, headers, columnMapping, options) {
    const transformedRow = {};
    
    for (let i = 0; i < Math.max(row.length, headers.length); i++) {
      const header = headers[i] || `column_${i + 1}`;
      const value = row[i] || '';
      
      // カラムマッピングの適用
      const mappedHeader = columnMapping && columnMapping[header] ? columnMapping[header] : header;
      transformedRow[mappedHeader] = value;
    }
    
    return transformedRow;
  }

  extractDataByPath(data, path) {
    const pathParts = path.split('.');
    let current = data;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  async mapFields(data, fieldMapping, options) {
    if (Array.isArray(data)) {
      return data.map(item => this.mapSingleItem(item, fieldMapping));
    } else {
      return this.mapSingleItem(data, fieldMapping);
    }
  }

  mapSingleItem(item, fieldMapping) {
    const mapped = {};
    
    for (const [newField, oldField] of Object.entries(fieldMapping)) {
      mapped[newField] = item[oldField];
    }
    
    return mapped;
  }

  async transformSingleItem(item, mapping, options) {
    // 単一アイテムの変換ロジック
    return item;
  }

  async validateFieldValue(value, validation, fieldName) {
    // フィールド値の検証ロジック
    return true;
  }

  applyFilter(item, filter) {
    // フィルタ適用ロジック
    return true;
  }

  sortData(data, sortOptions) {
    // ソートロジック
    return data;
  }

  async aggregateData(data, aggregateOptions) {
    // 集計ロジック
    return data;
  }

  extractHeaders(data) {
    if (data.length === 0) return [];
    
    const firstItem = data[0];
    if (Array.isArray(firstItem)) {
      return firstItem.map((_, index) => `column_${index + 1}`);
    } else if (typeof firstItem === 'object') {
      return Object.keys(firstItem);
    } else {
      return ['value'];
    }
  }

  async validateSlideContent(slideData, contentType) {
    // スライドコンテンツの検証
    if (!slideData || typeof slideData !== 'object') {
      throw new Error('無効なスライドコンテンツです');
    }
    
    if (slideData.type !== contentType) {
      throw new Error(`コンテンツタイプが一致しません: ${slideData.type} !== ${contentType}`);
    }
  }
}

module.exports = DataTransformService;