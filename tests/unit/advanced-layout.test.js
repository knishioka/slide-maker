/**
 * Advanced Layout Engine Tests
 * Tests for the enhanced multi-column layout system with responsive design
 */

describe('Advanced Layout Engine', () => {
  let layoutService;
  let slidesService;
  let themeService;

  beforeEach(() => {
    // Initialize mocks
    slidesService = {
      openById: mockFn(() => ({ id: 'mock-presentation' })),
      getSlideDimensions: mockFn(() => ({ width: 1920, height: 1080 })),
      getSlides: mockFn(() => [
        { id: 'slide-1' },
        { id: 'slide-2' },
        { id: 'slide-3' }
      ]),
      getSlideElements: mockFn(() => [
        { type: 'text', id: 'element-1' },
        { type: 'image', id: 'element-2' }
      ])
    };

    themeService = {
      getActiveTheme: mockFn(() => ({
        id: 'default',
        name: 'Default Theme',
        colors: { primary: '#2196f3' }
      }))
    };

    layoutService = new LayoutService(slidesService, themeService);
  });

  describe('createAdvancedLayout', () => {
    test('should create layout with auto column detection', () => {
      const config = {
        templateType: 'auto',
        columns: 'auto',
        content: [
          { type: 'text', text: 'Content 1' },
          { type: 'text', text: 'Content 2' },
          { type: 'text', text: 'Content 3' }
        ],
        responsive: true
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result).toBeDefined();
      expect(result.layoutType).toBe('advanced-multi-column');
      expect(result.grid.columns).toBe(3); // 3 content items = 3 columns
      expect(result.positioning).toHaveLength(3);
      expect(result.metadata.layoutEngine).toBe('Advanced Layout Engine v2.0');
    });

    test('should respect maximum column limits', () => {
      const config = {
        columns: 'auto',
        content: Array(10).fill().map((_, i) => ({ type: 'text', text: `Content ${i + 1}` }))
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.columns).toBeLessThanOrEqual(6); // Max 6 columns
    });

    test('should create fixed column layout', () => {
      const config = {
        columns: 4,
        content: [
          { type: 'text', text: 'Content 1' },
          { type: 'text', text: 'Content 2' }
        ]
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.columns).toBe(2); // Min of 4 and content.length
    });

    test('should generate proper grid areas', () => {
      const config = {
        columns: 2,
        content: [
          { type: 'text', text: 'Content 1' },
          { type: 'text', text: 'Content 2' },
          { type: 'text', text: 'Content 3' }
        ]
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.gridAreas['content-0']).toBe('1 / 1 / 2 / 2');
      expect(result.grid.gridAreas['content-1']).toBe('1 / 2 / 2 / 3');
      expect(result.grid.gridAreas['content-2']).toBe('2 / 1 / 3 / 2');
    });

    test('should add header area for header-content template', () => {
      const config = {
        templateType: 'header-content',
        columns: 2,
        content: [
          { type: 'text', text: 'Content 1' },
          { type: 'text', text: 'Content 2' }
        ]
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.gridAreas.header).toBe('1 / 1 / 2 / 3');
      expect(result.grid.gridAreas['content-0']).toBe('2 / 1 / 3 / 2'); // Shifted down
    });

    test('should include responsive configuration when enabled', () => {
      const config = {
        columns: 3,
        content: [{ type: 'text', text: 'Content 1' }],
        responsive: true
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.responsive).toBeDefined();
      expect(result.grid.responsive.breakpoint).toBeDefined();
    });

    test('should include theme information when available', () => {
      const config = {
        columns: 2,
        content: [{ type: 'text', text: 'Content 1' }]
      };

      const result = layoutService.createAdvancedLayout('test-presentation', config);

      expect(result.grid.theme).toBeDefined();
      expect(result.grid.theme.id).toBe('default');
    });
  });

  describe('calculateOptimalColumns', () => {
    test('should handle numeric columns', () => {
      const content = [{ text: 'a' }, { text: 'b' }, { text: 'c' }];
      const slideDimensions = { width: 1920, height: 1080 };

      const result = layoutService.calculateOptimalColumns(content, 4, slideDimensions);

      expect(result).toBe(3); // Min of 4, content.length(3), and max(6)
    });

    test('should auto-detect based on content count and width', () => {
      const slideDimensions = { width: 1200, height: 1080 };

      // Test various content counts
      expect(layoutService.calculateOptimalColumns([{ text: 'a' }], 'auto', slideDimensions)).toBe(1);
      expect(layoutService.calculateOptimalColumns([{ text: 'a' }, { text: 'b' }], 'auto', slideDimensions)).toBe(2);
      expect(layoutService.calculateOptimalColumns(Array(5).fill({ text: 'a' }), 'auto', slideDimensions)).toBe(3);
    });

    test('should consider slide width for column calculation', () => {
      const content = Array(4).fill({ text: 'content' });
      const narrowSlide = { width: 600, height: 1080 };
      const wideSlide = { width: 1600, height: 1080 };

      const narrowResult = layoutService.calculateOptimalColumns(content, 'auto', narrowSlide);
      const wideResult = layoutService.calculateOptimalColumns(content, 'auto', wideSlide);

      expect(narrowResult).toBeLessThanOrEqual(wideResult);
    });
  });

  describe('Grid positioning calculations', () => {
    test('should calculate proper gap size based on slide dimensions', () => {
      const smallSlide = { width: 960, height: 540 };
      const largeSlide = { width: 3840, height: 2160 };

      const smallGap = layoutService.calculateOptimalGap(smallSlide);
      const largeGap = layoutService.calculateOptimalGap(largeSlide);

      expect(largeGap).toBeGreaterThanOrEqual(smallGap);
      expect(smallGap).toBeGreaterThan(0);
    });

    test('should calculate proportional margins', () => {
      const slide = { width: 1920, height: 1080 };
      const margins = layoutService.calculateOptimalMargins(slide);

      expect(margins.top).toBe(margins.bottom);
      expect(margins.left).toBe(margins.right);
      expect(margins.top).toBeGreaterThan(0);
    });
  });

  describe('Content positioning', () => {
    test('should position content items correctly', () => {
      const content = [
        { type: 'text', text: 'Item 1' },
        { type: 'text', text: 'Item 2' }
      ];

      const mockGrid = {
        gridAreas: {
          'content-0': '1 / 1 / 2 / 2',
          'content-1': '1 / 2 / 2 / 3'
        },
        getGridPosition: mockFn((area) => ({
          x: 50,
          y: 50,
          width: 400,
          height: 300
        }))
      };

      const result = layoutService.generateContentPositioning(content, mockGrid);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBeDefined();
      expect(result[0].area).toBe('content-0');
      expect(result[1].area).toBe('content-1');
      expect(mockGrid.getGridPosition.mock.calls).toHaveLength(2);
    });

    test('should handle missing grid areas gracefully', () => {
      const content = [{ type: 'text', text: 'Item 1' }];
      const mockGrid = {
        gridAreas: {},
        getGridPosition: mockFn()
      };

      const result = layoutService.generateContentPositioning(content, mockGrid);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBeUndefined();
      expect(mockGrid.getGridPosition.mock.calls).toHaveLength(0);
    });
  });

  describe('Layout metadata generation', () => {
    test('should generate comprehensive metadata', () => {
      const config = { columns: 3, responsive: true };
      const grid = {
        columns: 3,
        rows: 2,
        gap: 16,
        margins: { top: 48, right: 48, bottom: 48, left: 48 },
        gridAreas: { 'content-0': '1/1/2/2', 'content-1': '1/2/2/3' },
        responsive: { breakpoint: { key: 'md' } }
      };

      const metadata = layoutService.generateLayoutMetadata(config, grid);

      expect(metadata.generatedAt).toBeDefined();
      expect(metadata.layoutEngine).toBe('Advanced Layout Engine v2.0');
      expect(metadata.config).toEqual(config);
      expect(metadata.grid.columns).toBe(3);
      expect(metadata.grid.totalAreas).toBe(2);
      expect(metadata.responsive).toBe(true);
      expect(metadata.accessibility).toBeDefined();
    });

    test('should include accessibility metadata', () => {
      const grid = { gridAreas: {} };
      const accessibility = layoutService.generateAccessibilityMetadata(grid);

      expect(accessibility.readingOrder).toBe('left-to-right, top-to-bottom');
      expect(accessibility.contrastCompliant).toBe(true);
      expect(accessibility.screenReaderFriendly).toBe(true);
    });
  });
});

