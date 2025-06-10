# Google Slides デザインガイドライン

## 1. フォント設計基準

### 1.1 フォントサイズ階層
```javascript
const FONT_HIERARCHY = {
  // プレゼンテーション用フォントサイズ (pt)
  title: {
    default: 44,
    min: 36,
    max: 60,
    description: "スライドタイトル - 最も重要な見出し"
  },
  
  heading: {
    default: 32,
    min: 28,
    max: 40,
    description: "セクション見出し - コンテンツの区分"
  },
  
  subheading: {
    default: 28,
    min: 24,
    max: 32,
    description: "サブセクション見出し"
  },
  
  body: {
    default: 24,
    min: 20,
    max: 28,
    description: "本文テキスト - メインコンテンツ"
  },
  
  caption: {
    default: 20,
    min: 18,
    max: 24,
    description: "キャプション・注釈・補足情報"
  },
  
  footnote: {
    default: 16,
    min: 14,
    max: 18,
    description: "脚注・参考情報"
  }
};
```

### 1.2 レスポンシブフォントサイズ計算
```javascript
/**
 * スライドサイズとコンテンツ量に基づく最適フォントサイズ計算
 */
function calculateResponsiveFontSize(options) {
  const {
    baseSize,           // 基準フォントサイズ
    slideWidth,         // スライド幅
    slideHeight,        // スライド高さ
    contentLength,      // コンテンツの文字数
    viewingDistance,    // 視聴距離 ('close', 'medium', 'far')
    importance         // 重要度 ('high', 'medium', 'low')
  } = options;
  
  // 基準サイズ (960x540 を標準とする)
  const STANDARD_WIDTH = 960;
  const STANDARD_HEIGHT = 540;
  
  // スケール比率計算
  const widthRatio = slideWidth / STANDARD_WIDTH;
  const heightRatio = slideHeight / STANDARD_HEIGHT;
  const scaleRatio = Math.min(widthRatio, heightRatio);
  
  // コンテンツ量による調整 (長いテキストは小さく)
  const contentFactor = calculateContentFactor(contentLength);
  
  // 視聴距離による調整
  const distanceFactor = getDistanceFactor(viewingDistance);
  
  // 重要度による調整
  const importanceFactor = getImportanceFactor(importance);
  
  // 最終サイズ計算
  const calculatedSize = baseSize * scaleRatio * contentFactor * distanceFactor * importanceFactor;
  
  // 最小・最大サイズでクランプ
  return Math.max(14, Math.min(72, Math.round(calculatedSize)));
}

function calculateContentFactor(contentLength) {
  if (contentLength <= 50) return 1.0;      // 短い: そのまま
  if (contentLength <= 150) return 0.95;    // 中程度: 5%縮小
  if (contentLength <= 300) return 0.85;    // 長い: 15%縮小
  return 0.75;                               // 非常に長い: 25%縮小
}

function getDistanceFactor(distance) {
  const factors = {
    'close': 0.9,     // 近距離視聴 (個人用)
    'medium': 1.0,    // 中距離視聴 (会議室)
    'far': 1.3        // 遠距離視聴 (大ホール)
  };
  return factors[distance] || 1.0;
}

function getImportanceFactor(importance) {
  const factors = {
    'high': 1.15,     // 重要: 15%拡大
    'medium': 1.0,    // 標準: そのまま
    'low': 0.9        // 低重要度: 10%縮小
  };
  return factors[importance] || 1.0;
}
```

### 1.3 フォントファミリー選択基準
```javascript
const FONT_FAMILIES = {
  // プレゼンテーション推奨フォント (視認性重視)
  primary: {
    families: ['Arial', 'Helvetica', 'Calibri'],
    characteristics: 'Sans-serif, 高い可読性, 画面表示最適化',
    usage: 'タイトル、見出し、本文すべてに使用可能'
  },
  
  // 日本語対応
  japanese: {
    families: ['Noto Sans JP', 'Hiragino Sans', 'MS Gothic'],
    characteristics: '日本語フォント, Sans-serif推奨',
    usage: '日本語コンテンツ用'
  },
  
  // 特殊用途
  monospace: {
    families: ['Courier New', 'Monaco', 'Consolas'],
    characteristics: '等幅フォント',
    usage: 'コード、データ表示用'
  }
};

/**
 * コンテンツタイプに基づくフォント選択
 */
function selectOptimalFont(contentType, language = 'en') {
  const selections = {
    'title': {
      en: 'Arial',
      ja: 'Noto Sans JP'
    },
    'body': {
      en: 'Calibri',
      ja: 'Hiragino Sans'
    },
    'code': {
      en: 'Courier New',
      ja: 'MS Gothic'
    }
  };
  
  return selections[contentType]?.[language] || 'Arial';
}
```

