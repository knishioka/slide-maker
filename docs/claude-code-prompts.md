# 🤖 各Worktree用 Claude Code プロンプト戦略

**目的**: 3並列開発で各チームが効率的にClaude Codeを活用するための具体的プロンプト集  
**対象**: Core Services, Layout Engine, Web Interface チーム  
**期間**: 6-8週間の継続的開発支援

---

## 🔧 Team A: Core Services チーム

### 🚀 **初回セッション開始プロンプト**

```markdown
私は Google Apps Script で Google Slides コンテンツ生成サービスの Core Services を実装するエンジニアです。

## プロジェクト概要
- **Worktree**: ../slide-maker-core-services
- **Branch**: feature/core-services  
- **役割**: 他チームが依存するコアAPI群の実装
- **期間**: 4週間での完全実装

## 実装対象ファイル
1. `src/services/slides.js` - Google Slides API wrapper
2. `src/services/content.js` - コンテンツ処理エンジン
3. `src/utils/logger.js` - ログシステム・エラーハンドリング
4. `src/utils/validation.js` - 入力検証・サニタイズ

## 技術制約
- Google Apps Script V8 runtime環境
- async/await の代わりにPromise使用必須
- Google APIs レート制限対応
- 他worktreeからの利用を前提とした設計

## 開発方針
1. CLAUDE.md の開発ガイドライン完全準拠
2. tests/runner.js を使ったテスト駆動開発
3. appsscript.json の既存設定活用
4. Layout Engine, Web Interface チームとの連携を考慮

まずは現在のプロジェクト状況を確認し、どこから実装を開始すべきか教えてください。既存のdocs/とCLAUDE.mdを参照して、最適な開発順序を提案してください。
```

### 📋 **週次目標設定プロンプト**

#### **Week 1: Google Slides API基盤**
```markdown
Week 1の目標: Google Slides API wrapper の基本実装

実装すべき機能:
1. プレゼンテーション作成・取得
2. スライド追加・削除・操作
3. テキストボックス挿入・スタイル適用
4. 画像挿入・位置調整
5. 基本的なエラーハンドリング

成功条件:
- src/services/slides.js の完成
- 全関数にJSDoc記述
- 単体テスト作成・実行成功
- Layout Engineチームがモック使用可能

今週はGoogle Slides APIの基本操作から始めて、他チームが依存できる安定したAPIを構築してください。まず何から実装しますか？
```

#### **Week 2: エラーハンドリング・ログ**
```markdown
Week 2の目標: 堅牢性の向上

実装すべき機能:
1. src/utils/logger.js - 構造化ログシステム
2. API レート制限対応・リトライ機能
3. 詳細なエラーハンドリング・分類
4. パフォーマンス監視・メトリクス

重要な観点:
- Google Apps Script実行時間制限(6分)対応
- API クォータ監視・最適化
- 他チームが使いやすいエラー情報提供

Week 1の実装を基に、本番運用に耐える堅牢なシステムを構築してください。
```

#### **Week 3-4: バリデーション・統合**
```markdown
Week 3-4の目標: コンテンツ処理・バリデーション完成

実装すべき機能:
1. src/utils/validation.js - 包括的入力検証
2. src/services/content.js - コンテンツ処理エンジン
3. セキュリティ対策・サニタイゼーション
4. 統合テスト・他チームとの連携テスト

統合準備:
- Layout Engineチームとのインターフェース調整
- Web Interfaceチームとのデータフォーマット統一
- パフォーマンス最適化・メモリ使用量削減

Week 3-4で他チームが完全に活用できるCore Services APIを完成させてください。
```

### 🔍 **トラブルシューティングプロンプト**
```markdown
Core Services実装中に以下の問題が発生しました:

【問題の詳細】
- 発生場所: [ファイル名:行番号]
- エラーメッセージ: [具体的なエラー]
- 期待していた動作: [説明]
- 実際の動作: [説明]

【環境情報】
- Google Apps Script実行環境
- 関連するAPI制限・クォータ状況
- 他チームとの依存関係

【試した解決方法】
1. [試した方法1とその結果]
2. [試した方法2とその結果]

このCore Services APIは他チーム(Layout Engine, Web Interface)が依存しているため、迅速な解決が必要です。最適な解決策を提案してください。
```

