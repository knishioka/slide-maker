# Google Slides Content Generator - Claude Code開発ガイド

## プロジェクト概要

Google Apps ScriptベースのGoogle
Slidesコンテンツ自動生成サービス。ダブルカラム・シングルカラムレイアウト、SVG・Mermaid図挿入、フォント・カラーテーマ制御機能を提供。

## 開発環境・技術スタック

- **メイン技術**: Google Apps Script (JavaScript)
- **API**: Google Slides API
- **開発ツール**: clasp (Command Line Apps Script Projects)
- **バージョン管理**: asdf (Runtime Version Manager)
- **CI/CD**: GitHub Actions
- **テスト**: GASUnit framework
- **Lint**: ESLint + Prettier

## プロジェクト構造

```
/
├── src/                     # Google Apps Script ソースコード
│   ├── main.js             # メインエントリーポイント
│   ├── services/           # サービス層
│   │   ├── slides.js       # Google Slides API wrapper
│   │   ├── layout.js       # レイアウト管理
│   │   ├── content.js      # コンテンツ処理
│   │   └── mermaid.js      # Mermaid図生成
│   ├── utils/              # ユーティリティ
│   │   ├── design.js       # デザイン計算関数
│   │   ├── validation.js   # 入力検証
│   │   └── logger.js       # ログ管理
│   └── web/                # Web UI
│       ├── index.html      # メインHTML
│       ├── style.css       # スタイルシート
│       └── script.js       # クライアントサイドJS
├── tests/                  # テストコード
├── docs/                   # 技術文書
├── .clasp.json            # clasp設定
├── appsscript.json        # GAS設定
└── package.json           # Node.js設定
```

## Claude Code 開発ベストプラクティス

### 1. 開発フロー（Git Worktree活用）

1. **機能別worktree作成**: 新機能開発時は必ずgit worktreeで分離
   ```bash
   # 新機能開発用worktree作成
   git worktree add -b feature-name ../feature-name
   cd ../feature-name
   ```
2. **調査フェーズ**: まずTaskツールで関連ファイル・機能を調査
3. **計画**: TodoWriteツールで作業を細分化・管理
4. **実装**: 既存コードパターンに従って開発
5. **テスト**: 実装後即座にテスト実行
6. **Lint**: コミット前に必ずlint実行
7. **マージ**: 完了後mainブランチにマージしworktree削除

### 2. ファイル操作の制約

- **既存ファイル優先**: 新規ファイル作成は最小限に
- **Read before Edit**: 編集前に必ずReadツールでファイル内容確認
- **パターン踏襲**: 既存コードのスタイル・構造を維持

### 3. コミット・デプロイのタイミング

- **明示的指示時のみコミット**: ユーザーが明確に指示した場合のみ
- **事前チェック必須**:
  ```bash
  npm run lint      # ESLint実行
  npm run test      # テスト実行
  npm run build     # ビルドチェック
  ```
- **pre-commit hooks**: 自動品質チェック実装済み

### 4. テスト実行ガイドライン

- **ユニットテスト**: `npm run test:unit` - 関数単位
- **統合テスト**: `npm run test:integration` - API連携
- **E2Eテスト**: `npm run test:e2e` - 全体フロー
- **テスト実行タイミング**:
  - 新機能実装後
  - リファクタリング後
  - pre-commit時（自動）

### 5. Lint・フォーマット設定

```json
{
  "scripts": {
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write src/ tests/",
    "precommit": "lint-staged"
  }
}
```

### 6. Google Apps Script 特有の制約

- **実行時間制限**: 6分以内で処理完了
- **API制限**:
  - Slides API: 1日100,000リクエスト
  - Drive API: 1日10億リクエスト
- **メモリ制限**: 実行時メモリ使用量に注意
- **同期処理**: async/awaitの代わりにPromise使用

### 7. デバッグ・ログ戦略

```javascript
// ログレベル設定
const Logger = {
  DEBUG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  level: 2, // 本番: 1, 開発: 3

  log(level, message, data) {
    if (level <= this.level) {
      console.log(`[${new Date().toISOString()}] ${message}`, data);
      // Spreadsheetにもログ保存
      this.writeToSheet(level, message, data);
    }
  }
};
```

