# 🚀 Quick Start Guide - Google Slides Content Generator

## 📋 はじめに

このガイドでは、Google Slides Content Generatorプロジェクトで効率的に開発を始める方法を説明します。

## ⚡ 超簡単スタート（3ステップ）

### 1. 🏗️ 初期設定（初回のみ）

```bash
# リポジトリをクローンしてmainディレクトリに移動
cd /path/to/slide-maker/main

# エイリアス設定（便利なショートカットコマンド）
./scripts/setup-aliases.sh

# シェルを再読み込み
source ~/.zshrc  # または ~/.bashrc
```

### 2. 🎯 タスク開始

```bash
# インタラクティブにタスクを選択して即開始
slides-start

# または直接タスクを指定
slides-start TASK-007
```

### 3. ✅ タスク完了

```bash
# コード実装後、すべて自動で完了処理
task-done TASK-007
```

## 🎮 利用可能なコマンド

### エイリアス（推奨）

| コマンド | 機能 |
|----------|------|
| `slides-start` | タスク開始 + worktreeに自動移動 |
| `task-done TASK-XXX` | タスク完了 + mainに自動移動 |
| `slides-status` | プロジェクト進捗確認 |
| `slides-main` | mainディレクトリに移動 |
| `slides-build` | 品質チェック（lint + test） |

### 直接実行（エイリアス未設定時）

| コマンド | 機能 |
|----------|------|
| `source ./scripts/quick-start.sh` | タスク開始 + 自動移動 |
| `source ./scripts/complete-task-and-cd.sh TASK-XXX` | タスク完了 + 自動移動 |
| `./scripts/project-status.sh` | プロジェクト進捗確認 |

## 📖 開発フロー例

```bash
# 1. エイリアス設定（初回のみ）
./scripts/setup-aliases.sh
source ~/.zshrc

# 2. プロジェクト状況確認
slides-status

# 3. タスク開始（インタラクティブ選択）
slides-start
# > 1. 🔥 TASK-007: Web Dashboard Development
# > 2. 📋 TASK-008: Mobile-Responsive Design  
# > Select a task to start (1-2, q to quit): 1

# 結果：
# ✅ Worktree created: ../task-007-quick-dev
# ✅ TASKS.md updated automatically
# 📁 Auto-moved to: /path/to/task-007-quick-dev
# 🚀 Start coding immediately!

# 4. 開発作業
echo "console.log('Hello World');" > dashboard.js

# 5. 品質チェック
slides-build

# 6. タスク完了
task-done TASK-007

# 結果：
# ✅ Quality checks passed
# ✅ Merged to main branch
# ✅ TASKS.md updated
# ✅ Worktree cleaned up
# 📁 Auto-moved to: /path/to/main

# 7. 次のタスクを開始
slides-start
```

## 🆘 トラブルシューティング

### エイリアスが動かない

```bash
# シェル確認
echo $SHELL

# 設定ファイル再読み込み
source ~/.zshrc    # zsh使用時
source ~/.bashrc   # bash使用時

# 手動エイリアス確認
alias | grep slides
```

### Worktreeディレクトリに移動しない

```bash
# sourceで実行する（重要！）
source ./scripts/quick-start.sh TASK-XXX

# 通常実行では移動しません
./scripts/quick-start.sh TASK-XXX  # ❌ ディレクトリ移動なし
```

### VS Codeが勝手に開く

```bash
# 修正済み：VS Code自動起動は完全に削除されています
# 問題が続く場合は以下を確認：
which code  # VS Codeのパスを確認
```

## 💡 Tips

### 複数タスクの並行開発

```bash
# タスクA開始
slides-start TASK-007

# タスクB開始（別のターミナルで）
cd /path/to/main
slides-start TASK-008

# タスク間の切り替え
slides-main          # mainに戻る
cd ../task-007-*     # タスクAのworktreeに移動
cd ../task-008-*     # タスクBのworktreeに移動
```

### 手動コマンド（エイリアス未使用時）

```bash
# タスク開始
source ./scripts/quick-start.sh

# 進捗確認
./scripts/project-status.sh

# タスク完了
source ./scripts/complete-task-and-cd.sh TASK-XXX
```

## 📚 詳細情報

- [README.md](README.md) - プロジェクト全体概要
- [CLAUDE.md](CLAUDE.md) - Claude Code開発ガイド
- [TASKS.md](TASKS.md) - タスク管理一覧
- [docs/](docs/) - 技術文書