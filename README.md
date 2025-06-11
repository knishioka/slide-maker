# Google Slides Content Generator

Google Apps ScriptベースのGoogle
Slidesコンテンツ自動生成サービス。ダブルカラム・シングルカラムレイアウト、SVG・Mermaid図の挿入、フォント・カラーテーマの制御を提供します。

## 🚀 機能

- **高度なレイアウト管理**: CSS Grid相当のグリッドシステムと複数カラムレイアウト
- **テンプレートシステム**: プリビルドレイアウト（hero-content, sidebar-main, feature-showcase等）
- **レスポンシブデザイン**: ブレークポイントベースの自動レイアウト適応
- **スマートグリッド**: 12カラムグリッドとカスタムエリア、スパン機能
- **コンテンツ挿入**: テキスト、画像、SVG、Mermaid図の高度な挿入
- **デザイン制御**: レスポンシブフォントサイズと余白の自動計算
- **テーマシステム**: カスタマイズ可能なカラーテーマとエリア別スタイリング
- **アクセシビリティ**: WCAG準拠のコントラスト比とフォントサイズ

## 🛠️ 技術スタック

- **Google Apps Script** - メインプラットフォーム
- **Google Slides API** - スライド操作
- **clasp** - 開発・デプロイツール
- **ESLint + Prettier** - コード品質管理
- **GitHub Actions** - CI/CD

## 📋 プロジェクト構造

```
/
├── src/                     # Google Apps Script ソースコード
│   ├── main.js             # メインエントリーポイント
│   ├── services/           # サービス層
│   ├── utils/              # ユーティリティ
│   └── web/                # Web UI
├── tests/                  # テストコード
├── docs/                   # 技術文書
├── .clasp.json            # clasp設定
└── appsscript.json        # GAS設定
```

## 🏃‍♂️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Apps Script プロジェクト作成

```bash
# Google Apps Script にログイン
npx clasp login

# 新しいプロジェクト作成
npx clasp create --title "Google Slides Content Generator" --type webapp

# プロジェクトIDを .clasp.json に設定
```

### 3. 設定ファイルの更新

`.clasp.json` にプロジェクトIDを設定:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
```

## 💻 開発

### 開発サーバー起動

```bash
# ファイル変更監視 + 自動テスト
npm run test:watch

# Lint + Format
npm run lint:fix
npm run format
```

### Google Apps Script へのデプロイ

```bash
# 開発環境
npm run deploy:dev

# 本番環境
npm run deploy:prod
```

## 🧪 テスト

```bash
# 全テスト実行
npm test

# 単体テスト
npm run test:unit

# 統合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e
```

## 📖 ドキュメント

- [技術仕様書](docs/technical-specification.md)
- [アーキテクチャ設計](docs/architecture.md)
- [デザインガイドライン](docs/design-guidelines.md)
- [Claude Code開発ガイド](CLAUDE.md)

## 🔧 開発ワークフロー

1. **機能ブランチ作成**: `git checkout -b feature/new-feature`
2. **開発**: コード実装 + テスト作成
3. **品質チェック**: `npm run build` (lint + test)
4. **プルリクエスト作成**: GitHub でレビュー依頼
5. **マージ後自動デプロイ**: main ブランチで本番デプロイ

## 🛡️ 品質管理

### Pre-commit Hooks

```bash
# pre-commit のインストール
pip install pre-commit
pre-commit install
```

自動実行される検査:

- ESLint (構文チェック + 自動修正)
- Prettier (コードフォーマット)
- テスト実行
- セキュリティスキャン

### CI/CD パイプライン

- **Lint & Test**: 全ブランチでコード品質チェック
- **Security Scan**: 脆弱性検査
- **Auto Deploy**: develop/main ブランチで自動デプロイ

## 📝 使用例

### 基本的なスライド生成

```javascript
// シングルカラムレイアウトでスライド生成
const layoutService = new LayoutService(slidesService);
const result = layoutService.createLayout(presentationId, {
  layoutType: 'single-column',
  theme: 'corporate',
  content: [
    { type: 'title', text: 'プレゼンテーションタイトル' },
    { type: 'body', text: 'メインコンテンツの説明文...' }
  ]
});
```

### テンプレートベースレイアウト

```javascript
// ヒーロー・コンテンツテンプレートの使用
const result = layoutService.createLayout(presentationId, {
  template: 'hero-content',
  theme: 'presentation',
  responsive: true,
  content: [
    { type: 'title', text: 'インパクトのあるタイトル' },
    { type: 'body', text: 'サポートコンテンツ...' }
  ]
});
```

### カスタムグリッドレイアウト

```javascript
// カスタムグリッドエリアの定義
const customAreas = {
  header: '1 / 1 / 2 / 13',
  sidebar: '2 / 1 / 6 / 4', 
  main: '2 / 4 / 6 / 13'
};

const result = layoutService.createLayout(presentationId, {
  layoutType: 'custom-grid',
  customAreas: customAreas,
  responsive: true,
  content: [
    { type: 'heading', text: 'ヘッダー' },
    { type: 'caption', text: 'サイドバー情報' },
    { type: 'body', text: 'メインコンテンツ' }
  ]
});
```

### レスポンシブレイアウト

```javascript
// 画面サイズに応じて自動調整
const result = layoutService.createLayout(presentationId, {
  layoutType: 'responsive-grid',
  content: [
    { type: 'title', text: 'レスポンシブタイトル' },
    { type: 'body', text: 'コンテンツ1' },
    { type: 'body', text: 'コンテンツ2' },
    { type: 'body', text: 'コンテンツ3' }
  ]
});
```

### Mermaid図の挿入

```javascript
const mermaidCode = `
graph LR
    A[開始] --> B{条件判定}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E
`;

await slideService.insertMermaidDiagram(slide, mermaidCode);
```

## 🤝 コントリビューション

1. Issue を作成して機能提案・バグ報告
2. Fork してローカルで開発
3. テストを追加・実行
4. プルリクエスト作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🆘 トラブルシューティング

### よくある問題

**Q: clasp認証エラーが発生する**

```bash
# 再認証を実行
npx clasp login --creds credentials.json
```

**Q: API制限エラーが発生する**

- Google APIs Console で使用量確認
- レート制限の実装確認

**Q: デプロイが失敗する**

```bash
# バージョン確認
npx clasp versions

# 手動デプロイ
npx clasp deploy
```

## 📞 サポート

- GitHub Issues でバグ報告・機能要望
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)
- [Google Slides API リファレンス](https://developers.google.com/slides/api)
