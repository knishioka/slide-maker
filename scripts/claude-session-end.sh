#!/bin/bash

# Google Slides Content Generator - Claude Code Session Finalization
# Claude Code作業完了後のワークフロー自動化

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

TASK_ID="$1"
FORCE_MODE="$2"

# 使用方法
show_usage() {
    echo -e "${BLUE}🏁 Claude Code Session Finalization${NC}"
    echo "===================================="
    echo ""
    echo "Usage: $0 [TASK-ID] [--force]"
    echo ""
    echo "Examples:"
    echo "  $0 TASK-002                 # Normal completion"
    echo "  $0 TASK-002 --force         # Skip confirmations"
    echo ""
    echo "This script will:"
    echo "  1. Run quality checks (lint, test)"
    echo "  2. Merge to main branch"
    echo "  3. Update task status to DONE"
    echo "  4. Clean up worktree"
    echo "  5. Push changes to remote"
}

# 引数チェック
if [ -z "$TASK_ID" ]; then
    echo -e "${RED}❌ Error: Task ID required${NC}"
    show_usage
    exit 1
fi

if [[ ! "$TASK_ID" =~ ^TASK-[0-9]{3}$ ]]; then
    echo -e "${RED}❌ Error: Invalid task ID format. Use TASK-XXX${NC}"
    exit 1
fi

# 必要コマンドの確認
check_dependencies() {
    if ! command -v yq >/dev/null 2>&1; then
        echo -e "${RED}❌ yq is required but not installed${NC}"
        echo "Install: brew install yq (macOS) or sudo apt install yq (Ubuntu)"
        exit 1
    fi
}

# ワークスペース確認
check_workspace() {
    local task_number=$(echo "$TASK_ID" | sed 's/TASK-0*//')
    local expected_path_pattern="../task-${task_number}-*"
    
    # 現在のディレクトリがworktreeかチェック
    if [[ $(pwd) == */task-${task_number}-* ]]; then
        WORKTREE_PATH=$(pwd)
        MAIN_PATH="../main"
        IN_WORKTREE=true
    elif [ -f "tasks.yaml" ]; then
        # mainディレクトリから実行された場合
        local worktree_path=$(find .. -maxdepth 1 -name "task-${task_number}-*" -type d 2>/dev/null | head -1)
        if [ -n "$worktree_path" ]; then
            WORKTREE_PATH=$(realpath "$worktree_path")
            MAIN_PATH=$(pwd)
            IN_WORKTREE=false
        else
            echo -e "${RED}❌ Worktree for $TASK_ID not found${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Please run from worktree or main directory${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📁 Workspace detected:${NC}"
    echo "  Worktree: $WORKTREE_PATH"
    echo "  Main: $MAIN_PATH"
    echo ""
}

# タスク情報取得
get_task_info() {
    cd "$MAIN_PATH"
    
    TASK_TITLE=$(yq eval ".tasks[] | select(.id == \"$TASK_ID\") | .title" tasks.yaml)
    TASK_STATUS=$(yq eval ".tasks[] | select(.id == \"$TASK_ID\") | .status" tasks.yaml)
    TASK_BRANCH=$(yq eval ".tasks[] | select(.id == \"$TASK_ID\") | .branch" tasks.yaml)
    
    if [ -z "$TASK_TITLE" ]; then
        echo -e "${RED}❌ Task $TASK_ID not found in tasks.yaml${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}📋 Task: $TASK_ID - $TASK_TITLE${NC}"
    echo -e "${CYAN}📊 Current Status: $TASK_STATUS${NC}"
    echo -e "${CYAN}🌿 Branch: $TASK_BRANCH${NC}"
    echo ""
}