describe('GridSystem Flexbox Layout', () => {
  let gridSystem;

  beforeEach(() => {
    gridSystem = new GridSystem();
  });

  describe('createFlexLayout', () => {
    test('should create horizontal flex layout', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        direction: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20
      };

      const flexLayout = gridSystem.createFlexLayout(config);

      expect(flexLayout.direction).toBe('row');
      expect(flexLayout.justifyContent).toBe('space-between');
      expect(flexLayout.alignItems).toBe('center');
      expect(flexLayout.contentWidth).toBe(1856); // 1920 - 32*2 margins
      expect(flexLayout.distributeItems).toBeDefined();
    });

    test('should create vertical flex layout', () => {
      const config = {
        slideDimensions: { width: 1920, height: 1080 },
        direction: 'column',
        gap: 16
      };

      const flexLayout = gridSystem.createFlexLayout(config);

      expect(flexLayout.direction).toBe('column');
      expect(flexLayout.contentHeight).toBe(1016); // 1080 - 32*2 margins
    });
  });

  describe('distributeFlexItems', () => {
    test('should distribute items horizontally with space-between', () => {
      const items = [
        { type: 'text', content: 'Item 1' },
        { type: 'text', content: 'Item 2' },
        { type: 'text', content: 'Item 3' }
      ];

      const flexConfig = {
        contentWidth: 900,
        contentHeight: 600,
        direction: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 20,
        margins: { top: 50, right: 50, bottom: 50, left: 50 }
      };

      const result = gridSystem.distributeFlexItems(items, flexConfig);

      expect(result).toHaveLength(3);
      expect(result[0].position.x).toBe(50); // margin.left + first item x
      expect(result[0].position.width).toBe(280); // (900 - 2*20) / 3
      expect(result[0].position.height).toBe(600);
      expect(result[2].position.x).toBeGreaterThan(result[1].position.x);
    });

    test('should distribute items vertically with center alignment', () => {
      const items = [
        { type: 'text', content: 'Item 1' },
        { type: 'text', content: 'Item 2' }
      ];

      const flexConfig = {
        contentWidth: 800,
        contentHeight: 600,
        direction: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        margins: { top: 40, right: 40, bottom: 40, left: 40 }
      };

      const result = gridSystem.distributeFlexItems(items, flexConfig);

      expect(result).toHaveLength(2);
      expect(result[0].position.width).toBe(800);
      expect(result[0].position.height).toBe(290); // (600 - 20) / 2
      expect(result[0].position.x).toBe(40); // margin.left (centered)
      expect(result[1].position.y).toBeGreaterThan(result[0].position.y);
    });

    test('should handle single item correctly', () => {
      const items = [{ type: 'text', content: 'Single Item' }];

      const flexConfig = {
        contentWidth: 800,
        contentHeight: 600,
        direction: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
        margins: { top: 0, right: 0, bottom: 0, left: 0 }
      };

      const result = gridSystem.distributeFlexItems(items, flexConfig);

      expect(result).toHaveLength(1);
      expect(result[0].position.width).toBe(800);
      expect(result[0].position.height).toBe(600);
    });

    test('should handle empty items array', () => {
      const flexConfig = {
        contentWidth: 800,
        contentHeight: 600,
        direction: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        margins: { top: 0, right: 0, bottom: 0, left: 0 }
      };

      const result = gridSystem.distributeFlexItems([], flexConfig);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateFlexItemDimensions', () => {
    test('should calculate equal widths for row direction', () => {
      const config = {
        contentWidth: 900,
        contentHeight: 300,
        direction: 'row',
        gap: 20
      };

      const dimensions = gridSystem.calculateFlexItemDimensions(3, config);

      expect(dimensions.width).toBe(280); // (900 - 2*20) / 3
      expect(dimensions.height).toBe(300);
    });

    test('should calculate equal heights for column direction', () => {
      const config = {
        contentWidth: 400,
        contentHeight: 600,
        direction: 'column',
        gap: 15
      };

      const dimensions = gridSystem.calculateFlexItemDimensions(4, config);

      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(135); // (600 - 3*15) / 4
    });
  });
});

