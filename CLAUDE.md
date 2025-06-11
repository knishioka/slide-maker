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

### 11. エラーハンドリング戦略

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

# 2. 専用worktree作成
git worktree add -b feature/task-001-layout-engine ../task-001-layout-engine
cd ../task-001-layout-engine

# 3. 開発開始
# - 既存パターン踏襲
# - 定期的なテスト実行
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
