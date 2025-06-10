# 🚀 3並列 Git Worktree 開発戦略

**プロジェクト**: Google Slides Content Generator  
**戦略**: 同時3チーム並行開発によるスピード最大化  
**期間**: 6-8週間で完全実装  
**ツール**: Git Worktree + Claude Code

---

## 📊 並行開発アーキテクチャ

### 🏗️ Worktree構成
```
slide-maker/
├── main/                           # メインプロジェクト (統合・調整)
├── ../slide-maker-core-services/   # Team A: Core Services
├── ../slide-maker-layout/          # Team B: Layout Engine  
└── ../slide-maker-ui/              # Team C: Web Interface
```

### 🎯 チーム分担・責任範囲

#### **Team A: Core Services** 🔧
**Worktree**: `../slide-maker-core-services`  
**Branch**: `feature/core-services`  
**優先度**: 🔴 Critical (他チーム依存元)

**実装対象**:
```javascript
src/services/slides.js      // Google Slides API wrapper
src/services/content.js     // コンテンツ処理エンジン
src/utils/logger.js         // ログシステム・エラーハンドリング
src/utils/validation.js     // 入力検証・サニタイズ
```

**キーマイルストーン**:
- Week 1-2: Google Slides API基本操作実装
- Week 3: エラーハンドリング・ログ機能
- Week 4: バリデーション・単体テスト完成

#### **Team B: Layout Engine** 📐
**Worktree**: `../slide-maker-layout`  
**Branch**: `feature/layout-engine`  
**優先度**: 🔴 High (Core Services完了後)

**実装対象**:
```javascript
src/services/layout.js      // レイアウト管理システム
src/utils/design.js         // デザイン計算・フォント制御
```

**キーマイルストーン**:
- Week 2-3: グリッドシステム基盤 (Core依存)
- Week 4: レスポンシブデザイン計算
- Week 5: テーマシステム・統合テスト

#### **Team C: Web Interface** 🎨
**Worktree**: `../slide-maker-ui`  
**Branch**: `feature/web-ui`  
**優先度**: 🟡 Medium (Core+Layout完了後)

**実装対象**:
```javascript
src/web/index.html          // メインUI・フォーム
src/web/style.css           // スタイルシート・レスポンシブ
src/web/script.js           // クライアントサイドJS
src/main.js                 // アプリケーションエントリーポイント
```

**キーマイルストーン**:
- Week 3-4: 基本UI実装 (モック使用)
- Week 5: フォーム処理・バリデーション
- Week 6: Core/Layout統合・UX改善

---

## 🔄 開発フローと統合戦略

### 1. **セットアップフェーズ (Day 1)**
```bash
# メインプロジェクトから3つのworktreeを作成
cd /path/to/slide-maker/main

# Core Services worktree
git worktree add -b feature/core-services ../slide-maker-core-services
cd ../slide-maker-core-services
npm install

# Layout Engine worktree  
cd /path/to/slide-maker/main
git worktree add -b feature/layout-engine ../slide-maker-layout
cd ../slide-maker-layout
npm install

# Web Interface worktree
cd /path/to/slide-maker/main
git worktree add -b feature/web-ui ../slide-maker-ui
cd ../slide-maker-ui
npm install
```

### 2. **日次開発サイクル**
```bash
# 各チーム共通の日次ルーチン

# 朝: 最新状況確認
git pull origin main
git rebase main

# 開発作業
# ... 実装作業 ...

# 夕方: 品質チェック・コミット
npm run lint
npm run test:unit
git add .
git commit -m "feat: implement X functionality"
git push origin feature/branch-name
```

### 3. **週次統合サイクル (金曜日)**
```bash
# メインプロジェクトで統合作業
cd /path/to/slide-maker/main

# 各ブランチの変更をmainに統合
git checkout main
git pull origin main

# Core Services統合
git merge feature/core-services
git push origin main

# Layout Engine統合 (Core依存のため後)
git merge feature/layout-engine  
git push origin main

# Web Interface統合 (最後)
git merge feature/web-ui
git push origin main

# 統合テスト実行
npm run test:integration
npm run test:e2e
```

