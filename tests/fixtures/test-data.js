/**
 * Test Data and Fixtures
 * Provides comprehensive test data for all testing scenarios
 */

const testFixtures = {
  presentations: {
    basic: {
      title: 'Basic Test Presentation',
      slides: [
        { 
          type: 'title',
          content: 'Welcome to Our Presentation',
          style: { fontSize: 44, fontFamily: 'Arial', color: '#1a73e8' }
        },
        { 
          type: 'content',
          content: 'This is the main content slide with important information.',
          style: { fontSize: 24, fontFamily: 'Arial', color: '#202124' }
        }
      ]
    },
    
    complex: {
      title: 'Complex Multi-Layout Presentation',
      slides: [
        {
          type: 'title',
          content: 'Complex Presentation Title',
          layout: 'TITLE_ONLY',
          style: { fontSize: 48, fontFamily: 'Calibri', color: '#4285f4', bold: true }
        },
        {
          type: 'two-column',
          leftContent: {
            type: 'text',
            content: 'Left column content with detailed information about our product features and benefits.',
            style: { fontSize: 20, fontFamily: 'Arial' }
          },
          rightContent: {
            type: 'image',
            url: 'https://example.com/chart.png',
            alt: 'Performance chart showing growth metrics'
          }
        },
        {
          type: 'mermaid',
          content: `
            graph TD
            A[Start] --> B{Decision}
            B -->|Yes| C[Action 1]
            B -->|No| D[Action 2]
            C --> E[End]
            D --> E
          `,
          style: { theme: 'default', backgroundColor: '#ffffff' }
        },
        {
          type: 'bullet-points',
          title: 'Key Features',
          items: [
            'Advanced layout management',
            'Mermaid diagram integration',
            'Customizable themes and styles',
            'Automated content positioning',
            'API rate limiting protection'
          ],
          style: { fontSize: 22, fontFamily: 'Arial' }
        }
      ]
    },

    minimal: {
      title: 'Minimal Presentation',
      slides: [
        {
          type: 'text',
          content: 'Simple text slide',
          style: { fontSize: 32, fontFamily: 'Helvetica' }
        }
      ]
    },

    multimedia: {
      title: 'Multimedia Rich Presentation',
      slides: [
        {
          type: 'title',
          content: 'Multimedia Demo',
          style: { fontSize: 42, fontFamily: 'Georgia', color: '#e91e63' }
        },
        {
          type: 'mixed-content',
          elements: [
            {
              type: 'text',
              content: 'This slide combines multiple media types',
              position: { x: 60, y: 80, width: 600, height: 60 },
              style: { fontSize: 24, fontFamily: 'Arial' }
            },
            {
              type: 'image',
              url: 'https://example.com/demo-image.jpg',
              position: { x: 60, y: 160, width: 300, height: 200 },
              alt: 'Demo image'
            },
            {
              type: 'shape',
              shapeType: 'RECTANGLE',
              position: { x: 400, y: 160, width: 260, height: 200 },
              style: { fillColor: '#f8f9fa', borderColor: '#dee2e6' }
            },
            {
              type: 'text',
              content: 'Additional details in this text box',
              position: { x: 420, y: 200, width: 220, height: 120 },
              style: { fontSize: 16, fontFamily: 'Arial' }
            }
          ]
        }
      ]
    }
  },
  
  apiResponses: {
    success: {
      createPresentation: {
        presentationId: 'test-presentation-123',
        title: 'Test Presentation',
        slides: [],
        url: 'https://docs.google.com/presentation/d/test-presentation-123/edit',
        revisionId: 'rev-001'
      },
      
      addSlide: {
        slideId: 'test-slide-456',
        layout: 'TITLE_AND_BODY',
        pageElements: []
      },

      insertTextBox: {
        elementId: 'text-element-789',
        type: 'TEXT_BOX',
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 100,
          translateY: 200,
          unit: 'PT'
        }
      },

      insertImage: {
        elementId: 'image-element-012',
        type: 'IMAGE',
        imageProperties: {
          imageUrl: 'https://example.com/image.jpg'
        }
      },

      batchUpdate: {
        presentationId: 'test-presentation-123',
        replies: [
          { createSlide: { slideId: 'slide-1' } },
          { createTextBox: { elementId: 'text-1' } },
          { createImage: { elementId: 'image-1' } }
        ]
      }
    },
    
    errors: {
      rateLimitExceeded: {
        error: {
          code: 429,
          message: 'Rate limit exceeded',
          status: 'RESOURCE_EXHAUSTED',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
              violations: [
                {
                  subject: 'quota_limit_exceeded',
                  description: 'Quota \'Requests per minute\' exceeded'
                }
              ]
            }
          ]
        }
      },
      
      insufficientPermissions: {
        error: {
          code: 403,
          message: 'The caller does not have permission',
          status: 'PERMISSION_DENIED',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
              reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
              domain: 'googleapis.com'
            }
          ]
        }
      },
      
      notFound: {
        error: {
          code: 404,
          message: 'Presentation not found',
          status: 'NOT_FOUND'
        }
      },

      invalidRequest: {
        error: {
          code: 400,
          message: 'Invalid request',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'requests[0].createSlide.slideLayoutReference',
                  description: 'Invalid layout reference'
                }
              ]
            }
          ]
        }
      },

      networkTimeout: {
        error: {
          code: 408,
          message: 'Request timeout',
          status: 'DEADLINE_EXCEEDED'
        }
      },

      serverError: {
        error: {
          code: 500,
          message: 'Internal server error',
          status: 'INTERNAL'
        }
      }
    }
  },
  
  slideContent: {
    validTextContent: {
      type: 'text',
      content: 'This is valid text content for testing purposes. It includes various punctuation marks, numbers like 123, and special characters like @#$%.',
      style: { 
        fontSize: 24, 
        fontFamily: 'Arial',
        color: '#202124',
        bold: false,
        italic: false,
        underline: false
      },
      position: { x: 100, y: 200, width: 400, height: 100 }
    },
    
    invalidTextContent: {
      type: 'text',
      content: '', // Invalid: empty content
      style: null, // Invalid: null style
      position: { x: -100, y: 200, width: -50, height: 0 } // Invalid: negative and zero values
    },
    
    validImageContent: {
      type: 'image',
      url: 'https://example.com/valid-image.jpg',
      alt: 'Test image description for accessibility',
      position: { x: 200, y: 300, width: 300, height: 200 },
      style: {
        borderColor: '#cccccc',
        borderWidth: 1,
        shadow: true
      }
    },

    invalidImageContent: {
      type: 'image',
      url: 'not-a-valid-url', // Invalid URL format
      position: { x: 0, y: 0 } // Missing width/height
    },
    
    mermaidDiagramContent: {
      type: 'mermaid',
      content: `
        graph LR
        A[Input Data] --> B[Processing]
        B --> C[Validation]
        C --> D{Valid?}
        D -->|Yes| E[Store Data]
        D -->|No| F[Error Handler]
        E --> G[Success Response]
        F --> H[Error Response]
      `,
      style: { 
        theme: 'default', 
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontSize: 14
      },
      position: { x: 50, y: 100, width: 620, height: 400 }
    },

    complexMermaidDiagram: {
      type: 'mermaid',
      content: `
        sequenceDiagram
        participant U as User
        participant A as API
        participant S as Slides Service
        participant G as Google API
        
        U->>A: Create Presentation Request
        A->>S: Validate Input
        S->>S: Process Content
        S->>G: Create Slides
        G-->>S: Slides Created
        S-->>A: Success Response
        A-->>U: Presentation Link
      `,
      interactive: true,
      styleTemplate: 'professional',
      exportFormats: ['svg', 'png', 'pdf'],
      interactiveOptions: {
        zoom: true,
        pan: true,
        clickable: true,
        tooltips: true
      },
      clickHandlers: {
        '.actor': { action: 'highlight', color: '#ff6b6b' },
        '.message': { action: 'alert', message: 'Message clicked' }
      },
      tooltipData: {
        '.actor': 'Click to highlight this actor',
        '.message': 'This represents a message flow'
      }
    },

    // Advanced Mermaid test cases
    advancedMermaidTests: {
      flowchartWithStyling: {
        type: 'mermaid',
        code: `
          graph TD
          A[User Input] --> B{Validation}
          B -->|Valid| C[Process Data]
          B -->|Invalid| D[Show Error]
          C --> E[Generate Slides]
          D --> F[Return to Form]
          E --> G[Success]
          
          classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:3px
          classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
          classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
          
          class A,G startEnd
          class C,E process
          class B decision
        `,
        styleTemplate: 'modern',
        customTheme: {
          primaryColor: '#673ab7',
          lineColor: '#9c27b0'
        },
        interactive: true,
        exportFormats: ['svg', 'png']
      },

      ganttChart: {
        type: 'mermaid',
        code: `
          gantt
          title Development Timeline
          dateFormat YYYY-MM-DD
          section Phase 1
          Research & Planning    :done, phase1, 2024-01-01, 2024-01-15
          Architecture Design   :done, arch, after phase1, 10d
          section Phase 2
          Core Development      :active, dev, 2024-02-01, 30d
          Testing              :test, after dev, 15d
          section Phase 3
          Deployment           :deploy, after test, 10d
          Documentation        :docs, after test, 20d
        `,
        styleTemplate: 'professional',
        exportFormats: ['svg', 'pdf'],
        width: 1000,
        height: 400
      },

      entityRelationshipDiagram: {
        type: 'mermaid',
        code: `
          erDiagram
          USER {
            string id PK
            string email UK
            string name
            datetime created_at
          }
          PRESENTATION {
            string id PK
            string title
            string user_id FK
            json slides
            datetime created_at
            datetime updated_at
          }
          SLIDE {
            string id PK
            string presentation_id FK
            int slide_number
            json content
            string layout_type
          }
          THEME {
            string id PK
            string name
            json theme_config
            boolean is_public
          }
          
          USER ||--o{ PRESENTATION : creates
          PRESENTATION ||--o{ SLIDE : contains
          PRESENTATION }o--|| THEME : uses
        `,
        styleTemplate: 'minimal',
        interactive: true,
        exportFormats: ['svg'],
        interactiveOptions: {
          tooltips: true,
          clickable: true
        },
        tooltipData: {
          'rect': 'Database entity - click for details'
        }
      },

      stateTransitionDiagram: {
        type: 'mermaid',
        code: `
          stateDiagram-v2
          [*] --> Idle
          Idle --> Loading : user_action
          Loading --> Processing : data_received
          Loading --> Error : network_error
          Processing --> Success : process_complete
          Processing --> Error : process_failed
          Success --> Idle : reset
          Error --> Idle : retry
          Error --> [*] : fatal_error
          
          Success : Entry/show_success_message
          Error : Entry/log_error
          Error : Entry/show_error_dialog
        `,
        styleTemplate: 'modern',
        animations: {
          'rect': 'pulse',
          'path': 'fadeIn'
        }
      },

      mindmapDiagram: {
        type: 'mermaid',
        code: `
          mindmap
          root((Slide Generator))
            Content Types
              Text
              Images
              Diagrams
                Mermaid
                  Flowcharts
                  Sequence
                  Gantt
                SVG
              Tables
            Layout Options
              Single Column
              Double Column
              Custom Grid
            Export Formats
              Google Slides
              PDF
              Images
                PNG
                JPEG
                SVG
        `,
        styleTemplate: 'creative',
        interactive: true,
        exportFormats: ['svg', 'png']
      },

      pieChart: {
        type: 'mermaid',
        code: `
          pie title Browser Usage Statistics
          "Chrome" : 60.5
          "Firefox" : 18.2
          "Safari" : 12.8
          "Edge" : 5.1
          "Other" : 3.4
        `,
        styleTemplate: 'professional',
        customTheme: {
          pie1: '#ff6b6b',
          pie2: '#4ecdc4',
          pie3: '#45b7d1',
          pie4: '#96ceb4',
          pie5: '#fda085'
        }
      }
    },

    // Error cases for testing
    mermaidErrorCases: {
      invalidSyntax: {
        type: 'mermaid',
        code: 'invalid mermaid syntax here',
        expectedError: 'Mermaid validation failed'
      },
      
      emptyCode: {
        type: 'mermaid',
        code: '',
        expectedError: 'Mermaid code is required'
      },
      
      tooLongCode: {
        type: 'mermaid',
        code: 'graph TD\n' + 'A --> B\n'.repeat(10000),
        expectedError: 'Mermaid code is too long'
      },
      
      invalidExportFormat: {
        type: 'mermaid',
        code: 'graph TD\nA --> B',
        exportFormats: ['invalid_format'],
        expectedError: 'Invalid export formats'
      }
    },

    // Performance test cases
    mermaidPerformanceTests: {
      largeFlowchart: {
        type: 'mermaid',
        code: `
          graph TD
          ${Array.from({length: 50}, (_, i) => `A${i}[Node ${i}] --> A${i+1}[Node ${i+1}]`).join('\n')}
        `,
        complexity: 'high',
        expectedRenderTime: 5000 // ms
      },
      
      complexSequence: {
        type: 'mermaid',
        code: `
          sequenceDiagram
          ${Array.from({length: 20}, (_, i) => 
            `participant P${i} as Participant ${i}\n` +
            Array.from({length: 10}, (_, j) => `P${i}->>P${(i+1)%20}: Message ${j}`).join('\n')
          ).join('\n')}
        `,
        complexity: 'very_high',
        expectedRenderTime: 8000 // ms
      }
    },

    shapeContent: {
      type: 'shape',
      shapeType: 'RECTANGLE',
      style: {
        fillColor: '#4285f4',
        borderColor: '#1a73e8',
        borderWidth: 2,
        transparency: 0.1
      },
      position: { x: 150, y: 250, width: 200, height: 100 }
    },

    circleShape: {
      type: 'shape',
      shapeType: 'ELLIPSE',
      style: {
        fillColor: '#ea4335',
        borderColor: '#d33b2c',
        borderWidth: 3
      },
      position: { x: 400, y: 300, width: 150, height: 150 }
    }
  },
  
  layoutConfigurations: {
    singleColumn: {
      type: 'single-column',
      margin: 60,
      itemSpacing: 20,
      maxItemsPerSlide: 5,
      slideWidth: 720,
      slideHeight: 540,
      headerHeight: 80,
      footerHeight: 40
    },
    
    doubleColumn: {
      type: 'double-column',
      margin: 60,
      columnGap: 40,
      itemSpacing: 15,
      maxItemsPerSlide: 8,
      slideWidth: 720,
      slideHeight: 540,
      columnWidth: 310 // (720 - 60*2 - 40) / 2
    },
    
    titleAndContent: {
      type: 'title-content',
      titleHeight: 120,
      contentMargin: 80,
      titleStyle: { 
        fontSize: 44, 
        fontFamily: 'Arial', 
        color: '#1a73e8',
        bold: true,
        alignment: 'center'
      },
      contentStyle: { 
        fontSize: 24, 
        fontFamily: 'Arial', 
        color: '#202124',
        lineSpacing: 1.2
      }
    },

    gridLayout: {
      type: 'grid',
      rows: 2,
      columns: 2,
      margin: 60,
      cellSpacing: 20,
      maxItemsPerSlide: 4,
      cellWidth: 300,
      cellHeight: 220
    },

    customLayout: {
      type: 'custom',
      regions: [
        { name: 'header', x: 0, y: 0, width: 720, height: 80 },
        { name: 'main', x: 60, y: 100, width: 600, height: 380 },
        { name: 'footer', x: 0, y: 500, width: 720, height: 40 }
      ]
    }
  },
  
  performanceTestData: {
    smallDataset: Array.from({ length: 10 }, (_, i) => ({
      type: 'text',
      content: `Item ${i + 1}: Small dataset content for performance testing with minimal text.`,
      style: { fontSize: 20, fontFamily: 'Arial' },
      position: { x: 60, y: 100 + (i * 40), width: 600, height: 35 }
    })),
    
    mediumDataset: Array.from({ length: 50 }, (_, i) => ({
      type: 'text',
      content: `Item ${i + 1}: Medium dataset content for performance testing with moderate amount of text and formatting.`,
      style: { 
        fontSize: 18, 
        fontFamily: 'Arial',
        color: i % 2 === 0 ? '#202124' : '#5f6368',
        bold: i % 5 === 0
      },
      position: { x: 60, y: 80 + (i * 30), width: 600, height: 25 }
    })),
    
    largeDataset: Array.from({ length: 200 }, (_, i) => ({
      type: i % 4 === 0 ? 'title' : i % 4 === 1 ? 'text' : i % 4 === 2 ? 'image' : 'shape',
      content: `Item ${i + 1}: Large dataset content for stress testing performance with comprehensive information, detailed descriptions, and various content types to simulate real-world usage patterns.`,
      url: i % 4 === 2 ? `https://example.com/image-${i}.jpg` : undefined,
      shapeType: i % 4 === 3 ? (i % 8 === 3 ? 'RECTANGLE' : 'ELLIPSE') : undefined,
      style: { 
        fontSize: 16 + (i % 3) * 2, // Vary font size 16, 18, 20
        fontFamily: ['Arial', 'Calibri', 'Helvetica'][i % 3],
        color: ['#202124', '#5f6368', '#1a73e8'][i % 3],
        bold: i % 7 === 0,
        italic: i % 11 === 0
      },
      position: { 
        x: 60 + (i % 2) * 320, 
        y: 80 + Math.floor(i / 2) * 25, 
        width: 300, 
        height: 20 
      }
    })),

    stressTestDataset: Array.from({ length: 1000 }, (_, i) => ({
      type: ['text', 'image', 'shape', 'title'][i % 4],
      content: `Stress test item ${i + 1}: This is a very large dataset designed to test system limits and performance under extreme load conditions. It includes varied content types, complex formatting, and extensive positioning data.`,
      url: i % 4 === 1 ? `https://example.com/stress-image-${i}.jpg` : undefined,
      shapeType: i % 4 === 2 ? ['RECTANGLE', 'ELLIPSE', 'TRIANGLE', 'HEXAGON'][i % 4] : undefined,
      style: {
        fontSize: 12 + (i % 16), // Font sizes 12-27
        fontFamily: ['Arial', 'Calibri', 'Helvetica', 'Georgia', 'Verdana'][i % 5],
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        bold: i % 13 === 0,
        italic: i % 17 === 0,
        underline: i % 23 === 0
      },
      position: {
        x: (i % 10) * 72,
        y: Math.floor(i / 10) * 20,
        width: 70,
        height: 18
      }
    }))
  },

  validationTestCases: {
    validInputs: [
      {
        name: 'Basic text content',
        input: {
          type: 'text',
          content: 'Valid text content',
          style: { fontSize: 24, fontFamily: 'Arial', color: '#000000' },
          position: { x: 100, y: 200, width: 400, height: 100 }
        }
      },
      {
        name: 'Image with all properties',
        input: {
          type: 'image',
          url: 'https://example.com/image.jpg',
          alt: 'Description',
          position: { x: 50, y: 150, width: 300, height: 200 }
        }
      },
      {
        name: 'Minimum required fields',
        input: {
          type: 'text',
          content: 'Minimal content'
        }
      }
    ],

    invalidInputs: [
      {
        name: 'Missing type field',
        input: {
          content: 'Content without type'
        },
        expectedErrors: ['Invalid content type']
      },
      {
        name: 'Invalid font size',
        input: {
          type: 'text',
          content: 'Text',
          style: { fontSize: 5 } // Too small
        },
        expectedErrors: ['Font size out of range']
      },
      {
        name: 'Negative position',
        input: {
          type: 'text',
          content: 'Text',
          position: { x: -10, y: -20 }
        },
        expectedErrors: ['X position out of bounds', 'Y position out of bounds']
      },
      {
        name: 'Invalid URL',
        input: {
          type: 'image',
          url: 'not-a-url'
        },
        expectedErrors: ['Invalid image URL format']
      }
    ],

    maliciousInputs: [
      {
        name: 'XSS attempt in content',
        input: {
          type: 'text',
          content: '<script>alert("xss")</script>Harmless text'
        },
        expectedSanitized: 'alert(&quot;xss&quot;)Harmless text'
      },
      {
        name: 'HTML injection',
        input: {
          type: 'text',
          content: '<img src="x" onerror="alert(1)">Text content'
        },
        expectedSanitized: 'Text content'
      },
      {
        name: 'SQL injection attempt',
        input: {
          type: 'text',
          content: "'; DROP TABLE presentations; --"
        },
        expectedSanitized: '&#x27;; DROP TABLE presentations; --'
      }
    ]
  },

  errorScenarios: {
    networkErrors: [
      'Connection timeout',
      'DNS resolution failed',
      'SSL handshake failed',
      'Connection reset by peer',
      'Network unreachable'
    ],

    apiErrors: [
      { code: 400, message: 'Bad Request', type: 'INVALID_ARGUMENT' },
      { code: 401, message: 'Unauthorized', type: 'UNAUTHENTICATED' },
      { code: 403, message: 'Forbidden', type: 'PERMISSION_DENIED' },
      { code: 404, message: 'Not Found', type: 'NOT_FOUND' },
      { code: 429, message: 'Too Many Requests', type: 'RESOURCE_EXHAUSTED' },
      { code: 500, message: 'Internal Server Error', type: 'INTERNAL' },
      { code: 503, message: 'Service Unavailable', type: 'UNAVAILABLE' }
    ],

    validationErrors: [
      'Required field missing',
      'Invalid data type',
      'Value out of range',
      'Invalid format',
      'Duplicate entry',
      'Reference not found'
    ]
  },

  mockApiLimits: {
    quotas: {
      requestsPerMinute: 1000,
      requestsPerDay: 100000,
      presentationsPerDay: 1000,
      slidesPerPresentation: 300,
      elementsPerSlide: 50
    },
    
    rateLimits: {
      burstCapacity: 10,
      sustainedRate: 2, // requests per second
      backoffMultiplier: 2,
      maxBackoffDelay: 60000 // 60 seconds
    }
  }
};

