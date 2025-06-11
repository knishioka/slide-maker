/**
 * Mock Data for Google Slides Content Generator Web Interface
 * Provides complete test data for frontend development
 */

// Mock presentation templates
const MOCK_TEMPLATES = [
  {
    id: 'business-proposal',
    name: 'Business Proposal',
    description: 'Professional business presentation template',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzMzNzNEQyIvPgo8cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0U1RTdFQiIvPgo8cmVjdCB4PSIxMTAiIHk9IjcwIiB3aWR0aD0iNzAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNUU3RUIiLz4KPC9zdmc+',
    theme: {
      primaryColor: '#3373DC',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Arial',
      titleFontSize: 36,
      bodyFontSize: 24
    }
  },
  {
    id: 'technical-presentation',
    name: 'Technical Presentation',
    description: 'Clean template for technical content',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzJEOUNEQiIvPgo8cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSIxNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNUU3RUIiLz4KPC9zdmc+',
    theme: {
      primaryColor: '#2D9CDB',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Roboto',
      titleFontSize: 32,
      bodyFontSize: 22
    }
  },
  {
    id: 'creative-design',
    name: 'Creative Design',
    description: 'Colorful template for creative presentations',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Y1NTMzNiIvPgo8Y2lyY2xlIGN4PSI1NSIgY3k9IjEwNSIgcj0iMjAiIGZpbGw9IiNGRkM3MzciLz4KPGJ5Y2xlIGN4PSIxNDUiIGN5PSIxMDUiIHI9IjIwIiBmaWxsPSIjMzZCMzdFIi8+Cjwvc3ZnPg==',
    theme: {
      primaryColor: '#F55336',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Open Sans',
      titleFontSize: 38,
      bodyFontSize: 26
    }
  }
];

// Mock slide layouts
const MOCK_LAYOUTS = [
  {
    id: 'single',
    name: 'Single Column',
    description: 'Full-width single column layout',
    icon: '▢'
  },
  {
    id: 'double',
    name: 'Double Column',
    description: 'Two-column layout for comparison',
    icon: '▢▢'
  },
  {
    id: 'title-only',
    name: 'Title Only',
    description: 'Title slide with no content',
    icon: '■'
  }
];

// Mock content types
const MOCK_CONTENT_TYPES = [
  { id: 'text', name: 'Text Block', icon: '📝' },
  { id: 'bullet', name: 'Bullet List', icon: '•' },
  { id: 'image', name: 'Image', icon: '🖼️' },
  { id: 'chart', name: 'Chart & Graph', icon: '📈' },
  { id: 'mermaid', name: 'Mermaid Diagram', icon: '📊' },
  { id: 'svg', name: 'SVG Graphics', icon: '⚡' }
];

// Mock chart examples
const MOCK_CHART_EXAMPLES = [
  {
    id: 'column',
    name: 'Column Chart',
    chartType: 'column',
    title: 'Quarterly Sales Performance',
    data: [
      ['Quarter', 'Sales ($M)', 'Profit ($M)'],
      ['Q1', 12.5, 2.8],
      ['Q2', 14.2, 3.1],
      ['Q3', 16.8, 3.9],
      ['Q4', 19.1, 4.5]
    ],
    options: {
      width: 600,
      height: 400,
      colors: ['#1f77b4', '#ff7f0e'],
      legend: 'bottom'
    }
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    chartType: 'pie',
    title: 'Market Share Distribution',
    data: [
      ['Company', 'Market Share (%)'],
      ['Our Company', 28.5],
      ['Competitor A', 24.2],
      ['Competitor B', 18.7],
      ['Others', 28.6]
    ],
    options: {
      width: 500,
      height: 400,
      is3D: false
    }
  },
  {
    id: 'line',
    name: 'Line Chart',
    chartType: 'line',
    title: 'Monthly Revenue Trend',
    data: [
      ['Month', 'Revenue ($K)', 'Target ($K)'],
      ['Jan', 85, 80],
      ['Feb', 89, 85],
      ['Mar', 92, 90],
      ['Apr', 87, 88],
      ['May', 94, 93],
      ['Jun', 98, 95]
    ],
    options: {
      smooth: true,
      pointSize: 4,
      lineWidth: 2
    }
  },
  {
    id: 'bar',
    name: 'Bar Chart',
    chartType: 'bar',
    title: 'Regional Performance Comparison',
    data: [
      ['Region', 'Sales ($M)', 'Target ($M)'],
      ['North America', 45.2, 42.0],
      ['Europe', 38.7, 40.0],
      ['Asia Pacific', 52.1, 48.0],
      ['Latin America', 23.4, 25.0]
    ],
    options: {
      orientation: 'horizontal',
      stacked: false
    }
  },
  {
    id: 'area',
    name: 'Area Chart',
    chartType: 'area',
    title: 'Website Traffic Over Time',
    data: [
      ['Date', 'Unique Visitors', 'Page Views'],
      ['Week 1', 1250, 3200],
      ['Week 2', 1480, 3800],
      ['Week 3', 1320, 3400],
      ['Week 4', 1650, 4200],
      ['Week 5', 1890, 4800]
    ],
    options: {
      stacked: true,
      smooth: true
    }
  },
  {
    id: 'scatter',
    name: 'Scatter Plot',
    chartType: 'scatter',
    title: 'Sales vs Marketing Spend',
    data: [
      ['Marketing Spend ($K)', 'Sales ($M)'],
      [10, 15.2],
      [15, 18.7],
      [20, 22.1],
      [25, 26.8],
      [30, 31.2],
      [35, 35.9]
    ],
    options: {
      pointSize: 6,
      trendlines: true
    }
  }
];