### 4. **競合解決戦略**
```bash
# 競合が発生した場合の解決手順
git checkout feature/branch-name
git rebase main  # 最新mainの変更を取り込む

# 競合解決後
git rebase --continue
git push origin feature/branch-name --force-with-lease
```

---

## 🎭 各Worktreeでの Claude Code 活用戦略

### 🔧 **Team A: Core Services**

#### **Claude Code プロンプト戦略**
```markdown
# セッション開始時の入力
私は Google Apps Script で Google Slides コンテンツ生成サービスのCore Servicesを実装します。

プロジェクト構成:
- Worktree: ../slide-maker-core-services  
- Branch: feature/core-services
- 実装対象: Google Slides API wrapper, コンテンツ処理, ログ, バリデーション

実装タスク:
1. src/services/slides.js - Google Slides API wrapper
2. src/services/content.js - コンテンツ処理エンジン  
3. src/utils/logger.js - ログシステム
4. src/utils/validation.js - 入力検証

制約条件:
- Google Apps Script環境 (V8 runtime)
- async/await の代わりにPromise使用
- API制限対応 (レート制限・エラーハンドリング)
- 他worktreeからの依存を考慮した設計

開発方針:
1. まずはCLAUDE.mdとdocs/を確認して開発ガイドライン理解
2. tests/runner.jsを使ったテスト駆動開発
3. 既存のappsscript.jsonの設定を活用
4. 実装完了後は必ずlint・テスト実行

どこから始めるべきでしょうか？
```

#### **ロングラン作業指示**
```markdown
以下の順序で Core Services を完全実装してください：

Phase 1 (Week 1-2): Google Slides API Wrapper
- src/services/slides.js の実装
- プレゼンテーション作成・管理
- スライド追加・操作
- テキストボックス・画像挿入
- エラーハンドリング・リトライ機能
- 単体テスト作成

Phase 2 (Week 2-3): ログ・バリデーション
- src/utils/logger.js の実装
- src/utils/validation.js の実装  
- src/services/content.js の実装
- 統合テスト作成

成功条件:
- 全関数にJSDoc
- テストカバレッジ80%以上
- lint エラー0件
- Layout EngineチームがAPIを使用可能

実装中は定期的に進捗報告し、他チームとの連携ポイントを確認してください。
```

### 📐 **Team B: Layout Engine**

#### **Claude Code プロンプト戦略**
```markdown
# セッション開始時の入力
私は Google Slides Layout Engine を実装します。Core Servicesチームの実装に依存する部分があります。

プロジェクト構成:
- Worktree: ../slide-maker-layout
- Branch: feature/layout-engine  
- 実装対象: レイアウト管理, デザイン計算システム

依存関係:
- Core Services (../slide-maker-core-services) のAPIを活用
- docs/design-guidelines.md の詳細仕様に準拠

実装タスク:
1. src/services/layout.js - レイアウト管理システム
2. src/utils/design.js - デザイン計算・フォント制御

技術要件:
- シングル・ダブルカラムレイアウト
- レスポンシブフォントサイズ計算
- グリッドシステム実装  
- テーマシステム (docs/design-guidelines.md準拠)

開発開始前に:
1. Core Servicesの実装状況確認
2. 依存APIのモック作成（必要に応じて）
3. design-guidelines.mdの仕様理解

どのように進めるのが最適でしょうか？
```

#### **ロングラン作業指示**
```markdown
以下の順序で Layout Engine を完全実装してください：

Phase 1 (Week 2-3): 基盤システム (Core Services待ち)
- GridSystemクラス実装
- BaseLayout抽象クラス
- SingleColumnLayout, DoubleColumnLayout
- モックテストでロジック検証

Phase 2 (Week 4): デザインシステム
- ResponsiveDesign計算関数
- ThemeManager実装  
- フォントサイズ・余白計算
- design-guidelines.md完全準拠

Phase 3 (Week 5): 統合・最適化
- Core Servicesとの統合
- パフォーマンス最適化
- エラーハンドリング強化
- UI チームとの連携準備

成功条件:
- 全レイアウトパターン動作
- design-guidelines.md 100%準拠
- Core Services API完全活用
- Web Interface チームが使用可能

実装は段階的に進め、Core Services完成を待って統合してください。
```

