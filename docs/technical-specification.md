# Google Slides コンテンツ生成サービス 技術仕様書

## 1. プロジェクト概要

### 1.1 目的
Google Apps Scriptベースで Google Slides コンテンツを自動生成するWebサービス。ダブルカラム・シングルカラムレイアウト、SVG・Mermaid図の挿入、フォント・カラーテーマの制御を提供する。

### 1.2 現在の実装状況 (2025年6月)
- **✅ 完了**: プロジェクト設計、開発環境構築、ドキュメント作成
- **🔄 実装中**: Core Services、Layout Engine、Web Interface
- **📋 計画中**: Mermaid統合、パフォーマンス最適化、セキュリティ強化

### 1.3 技術的目標
- プログラムによる適切なフォントサイズと余白の制御
- Git Worktree による並行開発戦略の実装
- 包括的なテスト・Lintカバレッジ (目標85%以上)
- 将来的なGoogle Spreadsheet連携の準備

## 2. 技術アーキテクチャ

### 2.1 基盤技術
- **開発プラットフォーム**: Google Apps Script (GAS)
- **APIレイヤー**: Google Slides API
- **開発環境**: clasp (Command Line Apps Script Projects)
- **バージョン管理**: Git + GitHub
- **CI/CD**: GitHub Actions

### 2.2 アーキテクチャ図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Interface │    │  Google Apps    │    │  Google Slides  │
│   (HTML/CSS/JS) │◄──►│     Script      │◄──►│      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Content Logic  │
                       │  - Layout Mgmt  │
                       │  - Font Control │
                       │  - SVG/Mermaid  │
                       └─────────────────┘
```

## 3. 機能仕様

### 3.1 レイアウト管理
- **シングルカラム**: テキスト・画像の縦配置
- **ダブルカラム**: 左右2分割レイアウト
- **レスポンシブ設計**: スライドサイズに応じた調整

### 3.2 コンテンツ挿入機能
- **テキストボックス**: プログラマティックな挿入・配置
- **画像**: URL・Blob形式のサポート
- **SVG図**: 外部SVGファイルの挿入
- **Mermaid図**: テキストからSVG変換・挿入
- **テーブル**: 動的行列数のテーブル生成

### 3.3 デザイン制御
- **フォント管理**:
  - フォントファミリー: Sans-serif推奨 (Arial, Calibri, Helvetica)
  - フォントサイズ: 
    - タイトル: 36-44pt
    - 本文: 24-32pt
    - キャプション: 22-24pt
- **余白制御**:
  - 行間: 130-150% (理想値: 140%)
  - 段落間: フォントサイズの2倍以上
  - 文字間: フォントサイズの0.12倍以上
- **カラーテーマ**: プログラマティックな色設定

## 4. 実装計画 (Git Worktree戦略)

### 4.1 並行開発アーキテクチャ
```bash
# 3並列 Worktree開発
├── main/ (メインブランチ)
├── ../slide-maker-core-services/   # Core Services実装
├── ../slide-maker-layout/          # Layout Engine実装
└── ../slide-maker-ui/              # Web Interface実装
```

### 4.2 実装対象ファイル
```javascript
// Phase 1: Core Services (優先度: High)
src/services/slides.js      // Google Slides API wrapper - 未実装
src/services/content.js     // コンテンツ処理 - 未実装
src/utils/logger.js         // ログシステム - 未実装
src/utils/validation.js     // 入力検証 - 未実装

// Phase 2: Layout Engine (優先度: High)
src/services/layout.js      // レイアウト管理 - 未実装
src/utils/design.js         // デザイン計算 - 未実装

// Phase 3: Web Interface (優先度: Medium)
src/web/index.html          // メインUI - 未実装
src/web/style.css           // スタイルシート - 未実装
src/web/script.js           // クライアントJS - 未実装
src/main.js                 // エントリーポイント - 未実装
```

### 4.3 Mermaid統合計画 (Phase 3)
```javascript
// 実装予定: src/services/mermaid.js
class MermaidService {
  // API設定 (appsscript.jsonで許可済み)
  // - https://mermaid.live/
  // - https://kroki.io/
  
  async convertToSVG(mermaidCode) {
    // 実装予定: Mermaid Live APIを使用
  }
  
  async insertDiagram(slide, mermaidCode, position) {
    // 実装予定: SVG→一時ファイル→スライド挿入
  }
}
```

### 4.3 レイアウト計算アルゴリズム
```javascript
// レスポンシブフォントサイズ計算
function calculateOptimalFontSize(slideWidth, slideHeight, textLength) {
  const baseSize = 24;
  const widthFactor = slideWidth / 960; // 標準スライド幅
  const heightFactor = slideHeight / 540; // 標準スライド高
  const scaleFactor = Math.min(widthFactor, heightFactor);
  
  // テキスト量に応じた調整
  const lengthAdjustment = Math.max(0.8, 1 - (textLength / 1000) * 0.2);
  
  return Math.round(baseSize * scaleFactor * lengthAdjustment);
}
```

## 5. 開発・デプロイメント戦略

### 5.1 Git Worktree分散開発
- **並行開発**: 3チーム同時実装 (Core/Layout/UI)
- **バージョン管理**: Git Worktree + feature branch戦略
- **統合**: 週次でmainブランチにマージ
- **品質管理**: 並行テスト実装 (../slide-maker-testing)

### 5.2 開発環境
- **ローカル開発**: clasp + VS Code + asdf (Node.js管理)
- **テスト環境**: 独自テストランナー (tests/runner.js)
- **Lint**: ESLint + Prettier + pre-commit hooks
- **本番環境**: Google Apps Script (clasp deploy)

### 5.2 CI/CD パイプライン
```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Apps Script
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install clasp
        run: npm install -g @google/clasp
      - name: Deploy to GAS
        run: |
          echo "$CLASP_CREDENTIALS" > ~/.clasprc.json
          clasp push
          clasp deploy
        env:
          CLASP_CREDENTIALS: ${{ secrets.CLASP_CREDENTIALS }}
```

## 6. 品質管理

### 6.1 テスト戦略
- **単体テスト**: GASUnit framework
- **統合テスト**: 実際のGoogle Slides API呼び出し
- **E2Eテスト**: スライド生成の完全フロー

### 6.2 コード品質
- **ESLint**: JavaScript静的解析
- **Prettier**: コードフォーマッティング
- **Pre-commit hooks**: コミット前の品質チェック

### 6.3 パフォーマンス目標
- スライド生成時間: 5秒以内
- API呼び出し制限: Google Quotaの80%以内
- テストカバレッジ: 85%以上
- 全テスト実行時間: 5分以内
- エラー率: 1%以下

## 7. 将来拡張計画

### 7.1 Google Spreadsheet連携
- スプレッドシートデータの自動取得
- 表・グラフの動的生成
- データ更新時の自動スライド更新

### 7.2 高度な機能
- アニメーション効果
- カスタムテンプレート
- バッチ処理機能
- 外部データソース連携

## 8. セキュリティ・プライバシー

### 8.1 認証・認可
- OAuth 2.0 による安全な認証
- スコープ最小化の原則
- ユーザーデータの最小限収集

### 8.2 データ保護
- 一時ファイルの確実な削除
- 機密情報のログ出力禁止
- HTTPS通信の強制

## 9. 運用・監視

### 9.1 ログ・監視
- エラーログの詳細記録
- パフォーマンスメトリクスの追跡
- 使用状況の分析

### 9.2 バックアップ・災害復旧
- コードのGitHub管理
- 設定情報の文書化
- 復旧手順の明文化