### 8. パフォーマンス最適化指針

- **バッチ処理**: API呼び出しは可能な限りまとめる
- **キャッシュ活用**: 重い計算結果をPropertiesServiceで保存
- **遅延読み込み**: 大きなデータは必要時に取得
- **レート制限対応**: 指数バックオフでリトライ

### 9. セキュリティ要件

- **スコープ最小化**: 必要最小限のGoogle API権限
- **入力検証**: 全ユーザー入力をサニタイズ
- **ログ保護**: 機密情報をログに出力しない
- **一時ファイル**: 処理後確実に削除

### 10. Claude Code活用コマンド

```bash
# プロジェクト初期化
/init

# メモリ管理
/memory

# コードレビュー
/review

# プロジェクト情報確認
/permissions

# 検索・調査時
# TaskツールまたはGrepツールを活用
```

### 11. Claude Code開発時の進捗可視化

#### 開発セッション開始時のテンプレート
```markdown
## 🚧 開発中: [TASK-XXX] [タスク名]

### 📝 タスク概要
- **目的**: [何を実現するためのタスクか]
- **影響範囲**: [変更するファイル・機能]  
- **期限**: [想定完了時期]

### 📋 実装計画
- [ ] **調査フェーズ** (25%)
  - [ ] 既存コード分析 (src/services/, src/utils/)
  - [ ] 依存関係確認
  - [ ] API仕様確認
- [ ] **設計フェーズ** (15%)
  - [ ] アーキテクチャ設計
  - [ ] インターフェース定義
  - [ ] データフロー設計
- [ ] **実装フェーズ** (40%)
  - [ ] コア機能実装
  - [ ] エラーハンドリング
  - [ ] ログ・監視実装
- [ ] **テストフェーズ** (15%)
  - [ ] ユニットテスト作成
  - [ ] 統合テスト実行
  - [ ] 手動テスト実施
- [ ] **品質保証フェーズ** (5%)
  - [ ] コードレビュー準備
  - [ ] ドキュメント更新
  - [ ] パフォーマンステスト

### 📊 現在の進捗: XX% (X/Y完了)
### 🎯 次回セッションの優先作業: [具体的な次の作業]

### ✅ 完了定義 (Definition of Done)
- [ ] 機能要件をすべて満たしている
- [ ] ユニットテストカバレッジ80%以上
- [ ] 統合テストが全て通過
- [ ] ESLint警告0件
- [ ] ドキュメント更新完了
- [ ] コードレビュー承認済み
- [ ] TASKS.mdステータス更新完了

---
**🔔 タスク完了確認**
- [ ] ✅ [TASK-XXX] の完了をTASKS.mdで確認
- [ ] 🧹 Worktreeクリーンアップ実施
- [ ] 📝 完了報告を関係者に共有
```

#### 進捗確認スクリプト活用
```bash
# タスク進捗の確認・更新
./scripts/track-task-progress.sh TASK-001 start    # 開発開始
./scripts/track-task-progress.sh TASK-001 update   # 進捗更新
./scripts/track-task-progress.sh TASK-001 checklist # 完了確認
./scripts/track-task-progress.sh TASK-001 complete  # 完了処理

# 定期的な進捗チェック（30分〜1時間ごと推奨）
./scripts/track-task-progress.sh TASK-001 milestone
```

#### TodoWriteツールとの連携
```markdown
# Claude Code開発開始時に必ずTodoWriteで計画管理
TodoWrite: [
  {"content": "TASK-001: 既存コード分析完了", "status": "completed", "priority": "high"},
  {"content": "TASK-001: アーキテクチャ設計", "status": "in_progress", "priority": "high"},
  {"content": "TASK-001: コア機能実装", "status": "pending", "priority": "high"},
  {"content": "TASK-001: テスト作成", "status": "pending", "priority": "medium"},
  {"content": "TASK-001: ドキュメント更新", "status": "pending", "priority": "low"}
]

# 進捗に応じて定期的に更新
```

