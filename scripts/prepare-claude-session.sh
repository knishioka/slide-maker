#!/bin/bash

# Google Slides Content Generator - Claude Code Session Preparation
# タスク選択、worktree作成、Claude Code起動準備を自動化

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 必要コマンドの確認
check_dependencies() {
    local missing_deps=()
    
    if ! command -v yq >/dev/null 2>&1; then
        missing_deps+=("yq")
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Please install missing dependencies:${NC}"
        echo "  macOS: brew install yq jq"
        echo "  Ubuntu: sudo apt install yq jq"
        exit 1
    fi
}

# プロジェクトルートの確認
check_project_root() {
    if [ ! -f "tasks.yaml" ] || [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Please run from project root directory${NC}"
        echo "Expected files: tasks.yaml, package.json"
        exit 1
    fi
}

# 利用可能なタスクを表示
show_available_tasks() {
    echo -e "${BLUE}📋 Available Tasks${NC}"
    echo "=================="
    echo ""
    
    # YAMLから利用可能なタスクを抽出
    yq eval '.tasks[] | select(.status == "todo") | "[\(.priority | upcase)] \(.id): \(.title) (\(.estimate_days)d)"' tasks.yaml | \
    while IFS= read -r line; do
        if [[ $line == *"[HIGH]"* ]]; then
            echo -e "${RED}🔥 $line${NC}"
        elif [[ $line == *"[MEDIUM]"* ]]; then
            echo -e "${YELLOW}⚡ $line${NC}"
        else
            echo -e "${GREEN}📝 $line${NC}"
        fi
    done
    
    echo ""
    echo -e "${CYAN}💡 Choose tasks based on:${NC}"
    echo "  🔥 High Priority - Critical for project progress"
    echo "  ⚡ Medium Priority - Important features"
    echo "  📝 Low Priority - Nice to have"
    echo ""
}

# タスク詳細を表示
show_task_details() {
    local task_id="$1"
    
    echo -e "${BLUE}📝 Task Details: $task_id${NC}"
    echo "================================"
    
    # タスク基本情報
    local title=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .title" tasks.yaml)
    local priority=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .priority" tasks.yaml)
    local estimate=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .estimate_days" tasks.yaml)
    local category=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .category" tasks.yaml)
    local description=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .description" tasks.yaml)
    local dependencies=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .dependencies[]" tasks.yaml 2>/dev/null | tr '\n' ', ' | sed 's/, $//')
    
    echo -e "${CYAN}Title:${NC} $title"
    echo -e "${CYAN}Priority:${NC} $priority"
    echo -e "${CYAN}Estimate:${NC} $estimate days"
    echo -e "${CYAN}Category:${NC} $category"
    echo -e "${CYAN}Dependencies:${NC} ${dependencies:-'None'}"
    echo -e "${CYAN}Description:${NC} $description"
    echo ""
    
    # Claude Context を表示
    echo -e "${PURPLE}🤖 Claude Context:${NC}"
    echo "-------------------"
    yq eval ".tasks[] | select(.id == \"$task_id\") | .claude_context" tasks.yaml
    echo ""
}

# タスク選択
select_task() {
    while true; do
        read -p "Enter task ID (e.g., TASK-002) or 'list' to see options: " task_input
        
        if [[ "$task_input" == "list" ]]; then
            show_available_tasks
            continue
        fi
        
        # タスクIDの検証
        if [[ ! "$task_input" =~ ^TASK-[0-9]{3}$ ]]; then
            echo -e "${RED}❌ Invalid format. Use TASK-XXX (e.g., TASK-002)${NC}"
            continue
        fi
        
        # タスク存在確認
        local task_exists=$(yq eval ".tasks[] | select(.id == \"$task_input\") | .id" tasks.yaml)
        if [ -z "$task_exists" ]; then
            echo -e "${RED}❌ Task $task_input not found${NC}"
            continue
        fi
        
        # タスク状態確認
        local task_status=$(yq eval ".tasks[] | select(.id == \"$task_input\") | .status" tasks.yaml)
        if [ "$task_status" != "todo" ]; then
            echo -e "${YELLOW}⚠️  Task $task_input is not available (status: $task_status)${NC}"
            read -p "Continue anyway? (y/N): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                continue
            fi
        fi
        
        # 依存関係チェック
        local dependencies=$(yq eval ".tasks[] | select(.id == \"$task_input\") | .dependencies[]?" tasks.yaml 2>/dev/null)
        if [ -n "$dependencies" ]; then
            echo -e "${YELLOW}📋 Checking dependencies...${NC}"
            local unmet_deps=()
            while IFS= read -r dep; do
                if [[ "$dep" =~ ^TASK- ]]; then
                    local dep_status=$(yq eval ".tasks[] | select(.id == \"$dep\") | .status" tasks.yaml 2>/dev/null)
                    if [ "$dep_status" != "done" ] && [ -n "$dep_status" ]; then
                        unmet_deps+=("$dep ($dep_status)")
                    fi
                fi
            done <<< "$dependencies"
            
            if [ ${#unmet_deps[@]} -ne 0 ]; then
                echo -e "${RED}⚠️  Unmet dependencies: ${unmet_deps[*]}${NC}"
                read -p "Continue anyway? (y/N): " confirm
                if [[ ! $confirm =~ ^[Yy]$ ]]; then
                    continue
                fi
            fi
        fi
        
        show_task_details "$task_input"
        read -p "Proceed with this task? (Y/n): " confirm
        if [[ $confirm =~ ^[Nn]$ ]]; then
            continue
        fi
        
        SELECTED_TASK="$task_input"
        break
    done
}

# Worktree作成
create_worktree() {
    local task_id="$1"
    local task_number=$(echo "$task_id" | sed 's/TASK-0*//')
    local task_title=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .title" tasks.yaml)
    local task_slug=$(echo "$task_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    BRANCH_NAME="feature/task-${task_number}-${task_slug}"
    WORKTREE_PATH="../task-${task_number}-${task_slug}"
    
    echo -e "${BLUE}🌿 Creating worktree...${NC}"
    echo "  Task: $task_id"
    echo "  Branch: $BRANCH_NAME"
    echo "  Path: $WORKTREE_PATH"
    echo ""
    
    # 既存worktreeの確認
    if [ -d "$WORKTREE_PATH" ]; then
        echo -e "${YELLOW}⚠️  Worktree already exists${NC}"
        read -p "Remove and recreate? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
            git branch -D "$BRANCH_NAME" 2>/dev/null || true
        else
            echo -e "${GREEN}✅ Using existing worktree${NC}"
            return 0
        fi
    fi
    
    # Worktree作成
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH"
    
    # 初期設定
    cd "$WORKTREE_PATH"
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        npm install --silent
    fi
    
    echo -e "${GREEN}✅ Worktree created successfully${NC}"
}

# タスクステータス更新
update_task_status() {
    local task_id="$1"
    local assignee="${2:-Claude AI}"
    local start_date=$(date '+%Y-%m-%d')
    
    echo -e "${BLUE}📝 Updating task status...${NC}"
    
    # バックアップ作成
    cp tasks.yaml tasks.yaml.backup
    
    # タスクステータス更新
    yq eval "(.tasks[] | select(.id == \"$task_id\") | .status) = \"in_progress\"" -i tasks.yaml
    yq eval "(.tasks[] | select(.id == \"$task_id\") | .assignee) = \"$assignee\"" -i tasks.yaml
    yq eval "(.tasks[] | select(.id == \"$task_id\") | .worktree) = \"$BRANCH_NAME\"" -i tasks.yaml
    yq eval "(.tasks[] | select(.id == \"$task_id\") | .branch) = \"$BRANCH_NAME\"" -i tasks.yaml
    yq eval "(.tasks[] | select(.id == \"$task_id\") | .started_date) = \"$start_date\"" -i tasks.yaml
    
    # Git commit
    git add tasks.yaml
    git commit -m "chore: start TASK-${task_id} - update status to in_progress

Assignee: $assignee
Worktree: $BRANCH_NAME
Started: $start_date

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo -e "${GREEN}✅ Task status updated and committed${NC}"
}

# Claude開始メッセージ生成
generate_claude_message() {
    local task_id="$1"
    
    echo -e "${PURPLE}🤖 Claude Code Session Ready${NC}"
    echo "==============================="
    echo ""
    echo -e "${CYAN}📋 Task Information:${NC}"
    
    local title=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .title" tasks.yaml)
    local priority=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .priority" tasks.yaml)
    local estimate=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .estimate_days" tasks.yaml)
    
    echo "  Task: $task_id - $title"
    echo "  Priority: $priority"
    echo "  Estimate: $estimate days"
    echo "  Workspace: $WORKTREE_PATH"
    echo "  Branch: $BRANCH_NAME"
    echo ""
    
    echo -e "${PURPLE}💬 Copy this message to Claude Code:${NC}"
    echo "-------------------------------------------"
    echo ""
    
    # Claude Context生成
    local claude_context=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .claude_context" tasks.yaml)
    local workspace_root=$(pwd)
    local dependencies=$(yq eval ".tasks[] | select(.id == \"$task_id\") | .dependencies[]?" tasks.yaml 2>/dev/null | tr '\n' ', ' | sed 's/, $//')
    
    cat << EOF
🎯 タスク開始: $task_id - $title

優先度: $priority
推定作業時間: $estimate日

$claude_context

## 🎯 このセッションのゴール
上記のタスクを完了してください。実装・テスト・ドキュメント更新を含みます。

## 📁 ワークスペース情報
- プロジェクトルート: $workspace_root
- 現在のブランチ: $BRANCH_NAME
- 依存タスク: ${dependencies:-'なし'}

質問があれば遠慮なくお聞きください！
EOF
    
    echo ""
    echo "-------------------------------------------"
    echo ""
}

# Claude Code起動案内
show_launch_instructions() {
    echo -e "${GREEN}🚀 Next Steps:${NC}"
    echo ""
    echo "1. 📁 Navigate to worktree:"
    echo "   ${CYAN}cd $WORKTREE_PATH${NC}"
    echo ""
    echo "2. 🤖 Launch Claude Code:"
    echo "   ${CYAN}claude-code --dangerously-skip-permissions${NC}"
    echo ""
    echo "3. 💬 Paste the above message to Claude Code"
    echo ""
    echo "4. ✅ After completion, run:"
    echo "   ${CYAN}../main/scripts/finalize-claude-session.sh $SELECTED_TASK${NC}"
    echo ""
    echo -e "${YELLOW}💡 Remember: Work only in the worktree directory!${NC}"
}

# メイン処理
main() {
    echo -e "${BLUE}🤖 Claude Code + Worktree Session Preparation${NC}"
    echo "==============================================="
    echo ""
    
    check_dependencies
    check_project_root
    
    show_available_tasks
    select_task
    
    create_worktree "$SELECTED_TASK"
    update_task_status "$SELECTED_TASK"
    
    # メインディレクトリに戻る
    cd - > /dev/null
    
    generate_claude_message "$SELECTED_TASK"
    show_launch_instructions
    
    echo ""
    echo -e "${GREEN}🎉 Session preparation complete!${NC}"
    echo -e "${PURPLE}Happy coding with Claude! 🚀${NC}"
}

# スクリプト実行
main "$@"