### 🎨 **Team C: Web Interface**

#### **Claude Code プロンプト戦略**
```markdown
# セッション開始時の入力
私は Google Apps Script の Web Interface を実装します。Core Services, Layout Engine の完成を待つ部分があります。

プロジェクト構成:
- Worktree: ../slide-maker-ui
- Branch: feature/web-ui
- 実装対象: HTML/CSS/JS フロントエンド + GAS統合

依存関係:
- Core Services API (../slide-maker-core-services)
- Layout Engine API (../slide-maker-layout)

実装タスク:
1. src/web/index.html - ユーザーインターフェース
2. src/web/style.css - レスポンシブスタイル
3. src/web/script.js - クライアントサイドJS
4. src/main.js - GAS WebApp エントリーポイント

技術仕様:
- Google Apps Script WebApp
- HtmlService使用
- レスポンシブデザイン  
- フォーム処理・バリデーション
- プログレス表示・エラーハンドリング

モック開発で先行実装可能な部分から開始したいです。どう進めるべきでしょうか？
```

#### **ロングラン作業指示**
```markdown
以下の順序で Web Interface を完全実装してください：

Phase 1 (Week 3-4): モックUI開発 (先行実装)
- HTML フォーム設計・実装
- CSS レスポンシブデザイン
- JavaScript フォーム処理ロジック
- モックデータでのプロトタイプ

Phase 2 (Week 5): バックエンド統合待ち
- Core Services API統合準備
- Layout Engine API統合準備
- src/main.js (GAS WebApp)実装
- エラーハンドリング・ユーザビリティ

Phase 3 (Week 6): 最終統合・UX改善
- 全システム統合
- パフォーマンス最適化
- ユーザビリティテスト
- E2Eテスト・バグ修正

成功条件:
- 直感的なユーザーインターフェース
- 全ブラウザ対応・レスポンシブ
- 完全なエラーハンドリング
- Core/Layout システム完全活用

モックで先行開発し、他チーム完成後に統合する戦略で進めてください。
```

---

## 📅 マイルストーン・タイムライン

### **Week 1-2: 基盤構築**
- **Core Services**: Google Slides API基本操作
- **Layout Engine**: グリッドシステム設計 (モック)
- **Web Interface**: HTML/CSS プロトタイプ

### **Week 3-4: 中間統合**
- **Core Services**: ログ・バリデーション完成
- **Layout Engine**: レイアウトロジック完成
- **Web Interface**: JavaScript フォーム処理

### **Week 5-6: 最終統合**
- **全チーム**: システム統合・バグ修正
- **品質保証**: E2Eテスト・パフォーマンス
- **ドキュメント**: ユーザーマニュアル

---

## 🛡️ リスク管理・依存関係

### **技術的リスク**
1. **API制限**: Google Slides API レート制限対策
2. **統合遅延**: チーム間のAPI不整合
3. **GAS制約**: 実行時間・メモリ制限

### **プロジェクトリスク**
1. **依存関係**: Core → Layout → UI の順序依存
2. **品質問題**: 統合時のバグ・互換性
3. **スケジュール**: 予想より複雑な実装要件

### **対策**
- **日次スタンドアップ**: チーム間の進捗共有
- **モック開発**: 依存関係のある部分を先行実装
- **継続的統合**: 週次での統合・テスト
- **バックアップ計画**: 重要機能のシンプル版実装

---

## 🎯 成功指標・KPI

### **開発効率**
- [ ] 各チーム週40時間以上の実装
- [ ] 統合作業時間 < 全体の20%
- [ ] バグ修正時間 < 全体の15%

### **品質指標**
- [ ] テストカバレッジ 85%以上
- [ ] Lint エラー 0件
- [ ] Critical Bug 0件

### **統合成功**
- [ ] 3チーム成果物の完全統合
- [ ] E2Eテスト 100%パス
- [ ] パフォーマンス目標達成

この戦略により、**6-8週間で高品質なGoogle Slides Content Generator**を完成させることができます。

各チームは独立して作業しながら、定期的な統合で全体の整合性を保ち、効率的な並行開発を実現します。