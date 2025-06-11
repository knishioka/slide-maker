# Task Management Templates & Workflows

## 📋 Task Templates

### 新規タスク作成テンプレート

```markdown
- [ ] 📝 **[TASK-XXX]** [Task Title]
  - **Priority**: High/Medium/Low
  - **Estimate**: X days
  - **Dependencies**: [List dependencies]
  - **Description**: [Detailed description]
  - **Assignee**: -
  - **Worktree**: -
  - **Status**: TODO
  - **Files Affected**: [List key files]
  - **Definition of Done**: 
    - [ ] Feature implementation
    - [ ] Unit tests passing
    - [ ] Integration tests passing
    - [ ] Code review completed
    - [ ] Documentation updated
```

### タスク更新テンプレート

#### 開始時
```markdown
- [x] 🚧 **[TASK-XXX]** [Task Title]
  - **Assignee**: [Developer Name]
  - **Worktree**: feature/task-xxx-description
  - **Start Date**: YYYY-MM-DD
  - **Status**: IN_PROGRESS
```

#### 完了時
```markdown
- [x] ✅ **[TASK-XXX]** [Task Title]
  - **Completed Date**: YYYY-MM-DD
  - **Status**: DONE
  - **Deliverables**: [What was implemented]
  - **Notes**: [Any important notes]
```

#### ブロック時
```markdown
- [x] ⏸️ **[TASK-XXX]** [Task Title]
  - **Blocked By**: [Dependency or issue]
  - **Block Date**: YYYY-MM-DD
  - **Status**: BLOCKED
  - **Resolution Plan**: [How to unblock]
```

---

## 🔄 Workflow Scripts

### 1. タスク開始スクリプト
```bash
#!/bin/bash
# scripts/start-task.sh

TASK_ID=$1
TASK_NAME=$2

if [ -z "$TASK_ID" ] || [ -z "$TASK_NAME" ]; then
    echo "Usage: ./start-task.sh TASK-001 'layout-engine'"
    exit 1
fi

WORKTREE_NAME="feature/task-${TASK_ID}-${TASK_NAME}"
WORKTREE_PATH="../task-${TASK_ID}-${TASK_NAME}"

echo "🚀 Starting task: $TASK_ID"
echo "📁 Creating worktree: $WORKTREE_PATH"

# Worktree作成
git worktree add -b "$WORKTREE_NAME" "$WORKTREE_PATH"

echo "✅ Worktree created successfully!"
echo "📝 Next steps:"
echo "1. Update TASKS.md status to IN_PROGRESS"
echo "2. Add your name as assignee"
echo "3. cd $WORKTREE_PATH"
echo "4. Start development!"
```

### 2. タスク完了スクリプト
```bash
#!/bin/bash
# scripts/complete-task.sh

TASK_ID=$1

if [ -z "$TASK_ID" ]; then
    echo "Usage: ./complete-task.sh TASK-001"
    exit 1
fi

echo "🎯 Completing task: $TASK_ID"

# 品質チェック
echo "🧪 Running quality checks..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed! Please fix issues before completing."
    exit 1
fi

npm run test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Please fix issues before completing."
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix issues before completing."
    exit 1
fi

echo "✅ All checks passed!"
echo "📝 Next steps:"
echo "1. Merge to main branch"
echo "2. Update TASKS.md status to DONE"
echo "3. Remove worktree with: ./cleanup-task.sh $TASK_ID"
```

### 3. Worktreeクリーンアップスクリプト
```bash
#!/bin/bash
# scripts/cleanup-task.sh

TASK_ID=$1

if [ -z "$TASK_ID" ]; then
    echo "Usage: ./cleanup-task.sh TASK-001"
    exit 1
fi

# Find worktree path pattern
WORKTREE_PATH=$(git worktree list | grep "task-${TASK_ID}" | awk '{print $1}')
BRANCH_NAME=$(git worktree list | grep "task-${TASK_ID}" | sed 's/.*\[\(.*\)\].*/\1/')

if [ -z "$WORKTREE_PATH" ]; then
    echo "❌ No worktree found for task: $TASK_ID"
    exit 1
fi

echo "🧹 Cleaning up task: $TASK_ID"
echo "📁 Removing worktree: $WORKTREE_PATH"
echo "🌿 Deleting branch: $BRANCH_NAME"

# Worktree削除
git worktree remove "$WORKTREE_PATH"

# ブランチ削除
git branch -d "$BRANCH_NAME"

echo "✅ Cleanup completed!"
```