# 品質チェック実行
run_quality_checks() {
    echo -e "${BLUE}🧪 Running quality checks...${NC}"
    
    cd "$WORKTREE_PATH"
    
    # パッケージ確認
    if [ ! -f "package.json" ]; then
        echo -e "${YELLOW}⚠️  No package.json found, skipping npm checks${NC}"
        return 0
    fi
    
    # Lint実行
    echo -e "${BLUE}🔍 Running lint...${NC}"
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✅ Lint passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Lint issues found${NC}"
        if [[ "$FORCE_MODE" != "--force" ]]; then
            read -p "Continue despite lint issues? (y/N): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                echo -e "${RED}❌ Aborting due to lint issues${NC}"
                exit 1
            fi
        fi
    fi
    
    # テスト実行
    echo -e "${BLUE}🧪 Running tests...${NC}"
    if npm test 2>/dev/null; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Test failures found${NC}"
        if [[ "$FORCE_MODE" != "--force" ]]; then
            read -p "Continue despite test failures? (y/N): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                echo -e "${RED}❌ Aborting due to test failures${NC}"
                exit 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✅ Quality checks completed${NC}"
    echo ""
}

# 作業状況確認
check_work_status() {
    echo -e "${BLUE}📊 Checking work status...${NC}"
    
    cd "$WORKTREE_PATH"
    
    # Gitステータス確認
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Uncommitted changes found:${NC}"
        git status --short
        echo ""
        
        if [[ "$FORCE_MODE" != "--force" ]]; then
            echo "Options:"
            echo "  1. Commit changes and continue"
            echo "  2. Stash changes and continue"
            echo "  3. Abort finalization"
            echo ""
            read -p "Choose option (1/2/3): " choice
            
            case $choice in
                1)
                    echo -e "${BLUE}💾 Committing changes...${NC}"
                    git add .
                    read -p "Enter commit message: " commit_msg
                    if [ -z "$commit_msg" ]; then
                        commit_msg="feat: complete $TASK_ID implementation"
                    fi
                    git commit -m "$commit_msg

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
                    ;;
                2)
                    echo -e "${BLUE}📦 Stashing changes...${NC}"
                    git stash push -m "Auto-stash before $TASK_ID completion"
                    ;;
                3)
                    echo -e "${BLUE}ℹ️  Finalization aborted${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}❌ Invalid option${NC}"
                    exit 1
                    ;;
            esac
        fi
    fi
    
    # コミット確認
    local commit_count=$(git rev-list --count HEAD ^main 2>/dev/null || echo "0")
    echo -e "${CYAN}📝 Commits in this branch: $commit_count${NC}"
    
    if [ "$commit_count" -eq "0" ]; then
        echo -e "${YELLOW}⚠️  No commits found in this branch${NC}"
        if [[ "$FORCE_MODE" != "--force" ]]; then
            read -p "Continue anyway? (y/N): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    echo ""
}

# メインブランチにマージ
merge_to_main() {
    echo -e "${BLUE}🔄 Merging to main branch...${NC}"
    
    cd "$MAIN_PATH"
    
    # mainブランチに切り替え
    git checkout main
    
    # リモートから最新取得
    echo -e "${BLUE}📡 Fetching latest changes...${NC}"
    git fetch origin main
    
    # Fast-forward可能かチェック
    if ! git merge-base --is-ancestor HEAD origin/main; then
        echo -e "${YELLOW}⚠️  Main branch has new commits${NC}"
        if [[ "$FORCE_MODE" != "--force" ]]; then
            read -p "Pull latest changes? (Y/n): " confirm
            if [[ ! $confirm =~ ^[Nn]$ ]]; then
                git pull origin main
            fi
        fi
    fi
    
    # マージ実行
    echo -e "${BLUE}🔀 Merging branch: $TASK_BRANCH${NC}"
    if git merge "$TASK_BRANCH" --no-edit; then
        echo -e "${GREEN}✅ Merge successful${NC}"
    else
        echo -e "${RED}❌ Merge conflicts detected${NC}"
        echo "Please resolve conflicts manually and run:"
        echo "  git add ."
        echo "  git commit"
        echo "  $0 $TASK_ID --force"
        exit 1
    fi
    
    echo ""
}

