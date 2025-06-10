module.exports = {
  env: {
    es2021: true,
    browser: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script' // Google Apps Script uses script mode
  },
  globals: {
    // Google Apps Script global objects
    SlidesApp: 'readonly',
    DriveApp: 'readonly',
    SpreadsheetApp: 'readonly',
    PropertiesService: 'readonly',
    Utilities: 'readonly',
    UrlFetchApp: 'readonly',
    Logger: 'readonly',
    console: 'readonly',
    HtmlService: 'readonly',
    ContentService: 'readonly',
    
    // Test globals
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    jest: 'readonly',
    
    // Custom globals for this project
    SlidesService: 'readonly',
    ContentService: 'readonly',
    ValidationService: 'readonly',
    logger: 'readonly',
    Logger: 'readonly'
  },
  rules: {
    // Google Apps Script specific rules
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    
    // Code quality rules
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_|^[A-Z].*Service$|^create|^add|^apply|^validate|^get|^generate|^convert|^batch|^set|^logger$' 
    }],
    'no-console': 'off', // console.log is valid in GAS
    'no-undef': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'brace-style': ['error', '1tbs'],
    
    // Function and naming conventions
    'camelcase': ['error', { properties: 'never' }],
    'func-names': 'off',
    'function-paren-newline': ['error', 'consistent'],
    
    // Object and array formatting
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    
    // String and template literals
    'quotes': ['error', 'single', { avoidEscape: true }],
    'template-curly-spacing': ['error', 'never'],
    
    // Spacing and indentation
    'indent': ['error', 2, { SwitchCase: 1 }],
    'semi': ['error', 'always'],
    'semi-spacing': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'keyword-spacing': 'error',
    
    // Line length and formatting
    'max-len': ['warn', { 
      code: 100, 
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true }],
    
    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Performance and best practices
    'no-loop-func': 'error',
    'no-new-wrappers': 'error',
    'no-implicit-coercion': 'error',
    
    // Documentation
    'valid-jsdoc': ['warn', {
      requireReturn: false,
      requireReturnDescription: false,
      requireParamDescription: true
    }],
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      }
    }]
  },
  overrides: [
    {
      // Test files have different rules
      files: ['tests/**/*.js'],
      rules: {
        'no-unused-expressions': 'off',
        'max-lines-per-function': 'off',
        'require-jsdoc': 'off'
      }
    },
    {
      // Web UI files can use modern JS features
      files: ['src/web/**/*.js'],
      env: {
        browser: true,
        es2021: true
      },
      parserOptions: {
        sourceType: 'module'
      }
    }
  ]
};