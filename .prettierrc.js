module.exports = {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX (not applicable for GAS but good to have)
  jsxSingleQuote: true,

  // Trailing commas
  trailingComma: 'none',

  // Spacing
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: 'avoid',

  // Prose formatting
  proseWrap: 'preserve',

  // HTML whitespace
  htmlWhitespaceSensitivity: 'css',

  // Vue files (not applicable but good to have)
  vueIndentScriptAndStyle: false,

  // End of line
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line
  singleAttributePerLine: false,

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80
      }
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    }
  ]
};