### 4. 進捗確認スクリプト
```bash
#!/bin/bash
# scripts/check-progress.sh

echo "📊 Project Progress Report"
echo "========================="

# アクティブなタスク
echo "🚧 Active Tasks:"
grep -n "IN_PROGRESS" TASKS.md | head -5

echo ""

# ブロックされたタスク
echo "⏸️ Blocked Tasks:"
grep -n "BLOCKED" TASKS.md

echo ""

# 完了タスク数
DONE_COUNT=$(grep -c "DONE" TASKS.md)
TODO_COUNT=$(grep -c "TODO" TASKS.md)
IN_PROGRESS_COUNT=$(grep -c "IN_PROGRESS" TASKS.md)
TOTAL_COUNT=$((DONE_COUNT + TODO_COUNT + IN_PROGRESS_COUNT))

echo "📈 Statistics:"
echo "   Completed: $DONE_COUNT"
echo "   In Progress: $IN_PROGRESS_COUNT"
echo "   Todo: $TODO_COUNT"
echo "   Total: $TOTAL_COUNT"

if [ $TOTAL_COUNT -gt 0 ]; then
    COMPLETION_RATE=$(( (DONE_COUNT * 100) / TOTAL_COUNT ))
    echo "   Completion Rate: $COMPLETION_RATE%"
fi

echo ""

# アクティブなworktree
echo "🌿 Active Worktrees:"
git worktree list | grep -v "(bare)"
```

---

## 📝 Documentation Templates

### プルリクエストテンプレート
```markdown
## 概要
[Task ID] [機能の概要を簡潔に]

## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] テスト追加

## テスト
- [ ] ユニットテスト追加/更新
- [ ] 統合テスト確認
- [ ] 手動テスト実施

## 影響範囲
- 変更したファイル: 
- 影響する機能: 
- 互換性への影響: 

## レビュー観点
- [ ] コード品質
- [ ] パフォーマンス影響
- [ ] セキュリティ考慮
- [ ] ドキュメント整合性

## 関連Issue/Task
- Closes #[Issue番号]
- Related: TASK-XXX
```

### 技術仕様書テンプレート
```markdown
# [機能名] 技術仕様書

## 概要
[機能の目的と概要]

## 要件
### 機能要件
- [ ] 要件1
- [ ] 要件2

### 非機能要件
- パフォーマンス: 
- セキュリティ: 
- 可用性: 

## アーキテクチャ
### システム構成
[システム構成図]

### データフロー
[データフローの説明]

## API設計
### エンドポイント
```http
GET /api/v1/resource
POST /api/v1/resource
```

## データベース設計
### テーブル定義
[テーブル構造]

## テスト計画
### テストケース
- [ ] 正常系テスト
- [ ] 異常系テスト
- [ ] 境界値テスト

## 実装計画
### マイルストーン
1. フェーズ1: [概要]
2. フェーズ2: [概要]

### リスク
- リスク1: [対策]
- リスク2: [対策]
```

---

## 🔍 Quality Gates

### Definition of Done チェックリスト
```markdown
## 開発完了の定義

### コード品質
- [ ] ESLint警告0件
- [ ] コードレビュー完了
- [ ] 適切なコメント追加
- [ ] 命名規則遵守

### テスト
- [ ] ユニットテストカバレッジ80%以上
- [ ] 統合テスト追加
- [ ] 手動テスト実施
- [ ] 既存テスト全て通過

### ドキュメント
- [ ] API仕様書更新
- [ ] README更新
- [ ] CHANGELOG更新
- [ ] コメント追加

### セキュリティ
- [ ] 入力検証実装
- [ ] 認証・認可確認
- [ ] ログ出力適切
- [ ] 機密情報除去

### パフォーマンス
- [ ] パフォーマンステスト実施
- [ ] メモリリーク確認
- [ ] API応答時間確認
- [ ] バッチ処理最適化
```

### コードレビューチェックリスト
```markdown
## コードレビュー観点

### 機能性
- [ ] 要件を満たしている
- [ ] エラーハンドリング適切
- [ ] エッジケース考慮
- [ ] ログ出力適切

### 保守性
- [ ] 命名が分かりやすい
- [ ] 関数が適切なサイズ
- [ ] 重複コード除去
- [ ] 設計パターン適用

### パフォーマンス
- [ ] 不要な処理なし
- [ ] メモリ効率的
- [ ] データベースアクセス最適
- [ ] キャッシュ活用

### セキュリティ
- [ ] 入力検証実装
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] 機密情報保護
```

---

*これらのテンプレートは、チームの成熟度に合わせて適宜カスタマイズしてください。*