// Helper functions for test data generation
const testHelpers = {
  generateRandomContent: (count = 10, options = {}) => {
    const types = options.types || ['text', 'image', 'shape'];
    const fonts = ['Arial', 'Calibri', 'Helvetica', 'Georgia', 'Verdana'];
    const colors = ['#000000', '#333333', '#666666', '#1a73e8', '#ea4335', '#34a853'];
    
    return Array.from({ length: count }, (_, i) => {
      const type = types[i % types.length];
      const baseContent = {
        type,
        style: { 
          fontSize: Math.floor(Math.random() * 20) + 16, // 16-36pt
          fontFamily: fonts[Math.floor(Math.random() * fonts.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          bold: Math.random() > 0.8,
          italic: Math.random() > 0.9
        },
        position: {
          x: Math.floor(Math.random() * 400) + 60,
          y: Math.floor(Math.random() * 300) + 100,
          width: Math.floor(Math.random() * 200) + 200,
          height: Math.floor(Math.random() * 50) + 30
        }
      };

      switch (type) {
        case 'text':
          baseContent.content = `Random content item ${i + 1} - ${Math.random().toString(36).substr(2, 8)}`;
          break;
        case 'image':
          baseContent.url = `https://example.com/random-image-${i}.jpg`;
          baseContent.alt = `Random image ${i + 1}`;
          break;
        case 'shape':
          baseContent.shapeType = ['RECTANGLE', 'ELLIPSE', 'TRIANGLE'][Math.floor(Math.random() * 3)];
          break;
      }

      return baseContent;
    });
  },
  
  createMockApiResponse: (success = true, data = {}, options = {}) => {
    const response = {
      success,
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substr(2, 16)}`
    };

    if (success) {
      response.data = data;
      if (options.includeMetadata) {
        response.metadata = {
          executionTime: Math.floor(Math.random() * 1000) + 100,
          apiVersion: 'v1',
          quotaUsed: Math.floor(Math.random() * 100)
        };
      }
    } else {
      response.error = {
        code: data.code || 500,
        message: data.message || 'Unknown error',
        type: data.type || 'INTERNAL',
        details: data.details || []
      };
    }
    
    return response;
  },

  createSlideDataset: (slideCount = 10, elementsPerSlide = 5) => {
    return Array.from({ length: slideCount }, (_, slideIndex) => ({
      slideId: `slide-${slideIndex + 1}`,
      layout: ['BLANK', 'TITLE', 'TITLE_AND_BODY', 'TITLE_ONLY'][slideIndex % 4],
      elements: Array.from({ length: elementsPerSlide }, (_, elementIndex) => ({
        elementId: `element-${slideIndex + 1}-${elementIndex + 1}`,
        type: ['text', 'image', 'shape'][elementIndex % 3],
        content: `Element ${elementIndex + 1} on slide ${slideIndex + 1}`,
        position: {
          x: (elementIndex % 2) * 350 + 60,
          y: Math.floor(elementIndex / 2) * 120 + 100,
          width: 300,
          height: 100
        }
      }))
    }));
  },

  simulateProgressiveLoad: (totalItems = 100, batchSize = 10) => {
    const batches = [];
    for (let i = 0; i < totalItems; i += batchSize) {
      const batch = testHelpers.generateRandomContent(
        Math.min(batchSize, totalItems - i),
        { types: ['text'] }
      );
      batches.push({
        batchNumber: Math.floor(i / batchSize) + 1,
        startIndex: i,
        endIndex: Math.min(i + batchSize - 1, totalItems - 1),
        items: batch
      });
    }
    return batches;
  },

  createTestPresentation: (title = 'Test Presentation', slideCount = 5) => {
    return {
      id: `test-presentation-${Date.now()}`,
      title,
      url: `https://docs.google.com/presentation/d/test-presentation-${Date.now()}/edit`,
      slides: testHelpers.createSlideDataset(slideCount),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
  }
};

module.exports = {
  testFixtures,
  testHelpers
};

// Also export as global for easy access in tests
global.testFixtures = testFixtures;
global.testHelpers = testHelpers;