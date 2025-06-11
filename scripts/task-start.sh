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
TASK_ID_LOWER=$(echo "$TASK_ID" | tr '[:upper:]' '[:lower:]')
TASK_NAME_CLEAN=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
WORKTREE_NAME="feature/${TASK_ID_LOWER}-${TASK_NAME_CLEAN}"
TASK_NUMBER=$(echo "$TASK_ID" | sed 's/TASK-//')
WORKTREE_PATH="../task-${TASK_NUMBER}-${TASK_NAME_CLEAN}"

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

# TASKS.md自動更新
echo -e "${BLUE}📝 Updating TASKS.md automatically...${NC}"
update_tasks_md() {
    local main_dir="../main"
    local tasks_file="$main_dir/TASKS.md"
    local start_date=$(date '+%Y-%m-%d')
    
    if [ -f "$tasks_file" ]; then
        # TODO → IN_PROGRESS に変更
        if grep -q "📝.*\*\*\[$TASK_ID\]" "$tasks_file"; then
            # 一時ファイルで更新
            sed "s/📝\(.*\*\*\[$TASK_ID\]\)/🚧\1/" "$tasks_file" > "$tasks_file.tmp"
            
            # Assignee, Worktree, Start date を更新/追加
            awk -v task_id="$TASK_ID" -v assignee="${ASSIGNEE:-'Developer'}" -v worktree="$WORKTREE_NAME" -v start_date="$start_date" '
            /\*\*\[/ && $0 ~ task_id {
                in_task = 1
                print $0
                next
            }
            in_task && /- \*\*Assignee\*\*:/ {
                print "  - **Assignee**: " assignee
                next
            }
            in_task && /- \*\*Worktree\*\*:/ {
                print "  - **Worktree**: " worktree
                next
            }
            in_task && /- \*\*Started\*\*:/ {
                print "  - **Started**: " start_date
                next
            }
            in_task && /^$/ && !assignee_added {
                print "  - **Assignee**: " assignee
                print "  - **Worktree**: " worktree
                print "  - **Started**: " start_date
                print $0
                assignee_added = 1
                in_task = 0
                next
            }
            in_task && /^\*\*\[/ {
                if (!assignee_added) {
                    print "  - **Assignee**: " assignee
                    print "  - **Worktree**: " worktree  
                    print "  - **Started**: " start_date
                    print ""
                }
                in_task = 0
                assignee_added = 0
                print $0
                next
            }
            { print $0 }
            ' "$tasks_file.tmp" > "$tasks_file.tmp2"
            
            mv "$tasks_file.tmp2" "$tasks_file"
            rm -f "$tasks_file.tmp"
            
            echo -e "${GREEN}✅ TASKS.md updated successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Task $TASK_ID not found in TASKS.md${NC}"
        fi
    else
        echo -e "${RED}❌ TASKS.md not found${NC}"
    fi
}

update_tasks_md

echo ""
echo -e "${GREEN}✅ Worktree created and task started!${NC}"
echo ""
echo -e "${CYAN}📂 You are now in: $(pwd)${NC}"
echo -e "${CYAN}🌿 Branch: $(git branch --show-current)${NC}"
echo ""
echo -e "${BLUE}🚀 Ready to start development!${NC}"
echo ""
echo -e "${YELLOW}Quick commands:${NC}"
echo "  npm run lint && npm run test   # Quality checks"
echo "  git add . && git commit        # Commit changes"
echo "  ../main/scripts/task-complete.sh $TASK_ID  # Complete task"