## 2. 余白・スペーシング設計

### 2.1 余白システム
```javascript
const SPACING_SYSTEM = {
  // 8の倍数ベースのスペーシングシステム
  base: 8,
  
  // 標準余白サイズ
  sizes: {
    xs: 4,    // 0.5 × base
    sm: 8,    // 1 × base
    md: 16,   // 2 × base
    lg: 24,   // 3 × base
    xl: 32,   // 4 × base
    xxl: 48,  // 6 × base
    xxxl: 64  // 8 × base
  },
  
  // スライドサイズ別余白
  slideMargins: {
    standard: {  // 960×540
      top: 48,
      right: 64,
      bottom: 48,
      left: 64
    },
    wide: {      // 1920×1080
      top: 80,
      right: 120,
      bottom: 80,
      left: 120
    }
  }
};

/**
 * レスポンシブ余白計算
 */
function calculateResponsiveMargins(slideWidth, slideHeight) {
  const standardWidth = 960;
  const standardHeight = 540;
  
  const scaleX = slideWidth / standardWidth;
  const scaleY = slideHeight / standardHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const baseMargin = SPACING_SYSTEM.sizes.xl;
  
  return {
    top: Math.round(baseMargin * scale),
    right: Math.round(baseMargin * scale * 1.3), // 横余白は少し大きく
    bottom: Math.round(baseMargin * scale),
    left: Math.round(baseMargin * scale * 1.3)
  };
}
```

### 2.2 行間・段落間スペーシング
```javascript
/**
 * フォントサイズに基づく行間計算
 */
function calculateLineHeight(fontSize, contentType = 'body') {
  const LINE_HEIGHT_RATIOS = {
    'title': 1.2,      // タイトルは詰める
    'heading': 1.3,    // 見出しも比較的詰める
    'body': 1.4,       // 本文は読みやすく
    'caption': 1.5,    // 小さい文字は行間を広く
    'list': 1.6        // リストは特に読みやすく
  };
  
  const ratio = LINE_HEIGHT_RATIOS[contentType] || 1.4;
  
  // 小さいフォントほど行間を広く
  const sizeAdjustment = fontSize < 20 ? 0.1 : 0;
  
  return (ratio + sizeAdjustment) * fontSize;
}

/**
 * 段落間スペーシング計算
 */
function calculateParagraphSpacing(fontSize) {
  // フォントサイズの1.5～2倍を段落間隔とする
  return Math.round(fontSize * 1.75);
}

/**
 * リストアイテム間スペーシング
 */
function calculateListItemSpacing(fontSize) {
  // フォントサイズの0.5～1倍をアイテム間隔とする
  return Math.round(fontSize * 0.75);
}
```

## 3. レイアウトシステム

