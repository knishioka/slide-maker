# Worktree使い方ガイド - 2並列開発

## 🚀 セットアップ手順

### 1. 基本Worktree作成
```bash
# メインプロジェクトディレクトリで実行
npm run worktree:setup

# または手動で2つだけ作成
git worktree add ../slide-maker-core-services feature/core-services
git worktree add ../slide-maker-testing test/comprehensive-suite
```

### 2. ディレクトリ構造確認
```
parent-directory/
├── slide-maker/                    # メインプロジェクト (あなたが今いる場所)
├── slide-maker-core-services/      # Core Services開発 (あなた)
└── slide-maker-testing/            # Testing開発 (協力者)
```

## 👤 あなた (Core Services担当)

### セットアップ
```bash
# Core Servicesディレクトリに移動
cd ../slide-maker-core-services

# 依存関係インストール
npm install

# 開発開始
code .  # VS Codeで開く
```

### 開発フロー
```bash
# 1. 毎日の開発開始時
cd ../slide-maker-core-services
git pull origin feature/core-services

# 2. 開発中
# ファイル編集・実装
npm run lint:fix    # リアルタイムでLint
npm run test:unit   # テスト実行

# 3. 日次コミット
git add .
git commit -m "feat: implement Google Slides API basic operations"
git push origin feature/core-services

# 4. 週次統合 (金曜日)
git checkout develop
git pull origin develop
git merge feature/core-services
git push origin develop
```

### 実装ターゲット
```javascript
// src/services/slides.js
class GoogleSlidesService {
  constructor() {
    this.slidesApp = SlidesApp;
  }
  
  createPresentation(title) {
    // Google Slides API実装
  }
  
  addSlide(presentationId, layout) {
    // スライド追加実装
  }
  
  insertTextBox(slide, text, position, style) {
    // テキストボックス挿入実装
  }
}

// src/utils/logger.js  
class Logger {
  log(level, message, context) {
    // ログシステム実装
  }
}

// src/utils/validation.js
class Validator {
  validateSlideContent(content) {
    // バリデーション実装
  }
}
```

## 👥 協力者 (Testing担当)

### Claude Codeへの依頼文

```markdown
# Google Slides Content Generator - Testing Implementation

## 📁 プロジェクト概要
Google Apps ScriptベースのGoogle Slidesコンテンツ自動生成サービスの包括的テストスイート実装をお願いします。

## 🛠️ 環境セットアップ
```bash
# 指定ディレクトリへ移動
cd /path/to/slide-maker-testing

# プロジェクト確認
ls -la  # ファイル構造確認
cat package.json  # 設定確認
cat CLAUDE.md  # 開発ガイドライン確認

