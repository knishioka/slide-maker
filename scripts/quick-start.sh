#!/bin/bash

# Quick Task Start - Interactive task selection or direct start
# Usage: 
#   ./scripts/quick-start.sh           # Interactive task selection
#   ./scripts/quick-start.sh TASK-XXX  # Direct task start

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

TASK_ID=$1

# インタラクティブタスク選択
select_task_interactive() {
    echo -e "${BLUE}${BOLD}🎯 Quick Task Start${NC}"
    echo -e "${BLUE}==================${NC}"
    echo ""
    
    # TODOタスクの抽出
    local todo_tasks=()
    local task_counter=1
    
    while IFS= read -r line; do
        if echo "$line" | grep -q "📝.*\*\*\[TASK-"; then
            local task_id=$(echo "$line" | grep -o 'TASK-[0-9]\{3\}' || echo "N/A")
            local task_title=$(echo "$line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-8)
            local priority=$(grep -A5 "\*\*\[${task_id}\]" TASKS.md | grep "Priority\*\*:" | sed 's/.*Priority\*\*: \(.*\)/\1/' || echo "Medium")
            
            todo_tasks+=("$task_id:$task_title:$priority")
            
            # 優先度に応じた色分け
            local priority_color=""
            case "$priority" in
                "High") priority_color="${RED}🔥${NC}" ;;
                "Medium") priority_color="${YELLOW}📋${NC}" ;;
                "Low") priority_color="${BLUE}📌${NC}" ;;
                *) priority_color="${CYAN}❓${NC}" ;;
            esac
            
            printf "${BOLD}%2d.${NC} ${priority_color} ${CYAN}%s${NC}: %s\n" \
                "$task_counter" "$task_id" "$task_title"
            
            ((task_counter++))
        fi
    done < TASKS.md
    
    if [ ${#todo_tasks[@]} -eq 0 ]; then
        echo -e "${YELLOW}ℹ️  No TODO tasks available${NC}"
        return 1
    fi
    
    echo ""
    echo -e "${CYAN}q.${NC} Quit without selecting"
    echo ""
    
    # ユーザー入力の処理
    while true; do
        echo -ne "${BOLD}Select a task to start (1-${#todo_tasks[@]}, q to quit): ${NC}"
        read -r choice
        
        case "$choice" in
            q|Q)
                echo -e "${BLUE}👋 Cancelled${NC}"
                return 1
                ;;
            [1-9]|[1-9][0-9])
                if [ "$choice" -ge 1 ] && [ "$choice" -le ${#todo_tasks[@]} ]; then
                    local selected_task=${todo_tasks[$((choice-1))]}
                    local task_id=$(echo "$selected_task" | cut -d: -f1)
                    local task_title=$(echo "$selected_task" | cut -d: -f2)
                    
                    echo ""
                    echo -e "${GREEN}✅ Selected: ${BOLD}$task_id${NC} - $task_title"
                    echo ""
                    
                    # タスク開始
                    start_task "$task_id"
                    return 0
                else
                    echo -e "${RED}❌ Invalid selection. Please choose 1-${#todo_tasks[@]}${NC}"
                fi
                ;;
            *)
                echo -e "${RED}❌ Invalid input. Please enter a number (1-${#todo_tasks[@]}) or q${NC}"
                ;;
        esac
    done
}

# タスク開始関数
start_task() {
    local task_id="$1"
    echo -e "${BLUE}🚀 Starting task: $task_id${NC}"
    
    # タスク開始とworktree作成を一気に実行
    ./scripts/task-start.sh "$task_id" "quick-dev" "$(git config user.name || echo 'Developer')"
    
    echo ""
    echo -e "${GREEN}🎉 Task $task_id started! You are now in the worktree directory.${NC}"
    echo -e "${CYAN}Start coding immediately!${NC}"
}

# メイン処理
if [ -z "$TASK_ID" ]; then
    # 引数なし：インタラクティブ選択
    select_task_interactive
else
    # 引数あり：直接タスク開始
    if ! grep -q "\[$TASK_ID\]" TASKS.md; then
        echo -e "${RED}❌ Task $TASK_ID not found in TASKS.md${NC}"
        echo ""
        echo "Available tasks:"
        grep "📝.*\*\*\[TASK-" TASKS.md | head -5
        exit 1
    fi
    
    start_task "$TASK_ID"
fi