---

## 📐 Team B: Layout Engine チーム

### 🚀 **初回セッション開始プロンプト**

```markdown
私は Google Slides Layout Engine を実装するエンジニアです。Core Services チームの実装に依存する設計を担当します。

## プロジェクト概要
- **Worktree**: ../slide-maker-layout
- **Branch**: feature/layout-engine
- **役割**: レイアウト・デザインロジックの実装
- **期間**: Core Services完成後、3-4週間での実装

## 実装対象ファイル
1. `src/services/layout.js` - レイアウト管理システム
2. `src/utils/design.js` - デザイン計算・フォント制御

## 依存関係
- **Core Services API**: ../slide-maker-core-services (必須)
- **設計仕様**: docs/design-guidelines.md (完全準拠)
- **アーキテクチャ**: docs/architecture.md のレイアウト設計

## 技術要件
- シングル・ダブルカラムレイアウト
- レスポンシブフォントサイズ計算
- グリッドシステム・余白計算
- テーマシステム・カラーパレット
- アクセシビリティ対応

## 開発戦略
1. Core Services完成まではモック使用
2. design-guidelines.md の仕様完全実装
3. Web Interface チームとの連携準備

まずCore Servicesの実装状況を確認し、モック開発から始めるべき部分と、実APIを待つべき部分を整理してください。docs/design-guidelines.md を参照して実装計画を立ててください。
```

### 📋 **週次目標設定プロンプト**

#### **Week 1-2: モック開発・基盤システム**
```markdown
Week 1-2の目標: Core Services待ちの間のモック開発

実装すべき機能:
1. GridSystemクラス - 12カラムグリッド基盤
2. BaseLayoutクラス - レイアウト抽象基底
3. SingleColumnLayout, DoubleColumnLayoutクラス
4. ResponsiveDesign計算関数群

モック戦略:
- Core Services APIのモック作成
- ロジック部分の完全実装
- 単体テスト・計算精度検証
- design-guidelines.md仕様準拠確認

Core Services完成前でも、レイアウトロジックとデザイン計算は完全実装できます。docs/design-guidelines.mdを参照しながら進めてください。
```

#### **Week 3: デザインシステム実装**
```markdown
Week 3の目標: テーマシステム・フォント計算

実装すべき機能:
1. ThemeManager - テーマ切り替え・管理
2. フォントサイズ・行間計算ロジック
3. カラーパレット・コントラスト検証
4. アクセシビリティ基準チェック

重要な観点:
- design-guidelines.md の仕様100%準拠
- 視認性・可読性の最適化
- WCAG準拠のアクセシビリティ
- パフォーマンス最適化

デザインシステムの実装でWeb Interfaceチームとの連携準備を進めてください。
```

#### **Week 4: Core Services統合・最適化**
```markdown
Week 4の目標: Core Services統合・システム完成

統合作業:
1. Core Services API実装との統合
2. エラーハンドリング・例外処理
3. パフォーマンス最適化・キャッシュ
4. Web Interface チームとの連携テスト

最終調整:
- 全レイアウトパターンの動作確認
- 複雑なコンテンツでの計算精度
- メモリ使用量・実行時間最適化
- 他チームからの使いやすさ改善

Core Services APIを活用して、Layout Engineを完全に完成させてください。
```

### 🎨 **デザイン仕様確認プロンプト**
```markdown
Layout Engine実装中、以下のデザイン仕様について確認が必要です:

【確認事項】
- 仕様書の該当箇所: docs/design-guidelines.md [セクション名]
- 実装しようとしている機能: [具体的な機能]
- 不明な点: [具体的な疑問]

【考慮すべき要素】
- レスポンシブ対応
- アクセシビリティ基準
- パフォーマンス影響
- 他チームとの連携

design-guidelines.mdの仕様に完全準拠した実装方法を提案してください。必要に応じて計算式やサンプルコードも含めてください。
```