# 依存関係インストール
npm install
```

## 🎯 実装ミッション (3週間)

### Week 1: Core Services単体テスト
**Priority: High**

#### 1.1 Google Slides API Wrapper テスト
ファイル: `tests/unit/slides-service.test.js`
```javascript
describe('GoogleSlidesService', () => {
  let slidesService;
  
  beforeEach(() => {
    slidesService = new GoogleSlidesService();
  });
  
  describe('createPresentation', () => {
    it('should create presentation with valid title', () => {
      const title = 'Test Presentation';
      const result = slidesService.createPresentation(title);
      
      expect(result).toBeDefined();
      expect(result.getId()).toBeTruthy();
    });
    
    it('should handle empty title gracefully', () => {
      expect(() => slidesService.createPresentation('')).toThrow();
    });
    
    it('should handle API errors', () => {
      // Mock API error and test error handling
    });
  });
  
  describe('addSlide', () => {
    it('should add slide to existing presentation', () => {
      // Implementation test
    });
    
    it('should handle invalid presentation ID', () => {
      // Error case test
    });
  });
  
  describe('insertTextBox', () => {
    it('should insert text box with correct positioning', () => {
      // Position and style test
    });
    
    it('should apply text styles correctly', () => {
      // Style application test
    });
  });
});
```

#### 1.2 Logger システムテスト
ファイル: `tests/unit/logger.test.js`
```javascript
describe('Logger', () => {
  let logger;
  
  beforeEach(() => {
    logger = new Logger();
  });
  
  describe('log levels', () => {
    it('should log ERROR level messages', () => {
      // Error logging test
    });
    
    it('should filter out lower priority messages', () => {
      // Log level filtering test
    });
    
    it('should format log messages correctly', () => {
      // Message formatting test
    });
  });
  
  describe('error handling', () => {
    it('should handle logging failures gracefully', () => {
      // Robust error handling test
    });
  });
});
```

#### 1.3 Validation システムテスト
ファイル: `tests/unit/validation.test.js`
```javascript
describe('Validator', () => {
  let validator;
  
  beforeEach(() => {
    validator = new Validator();
  });
  
  describe('validateSlideContent', () => {
    it('should validate correct slide content', () => {
      const validContent = {
        type: 'text',
        content: 'Valid content',
        style: { fontSize: 24 }
      };
      
      expect(validator.validateSlideContent(validContent)).toBe(true);
    });
    
    it('should reject invalid content types', () => {
      // Invalid content testing
    });
    
    it('should sanitize dangerous input', () => {
      // Security testing
    });
  });
});
```

### Week 2: 統合テスト実装
**Priority: High**

#### 2.1 スライド生成フローテスト
ファイル: `tests/integration/slide-generation.test.js`
```javascript
describe('Slide Generation Integration', () => {
  describe('complete slide creation flow', () => {
    it('should create presentation with multiple slides', async () => {
      // End-to-end slide creation test
      const content = [
        { type: 'title', text: 'Test Presentation' },
        { type: 'body', text: 'Content here' }
      ];
      
      const result = await slideGenerator.createSlides(content);
      expect(result.presentationId).toBeTruthy();
      expect(result.slides.length).toBe(2);
    });
    
    it('should handle large content gracefully', () => {
      // Performance test with large datasets
    });
    
    it('should recover from partial failures', () => {
      // Resilience testing
    });
  });
});
```

#### 2.2 Google API統合テスト
ファイル: `tests/integration/api-integration.test.js`
```javascript
describe('Google API Integration', () => {
  describe('API rate limiting', () => {
    it('should handle rate limits gracefully', () => {
      // Rate limiting test
    });
    
    it('should implement exponential backoff', () => {
      // Backoff strategy test
    });
  });
  
  describe('authentication', () => {
    it('should handle OAuth token refresh', () => {
      // Auth token management test
    });
  });
});
```

### Week 3: テスト基盤強化
**Priority: Medium**

#### 3.1 Google Apps Script モック強化
ファイル: `tests/helpers/gas-mocks.js`
```javascript
class EnhancedGASMocks {
  constructor() {
    this.setupSlidesAppMock();
    this.setupDriveAppMock();
    this.setupUtilitiesMock();
  }
  
  setupSlidesAppMock() {
    global.SlidesApp = {
      create: jest.fn(() => ({
        getId: () => 'mock-presentation-id',
        getSlides: () => [],
        appendSlide: jest.fn()
      })),
      
      openById: jest.fn((id) => ({
        getSlides: () => [this.createMockSlide()],
        setTitle: jest.fn()
      }))
    };
  }
  
  createMockSlide() {
    return {
      insertTextBox: jest.fn(() => this.createMockTextBox()),
      insertImage: jest.fn(() => this.createMockImage()),
      insertShape: jest.fn(() => this.createMockShape())
    };
  }
  
