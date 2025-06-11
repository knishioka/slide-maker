/**
 * Auth Service Unit Tests
 * Tests for authentication and authorization functionality
 */

describe('Auth Service Unit Tests', () => {
  let authService;
  let rateLimitService;
  let mockPropertiesService;

  beforeEach(() => {
    // Mock PropertiesService
    const mockProperties = new Map();
    mockPropertiesService = {
      getScriptProperties: () => ({
        getProperty: jest.fn((key) => mockProperties.get(key)),
        setProperty: jest.fn((key, value) => mockProperties.set(key, value)),
        getProperties: jest.fn(() => Object.fromEntries(mockProperties)),
        deleteProperty: jest.fn((key) => mockProperties.delete(key))
      })
    };

    global.PropertiesService = mockPropertiesService;

    // Initialize services
    authService = new AuthService();
    rateLimitService = new RateLimitService();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Key Management', () => {
    describe('generateApiKey', () => {
      it('should generate a valid API key', () => {
        const keyData = authService.generateApiKey('test-app', ['read', 'write'], 200);

        expect(keyData.apiKey).toMatch(/^gas_[a-zA-Z0-9]{32}$/);
        expect(keyData.name).toBe('test-app');
        expect(keyData.permissions).toEqual(['read', 'write']);
        expect(keyData.rateLimit).toBe(200);
        expect(keyData.isActive).toBe(true);
        expect(keyData.createdAt).toBeDefined();
        expect(keyData.id).toMatch(/^[a-zA-Z0-9]{16}$/);
      });

      it('should use default values for optional parameters', () => {
        const keyData = authService.generateApiKey('default-app');

        expect(keyData.permissions).toEqual(['read']);
        expect(keyData.rateLimit).toBe(100);
        expect(keyData.isActive).toBe(true);
      });

      it('should store the generated API key', () => {
        const keyData = authService.generateApiKey('stored-app');

        expect(authService.apiKeys.has(keyData.apiKey)).toBe(true);
        const storedData = authService.apiKeys.get(keyData.apiKey);
        expect(storedData.name).toBe('stored-app');
      });

      it('should save API keys to properties service', () => {
        const setSpy = jest.spyOn(
          mockPropertiesService.getScriptProperties(),
          'setProperty'
        );

        authService.generateApiKey('save-test');

        expect(setSpy).toHaveBeenCalledWith('API_KEYS', expect.any(String));
      });
    });

    describe('validateApiKey', () => {
      let testApiKey;

      beforeEach(() => {
        const keyData = authService.generateApiKey('test-validation');
        testApiKey = keyData.apiKey;
      });

      it('should validate existing active API key', () => {
        const result = authService.validateApiKey(testApiKey);

        expect(result.isValid).toBe(true);
        expect(result.keyData).toBeDefined();
        expect(result.keyData.name).toBe('test-validation');
      });

      it('should reject missing API key', () => {
        const result = authService.validateApiKey(null);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('API key required');
      });

      it('should reject invalid API key', () => {
        const result = authService.validateApiKey('invalid-key');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid API key');
      });

      it('should reject disabled API key', () => {
        // Disable the key
        authService.revokeApiKey(testApiKey);

        const result = authService.validateApiKey(testApiKey);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('API key is disabled');
      });

      it('should update last used timestamp', () => {
        const beforeTime = new Date().toISOString();
        const result = authService.validateApiKey(testApiKey);
        const afterTime = new Date().toISOString();

        expect(result.isValid).toBe(true);
        expect(result.keyData.lastUsed).toBeDefined();
        expect(result.keyData.lastUsed).toBeGreaterThanOrEqual(beforeTime);
        expect(result.keyData.lastUsed).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('hasPermission', () => {
      let readOnlyKey;
      let fullAccessKey;
      let adminKey;

      beforeEach(() => {
        const readData = authService.generateApiKey('read-only', ['read']);
        readOnlyKey = readData.apiKey;

        const fullData = authService.generateApiKey('full-access', ['read', 'write']);
        fullAccessKey = fullData.apiKey;

        const adminData = authService.generateApiKey('admin', ['admin']);
        adminKey = adminData.apiKey;
      });

      it('should allow access for granted permissions', () => {
        expect(authService.hasPermission(readOnlyKey, 'read')).toBe(true);
        expect(authService.hasPermission(fullAccessKey, 'read')).toBe(true);
        expect(authService.hasPermission(fullAccessKey, 'write')).toBe(true);
      });

      it('should deny access for missing permissions', () => {
        expect(authService.hasPermission(readOnlyKey, 'write')).toBe(false);
        expect(authService.hasPermission(readOnlyKey, 'admin')).toBe(false);
      });

      it('should allow admin access to all permissions', () => {
        expect(authService.hasPermission(adminKey, 'read')).toBe(true);
        expect(authService.hasPermission(adminKey, 'write')).toBe(true);
        expect(authService.hasPermission(adminKey, 'delete')).toBe(true);
      });

      it('should deny access for invalid API key', () => {
        expect(authService.hasPermission('invalid-key', 'read')).toBe(false);
      });

      it('should deny access for disabled API key', () => {
        authService.revokeApiKey(readOnlyKey);
        expect(authService.hasPermission(readOnlyKey, 'read')).toBe(false);
      });
    });

    describe('revokeApiKey', () => {
      let testApiKey;

      beforeEach(() => {
        const keyData = authService.generateApiKey('revoke-test');
        testApiKey = keyData.apiKey;
      });

      it('should revoke existing API key', () => {
        const result = authService.revokeApiKey(testApiKey);

        expect(result).toBe(true);
        
        const keyData = authService.apiKeys.get(testApiKey);
        expect(keyData.isActive).toBe(false);
      });

      it('should return false for non-existent API key', () => {
        const result = authService.revokeApiKey('non-existent-key');

        expect(result).toBe(false);
      });

      it('should save changes after revocation', () => {
        const setSpy = jest.spyOn(
          mockPropertiesService.getScriptProperties(),
          'setProperty'
        );

        authService.revokeApiKey(testApiKey);

        expect(setSpy).toHaveBeenCalledWith('API_KEYS', expect.any(String));
      });
    });
  });

  describe('OAuth Integration', () => {
    describe('getOAuthToken', () => {
      it('should return OAuth token from ScriptApp', () => {
        global.ScriptApp = {
          getOAuthToken: jest.fn(() => 'mock-oauth-token')
        };

        const token = authService.getOAuthToken('session-123');

        expect(token).toBe('mock-oauth-token');
        expect(global.ScriptApp.getOAuthToken).toHaveBeenCalled();
      });

      it('should handle OAuth token retrieval failure', () => {
        global.ScriptApp = {
          getOAuthToken: jest.fn(() => {
            throw new Error('OAuth failed');
          })
        };

        const token = authService.getOAuthToken('session-123');

        expect(token).toBeNull();
      });
    });

    describe('validateOAuthScopes', () => {
      it('should validate OAuth scopes successfully', () => {
        const requiredScopes = [
          'https://www.googleapis.com/auth/presentations',
          'https://www.googleapis.com/auth/drive.file'
        ];

        const result = authService.validateOAuthScopes(requiredScopes);

        expect(result).toBe(true);
      });

      it('should handle scope validation errors', () => {
        // Mock Logger for error handling
        global.Logger = {
          error: jest.fn()
        };

        // Force an error by making validateOAuthScopes throw
        const originalMethod = authService.validateOAuthScopes;
        authService.validateOAuthScopes = jest.fn(() => {
          throw new Error('Scope validation failed');
        });

        const result = authService.validateOAuthScopes(['invalid-scope']);

        expect(result).toBe(false);

        // Restore original method
        authService.validateOAuthScopes = originalMethod;
      });
    });
  });

  describe('Session Management', () => {
    describe('createSession', () => {
      it('should create a new session', () => {
        const sessionId = authService.createSession('user-123', { role: 'admin' });

        expect(sessionId).toMatch(/^[a-zA-Z0-9]{32}$/);
        expect(authService.sessions.has(sessionId)).toBe(true);

        const sessionData = authService.sessions.get(sessionId);
        expect(sessionData.userId).toBe('user-123');
        expect(sessionData.userData.role).toBe('admin');
        expect(sessionData.isActive).toBe(true);
        expect(sessionData.createdAt).toBeDefined();
      });

      it('should create session without user data', () => {
        const sessionId = authService.createSession('user-456');

        const sessionData = authService.sessions.get(sessionId);
        expect(sessionData.userId).toBe('user-456');
        expect(sessionData.userData).toEqual({});
      });
    });

    describe('validateSession', () => {
      let validSessionId;

      beforeEach(() => {
        validSessionId = authService.createSession('test-user');
      });

      it('should validate existing active session', () => {
        const result = authService.validateSession(validSessionId);

        expect(result.isValid).toBe(true);
        expect(result.sessionData.userId).toBe('test-user');
      });

      it('should reject missing session ID', () => {
        const result = authService.validateSession(null);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Session ID required');
      });

      it('should reject invalid session ID', () => {
        const result = authService.validateSession('invalid-session');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid session');
      });

      it('should reject inactive session', () => {
        authService.revokeSession(validSessionId);

        const result = authService.validateSession(validSessionId);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Session expired');
      });

      it('should reject expired session', () => {
        // Create an old session (simulate 25 hours ago)
        const oldSessionId = authService.createSession('old-user');
        const sessionData = authService.sessions.get(oldSessionId);
        const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
        sessionData.createdAt = oldDate.toISOString();
        authService.sessions.set(oldSessionId, sessionData);

        const result = authService.validateSession(oldSessionId);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Session expired');
      });

      it('should update last activity on validation', () => {
        const beforeTime = new Date().toISOString();
        const result = authService.validateSession(validSessionId);
        const afterTime = new Date().toISOString();

        expect(result.isValid).toBe(true);
        expect(result.sessionData.lastActivity).toBeGreaterThanOrEqual(beforeTime);
        expect(result.sessionData.lastActivity).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('revokeSession', () => {
      let testSessionId;

      beforeEach(() => {
        testSessionId = authService.createSession('revoke-test-user');
      });

      it('should revoke existing session', () => {
        const result = authService.revokeSession(testSessionId);

        expect(result).toBe(true);

        const sessionData = authService.sessions.get(testSessionId);
        expect(sessionData.isActive).toBe(false);
      });

      it('should return false for non-existent session', () => {
        const result = authService.revokeSession('non-existent-session');

        expect(result).toBe(false);
      });
    });
  });

  describe('Rate Limiting Service', () => {
    describe('checkRateLimit', () => {
      it('should allow requests within limit', () => {
        const result = rateLimitService.checkRateLimit('user-123', 10);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(10);
        expect(result.remaining).toBe(9);
        expect(result.retryAfter).toBe(0);
      });

      it('should track multiple requests', () => {
        // Make 5 requests
        for (let i = 0; i < 5; i++) {
          rateLimitService.checkRateLimit('user-123', 10);
        }

        const result = rateLimitService.checkRateLimit('user-123', 10);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // 10 - 6 = 4
      });

      it('should reject requests over limit', () => {
        // Make 10 requests (at limit)
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit('user-123', 10);
        }

        // 11th request should be rejected
        const result = rateLimitService.checkRateLimit('user-123', 10);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
      });

      it('should track different identifiers separately', () => {
        // Make requests for user-1
        for (let i = 0; i < 5; i++) {
          rateLimitService.checkRateLimit('user-1', 10);
        }

        // user-2 should have full limit available
        const result = rateLimitService.checkRateLimit('user-2', 10);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
      });

      it('should use default limit when not specified', () => {
        const result = rateLimitService.checkRateLimit('user-123');

        expect(result.limit).toBe(100);
      });

      it('should include reset time in response', () => {
        const result = rateLimitService.checkRateLimit('user-123', 10);

        expect(result.resetTime).toBeGreaterThan(Date.now());
      });
    });

    describe('cleanup', () => {
      it('should remove old request data', () => {
        // Add some request data
        rateLimitService.checkRateLimit('user-123', 10);
        rateLimitService.checkRateLimit('user-456', 10);

        expect(rateLimitService.requestCounts.size).toBe(2);

        // Manually set old timestamp
        const oldData = rateLimitService.requestCounts.get('user-123');
        oldData.requests = [Date.now() - (3 * 60 * 60 * 1000)]; // 3 hours ago
        rateLimitService.requestCounts.set('user-123', oldData);

        rateLimitService.cleanup();

        expect(rateLimitService.requestCounts.size).toBe(1);
        expect(rateLimitService.requestCounts.has('user-456')).toBe(true);
      });
    });

    describe('getStats', () => {
      it('should return rate limiting statistics', () => {
        rateLimitService.checkRateLimit('user-1', 10);
        rateLimitService.checkRateLimit('user-2', 20);

        const stats = rateLimitService.getStats();

        expect(stats.activeTracking).toBe(2);
        expect(stats.windowSize).toBe(60 * 60 * 1000);
        expect(stats.totalRequests).toBe(2);
      });
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(() => {
      global.Logger = {
        info: jest.fn(),
        debug: jest.fn()
      };
    });

    it('should clean up expired sessions and update API keys', () => {
      // Create some sessions
      const session1 = authService.createSession('user-1');
      const session2 = authService.createSession('user-2');

      // Make session1 old
      const sessionData = authService.sessions.get(session1);
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      sessionData.createdAt = oldDate.toISOString();
      authService.sessions.set(session1, sessionData);

      expect(authService.sessions.size).toBe(2);

      authService.cleanup();

      expect(authService.sessions.size).toBe(1);
      expect(authService.sessions.has(session2)).toBe(true);
    });
  });

  describe('API Key Statistics', () => {
    it('should return API key statistics', () => {
      authService.generateApiKey('app-1', ['read']);
      authService.generateApiKey('app-2', ['read', 'write']);
      const key3 = authService.generateApiKey('app-3', ['admin']);

      // Revoke one key
      authService.revokeApiKey(key3.apiKey);

      const stats = authService.getApiKeyStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.usage).toHaveLength(3);
      expect(stats.usage[0].name).toBe('app-1');
      expect(stats.usage[2].isActive).toBe(false);
    });
  });

  describe('Middleware Functions', () => {
    let mockRequest;

    beforeEach(() => {
      mockRequest = {
        path: '/presentations',
        method: 'POST',
        headers: {},
        query: {}
      };

      global.Logger = {
        info: jest.fn()
      };
    });

    describe('authenticationMiddleware', () => {
      it('should skip authentication for health check', () => {
        mockRequest.path = '/health';
        const result = authenticationMiddleware(mockRequest);

        expect(result).toBeNull();
      });

      it('should skip authentication for OPTIONS requests', () => {
        mockRequest.method = 'OPTIONS';
        const result = authenticationMiddleware(mockRequest);

        expect(result).toBeNull();
      });

      it('should authenticate with valid API key in header', () => {
        const keyData = authService.generateApiKey('test-middleware');
        mockRequest.headers['x-api-key'] = keyData.apiKey;

        const result = authenticationMiddleware(mockRequest);

        expect(result).toBeNull();
        expect(mockRequest.auth).toBeDefined();
        expect(mockRequest.auth.type).toBe('api_key');
      });

      it('should authenticate with valid API key in query', () => {
        const keyData = authService.generateApiKey('test-middleware');
        mockRequest.query.api_key = keyData.apiKey;

        const result = authenticationMiddleware(mockRequest);

        expect(result).toBeNull();
        expect(mockRequest.auth).toBeDefined();
      });

      it('should return 401 for invalid API key', () => {
        mockRequest.headers['x-api-key'] = 'invalid-key';

        const result = authenticationMiddleware(mockRequest);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(401);
      });

      it('should return 401 for missing authentication', () => {
        const result = authenticationMiddleware(mockRequest);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(401);
        expect(result.error.message).toBe('Authentication required');
      });
    });

    describe('rateLimitingMiddleware', () => {
      it('should allow requests within rate limit', () => {
        const keyData = authService.generateApiKey('rate-test', ['read'], 10);
        mockRequest.auth = {
          type: 'api_key',
          keyData
        };

        const result = rateLimitingMiddleware(mockRequest);

        expect(result).toBeNull();
        expect(mockRequest.rateLimitHeaders).toBeDefined();
      });

      it('should reject requests over rate limit', () => {
        const keyData = authService.generateApiKey('rate-test', ['read'], 1);
        mockRequest.auth = {
          type: 'api_key',
          keyData
        };

        // Make first request (should pass)
        rateLimitingMiddleware(mockRequest);

        // Make second request (should fail)
        const result = rateLimitingMiddleware(mockRequest);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(429);
        expect(result.error.message).toBe('Rate limit exceeded');
      });

      it('should use default limit for unauthenticated requests', () => {
        const result = rateLimitingMiddleware(mockRequest);

        expect(result).toBeNull(); // Should pass with low default limit
      });
    });

    describe('loggingMiddleware', () => {
      it('should log request and continue processing', () => {
        const result = loggingMiddleware(mockRequest);

        expect(result).toBeNull();
        expect(mockRequest._startTime).toBeDefined();
        expect(global.Logger.info).toHaveBeenCalledWith(
          'API request received',
          expect.objectContaining({
            method: 'POST',
            path: '/presentations',
            auth: 'none'
          })
        );
      });

      it('should log authenticated request', () => {
        mockRequest.auth = { type: 'api_key' };

        loggingMiddleware(mockRequest);

        expect(global.Logger.info).toHaveBeenCalledWith(
          'API request received',
          expect.objectContaining({
            auth: 'api_key'
          })
        );
      });
    });
  });
});