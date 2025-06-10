# Google Slides Content Generator - Claude Code開発ガイド

## プロジェクト概要
Google Apps ScriptベースのGoogle Slidesコンテンツ自動生成サービス。ダブルカラム・シングルカラムレイアウト、SVG・Mermaid図挿入、フォント・カラーテーマ制御機能を提供。

## 開発環境・技術スタック
- **メイン技術**: Google Apps Script (JavaScript)
- **API**: Google Slides API
- **開発ツール**: clasp (Command Line Apps Script Projects)
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

### 1. 開発フロー
1. **調査フェーズ**: まずTaskツールで関連ファイル・機能を調査
2. **計画**: TodoWriteツールで作業を細分化・管理
3. **実装**: 既存コードパターンに従って開発
4. **テスト**: 実装後即座にテスト実行
5. **Lint**: コミット前に必ずlint実行

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
  DEBUG: 3, INFO: 2, WARN: 1, ERROR: 0,
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

## 開発時注意事項
1. **API制限監視**: Google APIs Consoleで使用量確認
2. **テスト環境分離**: 開発・本番でGASプロジェクト分離
3. **バージョン管理**: claspで適切にバージョン管理
4. **ドキュメント更新**: 機能追加時は必ずdocs/更新

## トラブルシューティング
- **clasp認証エラー**: `clasp login --creds credentials.json`
- **API制限エラー**: レート制限実装確認
- **権限エラー**: appsscript.jsonのoauthScopesに必要権限追加
- **デプロイエラー**: `clasp versions`でバージョン確認後`clasp deploy`