// Mock Mermaid examples
const MOCK_MERMAID_EXAMPLES = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    code: `sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    code: `pie title Market Share
    "Product A" : 45
    "Product B" : 30
    "Product C" : 25`
  }
];

// Mock API responses
const MOCK_API_RESPONSES = {
  createPresentation: (config) => ({
    success: true,
    data: {
      presentationId: `mock_${Date.now()}`,
      title: config.title,
      slides: config.slides?.map((slide, index) => ({
        slideId: `slide_${index + 1}`,
        title: slide.title,
        index: index
      })) || [],
      url: `https://docs.google.com/presentation/d/mock_${Date.now()}/edit`,
      thumbnailUrl: MOCK_TEMPLATES[0].thumbnail
    }
  }),

  validateContent: (content) => ({
    success: true,
    data: {
      isValid: true,
      errors: [],
      warnings: content.length > 1000 ? ['Content is quite long'] : [],
      suggestions: ['Consider adding more visual elements']
    }
  }),

  getSystemHealth: () => ({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      recentLogs: 5,
      recentErrors: 0,
      recentWarnings: 1,
      logLevel: 'INFO'
    }
  })
};

// Mock presentation history
const MOCK_PRESENTATION_HISTORY = [
  {
    id: 'pres_001',
    title: 'Q4 Business Review',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    slideCount: 12,
    template: 'business-proposal',
    url: 'https://docs.google.com/presentation/d/mock_001/edit',
    thumbnail: MOCK_TEMPLATES[0].thumbnail
  },
  {
    id: 'pres_002',
    title: 'API Documentation',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    slideCount: 8,
    template: 'technical-presentation',
    url: 'https://docs.google.com/presentation/d/mock_002/edit',
    thumbnail: MOCK_TEMPLATES[1].thumbnail
  },
  {
    id: 'pres_003',
    title: 'Design System Overview',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    slideCount: 15,
    template: 'creative-design',
    url: 'https://docs.google.com/presentation/d/mock_003/edit',
    thumbnail: MOCK_TEMPLATES[2].thumbnail
  }
];

// Mock utilities for delays and error simulation
const MockUtils = {
  delay: (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms)),
  
  simulateError: (chance = 0.1) => {
    if (Math.random() < chance) {
      throw new Error('Simulated API error for testing');
    }
  },

  generateMockId: (prefix = 'mock') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  formatDate: (date) => new Date(date).toLocaleDateString('ja-JP')
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.MockData = {
    TEMPLATES: MOCK_TEMPLATES,
    LAYOUTS: MOCK_LAYOUTS,
    CONTENT_TYPES: MOCK_CONTENT_TYPES,
    CHART_EXAMPLES: MOCK_CHART_EXAMPLES,
    MERMAID_EXAMPLES: MOCK_MERMAID_EXAMPLES,
    API_RESPONSES: MOCK_API_RESPONSES,
    PRESENTATION_HISTORY: MOCK_PRESENTATION_HISTORY,
    Utils: MockUtils
  };
}