### 3.1 グリッドシステム
```javascript
class GridSystem {
  constructor(slideWidth, slideHeight, columns = 12) {
    this.width = slideWidth;
    this.height = slideHeight;
    this.columns = columns;
    this.margins = calculateResponsiveMargins(slideWidth, slideHeight);
    this.gutter = SPACING_SYSTEM.sizes.md;
    
    this.contentWidth = this.width - this.margins.left - this.margins.right;
    this.contentHeight = this.height - this.margins.top - this.margins.bottom;
    this.columnWidth = (this.contentWidth - (this.gutter * (columns - 1))) / columns;
  }
  
  /**
   * グリッド位置計算
   */
  getColumnPosition(startCol, spanCols = 1) {
    const x = this.margins.left + ((startCol - 1) * (this.columnWidth + this.gutter));
    const width = (this.columnWidth * spanCols) + (this.gutter * (spanCols - 1));
    
    return { x, width };
  }
  
  /**
   * 行位置計算
   */
  getRowPosition(startRow, spanRows = 1, totalRows = 1) {
    const availableHeight = this.contentHeight;
    const rowHeight = availableHeight / totalRows;
    const y = this.margins.top + ((startRow - 1) * rowHeight);
    const height = rowHeight * spanRows;
    
    return { y, height };
  }
}

/**
 * 一般的なレイアウトパターン
 */
const LAYOUT_PATTERNS = {
  'single-column': {
    description: 'シングルカラム - 縦一列配置',
    grid: { columns: 1, rows: 'auto' },
    usage: 'テキスト中心、シンプルなコンテンツ'
  },
  
  'double-column': {
    description: 'ダブルカラム - 左右2分割',
    grid: { columns: 2, rows: 'auto' },
    usage: '比較、対比、テキスト+画像'
  },
  
  'title-content': {
    description: 'タイトル+コンテンツ',
    grid: { columns: 1, rows: [1, 4] }, // タイトル1行、コンテンツ4行
    usage: '標準的なスライド構成'
  },
  
  'three-column': {
    description: '3カラム',
    grid: { columns: 3, rows: 'auto' },
    usage: '3つの要素を並列表示'
  }
};
```

### 3.2 レイアウト実装
```javascript
/**
 * シングルカラムレイアウト
 */
class SingleColumnLayout {
  constructor(slide, content) {
    this.slide = slide;
    this.content = content;
    this.grid = new GridSystem(slide.getPageWidth(), slide.getPageHeight(), 1);
  }
  
  render() {
    const totalItems = this.content.length;
    
    this.content.forEach((item, index) => {
      const position = this.grid.getRowPosition(index + 1, 1, totalItems);
      const fullWidth = this.grid.getColumnPosition(1, 1);
      
      this.renderContentItem(item, {
        x: fullWidth.x,
        y: position.y,
        width: fullWidth.width,
        height: position.height - SPACING_SYSTEM.sizes.sm
      });
    });
  }
}

/**
 * ダブルカラムレイアウト
 */
class DoubleColumnLayout {
  constructor(slide, content) {
    this.slide = slide;
    this.content = content;
    this.grid = new GridSystem(slide.getPageWidth(), slide.getPageHeight(), 2);
  }
  
  render() {
    const itemsPerColumn = Math.ceil(this.content.length / 2);
    
    this.content.forEach((item, index) => {
      const columnIndex = Math.floor(index / itemsPerColumn);
      const rowIndex = index % itemsPerColumn;
      
      const columnPos = this.grid.getColumnPosition(columnIndex + 1, 1);
      const rowPos = this.grid.getRowPosition(rowIndex + 1, 1, itemsPerColumn);
      
      this.renderContentItem(item, {
        x: columnPos.x,
        y: rowPos.y,
        width: columnPos.width,
        height: rowPos.height - SPACING_SYSTEM.sizes.sm
      });
    });
  }
}
```

## 4. カラーシステム

### 4.1 カラーパレット定義
```javascript
const COLOR_SYSTEM = {
  // 基本カラーパレット
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    500: '#2196f3',    // メインブルー
    700: '#1976d2',
    900: '#0d47a1'
  },
  
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    500: '#9c27b0',    // アクセントパープル
    700: '#7b1fa2',
    900: '#4a148c'
  },
  
  // セマンティックカラー
  semantic: {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  
  // グレースケール
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  
  // テキストカラー
  text: {
    primary: '#212121',      // メインテキスト
    secondary: '#757575',    // セカンダリテキスト
    disabled: '#bdbdbd',     // 無効状態
    inverse: '#ffffff'       // 反転テキスト
  }
};

/**
 * コントラスト比チェック
 */
function checkColorContrast(foreground, background) {
  const contrast = calculateContrastRatio(foreground, background);
  
  return {
    ratio: contrast,
    AA: contrast >= 4.5,      // WCAG AA 基準
    AAA: contrast >= 7.0      // WCAG AAA 基準
  };
}
```