#### 中断・再開時のコンテキスト保持
```markdown
## 🔄 [TASK-XXX] セッション中断 - [時刻]

### ✅ 本セッションで完了した作業
- [x] [完了項目1] - [完了時刻] 
- [x] [完了項目2] - [完了時刻]

### 🚧 中断時点での作業状況
- **作業中ファイル**: [現在編集中のファイル]
- **実装状況**: [どこまで実装したか]
- **次の作業**: [中断後すぐに取り組むべき作業]

### 📋 次回セッション開始時の注意点
- **確認事項**: [再開前に確認すべきこと]
- **ブロッカー**: [作業継続の障害要因]
- **推定残り時間**: [完了までの想定時間]

### 📊 進捗率: XX% (前回から+YY%)
```

### 12. エラーハンドリング戦略

```javascript
// 標準エラーハンドリングパターン
function executeWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (error) {
      Logger.log('WARN', `Retry ${i + 1}/${maxRetries}`, error);
      if (i === maxRetries - 1) throw error;
      Utilities.sleep(Math.pow(2, i) * 1000); // 指数バックオフ
    }
  }
}
```

## Git Worktree 分散開発戦略 & タスク管理システム

### 📋 中央タスク管理システム
- **管理ドキュメント**: `TASKS.md` - すべてのタスクの中央ハブ
- **状態管理**: TODO → IN_PROGRESS → DONE の明確な流れ
- **依存関係**: タスク間の依存関係を可視化
- **担当者管理**: 各タスクの担当者とworktreeブランチを記録

### 🎯 タスク状態とルール

#### タスク状態
- **📝 TODO**: 未着手（誰でもアサイン可能）
- **🚧 IN_PROGRESS**: 作業中（担当者・worktreeブランチ必須）
- **⏸️ BLOCKED**: 依存関係で待機中
- **✅ DONE**: 完了・mainにマージ済み
- **❌ CANCELLED**: キャンセル・不要になったタスク

#### タスク管理ルール
1. **タスク開始前**: TASKS.mdでタスクをIN_PROGRESSに変更し、担当者・worktreeブランチを記載
2. **作業中**: 専用worktreeで独立開発
3. **完了時**: 必ずTASKS.mdでDONEに変更後、worktree削除
4. **ブロック時**: BLOCKEDに変更し、理由を明記

### 🔄 統合ワークフロー

#### 新タスク開始フロー
```bash
# 1. TASKS.mdでタスク状態更新
# - ステータス: TODO → IN_PROGRESS
# - 担当者: [Your Name]
# - Worktree: feature/task-xxx-description
# - 開始日: YYYY-MM-DD

# 2. 専用worktree作成・進捗トラッキング開始
./scripts/start-task.sh TASK-001
./scripts/track-task-progress.sh TASK-001 start

# 3. 開発開始
# - 既存パターン踏襲
# - 定期的なテスト実行
# - 定期的な進捗更新: ./scripts/track-task-progress.sh TASK-001 update
# - コミット前lint実行
```

#### タスク完了フロー
```bash
# 1. 品質保証
npm run lint && npm run test && npm run build

# 2. mainにマージ
cd /path/to/main
git checkout main
git merge feature/task-001-layout-engine

# 3. TASKS.md更新
# - ステータス: IN_PROGRESS → DONE
# - 完了日: YYYY-MM-DD
# - 成果物: 実装した機能の概要

# 4. worktree削除
git worktree remove ../task-001-layout-engine
git branch -d feature/task-001-layout-engine
```

### 🏗️ 並行開発支援

#### 複数開発者対応
- **タスクの可視化**: 誰が何をやっているかTASKS.mdで即座に確認
- **競合回避**: ファイル単位の影響範囲をタスク説明に記載
- **ブロッカー管理**: 依存関係が明確で待機理由が分かる

#### Worktree命名規則
```bash
# パターン: feature/task-[番号]-[短縮説明]
feature/task-001-layout-engine
feature/task-005-api-development
feature/task-007-web-dashboard
hotfix/bug-123-memory-leak
```

### 📊 進捗監視とレポート

