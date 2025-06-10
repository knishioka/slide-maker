/**
 * Test Coverage Configuration and Reporting
 * Provides coverage tracking and report generation for the test suite
 */

const fs = require('fs');
const path = require('path');

class CoverageTracker {
  constructor(options = {}) {
    this.coverage = {
      files: new Map(),
      totalLines: 0,
      coveredLines: 0,
      totalFunctions: 0,
      coveredFunctions: 0,
      totalBranches: 0,
      coveredBranches: 0
    };
    
    this.options = {
      threshold: options.threshold || 80, // Minimum coverage percentage
      outputDir: options.outputDir || 'coverage',
      includePatterns: options.includePatterns || ['src/**/*.js'],
      excludePatterns: options.excludePatterns || ['node_modules/**', 'tests/**'],
      reportFormats: options.reportFormats || ['json', 'html', 'text'],
      ...options
    };
    
    this.executionMap = new Map(); // Track which lines/functions were executed
    this.startTime = Date.now();
  }
  
  /**
   * Track file execution during tests
   */
  trackFile(filePath, executedLines = [], executedFunctions = [], executedBranches = []) {
    if (!this.shouldTrackFile(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeFile(content, filePath);
      
      this.coverage.files.set(filePath, {
        ...analysis,
        executedLines: new Set(executedLines),
        executedFunctions: new Set(executedFunctions),
        executedBranches: new Set(executedBranches),
        coveredLines: executedLines.length,
        coveredFunctions: executedFunctions.length,
        coveredBranches: executedBranches.length
      });
      
      this.updateTotals();
    } catch (error) {
      console.warn(`Failed to track coverage for ${filePath}:`, error.message);
    }
  }
  
  /**
   * Analyze file to count lines, functions, and branches
   */
  analyzeFile(content, filePath) {
    const lines = content.split('\n');
    const totalLines = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('/*') &&
      !line.trim().startsWith('*')).length;
    
    // Count functions
    const functionMatches = content.match(/function\s+\w+|=>\s*{|:\s*function/g) || [];
    const arrowFunctions = content.match(/\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
    const totalFunctions = functionMatches.length + arrowFunctions.length;
    
    // Count branches (if/else, switch, ternary, try/catch)
    const ifStatements = content.match(/\bif\s*\(/g) || [];
    const switchStatements = content.match(/\bswitch\s*\(/g) || [];
    const ternaryOperators = content.match(/\?\s*[^:]+\s*:/g) || [];
    const tryStatements = content.match(/\btry\s*{/g) || [];
    const totalBranches = ifStatements.length + switchStatements.length + 
                         ternaryOperators.length + tryStatements.length;
    
    return {
      filePath,
      totalLines,
      totalFunctions,
      totalBranches,
      linesOfCode: totalLines,
      complexity: this.calculateComplexity(content)
    };
  }
  
  /**
   * Calculate cyclomatic complexity
   */
  calculateComplexity(content) {
    // Basic complexity calculation based on decision points
    const decisionPoints = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*[^:]+\s*:/g, // Ternary operators
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1; // Base complexity
    decisionPoints.forEach(pattern => {
      const matches = content.match(pattern) || [];
      complexity += matches.length;
    });
    
    return complexity;
  }
  
  /**
   * Check if file should be tracked for coverage
   */
  shouldTrackFile(filePath) {
    const normalizedPath = path.normalize(filePath);
    
    // Check exclude patterns
    for (const pattern of this.options.excludePatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of this.options.includePatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Simple pattern matching for file paths
   */
  matchesPattern(filePath, pattern) {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
    );
    return regex.test(filePath);
  }
  
  /**
   * Update total coverage statistics
   */
  updateTotals() {
    this.coverage.totalLines = 0;
    this.coverage.coveredLines = 0;
    this.coverage.totalFunctions = 0;
    this.coverage.coveredFunctions = 0;
    this.coverage.totalBranches = 0;
    this.coverage.coveredBranches = 0;
    
    for (const fileData of this.coverage.files.values()) {
      this.coverage.totalLines += fileData.totalLines;
      this.coverage.coveredLines += fileData.coveredLines;
      this.coverage.totalFunctions += fileData.totalFunctions;
      this.coverage.coveredFunctions += fileData.coveredFunctions;
      this.coverage.totalBranches += fileData.totalBranches;
      this.coverage.coveredBranches += fileData.coveredBranches;
    }
  }
  
  /**
   * Calculate coverage percentages
   */
  getPercentages() {
    return {
      lines: this.coverage.totalLines > 0 ? 
        (this.coverage.coveredLines / this.coverage.totalLines * 100).toFixed(2) : 0,
      functions: this.coverage.totalFunctions > 0 ? 
        (this.coverage.coveredFunctions / this.coverage.totalFunctions * 100).toFixed(2) : 0,
      branches: this.coverage.totalBranches > 0 ? 
        (this.coverage.coveredBranches / this.coverage.totalBranches * 100).toFixed(2) : 0
    };
  }
  
  /**
   * Generate comprehensive coverage report
   */
  generateReport() {
    const percentages = this.getPercentages();
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        totalFiles: this.coverage.files.size,
        coverage: {
          lines: {
            total: this.coverage.totalLines,
            covered: this.coverage.coveredLines,
            percentage: `${percentages.lines}%`,
            threshold: `${this.options.threshold}%`,
            passing: parseFloat(percentages.lines) >= this.options.threshold
          },
          functions: {
            total: this.coverage.totalFunctions,
            covered: this.coverage.coveredFunctions,
            percentage: `${percentages.functions}%`,
            threshold: `${this.options.threshold}%`,
            passing: parseFloat(percentages.functions) >= this.options.threshold
          },
          branches: {
            total: this.coverage.totalBranches,
            covered: this.coverage.coveredBranches,
            percentage: `${percentages.branches}%`,
            threshold: `${this.options.threshold}%`,
            passing: parseFloat(percentages.branches) >= this.options.threshold
          }
        },
        overallPassing: parseFloat(percentages.lines) >= this.options.threshold &&
                       parseFloat(percentages.functions) >= this.options.threshold &&
                       parseFloat(percentages.branches) >= this.options.threshold
      },
      files: {}
    };
    
    // Add file-level details
    for (const [filePath, data] of this.coverage.files) {
      const fileLineCoverage = data.totalLines > 0 ? 
        (data.coveredLines / data.totalLines * 100).toFixed(2) : 0;
      const fileFunctionCoverage = data.totalFunctions > 0 ? 
        (data.coveredFunctions / data.totalFunctions * 100).toFixed(2) : 0;
      const fileBranchCoverage = data.totalBranches > 0 ? 
        (data.coveredBranches / data.totalBranches * 100).toFixed(2) : 0;
      
      report.files[filePath] = {
        lines: {
          total: data.totalLines,
          covered: data.coveredLines,
          percentage: `${fileLineCoverage}%`,
          uncoveredLines: this.getUncoveredLines(data)
        },
        functions: {
          total: data.totalFunctions,
          covered: data.coveredFunctions,
          percentage: `${fileFunctionCoverage}%`
        },
        branches: {
          total: data.totalBranches,
          covered: data.coveredBranches,
          percentage: `${fileBranchCoverage}%`
        },
        complexity: data.complexity,
        status: fileLineCoverage >= this.options.threshold ? 'passing' : 'failing'
      };
    }
    
    return report;
  }
  
  /**
   * Get lines that are not covered
   */
  getUncoveredLines(fileData) {
    const uncovered = [];
    for (let i = 1; i <= fileData.totalLines; i++) {
      if (!fileData.executedLines.has(i)) {
        uncovered.push(i);
      }
    }
    return uncovered;
  }
  
  /**
   * Save coverage report in multiple formats
   */
  async saveReport(outputPath = null) {
    const report = this.generateReport();
    const baseOutputPath = outputPath || path.join(this.options.outputDir, 'coverage-report');
    
    // Ensure output directory exists
    const outputDir = path.dirname(baseOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const savedFiles = [];
    
    // Save in requested formats
    for (const format of this.options.reportFormats) {
      const filePath = await this.saveInFormat(report, baseOutputPath, format);
      savedFiles.push(filePath);
    }
    
    // Log summary
    this.logSummary(report);
    
    return {
      report,
      savedFiles,
      passing: report.summary.overallPassing
    };
  }
  
  /**
   * Save report in specific format
   */
  async saveInFormat(report, basePath, format) {
    switch (format) {
      case 'json':
        return this.saveJsonReport(report, `${basePath}.json`);
      case 'html':
        return this.saveHtmlReport(report, `${basePath}.html`);
      case 'text':
        return this.saveTextReport(report, `${basePath}.txt`);
      case 'lcov':
        return this.saveLcovReport(report, `${basePath}.lcov`);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }
  
  /**
   * Save JSON format report
   */
  saveJsonReport(report, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }
  
  /**
   * Save HTML format report
   */
  saveHtmlReport(report, filePath) {
    const html = this.generateHtmlReport(report);
    fs.writeFileSync(filePath, html);
    return filePath;
  }
  
  /**
   * Save text format report
   */
  saveTextReport(report, filePath) {
    const text = this.generateTextReport(report);
    fs.writeFileSync(filePath, text);
    return filePath;
  }
  
  /**
   * Save LCOV format report
   */
  saveLcovReport(report, filePath) {
    const lcov = this.generateLcovReport(report);
    fs.writeFileSync(filePath, lcov);
    return filePath;
  }
  
  /**
   * Generate HTML report
   */
  generateHtmlReport(report) {
    const { summary } = report;
    const getStatusClass = (passing) => passing ? 'passing' : 'failing';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { 
            background: white; 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 5px; 
            flex: 1; 
        }
        .passing { border-left: 5px solid #4caf50; }
        .failing { border-left: 5px solid #f44336; }
        .files { margin-top: 30px; }
        .file { 
            background: white; 
            border: 1px solid #ddd; 
            margin: 10px 0; 
            padding: 15px; 
            border-radius: 5px; 
        }
        .percentage { font-size: 24px; font-weight: bold; }
        .uncovered { color: #f44336; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Coverage Report</h1>
        <p>Generated: ${summary.timestamp}</p>
        <p>Duration: ${summary.duration}</p>
        <p>Files: ${summary.totalFiles}</p>
    </div>
    
    <div class="summary">
        <div class="metric ${getStatusClass(summary.coverage.lines.passing)}">
            <h3>Line Coverage</h3>
            <div class="percentage">${summary.coverage.lines.percentage}</div>
            <p>${summary.coverage.lines.covered}/${summary.coverage.lines.total} lines</p>
        </div>
        <div class="metric ${getStatusClass(summary.coverage.functions.passing)}">
            <h3>Function Coverage</h3>
            <div class="percentage">${summary.coverage.functions.percentage}</div>
            <p>${summary.coverage.functions.covered}/${summary.coverage.functions.total} functions</p>
        </div>
        <div class="metric ${getStatusClass(summary.coverage.branches.passing)}">
            <h3>Branch Coverage</h3>
            <div class="percentage">${summary.coverage.branches.percentage}</div>
            <p>${summary.coverage.branches.covered}/${summary.coverage.branches.total} branches</p>
        </div>
    </div>
    
    <div class="files">
        <h2>File Coverage</h2>
        ${Object.entries(report.files).map(([filePath, fileData]) => `
            <div class="file ${fileData.status}">
                <h4>${filePath}</h4>
                <p>Lines: ${fileData.lines.percentage} (${fileData.lines.covered}/${fileData.lines.total})</p>
                <p>Functions: ${fileData.functions.percentage} (${fileData.functions.covered}/${fileData.functions.total})</p>
                <p>Branches: ${fileData.branches.percentage} (${fileData.branches.covered}/${fileData.branches.total})</p>
                <p>Complexity: ${fileData.complexity}</p>
                ${fileData.lines.uncoveredLines.length > 0 ? 
    `<div class="uncovered">Uncovered lines: ${fileData.lines.uncoveredLines.join(', ')}</div>` : 
    ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }
  
  /**
   * Generate text report
   */
  generateTextReport(report) {
    const { summary } = report;
    let text = `Test Coverage Report
${'='.repeat(50)}
Generated: ${summary.timestamp}
Duration: ${summary.duration}
Files Analyzed: ${summary.totalFiles}

Overall Coverage Summary:
- Lines: ${summary.coverage.lines.percentage} (${summary.coverage.lines.covered}/${summary.coverage.lines.total}) ${summary.coverage.lines.passing ? '✓' : '✗'}
- Functions: ${summary.coverage.functions.percentage} (${summary.coverage.functions.covered}/${summary.coverage.functions.total}) ${summary.coverage.functions.passing ? '✓' : '✗'}
- Branches: ${summary.coverage.branches.percentage} (${summary.coverage.branches.covered}/${summary.coverage.branches.total}) ${summary.coverage.branches.passing ? '✓' : '✗'}

Threshold: ${summary.coverage.lines.threshold}
Overall Status: ${summary.overallPassing ? 'PASSING' : 'FAILING'}

File Details:
${'-'.repeat(50)}
`;
    
    for (const [filePath, fileData] of Object.entries(report.files)) {
      text += `
${filePath} [${fileData.status.toUpperCase()}]
  Lines: ${fileData.lines.percentage} (${fileData.lines.covered}/${fileData.lines.total})
  Functions: ${fileData.functions.percentage} (${fileData.functions.covered}/${fileData.functions.total})
  Branches: ${fileData.branches.percentage} (${fileData.branches.covered}/${fileData.branches.total})
  Complexity: ${fileData.complexity}`;
      
      if (fileData.lines.uncoveredLines.length > 0) {
        text += `
  Uncovered lines: ${fileData.lines.uncoveredLines.join(', ')}`;
      }
      text += '\n';
    }
    
    return text;
  }
  
  /**
   * Generate LCOV format report
   */
  generateLcovReport(report) {
    let lcov = '';
    
    for (const [filePath, fileData] of Object.entries(report.files)) {
      lcov += `SF:${filePath}\n`;
      
      // Function data
      for (let i = 1; i <= fileData.functions.total; i++) {
        lcov += `FN:${i},function${i}\n`;
      }
      lcov += `FNF:${fileData.functions.total}\n`;
      lcov += `FNH:${fileData.functions.covered}\n`;
      
      // Line data
      for (let i = 1; i <= fileData.lines.total; i++) {
        const hits = fileData.lines.uncoveredLines.includes(i) ? 0 : 1;
        lcov += `DA:${i},${hits}\n`;
      }
      lcov += `LF:${fileData.lines.total}\n`;
      lcov += `LH:${fileData.lines.covered}\n`;
      
      // Branch data
      for (let i = 1; i <= fileData.branches.total; i++) {
        lcov += `BDA:${i},0,1\n`;
        lcov += `BDA:${i},1,1\n`;
      }
      lcov += `BRF:${fileData.branches.total * 2}\n`;
      lcov += `BRH:${fileData.branches.covered * 2}\n`;
      
      lcov += 'end_of_record\n';
    }
    
    return lcov;
  }
  
  /**
   * Log coverage summary to console
   */
  logSummary(report) {
    const { summary } = report;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Coverage Summary');
    console.log('='.repeat(60));
    console.log(`📁 Files analyzed: ${summary.totalFiles}`);
    console.log(`⏱️  Duration: ${summary.duration}`);
    console.log('');
    
    const logMetric = (name, data, icon) => {
      const status = data.passing ? '✅' : '❌';
      console.log(`${icon} ${name}: ${data.percentage} (${data.covered}/${data.total}) ${status}`);
    };
    
    logMetric('Lines', summary.coverage.lines, '📝');
    logMetric('Functions', summary.coverage.functions, '🔧');
    logMetric('Branches', summary.coverage.branches, '🌿');
    
    console.log('');
    console.log(`🎯 Threshold: ${summary.coverage.lines.threshold}`);
    console.log(`📈 Overall Status: ${summary.overallPassing ? '✅ PASSING' : '❌ FAILING'}`);
    
    if (!summary.overallPassing) {
      console.log('\n⚠️  Coverage below threshold!');
      console.log('Consider adding more tests to improve coverage.');
    }
    
    console.log('='.repeat(60));
  }
  
  /**
   * Reset coverage data
   */
  reset() {
    this.coverage.files.clear();
    this.coverage.totalLines = 0;
    this.coverage.coveredLines = 0;
    this.coverage.totalFunctions = 0;
    this.coverage.coveredFunctions = 0;
    this.coverage.totalBranches = 0;
    this.coverage.coveredBranches = 0;
    this.executionMap.clear();
    this.startTime = Date.now();
  }
}

module.exports = CoverageTracker;