### 4.2 テーマシステム
```javascript
/**
 * テーマ定義
 */
const THEMES = {
  default: {
    name: 'デフォルト',
    colors: {
      background: COLOR_SYSTEM.gray[50],
      surface: '#ffffff',
      primary: COLOR_SYSTEM.primary[500],
      secondary: COLOR_SYSTEM.secondary[500],
      text: COLOR_SYSTEM.text.primary,
      textSecondary: COLOR_SYSTEM.text.secondary
    },
    fonts: FONT_HIERARCHY
  },
  
  corporate: {
    name: 'ビジネス',
    colors: {
      background: '#ffffff',
      surface: COLOR_SYSTEM.gray[50],
      primary: '#1565c0',
      secondary: '#424242',
      text: COLOR_SYSTEM.text.primary,
      textSecondary: COLOR_SYSTEM.text.secondary
    },
    fonts: {
      ...FONT_HIERARCHY,
      // ビジネス用途では少し控えめなサイズ
      title: { ...FONT_HIERARCHY.title, default: 40 },
      body: { ...FONT_HIERARCHY.body, default: 22 }
    }
  },
  
  presentation: {
    name: 'プレゼンテーション',
    colors: {
      background: '#1a237e',
      surface: '#303f9f',
      primary: '#ffeb3b',
      secondary: '#ff5722',
      text: '#ffffff',
      textSecondary: COLOR_SYSTEM.gray[200]
    },
    fonts: {
      ...FONT_HIERARCHY,
      // プレゼン用途では大きめサイズ
      title: { ...FONT_HIERARCHY.title, default: 48 },
      body: { ...FONT_HIERARCHY.body, default: 28 }
    }
  }
};
```

## 5. アクセシビリティガイドライン

### 5.1 視認性基準
```javascript
const ACCESSIBILITY_STANDARDS = {
  // 最小フォントサイズ (プレゼンテーション用)
  minFontSizes: {
    title: 28,
    heading: 24,
    body: 18,
    caption: 16
  },
  
  // 最小コントラスト比
  minContrastRatios: {
    normal: 4.5,      // 通常テキスト
    large: 3.0,       // 大きなテキスト (18pt以上)
    enhanced: 7.0     // 強化基準
  },
  
  // 推奨行間
  minLineHeight: 1.5,
  
  // 推奨文字間隔
  minLetterSpacing: 0.12  // フォントサイズの12%
};

/**
 * アクセシビリティチェック
 */
function validateAccessibility(element) {
  const issues = [];
  
  // フォントサイズチェック
  if (element.fontSize < ACCESSIBILITY_STANDARDS.minFontSizes[element.type]) {
    issues.push(`フォントサイズが小さすぎます: ${element.fontSize}pt`);
  }
  
  // コントラストチェック
  const contrast = checkColorContrast(element.color, element.backgroundColor);
  if (!contrast.AA) {
    issues.push(`コントラスト比が不十分です: ${contrast.ratio.toFixed(2)}`);
  }
  
  // 行間チェック
  if (element.lineHeight < ACCESSIBILITY_STANDARDS.minLineHeight * element.fontSize) {
    issues.push('行間が狭すぎます');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
```

## 6. 実装ユーティリティ

### 6.1 デザイン適用ヘルパー
```javascript
/**
 * テキスト要素にデザインを適用
 */
function applyTextDesign(textElement, options) {
  const {
    type = 'body',
    theme = 'default',
    importance = 'medium',
    slideWidth = 960,
    slideHeight = 540
  } = options;
  
  const currentTheme = THEMES[theme];
  const fontSize = calculateResponsiveFontSize({
    baseSize: currentTheme.fonts[type].default,
    slideWidth,
    slideHeight,
    importance
  });
  
  // フォント設定
  textElement.setFontFamily(selectOptimalFont(type));
  textElement.setFontSize(fontSize);
  textElement.setForegroundColor(currentTheme.colors.text);
  
  // 行間設定
  const lineHeight = calculateLineHeight(fontSize, type);
  textElement.setLineHeight(lineHeight);
  
  // スタイル設定
  if (['title', 'heading'].includes(type)) {
    textElement.setBold(true);
  }
}

/**
 * レイアウト要素の配置
 */
function positionElement(element, position, margins) {
  element.setLeft(position.x + margins.left);
  element.setTop(position.y + margins.top);
  element.setWidth(position.width);
  element.setHeight(position.height);
}
```

このガイドラインに従うことで、一貫性があり、アクセシブルで、視覚的に魅力的なGoogle Slidesコンテンツを生成できます。