---

## 🎨 Team C: Web Interface チーム

### 🚀 **初回セッション開始プロンプト**

```markdown
私は Google Apps Script の Web Interface を実装するフロントエンドエンジニアです。Core Services, Layout Engine の完成を待つ部分がある中で、効率的に開発を進めたいです。

## プロジェクト概要
- **Worktree**: ../slide-maker-ui
- **Branch**: feature/web-ui
- **役割**: ユーザーインターフェース・UX実装
- **期間**: 3-4週間、他チーム完成後に統合

## 実装対象ファイル
1. `src/web/index.html` - メインUI・フォーム設計
2. `src/web/style.css` - レスポンシブスタイルシート
3. `src/web/script.js` - クライアントサイドJavaScript
4. `src/main.js` - Google Apps Script WebApp エントリーポイント

## 依存関係
- **Core Services API**: ../slide-maker-core-services (バックエンド)
- **Layout Engine API**: ../slide-maker-layout (レイアウト)
- **Google Apps Script**: HtmlService WebApp

## 技術要件
- レスポンシブデザイン・モバイル対応
- 直感的なユーザーインターフェース
- リアルタイム進捗表示・エラーハンドリング
- アクセシビリティ対応

## 開発戦略
1. モックデータで先行UI開発
2. 段階的なバックエンド統合
3. ユーザビリティテスト・改善

Core Services, Layout Engineの実装を待つ間に、モックデータでプロトタイプを作成し、他チーム完成後にスムーズに統合したいです。最適な開発順序を提案してください。
```

### 📋 **週次目標設定プロンプト**

#### **Week 1-2: モックUI開発（先行実装）**
```markdown
Week 1-2の目標: バックエンド待ちの間のUI先行開発

実装すべき機能:
1. HTMLフォーム設計・レイアウト選択
2. CSSレスポンシブデザイン・モバイル対応
3. JavaScriptフォーム処理・バリデーション
4. モックデータでのプレビュー機能

モック戦略:
- Core Services, Layout Engine APIのモック
- 実際のデータフォーマット推定・実装
- ユーザビリティテスト準備
- アクセシビリティ基準準拠

他チームのAPI完成前でも、UIとUXは完全に実装できます。まずはユーザーが使いやすいインターフェースを作成してください。
```

#### **Week 3: バックエンド統合準備**
```markdown
Week 3の目標: バックエンドAPI統合・GAS WebApp実装

実装すべき機能:
1. src/main.js - Google Apps Script WebApp実装
2. Core Services API呼び出し統合
3. Layout Engine API呼び出し統合
4. エラーハンドリング・ユーザーフィードバック

統合準備:
- API呼び出しパターンの最適化
- 非同期処理・プログレス表示
- エラー状態の適切な表示
- パフォーマンス最適化

Core Services, Layout Engineの完成に合わせて、段階的にAPIを統合してください。
```

#### **Week 4: 最終統合・UX改善**
```markdown
Week 4の目標: 全システム統合・ユーザビリティ完成

最終統合:
1. 全API統合・E2Eテスト
2. パフォーマンス最適化・レスポンス向上
3. ユーザビリティテスト・改善
4. ブラウザ互換性・エラー処理完善

UX改善:
- 直感的な操作フロー
- 適切なフィードバック・進捗表示
- エラー回復・ユーザーガイダンス
- アクセシビリティ・ユーザビリティ

最終的にユーザーが簡単に使える、完成度の高いWebアプリケーションを作成してください。
```