  // ... more sophisticated mocks
}
```

#### 3.2 テストデータ・フィクスチャ
ファイル: `tests/fixtures/test-data.js`
```javascript
export const testFixtures = {
  presentations: {
    basic: {
      title: 'Test Presentation',
      slides: [
        { type: 'title', content: 'Title Slide' },
        { type: 'content', content: 'Content Slide' }
      ]
    },
    
    complex: {
      title: 'Complex Presentation',
      slides: [
        // Multiple slide types with various content
      ]
    }
  },
  
  apiResponses: {
    success: {
      presentationId: 'test-id-123',
      title: 'Test Presentation'
    },
    
    error: {
      error: {
        code: 429,
        message: 'Rate limit exceeded'
      }
    }
  },
  
  slideContent: {
    validText: {
      type: 'text',
      content: 'Valid text content',
      style: { fontSize: 24, fontFamily: 'Arial' }
    },
    
    invalidText: {
      type: 'text',
      content: '', // Invalid empty content
      style: null
    }
  }
};
```

#### 3.3 テストカバレッジレポート
```javascript
// tests/coverage-setup.js
// カバレッジレポート設定
```

## 📖 重要な参考資料

### 必読ドキュメント
1. **CLAUDE.md** - Claude Code開発ガイドライン
2. **docs/technical-specification.md** - 技術仕様詳細
3. **docs/architecture.md** - システムアーキテクチャ
4. **tests/unit/example.test.js** - テストテンプレート

### Google Apps Script API参考
- [Google Slides API](https://developers.google.com/slides/api)
- [Google Apps Script Slides Service](https://developers.google.com/apps-script/reference/slides)

## 🔄 開発フロー

### 日次作業
```bash
# 1. 最新コード確認
git pull origin test/comprehensive-suite

# 2. Core Services実装状況確認
cd ../slide-maker-core-services
git log --oneline -5  # 最新の実装確認

# 3. 対応するテスト作成
cd ../slide-maker-testing
# Core Servicesの実装に合わせてテスト作成

# 4. テスト実行・デバッグ
npm run test:unit
npm run lint:fix

# 5. 日次コミット
git add .
git commit -m "test: add unit tests for GoogleSlidesService"
git push origin test/comprehensive-suite
```

### 週次統合
```bash
# 金曜日: developブランチに統合
git checkout develop  
git pull origin develop
git merge test/comprehensive-suite
git push origin develop
```

## 🎯 成功指標

### Week 1目標
- [ ] Core Services単体テスト完成
- [ ] テストカバレッジ60%以上
- [ ] 全テストパス

### Week 2目標  
- [ ] 統合テスト完成
- [ ] API連携テスト動作
- [ ] テストカバレッジ80%以上

### Week 3目標
- [ ] テスト基盤完成
- [ ] モックシステム強化
- [ ] テストカバレッジ90%以上

## 💬 サポート・質問

### 質問時の情報提供
- 現在の実装状況
- エラーメッセージ全文
- 期待する動作
- 試した解決方法

### コミュニケーション
- 日次: 進捗簡単報告
- 週次: 詳細レビュー・課題共有
- 随時: 技術的質問・相談

## 🚀 最終目標

**高品質で保守性の高いテストスイート**を構築し、Google Slides Content Generatorの安定性と信頼性を確保する。

---

このミッションを完遂することで、プロジェクト全体の品質向上に大きく貢献できます。
頑張ってください！🎉
```

## 🔄 日常の使い方

### あなたの日次ルーチン
```bash
# 朝: Core Services開発開始
cd ../slide-maker-core-services
git pull origin feature/core-services

# 実装作業
# ... Google Slides API実装 ...

# 夕方: デイリーコミット
git add .
git commit -m "feat: implement slide text insertion with styling"
git push origin feature/core-services

# Testing側の進捗確認
cd ../slide-maker-testing
git log --oneline -3  # 協力者の進捗確認
```

### 協力者の日次ルーチン
```bash
# 朝: Testing開発開始  
cd ../slide-maker-testing
git pull origin test/comprehensive-suite

# あなたの実装確認
cd ../slide-maker-core-services
git log --oneline -3  # 最新実装確認

# 対応するテスト作成
cd ../slide-maker-testing
# ... テスト実装 ...

# 夕方: デイリーコミット
git add .
git commit -m "test: add comprehensive tests for slide text insertion"
git push origin test/comprehensive-suite
```

## 🔗 統合・同期

### 週次統合 (金曜日)
```bash
# メインプロジェクトで実行
npm run worktree:status  # 全体状況確認
npm run worktree:sync-all  # 全worktree同期

# 手動統合
cd ../slide-maker-core-services
git checkout develop
git merge feature/core-services
git push origin develop

cd ../slide-maker-testing  
git checkout develop
git merge test/comprehensive-suite
git push origin develop
```

これで効率的な2並列開発が実現できます！