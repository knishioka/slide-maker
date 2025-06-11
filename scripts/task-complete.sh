#!/bin/bash

# Google Slides Content Generator - Task Complete Script
# タスク完了時の品質チェック、マージ、クリーンアップを自動化

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

TASK_ID=$1
AUTO_MERGE=${2:-false}

# 使用方法表示
show_usage() {
    echo -e "${BLUE}🎯 Google Slides Content Generator - Task Complete${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
    echo "Usage: $0 [TASK-ID] [auto-merge]"
    echo ""
    echo "Arguments:"
    echo "  TASK-ID     - Task identifier (e.g., TASK-001)"
    echo "  auto-merge  - Automatically merge to main (true/false, default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 TASK-001"
    echo "  $0 TASK-005 true"
    echo ""
    echo "This script will:"
    echo "  1. Run quality checks (lint, test, build)"
    echo "  2. Optionally merge to main branch"
    echo "  3. Guide TASKS.md update"
    echo "  4. Clean up worktree"
}

# 引数チェック
if [ -z "$TASK_ID" ]; then
    echo -e "${RED}❌ Error: Task ID required${NC}"
    show_usage
    exit 1
fi

# タスクIDフォーマットチェック
if [[ ! "$TASK_ID" =~ ^TASK-[0-9]{3}$ ]]; then
    echo -e "${RED}❌ Error: Invalid task ID format. Use TASK-XXX (e.g., TASK-001)${NC}"
    exit 1
fi

# TASKS.mdの存在確認
MAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ ! -f "$MAIN_DIR/TASKS.md" ]; then
    echo -e "${RED}❌ Error: TASKS.md not found in $MAIN_DIR${NC}"
    exit 1
fi

# worktreeパスを検出
TASK_NUMBER=$(echo "$TASK_ID" | sed 's/TASK-//')
WORKTREE_PATTERN="task-${TASK_NUMBER}-*"
WORKTREE_PATH=""

# worktreeを検索
echo -e "${BLUE}🔍 Searching for worktree...${NC}"
git worktree list --porcelain | while read -r line; do
    if [[ $line == worktree* ]]; then
        path=$(echo "$line" | sed 's/worktree //')
        if [[ $(basename "$path") == $WORKTREE_PATTERN ]]; then
            echo "$path"
            exit 0
        fi
    fi
done > /tmp/worktree_path

WORKTREE_PATH=$(cat /tmp/worktree_path 2>/dev/null || echo "")
rm -f /tmp/worktree_path

if [ -z "$WORKTREE_PATH" ] || [ ! -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}❌ Error: Worktree not found for $TASK_ID${NC}"
    echo "Expected pattern: $WORKTREE_PATTERN"
    echo "Available worktrees:"
    git worktree list
    exit 1
fi

WORKTREE_NAME=$(basename "$WORKTREE_PATH")
echo -e "${GREEN}✅ Found worktree: $WORKTREE_PATH${NC}"

# worktreeに移動
cd "$WORKTREE_PATH"

# 現在のブランチ取得
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}🌿 Current branch: $CURRENT_BRANCH${NC}"

echo -e "${BLUE}🎯 Completing task: $TASK_ID${NC}"
echo -e "📁 Worktree: $WORKTREE_NAME"
echo -e "🌿 Branch: $CURRENT_BRANCH"
echo ""