describe('Advanced Layout API Integration', () => {
  beforeEach(() => {
    // Mock global services
    global.SlidesService = function() {
      return {
        openById: mockFn(() => ({ id: 'test-presentation' })),
        getSlideDimensions: mockFn(() => ({ width: 1920, height: 1080 }))
      };
    };

    global.LayoutService = function(slidesService, themeService) {
      return {
        createAdvancedLayout: mockFn(() => ({
          layoutType: 'advanced-multi-column',
          grid: { columns: 3, rows: 2 },
          positioning: [],
          metadata: { layoutEngine: 'Advanced Layout Engine v2.0' }
        })),
        gridSystem: {
          createFlexLayout: mockFn(() => ({
            direction: 'row',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            distributeItems: mockFn((items) => items.map((item, i) => ({
              ...item,
              position: { x: i * 100, y: 50, width: 80, height: 200 }
            })))
          }))
        }
      };
    };
  });

  describe('createAdvancedLayout API', () => {
    test('should create advanced layout successfully', () => {
      const layoutConfig = {
        columns: 'auto',
        content: [
          { type: 'text', text: 'Content 1' },
          { type: 'text', text: 'Content 2' }
        ],
        responsive: true
      };

      const result = createAdvancedLayout('test-presentation', layoutConfig);

      expect(result.success).toBe(true);
      expect(result.data.layoutType).toBe('advanced-multi-column');
      expect(result.data.grid.columns).toBe(3);
    });

    test('should handle errors gracefully', () => {
      // Override to throw error
      global.LayoutService = function() {
        return {
          createAdvancedLayout: mockFn(() => {
            throw new Error('Test error');
          })
        };
      };

      const result = createAdvancedLayout('invalid-presentation', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('createFlexLayout API', () => {
    test('should create flex layout successfully', () => {
      const flexConfig = {
        direction: 'row',
        justifyContent: 'center',
        content: [
          { type: 'text', text: 'Item 1' },
          { type: 'text', text: 'Item 2' }
        ]
      };

      const result = createFlexLayout('test-presentation', flexConfig);

      expect(result.success).toBe(true);
      expect(result.data.layoutType).toBe('flexbox');
      expect(result.data.flex.direction).toBe('row');
      expect(result.data.items).toHaveLength(2);
    });
  });
});