### 🎯 **ユーザビリティ改善プロンプト**
```markdown
Web Interface のユーザビリティについて改善が必要です:

【現在の状況】
- 実装済み機能: [具体的な機能リスト]
- ユーザーテスト結果: [フィードバック内容]
- 特定の問題: [具体的な使いにくさ]

【改善したい観点】
- 操作の直感性・分かりやすさ
- エラー時の適切なガイダンス
- レスポンシブ・モバイル対応
- アクセシビリティ・障害者対応

【制約条件】
- Google Apps Script WebApp環境
- Core Services, Layout Engine APIの仕様
- 実装期間・技術的制約

ユーザーが迷わず、簡単にスライドを生成できるUIに改善してください。具体的な改善案とコード例を提案してください。
```

---

## 🔄 チーム間連携プロンプト

### 🤝 **API仕様調整プロンプト**
```markdown
チーム間でAPI仕様の調整が必要になりました:

【関係チーム】
- 提供側: [Team A/B/C]
- 利用側: [Team A/B/C]

【調整が必要な内容】
- API関数名・引数仕様: [具体的な内容]
- データフォーマット: [JSON構造など]
- エラーハンドリング方法: [エラー情報の形式]

【現在の実装状況】
- 提供側の実装: [完成度・問題点]
- 利用側の期待: [必要な機能・データ]

【制約条件】
- 既存実装への影響最小化
- パフォーマンス・保守性考慮
- 統合スケジュールへの影響

チーム間でスムーズに連携できるAPI仕様を提案し、必要に応じて実装方法も含めて調整してください。
```

### 📊 **統合テストプロンプト**
```markdown
3チーム実装の統合テストを実施します:

【統合対象】
- Core Services (../slide-maker-core-services)
- Layout Engine (../slide-maker-layout)
- Web Interface (../slide-maker-ui)

【テストシナリオ】
1. ユーザーフォーム入力 → バリデーション → レイアウト計算 → スライド生成
2. エラーケース: 不正入力、API制限、権限エラー
3. パフォーマンス: 大量データ、複雑レイアウト
4. ブラウザ互換性: Chrome, Firefox, Safari, Edge

【期待する結果】
- 全シナリオの正常動作
- 適切なエラーハンドリング
- パフォーマンス目標達成
- ユーザビリティ基準満足

統合テストを実施し、発見された問題の修正方法を提案してください。各チームが対応すべき課題を整理してください。
```

---

## 📈 継続的改善プロンプト

### 🔍 **コードレビュープロンプト**
```markdown
実装したコードのレビューをお願いします:

【対象コード】
- ファイル: [src/services/xxx.js]
- 機能: [具体的な機能説明]
- 実装期間: [Week X]

【レビュー観点】
1. CLAUDE.md ガイドライン準拠
2. パフォーマンス・メモリ使用量
3. エラーハンドリング・堅牢性
4. 他チームとの連携しやすさ
5. 保守性・拡張性

【特に確認したい点】
- [具体的な懸念点]
- [不安な実装箇所]
- [パフォーマンス問題の可能性]

Google Apps Script環境での最適化、他チームからの使いやすさ、将来の拡張性を考慮した改善提案をお願いします。
```

### 🎯 **最終調整プロンプト**
```markdown
プロジェクト完成に向けた最終調整を行います:

【完成状況】
- Core Services: [完成度%] [残課題]
- Layout Engine: [完成度%] [残課題]  
- Web Interface: [完成度%] [残課題]

【品質目標】
- テストカバレッジ: 85%以上
- パフォーマンス: スライド生成5秒以内
- ユーザビリティ: 直感的操作
- アクセシビリティ: WCAG準拠

【リリース準備】
- ドキュメント更新
- デプロイメント準備
- ユーザーマニュアル
- トラブルシューティングガイド

6-8週間の開発成果を統合し、本番リリース可能な品質に仕上げてください。各チームの最終調整と、統合後の品質向上を進めてください。
```

---

この戦略により、**各チームが効率的にClaude Codeを活用し、6-8週間で高品質なシステムを完成**させることができます。

各プロンプトは段階的に詳細化され、チーム間の連携も考慮した設計となっています。定期的な見直しと調整で、プロジェクト成功を支援します。