# 未コミット変更チェック
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    git status --short
    echo ""
    read -p "Commit changes now? (y/N): " commit_now
    
    if [[ $commit_now =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}💬 Enter commit message:${NC}"
        read -p "> " commit_message
        
        if [ -z "$commit_message" ]; then
            commit_message="feat: complete $TASK_ID implementation"
        fi
        
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${RED}❌ Please commit or stash changes before completing task${NC}"
        exit 1
    fi
fi

# 品質チェック実行
echo -e "${BLUE}🧪 Running quality checks...${NC}"

# package.jsonの存在確認
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  No package.json found, skipping npm scripts${NC}"
else
    # Lint実行
    echo -e "${PURPLE}📝 Running lint...${NC}"
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✅ Lint passed${NC}"
    else
        echo -e "${RED}❌ Lint failed! Please fix issues before completing.${NC}"
        exit 1
    fi

    # テスト実行
    echo -e "${PURPLE}🧪 Running tests...${NC}"
    if npm run test 2>/dev/null; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed! Please fix issues before completing.${NC}"
        exit 1
    fi

    # ビルド実行
    echo -e "${PURPLE}🏗️  Running build...${NC}"
    if npm run build 2>/dev/null; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed! Please fix issues before completing.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ All quality checks passed!${NC}"
echo ""

# メインブランチにマージ
if [[ "$AUTO_MERGE" == "true" ]]; then
    merge_to_main=true
else
    read -p "Merge to main branch? (y/N): " merge_response
    merge_to_main=$([[ $merge_response =~ ^[Yy]$ ]] && echo true || echo false)
fi

if [[ "$merge_to_main" == "true" ]]; then
    echo -e "${BLUE}🔀 Merging to main branch...${NC}"
    
    # mainブランチに移動
    cd "$MAIN_DIR"
    git checkout main
    
    # mainを最新に更新
    git pull origin main
    
    # マージ実行
    git merge "$CURRENT_BRANCH" --no-ff -m "feat: merge $TASK_ID - $WORKTREE_NAME

Completed task: $TASK_ID
Branch: $CURRENT_BRANCH
Worktree: $WORKTREE_NAME

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo -e "${GREEN}✅ Successfully merged to main${NC}"
    
    # リモートにプッシュ
    read -p "Push to remote? (y/N): " push_response
    if [[ $push_response =~ ^[Yy]$ ]]; then
        git push origin main
        echo -e "${GREEN}✅ Pushed to remote${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  Skipping merge. You can merge manually later.${NC}"
fi

# TASKS.md更新ガイド
echo ""
echo -e "${BLUE}📝 Update TASKS.md:${NC}"
echo ""
echo "Please update the following in TASKS.md:"
echo "  1. Change status: 🚧 IN_PROGRESS → ✅ DONE"
echo "  2. Add completion date: $(date '+%Y-%m-%d')"
echo "  3. Add deliverables description"
echo ""

# TASKS.md更新の確認
echo -e "${BLUE}📝 Please manually edit TASKS.md:${NC}"
echo "   $MAIN_DIR/TASKS.md"
echo ""
echo -e "${YELLOW}Required updates:${NC}"
echo "   - Status: 🚧 IN_PROGRESS → ✅ DONE"
echo "   - Completion date: $(date '+%Y-%m-%d')"

# worktreeクリーンアップ
echo ""
read -p "Clean up worktree? (recommended: y/N): " cleanup_response
if [[ $cleanup_response =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 Cleaning up worktree...${NC}"
    
    cd "$MAIN_DIR"
    git worktree remove "$WORKTREE_PATH"
    
    # ブランチ削除（マージ済みの場合のみ）
    if git branch --merged main | grep -q "$CURRENT_BRANCH"; then
        git branch -d "$CURRENT_BRANCH"
        echo -e "${GREEN}✅ Deleted merged branch: $CURRENT_BRANCH${NC}"
    else
        echo -e "${YELLOW}⚠️  Branch not merged, keeping: $CURRENT_BRANCH${NC}"
        echo "You can delete it manually later with: git branch -D $CURRENT_BRANCH"
    fi
    
    echo -e "${GREEN}✅ Worktree cleanup completed${NC}"
else
    echo -e "${BLUE}ℹ️  Worktree preserved: $WORKTREE_PATH${NC}"
    echo "Clean up manually with: git worktree remove $WORKTREE_PATH"
fi

# 完了サマリー
echo ""
echo -e "${GREEN}🎉 Task $TASK_ID completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "  Task ID: $TASK_ID"
echo "  Worktree: $WORKTREE_NAME"
echo "  Branch: $CURRENT_BRANCH"
echo "  Quality checks: ✅ Passed"
if [[ "$merge_to_main" == "true" ]]; then
    echo "  Merged to main: ✅ Yes"
else
    echo "  Merged to main: ⏸️  Pending"
fi
echo "  Completion date: $(date '+%Y-%m-%d %H:%M')"
echo ""
echo -e "${PURPLE}🔗 Next steps:${NC}"
echo "  1. Update TASKS.md status to DONE"
echo "  2. Choose next task from TASKS.md"
echo "  3. Start new task: ./scripts/start-task.sh TASK-XXX"
echo ""
echo -e "${YELLOW}💡 Don't forget to update project documentation if needed!${NC}"