#### 日次チェック
```bash
# アクティブなタスク確認
grep "IN_PROGRESS" TASKS.md

# 完了タスク数確認
grep "DONE" TASKS.md | wc -l

# ブロッカー確認
grep "BLOCKED" TASKS.md

# worktree状況確認
git worktree list
```

#### 週次レビュー
- **完了タスク**: 今週DONEになったタスクの確認
- **進行中タスク**: 予定通り進んでいるかの確認
- **ブロッカー解消**: 待機中タスクの依存関係解決
- **次週計画**: 新たにアサインするタスクの決定

### 🛠️ 自動化サポート

#### タスク管理スクリプト
```bash
# 新タスク開始
./scripts/start-task.sh TASK-001

# タスク完了
./scripts/complete-task.sh TASK-001

# 進捗確認
./scripts/check-progress.sh
```

#### 品質チェック自動化
- **pre-commit hooks**: lint + test自動実行
- **CI/CD**: プルリクエスト時の自動テスト
- **定期チェック**: 日次でTASKS.mdの整合性確認

### 🔧 トラブルシューティング

#### よくある問題と解決
- **worktree削除エラー**: `git worktree remove --force`
- **ブランチ削除エラー**: マージ確認後 `git branch -D`
- **タスク状態の不整合**: TASKS.mdの手動修正
- **依存関係の循環**: タスク分割で解決

#### エスカレーション
- **ブロッカー長期化**: チーム全体で優先度見直し
- **技術的困難**: アーキテクチャレビューの実施
- **リソース不足**: タスクの再優先付けまたは延期

## 開発時注意事項

1. **API制限監視**: Google APIs Consoleで使用量確認
2. **テスト環境分離**: 開発・本番でGASプロジェクト分離
3. **バージョン管理**: claspで適切にバージョン管理
4. **ランタイム管理**: asdfで Node.js バージョンを統一管理
5. **ドキュメント更新**: 機能追加時は必ずdocs/更新
6. **Worktree管理**: 機能完了後は必ずworktreeを削除してクリーンアップ

## トラブルシューティング

- **clasp認証エラー**: `clasp login --creds credentials.json`
- **API制限エラー**: レート制限実装確認
- **権限エラー**: appsscript.jsonのoauthScopesに必要権限追加
- **デプロイエラー**: `clasp versions`でバージョン確認後`clasp deploy`
- **Node.jsバージョンエラー**: `asdf install nodejs` でバージョンインストール後 `asdf local nodejs <version>`

## 11. Claude Code開発時の進捗可視化システム

### 📊 システム概要

Claude Code使用時に**現在何をしているのか**、**どこまで進んでいるのか**、**何が残っているのか**を明確に把握するためのシステム。開発途中でも状況が分かり、タスク完了の見落としを防ぐ。

### 🎯 解決する課題

- **途中参入時の混乱**: 開発の途中から見ても何をやっているかわからない
- **進捗の不透明性**: どこまで完了して何が残っているか不明
- **タスク完了の見落とし**: 重要な作業が抜け落ちるリスク
- **レビュー時の困難**: コードレビュー時に開発意図が不明

### 🔧 実装ツール

#### 進捗トラッキングスクリプト
```bash
# タスク開始時
./scripts/track-task-progress.sh TASK-001 start

# 開発中の進捗更新
./scripts/track-task-progress.sh TASK-001 update

# 完了確認チェックリスト
./scripts/track-task-progress.sh TASK-001 checklist

# タスク完了時
./scripts/track-task-progress.sh TASK-001 complete
```

### 📋 Claude Code開発テンプレート

#### セッション開始時
```markdown
## 🚀 [TASK-XXX] 開発開始

**開発対象**: [機能名]
**担当者**: Claude AI
**開始時刻**: [YYYY-MM-DD HH:MM]
**予想所要時間**: [X時間]

### 📋 今回のセッションで実装予定
1. [ ] [具体的な実装項目1]
2. [ ] [具体的な実装項目2]
3. [ ] [具体的な実装項目3]

### 🔗 関連リソース
- **TASKS.md**: Line XXX
- **技術仕様**: docs/technical-specification.md
- **Worktree**: feature/task-xxx-description
```

