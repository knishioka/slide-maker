#!/bin/bash

# Google Slides Content Generator - Task Start Script
# タスク管理システム連携でworktreeを作成し、開発を開始

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

TASK_ID=$1
TASK_NAME=$2
ASSIGNEE=$3

# 使用方法表示
show_usage() {
    echo -e "${BLUE}🚀 Google Slides Content Generator - Task Start${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo ""
    echo "Usage: $0 [TASK-ID] [task-name] [assignee]"
    echo ""
    echo "Examples:"
    echo "  $0 TASK-001 layout-engine 'Developer Name'"
    echo "  $0 TASK-005 api-development 'John Doe'"
    echo ""
    echo "This script will:"
    echo "  1. Create a new worktree for the task"
    echo "  2. Guide you to update TASKS.md"
    echo "  3. Set up the development environment"
}

# 引数チェック
if [ -z "$TASK_ID" ] || [ -z "$TASK_NAME" ]; then
    echo -e "${RED}❌ Error: Missing required arguments${NC}"
    show_usage
    exit 1
fi

# タスクIDフォーマットチェック
if [[ ! "$TASK_ID" =~ ^TASK-[0-9]{3}$ ]]; then
    echo -e "${RED}❌ Error: Invalid task ID format. Use TASK-XXX (e.g., TASK-001)${NC}"
    exit 1
fi

# TASKS.mdの存在確認
if [ ! -f "TASKS.md" ]; then
    echo -e "${RED}❌ Error: TASKS.md not found. Please run from project root.${NC}"
    exit 1
fi

# タスクがTASKS.mdに存在するかチェック
if ! grep -q "\[$TASK_ID\]" TASKS.md; then
    echo -e "${YELLOW}⚠️  Warning: $TASK_ID not found in TASKS.md${NC}"
    echo "Please make sure the task is properly defined in TASKS.md"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
        exit 0
    fi
fi

# Worktree設定
WORKTREE_NAME="feature/task-${TASK_ID,,}-${TASK_NAME}"  # 小文字に変換
TASK_NUMBER=$(echo "$TASK_ID" | sed 's/TASK-//')
WORKTREE_PATH="../task-${TASK_NUMBER}-${TASK_NAME}"

echo -e "${BLUE}🚀 Starting task: $TASK_ID${NC}"
echo -e "📝 Task name: $TASK_NAME"
echo -e "👤 Assignee: ${ASSIGNEE:-'[Not specified]'}"
echo -e "🌿 Branch: $WORKTREE_NAME"
echo -e "📁 Path: $WORKTREE_PATH"
echo ""

# 既存worktreeチェック
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${YELLOW}⚠️  Worktree already exists: $WORKTREE_PATH${NC}"
    read -p "Remove existing worktree and recreate? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️  Removing existing worktree...${NC}"
        git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
        git branch -D "$WORKTREE_NAME" 2>/dev/null || true
    else
        echo -e "${BLUE}ℹ️  Using existing worktree${NC}"
        cd "$WORKTREE_PATH"
        echo -e "${GREEN}✅ Switched to existing worktree: $WORKTREE_PATH${NC}"
        show_next_steps
        exit 0
    fi
fi

# Worktree作成
echo -e "${BLUE}📁 Creating worktree...${NC}"
git worktree add -b "$WORKTREE_NAME" "$WORKTREE_PATH"

# worktreeに移動
cd "$WORKTREE_PATH"

# 初期設定
echo -e "${BLUE}⚙️  Setting up development environment...${NC}"

# package.jsonの存在確認とnpm install
if [ -f "package.json" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Git設定の確認
echo -e "${BLUE}🔧 Checking git configuration...${NC}"
git config user.name >/dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Git user.name not set${NC}"
    if [ -n "$ASSIGNEE" ]; then
        git config user.name "$ASSIGNEE"
        echo -e "${GREEN}✅ Set git user.name to: $ASSIGNEE${NC}"
    fi
}

# 作業完了メッセージ
echo ""
echo -e "${GREEN}✅ Worktree created successfully!${NC}"
echo ""

# 次のステップガイド
show_next_steps() {
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo ""
    echo "1. 📋 Update TASKS.md:"
    echo "   - Change status from 📝 TODO to 🚧 IN_PROGRESS"
    echo "   - Add assignee: ${ASSIGNEE:-'[Your Name]'}"
    echo "   - Add worktree: $WORKTREE_NAME"
    echo "   - Add start date: $(date '+%Y-%m-%d')"
    echo ""
    echo "2. 💻 Start development:"
    echo "   cd $WORKTREE_PATH"
    echo "   # Your development work here..."
    echo ""
    echo "3. 🧪 Regular quality checks:"
    echo "   npm run lint"
    echo "   npm run test"
    echo ""
    echo "4. 📝 Commit your work:"
    echo "   git add ."
    echo "   git commit -m \"feat: implement [feature description]\""
    echo ""
    echo "5. ✅ Complete the task:"
    echo "   ../main/scripts/complete-task.sh $TASK_ID"
    echo ""
    echo -e "${YELLOW}💡 Remember to keep TASKS.md updated with your progress!${NC}"
    echo ""
    echo -e "${PURPLE}🔗 Useful commands:${NC}"
    echo "   git worktree list                    # List all worktrees"
    echo "   ../main/scripts/check-progress.sh   # Check project progress"
    echo "   ../main/scripts/manage-worktrees.sh status  # Detailed status"
}

show_next_steps

# TASKS.md更新の確認
echo ""
read -p "Open TASKS.md for editing now? (y/N): " open_tasks
if [[ $open_tasks =~ ^[Yy]$ ]]; then
    # 利用可能なエディタを検出
    if command -v code >/dev/null 2>&1; then
        echo -e "${BLUE}📝 Opening TASKS.md in VS Code...${NC}"
        cd "../main"
        code TASKS.md
    elif command -v vim >/dev/null 2>&1; then
        echo -e "${BLUE}📝 Opening TASKS.md in vim...${NC}"
        cd "../main"
        vim TASKS.md
    else
        echo -e "${YELLOW}⚠️  No suitable editor found. Please manually edit:${NC}"
        echo "   ../main/TASKS.md"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Task $TASK_ID is ready for development!${NC}"