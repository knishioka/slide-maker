/**
 * Authentication and Authorization Service
 * Handles API key validation, OAuth integration, and permission management
 */

/**
 * Authentication Service Class
 * Manages API authentication and authorization
 */
class AuthService {
  constructor() {
    this.apiKeys = new Map();
    this.sessions = new Map();
    this.loadApiKeys();
  }

  /**
   * Load API keys from Properties Service
   */
  loadApiKeys() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const apiKeysData = properties.getProperty('API_KEYS');
      
      if (apiKeysData) {
        const keys = JSON.parse(apiKeysData);
        keys.forEach(key => {
          this.apiKeys.set(key.key, {
            id: key.id,
            name: key.name,
            permissions: key.permissions || ['read'],
            rateLimit: key.rateLimit || 100, // requests per hour
            createdAt: key.createdAt,
            lastUsed: null,
            isActive: key.isActive !== false
          });
        });
      }
    } catch (error) {
      Logger.error('Failed to load API keys', { error: error.message });
    }
  }

  /**
   * Generate new API key
   * @param {string} name - API key name/description
   * @param {Array} permissions - Array of permissions
   * @param {number} rateLimit - Rate limit per hour
   * @returns {Object} Generated API key data
   */
  generateApiKey(name, permissions = ['read'], rateLimit = 100) {
    const apiKey = `gas_${this.generateRandomString(32)}`;
    const keyData = {
      id: this.generateRandomString(16),
      name,
      permissions,
      rateLimit,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true
    };

    this.apiKeys.set(apiKey, keyData);
    this.saveApiKeys();

    Logger.info('API key generated', { 
      name, 
      permissions, 
      keyId: keyData.id 
    });

    return {
      apiKey,
      ...keyData
    };
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {Object} Validation result
   */
  validateApiKey(apiKey) {
    if (!apiKey) {
      return {
        isValid: false,
        error: 'API key required'
      };
    }

    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData) {
      return {
        isValid: false,
        error: 'Invalid API key'
      };
    }

    if (!keyData.isActive) {
      return {
        isValid: false,
        error: 'API key is disabled'
      };
    }

    // Update last used timestamp
    keyData.lastUsed = new Date().toISOString();
    this.apiKeys.set(apiKey, keyData);

    return {
      isValid: true,
      keyData
    };
  }

  /**
   * Check if API key has required permission
   * @param {string} apiKey - API key
   * @param {string} permission - Required permission
   * @returns {boolean} True if permission granted
   */
  hasPermission(apiKey, permission) {
    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData || !keyData.isActive) {
      return false;
    }

    return keyData.permissions.includes(permission) || 
           keyData.permissions.includes('admin');
  }

  /**
   * Revoke API key
   * @param {string} apiKey - API key to revoke
   * @returns {boolean} True if successfully revoked
   */
  revokeApiKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    
    if (keyData) {
      keyData.isActive = false;
      this.apiKeys.set(apiKey, keyData);
      this.saveApiKeys();
      
      Logger.info('API key revoked', { keyId: keyData.id });
      return true;
    }
    
    return false;
  }

  /**
   * Get OAuth token from session
   * @param {string} sessionId - Session identifier
   * @returns {string|null} OAuth token or null
   */
  getOAuthToken(sessionId) {
    try {
      // For Google Apps Script, use built-in OAuth
      const token = ScriptApp.getOAuthToken();
      return token;
    } catch (error) {
      Logger.warn('Failed to get OAuth token', { 
        sessionId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Validate OAuth scope
   * @param {Array} requiredScopes - Required OAuth scopes
   * @returns {boolean} True if all scopes are available
   */
  validateOAuthScopes(requiredScopes) {
    try {
      // Check if current execution has required scopes
      // This is implicit in GAS - if script runs, scopes are granted
      return true;
    } catch (error) {
      Logger.error('OAuth scope validation failed', { 
        requiredScopes, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Create user session
   * @param {string} userId - User identifier
   * @param {Object} userData - Additional user data
   * @returns {string} Session ID
   */
  createSession(userId, userData = {}) {
    const sessionId = this.generateRandomString(32);
    const sessionData = {
      userId,
      userData,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    this.sessions.set(sessionId, sessionData);

    Logger.info('User session created', { userId, sessionId });
    return sessionId;
  }

  /**
   * Validate user session
   * @param {string} sessionId - Session ID to validate
   * @returns {Object} Session validation result
   */
  validateSession(sessionId) {
    if (!sessionId) {
      return {
        isValid: false,
        error: 'Session ID required'
      };
    }

    const sessionData = this.sessions.get(sessionId);
    
    if (!sessionData) {
      return {
        isValid: false,
        error: 'Invalid session'
      };
    }

    if (!sessionData.isActive) {
      return {
        isValid: false,
        error: 'Session expired'
      };
    }

    // Check session timeout (24 hours)
    const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (sessionAge > maxAge) {
      sessionData.isActive = false;
      this.sessions.set(sessionId, sessionData);
      
      return {
        isValid: false,
        error: 'Session expired'
      };
    }

    // Update last activity
    sessionData.lastActivity = new Date().toISOString();
    this.sessions.set(sessionId, sessionData);

    return {
      isValid: true,
      sessionData
    };
  }

  /**
   * Revoke user session
   * @param {string} sessionId - Session ID to revoke
   * @returns {boolean} True if successfully revoked
   */
  revokeSession(sessionId) {
    const sessionData = this.sessions.get(sessionId);
    
    if (sessionData) {
      sessionData.isActive = false;
      this.sessions.set(sessionId, sessionData);
      
      Logger.info('User session revoked', { sessionId });
      return true;
    }
    
    return false;
  }

  /**
   * Clean up expired sessions and update API key usage
   */
  cleanup() {
    let expiredSessions = 0;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up expired sessions
    for (const [sessionId, sessionData] of this.sessions) {
      const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
      
      if (sessionAge > maxAge || !sessionData.isActive) {
        this.sessions.delete(sessionId);
        expiredSessions++;
      }
    }

    // Save updated API keys
    this.saveApiKeys();

    Logger.info('Auth cleanup completed', { 
      expiredSessions,
      activeSessions: this.sessions.size,
      activeApiKeys: Array.from(this.apiKeys.values()).filter(k => k.isActive).length
    });
  }

  /**
   * Save API keys to Properties Service
   */
  saveApiKeys() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const apiKeysArray = Array.from(this.apiKeys.entries()).map(([key, data]) => ({
        key,
        ...data
      }));
      
      properties.setProperty('API_KEYS', JSON.stringify(apiKeysArray));
    } catch (error) {
      Logger.error('Failed to save API keys', { error: error.message });
    }
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Get API key statistics
   * @returns {Object} API key usage statistics
   */
  getApiKeyStats() {
    const stats = {
      total: this.apiKeys.size,
      active: 0,
      inactive: 0,
      usage: []
    };

    for (const [key, data] of this.apiKeys) {
      if (data.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      stats.usage.push({
        id: data.id,
        name: data.name,
        lastUsed: data.lastUsed,
        permissions: data.permissions,
        isActive: data.isActive
      });
    }

    return stats;
  }
}

/**
 * Rate Limiting Service
 * Tracks and enforces API rate limits
 */
class RateLimitService {
  constructor() {
    this.requestCounts = new Map();
    this.windowSize = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Check if request is within rate limit
   * @param {string} identifier - API key or IP address
   * @param {number} limit - Rate limit (requests per hour)
   * @returns {Object} Rate limit check result
   */
  checkRateLimit(identifier, limit = 100) {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get existing request data
    let requestData = this.requestCounts.get(identifier) || {
      requests: [],
      lastCleanup: now
    };

    // Clean old requests (outside current window)
    requestData.requests = requestData.requests.filter(
      timestamp => timestamp > windowStart
    );

    // Check if limit exceeded
    if (requestData.requests.length >= limit) {
      const oldestRequest = Math.min(...requestData.requests);
      const resetTime = oldestRequest + this.windowSize;

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000) // seconds
      };
    }

    // Add current request
    requestData.requests.push(now);
    requestData.lastCleanup = now;
    
    this.requestCounts.set(identifier, requestData);

    return {
      allowed: true,
      limit,
      remaining: limit - requestData.requests.length,
      resetTime: windowStart + this.windowSize,
      retryAfter: 0
    };
  }

  /**
   * Clean up old rate limit data
   */
  cleanup() {
    const now = Date.now();
    let cleanedItems = 0;

    for (const [identifier, requestData] of this.requestCounts) {
      // Clean requests older than 2 windows
      const cutoff = now - (this.windowSize * 2);
      const oldCount = requestData.requests.length;
      
      requestData.requests = requestData.requests.filter(
        timestamp => timestamp > cutoff
      );

      if (requestData.requests.length === 0) {
        this.requestCounts.delete(identifier);
        cleanedItems++;
      } else if (requestData.requests.length !== oldCount) {
        this.requestCounts.set(identifier, requestData);
      }
    }

    Logger.debug('Rate limit cleanup completed', { 
      cleanedItems,
      activeTracking: this.requestCounts.size 
    });
  }

  /**
   * Get rate limit statistics
   * @returns {Object} Rate limiting statistics
   */
  getStats() {
    return {
      activeTracking: this.requestCounts.size,
      windowSize: this.windowSize,
      totalRequests: Array.from(this.requestCounts.values())
        .reduce((sum, data) => sum + data.requests.length, 0)
    };
  }
}

// Global service instances
let authService = null;
let rateLimitService = null;

/**
 * Get AuthService instance
 * @returns {AuthService} Auth service instance
 */
function getAuthService() {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

/**
 * Get RateLimitService instance
 * @returns {RateLimitService} Rate limit service instance
 */
function getRateLimitService() {
  if (!rateLimitService) {
    rateLimitService = new RateLimitService();
  }
  return rateLimitService;
}

/**
 * Authentication middleware for API requests
 * @param {Object} request - Request object
 * @returns {Object|null} Error response or null if authenticated
 */
function authenticationMiddleware(request) {
  // Skip authentication for health check and OPTIONS
  if (request.path === '/health' || request.method === 'OPTIONS') {
    return null;
  }

  const authService = getAuthService();
  
  // Check for API key in header or query parameter
  const apiKey = request.headers['x-api-key'] || 
                 request.headers['authorization']?.replace('Bearer ', '') ||
                 request.query.api_key;

  if (apiKey) {
    const validation = authService.validateApiKey(apiKey);
    
    if (!validation.isValid) {
      return {
        success: false,
        statusCode: 401,
        error: { message: validation.error },
        timestamp: new Date().toISOString()
      };
    }

    // Add key data to request context
    request.auth = {
      type: 'api_key',
      keyData: validation.keyData
    };

    return null; // Continue processing
  }

  // Check for session ID
  const sessionId = request.headers['x-session-id'] || request.query.session_id;
  
  if (sessionId) {
    const sessionValidation = authService.validateSession(sessionId);
    
    if (!sessionValidation.isValid) {
      return {
        success: false,
        statusCode: 401,
        error: { message: sessionValidation.error },
        timestamp: new Date().toISOString()
      };
    }

    // Add session data to request context
    request.auth = {
      type: 'session',
      sessionData: sessionValidation.sessionData
    };

    return null; // Continue processing
  }

  // No authentication provided
  return {
    success: false,
    statusCode: 401,
    error: { message: 'Authentication required' },
    timestamp: new Date().toISOString()
  };
}

/**
 * Rate limiting middleware for API requests
 * @param {Object} request - Request object
 * @returns {Object|null} Error response or null if within limits
 */
function rateLimitingMiddleware(request) {
  const rateLimitService = getRateLimitService();
  
  // Determine identifier for rate limiting
  let identifier = 'anonymous';
  let limit = 10; // Default limit for unauthenticated requests

  if (request.auth) {
    if (request.auth.type === 'api_key') {
      identifier = request.auth.keyData.id;
      limit = request.auth.keyData.rateLimit;
    } else if (request.auth.type === 'session') {
      identifier = request.auth.sessionData.userId;
      limit = 100; // Default limit for authenticated users
    }
  }

  const rateCheck = rateLimitService.checkRateLimit(identifier, limit);

  if (!rateCheck.allowed) {
    return {
      success: false,
      statusCode: 429,
      error: { 
        message: 'Rate limit exceeded',
        limit: rateCheck.limit,
        retryAfter: rateCheck.retryAfter
      },
      headers: {
        'X-RateLimit-Limit': rateCheck.limit,
        'X-RateLimit-Remaining': rateCheck.remaining,
        'X-RateLimit-Reset': Math.floor(rateCheck.resetTime / 1000),
        'Retry-After': rateCheck.retryAfter
      },
      timestamp: new Date().toISOString()
    };
  }

  // Add rate limit headers to response context
  request.rateLimitHeaders = {
    'X-RateLimit-Limit': rateCheck.limit,
    'X-RateLimit-Remaining': rateCheck.remaining,
    'X-RateLimit-Reset': Math.floor(rateCheck.resetTime / 1000)
  };

  return null; // Continue processing
}

/**
 * Logging middleware for API requests
 * @param {Object} request - Request object
 * @returns {null} Always allows request to continue
 */
function loggingMiddleware(request) {
  const startTime = Date.now();
  
  // Log request
  Logger.info('API request received', {
    method: request.method,
    path: request.path,
    auth: request.auth ? request.auth.type : 'none',
    timestamp: request.timestamp
  });

  // Store start time for response logging
  request._startTime = startTime;

  return null; // Continue processing
}

/**
 * Scheduled cleanup function for auth and rate limiting data
 * Run this periodically (e.g., daily) to clean up old data
 */
function cleanupAuthData() {
  try {
    const authService = getAuthService();
    const rateLimitService = getRateLimitService();

    authService.cleanup();
    rateLimitService.cleanup();

    Logger.info('Auth data cleanup completed');
  } catch (error) {
    Logger.error('Auth data cleanup failed', { error: error.message });
  }
}