#### 進捗更新時（30分ごと）
```markdown
## 📈 [TASK-XXX] 進捗更新 - [現在時刻]

### ✅ 完了した作業
- [x] [実装項目1] - [完了時刻]
- [x] [実装項目2] - [完了時刻]

### 🚧 現在作業中
- [ ] [現在の作業内容]

### 📋 次に予定している作業
- [ ] [次の作業項目1]
- [ ] [次の作業項目2]

### 📊 進捗率: XX% (前回から+YY%)

---
⏰ **進捗チェックポイント** ([現在時刻])

🎯 **完了確認**
- [ ] ✅ [現在作業]を完了したらTODOリスト更新
- [ ] 📝 実装完了後に次タスクを開始
- [ ] 🔄 TASKS.mdの進捗率を更新
```

#### セッション終了時
```markdown
## 🎯 [TASK-XXX] セッション完了報告

### ✅ 本セッションの成果
- [x] [完了項目1]
- [x] [完了項目2]
- [x] [完了項目3]

### 📋 残作業
- [ ] [未完了項目1] - 推定XX分
- [ ] [未完了項目2] - 推定XX分

### 🔄 次回セッションの準備
- **優先作業**: [次回最初に取り組む作業]
- **準備事項**: [事前に確認・準備すべきこと]
- **ブロッカー**: [作業を進める上での障害]

### 📊 全体進捗: XX% (推定残り時間: XX時間)

---
**🔔 タスク完了確認**
- [ ] ✅ [TASK-XXX] の完了をTASKS.mdで確認
- [ ] 🧹 Worktreeクリーンアップ実施
- [ ] 📝 完了報告を関係者に共有
```

### 🎉 タスク完了チェックリスト

#### 必須項目
- [ ] **機能実装完了**: すべての要件を満たしている
- [ ] **テスト完了**: ユニット・統合テストが通過
- [ ] **品質確認**: `npm run lint && npm run test && npm run build` が通過
- [ ] **ドキュメント**: README、API仕様、コメントが更新
- [ ] **TASKS.md更新**: ステータスをDONEに変更

#### 推奨項目
- [ ] **パフォーマンス**: 性能劣化がないことを確認
- [ ] **セキュリティ**: 脆弱性スキャン実施
- [ ] **互換性**: 既存機能への影響確認
- [ ] **ユーザビリティ**: 使いやすさの確認

#### クリーンアップ
- [ ] **Worktree削除**: `./scripts/complete-task.sh TASK-XXX`
- [ ] **ブランチクリーンアップ**: マージ済みブランチを削除
- [ ] **テンポラリファイル削除**: 作業中ファイルを削除

### 🔗 TodoWrite統合

#### Claude Codeセッション管理
```javascript
// セッション開始時
TodoWrite([
  {"content": "TASK-001: 調査フェーズ完了", "status": "completed", "priority": "high"},
  {"content": "TASK-001: 設計フェーズ完了", "status": "completed", "priority": "high"},
  {"content": "TASK-001: コア機能実装", "status": "in_progress", "priority": "high"},
  {"content": "TASK-001: エラーハンドリング実装", "status": "pending", "priority": "medium"},
  {"content": "TASK-001: テスト作成", "status": "pending", "priority": "high"}
]);
```

### 📱 活用方法

#### 開発開始時
1. `./scripts/track-task-progress.sh TASK-XXX start` でセッション開始
2. TodoWriteでサブタスクリストを作成
3. 進捗テンプレートを使用してコンテキストを明示

#### 開発中
1. 30分ごとに進捗更新テンプレートを使用
2. TodoWriteで完了したサブタスクをupdateします
3. 重要な確認事項を定期的にチェック

#### 開発完了時
1. 完了チェックリストで全項目を確認
2. `./scripts/track-task-progress.sh TASK-XXX complete` で最終確認
3. TASKS.mdステータス更新とworktreeクリーンアップ

この進捗可視化システムにより、Claude Code開発時に常に現在の状況が把握でき、タスクの取りこぼしを防げます。