# タスクステータス更新
update_task_completion() {
    echo -e "${BLUE}📝 Updating task completion status...${NC}"
    
    cd "$MAIN_PATH"
    
    local completion_date=$(date '+%Y-%m-%d')
    
    # バックアップ作成
    cp tasks.yaml tasks.yaml.backup
    
    # ステータス更新
    yq eval "(.tasks[] | select(.id == \"$TASK_ID\") | .status) = \"done\"" -i tasks.yaml
    yq eval "(.tasks[] | select(.id == \"$TASK_ID\") | .completed_date) = \"$completion_date\"" -i tasks.yaml
    
    # コミット
    git add tasks.yaml
    git commit -m "chore: complete $TASK_ID - update status to done

Task: $TASK_TITLE
Completed: $completion_date
Branch: $TASK_BRANCH

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo -e "${GREEN}✅ Task status updated${NC}"
    echo ""
}

# Worktreeクリーンアップ
cleanup_worktree() {
    echo -e "${BLUE}🧹 Cleaning up worktree...${NC}"
    
    cd "$MAIN_PATH"
    
    # Worktree削除
    if git worktree list | grep -q "$WORKTREE_PATH"; then
        git worktree remove "$WORKTREE_PATH" --force
        echo -e "${GREEN}✅ Worktree removed: $WORKTREE_PATH${NC}"
    fi
    
    # ブランチ削除
    if git branch | grep -q "$TASK_BRANCH"; then
        git branch -d "$TASK_BRANCH"
        echo -e "${GREEN}✅ Branch deleted: $TASK_BRANCH${NC}"
    fi
    
    echo ""
}

# リモートプッシュ
push_changes() {
    echo -e "${BLUE}📤 Pushing changes to remote...${NC}"
    
    cd "$MAIN_PATH"
    
    if git push origin main; then
        echo -e "${GREEN}✅ Changes pushed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Push failed, but work is completed locally${NC}"
        echo "You can push manually later with: git push origin main"
    fi
    
    echo ""
}

# 完了サマリー表示
show_completion_summary() {
    echo -e "${GREEN}🎉 Task Completion Summary${NC}"
    echo "=========================="
    echo ""
    echo -e "${CYAN}✅ Task: $TASK_ID - $TASK_TITLE${NC}"
    echo -e "${CYAN}📅 Completed: $(date '+%Y-%m-%d %H:%M')${NC}"
    echo -e "${CYAN}🌿 Branch: $TASK_BRANCH (merged & deleted)${NC}"
    echo ""
    
    # 次のタスク提案
    echo -e "${BLUE}🔮 What's next?${NC}"
    cd "$MAIN_PATH"
    
    local next_tasks=$(yq eval '.tasks[] | select(.status == "todo") | "\(.id): \(.title) (\(.priority))"' tasks.yaml | head -3)
    
    if [ -n "$next_tasks" ]; then
        echo -e "${CYAN}Available tasks:${NC}"
        echo "$next_tasks" | while IFS= read -r line; do
            echo "  📝 $line"
        done
        echo ""
        echo -e "${YELLOW}💡 Start next task: ./scripts/prepare-claude-session.sh${NC}"
    else
        echo -e "${GREEN}🏆 All tasks completed! Great work!${NC}"
    fi
    
    echo ""
    echo -e "${PURPLE}Thanks for using Claude Code! 🤖✨${NC}"
}

# メイン処理
main() {
    echo -e "${BLUE}🏁 Claude Code Session Finalization${NC}"
    echo "====================================="
    echo ""
    
    check_dependencies
    check_workspace
    get_task_info
    
    # 確認プロンプト
    if [[ "$FORCE_MODE" != "--force" ]]; then
        echo -e "${YELLOW}⚠️  This will finalize the task and merge to main${NC}"
        read -p "Continue? (Y/n): " confirm
        if [[ $confirm =~ ^[Nn]$ ]]; then
            echo -e "${BLUE}ℹ️  Finalization cancelled${NC}"
            exit 0
        fi
        echo ""
    fi
    
    run_quality_checks
    check_work_status
    merge_to_main
    update_task_completion
    cleanup_worktree
    push_changes
    show_completion_summary
}

# スクリプト実行
main "$@"