/**
 * External Data Sources Integration Service
 * Google Slides Content Generator - Data Source Management
 * 
 * 外部データソースとの統合を管理するサービス
 * Google Sheets、CSV、JSON、APIエンドポイントからのデータ取得を統合管理
 */

const Logger = require('../utils/logger.js');
const ValidationService = require('../utils/validation.js');

/**
 * 外部データソース統合サービス
 * - API接続管理
 * - データキャッシュ
 * - 認証管理
 * - レート制限対応
 */
class DataSourceService {
  /**
   * DataSourceService コンストラクタ
   */
  constructor() {
    this.cache = new Map();
    this.rateLimiters = new Map();
    this.authTokens = new Map();
    
    // デフォルト設定
    this.config = {
      cacheEnabled: true,
      defaultCacheTTL: 300000, // 5分
      maxRetries: 3,
      requestTimeout: 30000, // 30秒
      rateLimit: {
        default: { requests: 100, window: 3600000 }, // 1時間に100リクエスト
        googleSheets: { requests: 100, window: 100000 }, // 100秒に100リクエスト
        external: { requests: 50, window: 3600000 } // 1時間に50リクエスト
      }
    };
  }

  /**
   * Google Sheetsからデータを取得
   * @param {string} spreadsheetId - スプレッドシートID
   * @param {string} range - 取得範囲 (例: "Sheet1!A1:D10")
   * @param {Object} options - オプション設定
   * @returns {Promise<Array>} - 取得したデータ
   */
  async fetchGoogleSheetsData(spreadsheetId, range, options = {}) {
    const cacheKey = `sheets_${spreadsheetId}_${range}`;
    
    try {
      Logger.log('INFO', 'Google Sheetsデータ取得開始', {
        spreadsheetId: spreadsheetId.substring(0, 10) + '...',
        range
      });

      // キャッシュチェック
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheTTL || this.config.defaultCacheTTL)) {
          Logger.log('DEBUG', 'キャッシュからデータを返却', { cacheKey });
          return cached.data;
        }
      }

      // レート制限チェック
      await this.checkRateLimit('googleSheets');

      // Google Sheets APIでデータ取得
      const sheet = SpreadsheetApp.openById(spreadsheetId);
      const values = sheet.getRange(range).getValues();
      
      // データの基本検証
      const validatedData = await this.validateSheetData(values, options);
      
      // キャッシュに保存
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        });
      }

      Logger.log('INFO', 'Google Sheetsデータ取得完了', {
        rowCount: validatedData.length,
        columnCount: validatedData[0]?.length || 0
      });

      return validatedData;

    } catch (error) {
      Logger.log('ERROR', 'Google Sheetsデータ取得エラー', {
        spreadsheetId: spreadsheetId.substring(0, 10) + '...',
        range,
        error: error.toString()
      });
      throw new Error(`Google Sheetsデータ取得失敗: ${error.message}`);
    }
  }

  /**
   * 外部 API からJSON データを取得
   * @param {string} url - API エンドポイント
   * @param {Object} options - リクエストオプション
   * @returns {Promise<Object>} - 取得したJSONデータ
   */
  async fetchApiData(url, options = {}) {
    const cacheKey = `api_${this.generateCacheKey(url, options)}`;
    
    try {
      Logger.log('INFO', 'API データ取得開始', { url: this.sanitizeUrl(url) });

      // キャッシュチェック
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheTTL || this.config.defaultCacheTTL)) {
          Logger.log('DEBUG', 'キャッシュからAPIデータを返却', { cacheKey });
          return cached.data;
        }
      }

      // URL検証
      if (!ValidationService.isValidUrl(url)) {
        throw new Error('無効なURL形式です');
      }

      // レート制限チェック
      await this.checkRateLimit('external');

      // HTTP リクエスト設定
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Google-Apps-Script-DataSource/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        muteHttpExceptions: true,
        ...options
      };

      // 認証ヘッダー追加
      if (options.authToken || this.authTokens.has(url)) {
        const token = options.authToken || this.authTokens.get(url);
        requestOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      // リトライ機能付きリクエスト実行
      const response = await this.executeWithRetry(
        () => UrlFetchApp.fetch(url, requestOptions),
        this.config.maxRetries
      );

      // レスポンス検証
      if (response.getResponseCode() >= 400) {
        throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
      }

      const jsonData = JSON.parse(response.getContentText());
      
      // データ検証
      const validatedData = await this.validateApiData(jsonData, options);

      // キャッシュに保存
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        });
      }

      Logger.log('INFO', 'APIデータ取得完了', {
        url: this.sanitizeUrl(url),
        dataSize: JSON.stringify(validatedData).length
      });

      return validatedData;

    } catch (error) {
      Logger.log('ERROR', 'APIデータ取得エラー', {
        url: this.sanitizeUrl(url),
        error: error.toString()
      });
      throw new Error(`APIデータ取得失敗: ${error.message}`);
    }
  }

  /**
   * CSV データをパースして取得
   * @param {string} csvContent - CSV文字列またはURL
   * @param {Object} options - パースオプション
   * @returns {Promise<Array>} - パースされたデータ
   */
  async fetchCsvData(csvContent, options = {}) {
    try {
      Logger.log('INFO', 'CSVデータ処理開始');

      let csvText;
      
      if (csvContent.startsWith('http')) {
        // URL からCSVデータを取得
        const response = await UrlFetchApp.fetch(csvContent);
        csvText = response.getContentText();
      } else {
        // 直接CSVテキストとして処理
        csvText = csvContent;
      }

      // CSV パース設定
      const parseOptions = {
        delimiter: options.delimiter || ',',
        quote: options.quote || '"',
        escape: options.escape || '"',
        skipEmptyLines: options.skipEmptyLines !== false,
        header: options.header !== false,
        ...options
      };

      // CSV パース実行
      const parsedData = this.parseCsv(csvText, parseOptions);
      
      // データ検証
      const validatedData = await this.validateCsvData(parsedData, options);

      Logger.log('INFO', 'CSVデータ処理完了', {
        rowCount: validatedData.length,
        columnCount: validatedData[0]?.length || Object.keys(validatedData[0] || {}).length
      });

      return validatedData;

    } catch (error) {
      Logger.log('ERROR', 'CSVデータ処理エラー', { error: error.toString() });
      throw new Error(`CSVデータ処理失敗: ${error.message}`);
    }
  }

  /**
   * 認証トークンを設定
   * @param {string} source - データソース識別子
   * @param {string} token - 認証トークン
   */
  setAuthToken(source, token) {
    if (!token || typeof token !== 'string') {
      throw new Error('無効な認証トークンです');
    }
    
    this.authTokens.set(source, token);
    Logger.log('INFO', '認証トークン設定完了', { source });
  }

  /**
   * キャッシュをクリア
   * @param {string} pattern - クリア対象のパターン（オプション）
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
      Logger.log('INFO', 'パターンマッチキャッシュクリア完了', { pattern });
    } else {
      this.cache.clear();
      Logger.log('INFO', '全キャッシュクリア完了');
    }
  }

  /**
   * レート制限チェック
   * @param {string} source - データソース種別
   */
  async checkRateLimit(source) {
    const limit = this.config.rateLimit[source] || this.config.rateLimit.default;
    const now = Date.now();
    
    if (!this.rateLimiters.has(source)) {
      this.rateLimiters.set(source, { requests: [], window: limit.window });
    }
    
    const limiter = this.rateLimiters.get(source);
    
    // 古いリクエスト記録を削除
    limiter.requests = limiter.requests.filter(time => now - time < limiter.window);
    
    // レート制限チェック
    if (limiter.requests.length >= limit.requests) {
      const waitTime = limiter.window - (now - limiter.requests[0]);
      Logger.log('WARN', 'レート制限に達しました', { source, waitTime });
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    limiter.requests.push(now);
  }

  /**
   * リトライ機能付き実行
   * @param {Function} fn - 実行する関数
   * @param {number} maxRetries - 最大リトライ回数
   * @returns {Promise} - 実行結果
   */
  async executeWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        const waitTime = Math.pow(2, i) * 1000; // 指数バックオフ
        Logger.log('WARN', `リトライ実行 ${i + 1}/${maxRetries}`, { 
          error: error.toString(), 
          waitTime 
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Google Sheets データの検証
   * @param {Array} data - 検証対象データ
   * @param {Object} options - 検証オプション
   * @returns {Promise<Array>} - 検証済みデータ
   */
  async validateSheetData(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('Google Sheetsデータは配列である必要があります');
    }

    // 空データチェック
    if (data.length === 0) {
      Logger.log('WARN', 'Google Sheetsデータが空です');
      return [];
    }

    // 最大行数チェック
    const maxRows = options.maxRows || 10000;
    if (data.length > maxRows) {
      Logger.log('WARN', `データが最大行数を超過: ${data.length} > ${maxRows}`);
      return data.slice(0, maxRows);
    }

    return data;
  }

  /**
   * API データの検証
   * @param {Object} data - 検証対象データ
   * @param {Object} options - 検証オプション
   * @returns {Promise<Object>} - 検証済みデータ
   */
  async validateApiData(data, options = {}) {
    // データサイズチェック
    const dataSize = JSON.stringify(data).length;
    const maxSize = options.maxSize || 1024 * 1024; // 1MB
    
    if (dataSize > maxSize) {
      throw new Error(`APIデータサイズが制限を超過: ${dataSize} > ${maxSize}`);
    }

    return data;
  }

  /**
   * CSV データの検証
   * @param {Array} data - 検証対象データ
   * @param {Object} options - 検証オプション
   * @returns {Promise<Array>} - 検証済みデータ
   */
  async validateCsvData(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('CSVデータは配列である必要があります');
    }

    // 最大行数チェック
    const maxRows = options.maxRows || 10000;
    if (data.length > maxRows) {
      Logger.log('WARN', `CSVデータが最大行数を超過: ${data.length} > ${maxRows}`);
      return data.slice(0, maxRows);
    }

    return data;
  }

  /**
   * CSV パーサー
   * @param {string} csvText - CSV テキスト
   * @param {Object} options - パースオプション
   * @returns {Array} - パース結果
   */
  parseCsv(csvText, options = {}) {
    const { delimiter = ',', quote = '"', header = true } = options;
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }

    const result = [];
    let headers = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCsvLine(line, delimiter, quote);
      
      if (i === 0 && header) {
        headers = values;
        continue;
      }
      
      if (header && headers) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        result.push(row);
      } else {
        result.push(values);
      }
    }

    return result;
  }

  /**
   * CSV行のパース
   * @param {string} line - CSV行
   * @param {string} delimiter - 区切り文字
   * @param {string} quote - 引用符
   * @returns {Array} - パースされた値の配列
   */
  parseCsvLine(line, delimiter, quote) {
    const values = [];
    let value = '';
    let insideQuote = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === quote) {
        if (insideQuote && line[i + 1] === quote) {
          value += quote;
          i++; // Skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        values.push(value.trim());
        value = '';
      } else {
        value += char;
      }
    }
    
    values.push(value.trim());
    return values;
  }

  /**
   * キャッシュキーの生成
   * @param {string} url - URL
   * @param {Object} options - オプション
   * @returns {string} - キャッシュキー
   */
  generateCacheKey(url, options) {
    const key = url + JSON.stringify({
      method: options.method,
      headers: options.headers,
      payload: options.payload
    });
    
    // ハッシュ化（簡易版）
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer conversion
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * URL のサニタイズ（ログ出力用）
   * @param {string} url - URL
   * @returns {string} - サニタイズされたURL
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url.substring(0, 50) + '...';
    }
  }
}

module.exports = DataSourceService;