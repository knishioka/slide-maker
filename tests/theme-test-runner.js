/**
 * Theme System Test Runner
 * Standalone test runner for theme management components
 */

const fs = require('fs');
const path = require('path');

// Mock Google Apps Script environment
global.console = console;
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: () => null,
    setProperty: () => {},
    deleteProperty: () => {}
  })
};

// Helper function to load and execute source files
function loadSourceFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    eval(code);
    console.log(`✓ Loaded: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to load ${filePath}:`, error.message);
    throw error;
  }
}

// Load all required source files
console.log('Loading source files...');
try {
  loadSourceFile('src/services/theme.js');
  loadSourceFile('src/utils/color-palette.js');
  loadSourceFile('src/utils/font-manager.js');
  loadSourceFile('src/services/layout.js');
  console.log('All source files loaded successfully.\n');
} catch (error) {
  console.error('Failed to load source files. Exiting.');
  process.exit(1);
}

// Load test file
console.log('Loading test file...');
try {
  const testCode = fs.readFileSync(path.join(__dirname, 'unit', 'theme.test.js'), 'utf8');
  eval(testCode);
  console.log('✓ Test file loaded successfully.\n');
} catch (error) {
  console.error('✗ Failed to load test file:', error.message);
  process.exit(1);
}

// Run the tests
console.log('Starting theme system tests...\n');
const results = runAllThemeTests();

// Exit with appropriate code
process.exit(results.totalFailed > 0 ? 1 : 0);