#!/bin/bash

# Google Slides Content Generator - Progress Check Script
# プロジェクト進捗の可視化とタスク状況レポート

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

# プロジェクトルートディレクトリ
MAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# TASKS.mdの存在確認
if [ ! -f "$MAIN_DIR/TASKS.md" ]; then
    echo -e "${RED}❌ Error: TASKS.md not found in $MAIN_DIR${NC}"
    exit 1
fi

cd "$MAIN_DIR"

# ヘッダー表示
echo -e "${BLUE}${BOLD}📊 Google Slides Content Generator - Progress Report${NC}"
echo -e "${BLUE}${BOLD}=================================================${NC}"
echo ""
echo -e "${CYAN}📅 Report Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${CYAN}📁 Project Root: $MAIN_DIR${NC}"
echo ""

# タスク統計の計算
calculate_stats() {
    local todo_count=$(grep -c "📝.*\*\*\[TASK-" TASKS.md 2>/dev/null | tr -d '\n' || echo "0")
    local in_progress_count=$(grep -c "🚧.*\*\*\[TASK-" TASKS.md 2>/dev/null | tr -d '\n' || echo "0")
    local blocked_count=$(grep -c "⏸️.*\*\*\[TASK-" TASKS.md 2>/dev/null | tr -d '\n' || echo "0")
    local done_count=$(grep -c "✅.*\*\*\[TASK-" TASKS.md 2>/dev/null | tr -d '\n' || echo "0")
    local cancelled_count=$(grep -c "❌.*\*\*\[TASK-" TASKS.md 2>/dev/null | tr -d '\n' || echo "0")
    
    # 変数が空の場合は0にセット
    [ -z "$todo_count" ] && todo_count=0
    [ -z "$in_progress_count" ] && in_progress_count=0
    [ -z "$blocked_count" ] && blocked_count=0
    [ -z "$done_count" ] && done_count=0
    [ -z "$cancelled_count" ] && cancelled_count=0
    
    local total_count=$((todo_count + in_progress_count + blocked_count + done_count + cancelled_count))
    
    echo "$todo_count:$in_progress_count:$blocked_count:$done_count:$cancelled_count:$total_count"
}

# 統計情報取得
STATS=$(calculate_stats)
TODO_COUNT=$(echo "$STATS" | cut -d: -f1)
IN_PROGRESS_COUNT=$(echo "$STATS" | cut -d: -f2)
BLOCKED_COUNT=$(echo "$STATS" | cut -d: -f3)
DONE_COUNT=$(echo "$STATS" | cut -d: -f4)
CANCELLED_COUNT=$(echo "$STATS" | cut -d: -f5)
TOTAL_COUNT=$(echo "$STATS" | cut -d: -f6)

# 完了率計算
COMPLETION_RATE=0
if [ "$TOTAL_COUNT" -gt 0 ]; then
    COMPLETION_RATE=$(( (DONE_COUNT * 100) / TOTAL_COUNT ))
fi

# 進捗バー表示
show_progress_bar() {
    local percentage=$1
    local width=40
    local filled=$((percentage * width / 100))
    local empty=$((width - filled))
    
    printf "["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "] %d%%\n" $percentage
}

# メイン統計表示
echo -e "${PURPLE}${BOLD}📈 Project Statistics${NC}"
echo -e "${PURPLE}===================${NC}"
echo ""
echo -e "${BLUE}Total Tasks: ${BOLD}$TOTAL_COUNT${NC}"
echo -e "${GREEN}✅ Completed: $DONE_COUNT${NC}"
echo -e "${YELLOW}🚧 In Progress: $IN_PROGRESS_COUNT${NC}"
echo -e "${CYAN}📝 Todo: $TODO_COUNT${NC}"
echo -e "${RED}⏸️ Blocked: $BLOCKED_COUNT${NC}"
echo -e "${RED}❌ Cancelled: $CANCELLED_COUNT${NC}"
echo ""
echo -e "${BOLD}Progress: ${NC}"
echo -ne "${GREEN}"
show_progress_bar $COMPLETION_RATE
echo -e "${NC}"

# アクティブタスク表示
echo ""
echo -e "${PURPLE}${BOLD}🚧 Active Tasks${NC}"
echo -e "${PURPLE}===============${NC}"
if [ "$IN_PROGRESS_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No tasks currently in progress${NC}"
else
    echo ""
    grep -n "🚧.*\*\*\[TASK-" TASKS.md | head -10 | while read -r line; do
        task_line=$(echo "$line" | sed 's/^[0-9]*://')
        task_id=$(echo "$task_line" | grep -o 'TASK-[0-9]\{3\}' || echo "N/A")
        task_title=$(echo "$task_line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-5)
        echo -e "  ${YELLOW}🚧 ${task_id}${NC}: $task_title"
    done
fi

# ブロックされたタスク表示
echo ""
echo -e "${PURPLE}${BOLD}⏸️ Blocked Tasks${NC}"
echo -e "${PURPLE}=================${NC}"
if [ "$BLOCKED_COUNT" -eq 0 ]; then
    echo -e "${GREEN}ℹ️  No blocked tasks${NC}"
else
    echo ""
    grep -n "⏸️.*\*\*\[TASK-" TASKS.md | while read -r line; do
        task_line=$(echo "$line" | sed 's/^[0-9]*://')
        task_id=$(echo "$task_line" | grep -o 'TASK-[0-9]\{3\}' || echo "N/A")
        task_title=$(echo "$task_line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-5)
        echo -e "  ${RED}⏸️ ${task_id}${NC}: $task_title"
    done
fi

# 最近完了したタスク
echo ""
echo -e "${PURPLE}${BOLD}✅ Recently Completed Tasks${NC}"
echo -e "${PURPLE}===========================${NC}"
recent_done=$(grep -n "✅.*\*\*\[TASK-" TASKS.md | tail -5)
if [ -z "$recent_done" ]; then
    echo -e "${YELLOW}ℹ️  No completed tasks yet${NC}"
else
    echo ""
    echo "$recent_done" | while read -r line; do
        task_line=$(echo "$line" | sed 's/^[0-9]*://')
        task_id=$(echo "$task_line" | grep -o 'TASK-[0-9]\{3\}' || echo "N/A")
        task_title=$(echo "$task_line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-5)
        echo -e "  ${GREEN}✅ ${task_id}${NC}: $task_title"
    done
fi

# Worktree状況
echo ""
echo -e "${PURPLE}${BOLD}🌿 Worktree Status${NC}"
echo -e "${PURPLE}==================${NC}"
worktree_list=$(git worktree list 2>/dev/null || echo "")
if [ -z "$worktree_list" ]; then
    echo -e "${YELLOW}ℹ️  No worktrees found${NC}"
else
    echo ""
    active_worktrees=0
    echo "$worktree_list" | while read -r worktree; do
        path=$(echo "$worktree" | awk '{print $1}')
        branch=$(echo "$worktree" | sed 's/.*\[\(.*\)\].*/\1/' | grep -v "detached" || echo "main")
        
        if [[ "$path" != *"main"* ]] && [[ "$branch" != "main" ]]; then
            active_worktrees=$((active_worktrees + 1))
            worktree_name=$(basename "$path")
            echo -e "  ${BLUE}🌿 ${worktree_name}${NC} (${branch})"
            
            # 各worktreeの状況チェック
            if [ -d "$path" ]; then
                cd "$path"
                uncommitted=$(git status --porcelain | wc -l)
                if [ "$uncommitted" -gt 0 ]; then
                    echo -e "    ${YELLOW}⚠️  $uncommitted uncommitted changes${NC}"
                else
                    echo -e "    ${GREEN}✅ Clean${NC}"
                fi
                cd "$MAIN_DIR"
            fi
        fi
    done
    
    # アクティブなworktree数が0の場合
    if ! echo "$worktree_list" | grep -q -v "main\|bare"; then
        echo -e "${GREEN}ℹ️  No active development worktrees${NC}"
    fi
fi

# 優先度別タスク分析
echo ""
echo -e "${PURPLE}${BOLD}📊 Priority Analysis${NC}"
echo -e "${PURPLE}====================${NC}"
high_priority=$(grep -c "Priority\*\*: High" TASKS.md 2>/dev/null || echo "0")
medium_priority=$(grep -c "Priority\*\*: Medium" TASKS.md 2>/dev/null || echo "0")
low_priority=$(grep -c "Priority\*\*: Low" TASKS.md 2>/dev/null || echo "0")

echo ""
echo -e "${RED}🔥 High Priority: $high_priority tasks${NC}"
echo -e "${YELLOW}📋 Medium Priority: $medium_priority tasks${NC}"
echo -e "${BLUE}📌 Low Priority: $low_priority tasks${NC}"

# 推定作業時間の集計
echo ""
echo -e "${PURPLE}${BOLD}⏱️ Time Estimation${NC}"
echo -e "${PURPLE}==================${NC}"
total_days=0
remaining_days=0

# 簡単な推定時間抽出（例: "Estimate: 5 days"）
while read -r line; do
    if echo "$line" | grep -q "Estimate:.*days"; then
        days=$(echo "$line" | sed 's/.*Estimate: \([0-9]\+\) days.*/\1/')
        if [[ "$days" =~ ^[0-9]+$ ]]; then
            total_days=$((total_days + days))
            # TODOとIN_PROGRESSのタスクのみカウント
            if echo "$line" | grep -q "📝\|🚧"; then
                remaining_days=$((remaining_days + days))
            fi
        fi
    fi
done < TASKS.md

echo ""
echo -e "${BLUE}📅 Total Estimated Days: $total_days${NC}"
echo -e "${YELLOW}📅 Remaining Days: $remaining_days${NC}"
if [ "$total_days" -gt 0 ]; then
    completed_days=$((total_days - remaining_days))
    time_completion_rate=$(( (completed_days * 100) / total_days ))
    echo -e "${GREEN}📅 Time Progress: $time_completion_rate%${NC}"
fi

# 推奨アクション
echo ""
echo -e "${PURPLE}${BOLD}💡 Recommendations${NC}"
echo -e "${PURPLE}==================${NC}"
echo ""

if [ "$IN_PROGRESS_COUNT" -eq 0 ] && [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}📝 Consider starting a new task from the TODO list${NC}"
fi

if [ "$BLOCKED_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  Review blocked tasks and resolve dependencies${NC}"
fi

if [ "$IN_PROGRESS_COUNT" -gt 3 ]; then
    echo -e "${YELLOW}⚠️  Many tasks in progress - consider focusing on completion${NC}"
fi

if [ "$COMPLETION_RATE" -ge 75 ]; then
    echo -e "${GREEN}🎉 Great progress! Project is nearing completion${NC}"
elif [ "$COMPLETION_RATE" -ge 50 ]; then
    echo -e "${BLUE}👍 Good progress! Keep up the momentum${NC}"
elif [ "$COMPLETION_RATE" -ge 25 ]; then
    echo -e "${YELLOW}📈 Making progress - consider prioritizing high-impact tasks${NC}"
else
    echo -e "${CYAN}🚀 Project is in early stages - establish development rhythm${NC}"
fi

# クイックアクション
echo ""
echo -e "${PURPLE}${BOLD}🔧 Quick Actions${NC}"
echo -e "${PURPLE}===============${NC}"
echo ""
echo -e "${BLUE}Task Management:${NC}"
echo "  ./scripts/task-start.sh TASK-XXX 'task-name'  # Start new task"
echo "  ./scripts/task-complete.sh TASK-XXX           # Complete task"
echo ""
echo -e "${BLUE}Worktree Management:${NC}"
echo "  ./scripts/worktree-manager.sh list            # List worktrees"
echo "  ./scripts/worktree-manager.sh status          # Detailed status"
echo "  ./scripts/worktree-manager.sh clean TASK-XXX  # Clean worktree"
echo ""
echo -e "${BLUE}Quality Checks:${NC}"
echo "  npm run lint && npm run test                   # Run quality checks"
echo "  git status                                     # Check git status"
echo ""

# インタラクティブタスク選択機能
show_interactive_menu() {
    echo ""
    echo -e "${PURPLE}${BOLD}🎯 Interactive Task Selection${NC}"
    echo -e "${PURPLE}=============================${NC}"
    echo ""
    
    # TODOタスクの抽出
    local todo_tasks=()
    local task_counter=1
    
    while IFS= read -r line; do
        if echo "$line" | grep -q "📝.*\*\*\[TASK-"; then
            local task_id=$(echo "$line" | grep -o 'TASK-[0-9]\{3\}' || echo "N/A")
            local task_title=$(echo "$line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-8)
            local priority=$(grep -A5 "\*\*\[${task_id}\]" TASKS.md | grep "Priority\*\*:" | sed 's/.*Priority\*\*: \(.*\)/\1/' || echo "Medium")
            local estimate=$(grep -A5 "\*\*\[${task_id}\]" TASKS.md | grep "Estimate\*\*:" | sed 's/.*Estimate\*\*: \(.*\)/\1/' || echo "Unknown")
            
            todo_tasks+=("$task_id:$task_title:$priority:$estimate")
            
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
            printf "     📊 Priority: %s | ⏱️  Estimate: %s\n" "$priority" "$estimate"
            echo ""
            
            ((task_counter++))
        fi
    done < TASKS.md
    
    if [ ${#todo_tasks[@]} -eq 0 ]; then
        echo -e "${YELLOW}ℹ️  No TODO tasks available${NC}"
        return
    fi
    
    echo -e "${BOLD}Available options:${NC}"
    echo -e "${CYAN}0.${NC} View detailed task information"
    echo -e "${CYAN}q.${NC} Quit without selecting"
    echo ""
    
    # ユーザー入力の処理
    while true; do
        echo -ne "${BOLD}Select a task to start (1-${#todo_tasks[@]}, 0 for details, q to quit): ${NC}"
        read -r choice
        
        case "$choice" in
            q|Q)
                echo -e "${BLUE}👋 Exiting task selection${NC}"
                return
                ;;
            0)
                show_detailed_task_info "${todo_tasks[@]}"
                ;;
            [1-9]|[1-9][0-9])
                if [ "$choice" -ge 1 ] && [ "$choice" -le ${#todo_tasks[@]} ]; then
                    local selected_task=${todo_tasks[$((choice-1))]}
                    local task_id=$(echo "$selected_task" | cut -d: -f1)
                    local task_title=$(echo "$selected_task" | cut -d: -f2)
                    
                    echo ""
                    echo -e "${GREEN}✅ Selected: ${BOLD}$task_id${NC} - $task_title"
                    echo ""
                    
                    # タスク開始の確認
                    echo -ne "${BOLD}Start this task and create worktree? (y/N): ${NC}"
                    read -r confirm
                    
                    if [[ "$confirm" =~ ^[Yy]$ ]]; then
                        start_selected_task "$task_id" "$task_title"
                    else
                        echo -e "${YELLOW}Task selection cancelled${NC}"
                    fi
                    return
                else
                    echo -e "${RED}❌ Invalid selection. Please choose 1-${#todo_tasks[@]}${NC}"
                fi
                ;;
            *)
                echo -e "${RED}❌ Invalid input. Please enter a number (1-${#todo_tasks[@]}), 0, or q${NC}"
                ;;
        esac
    done
}

# 詳細タスク情報表示
show_detailed_task_info() {
    local tasks=("$@")
    echo ""
    echo -e "${PURPLE}${BOLD}📋 Detailed Task Information${NC}"
    echo -e "${PURPLE}============================${NC}"
    
    for i in "${!tasks[@]}"; do
        local task_info=${tasks[$i]}
        local task_id=$(echo "$task_info" | cut -d: -f1)
        local task_title=$(echo "$task_info" | cut -d: -f2)
        local priority=$(echo "$task_info" | cut -d: -f3)
        local estimate=$(echo "$task_info" | cut -d: -f4)
        
        echo ""
        echo -e "${BOLD}$((i+1)). $task_id${NC}: $task_title"
        
        # TASKS.mdから詳細情報を抽出
        local description=$(grep -A10 "\*\*\[$task_id\]" TASKS.md | grep "Description\*\*:" | sed 's/.*Description\*\*: \(.*\)/\1/' || echo "No description available")
        local dependencies=$(grep -A10 "\*\*\[$task_id\]" TASKS.md | grep "Dependencies\*\*:" | sed 's/.*Dependencies\*\*: \(.*\)/\1/' || echo "None")
        
        echo -e "   📝 ${BOLD}Description:${NC} $description"
        echo -e "   🔗 ${BOLD}Dependencies:${NC} $dependencies"
        echo -e "   📊 ${BOLD}Priority:${NC} $priority"
        echo -e "   ⏱️  ${BOLD}Estimate:${NC} $estimate"
    done
    
    echo ""
    echo -ne "${BOLD}Press Enter to return to task selection...${NC}"
    read -r
}

# 選択されたタスクの開始処理
start_selected_task() {
    local task_id="$1"
    local task_title="$2"
    
    echo ""
    echo -e "${BLUE}${BOLD}🚀 Starting Task: $task_id${NC}"
    echo -e "${BLUE}${BOLD}===========================================${NC}"
    
    # Worktreeブランチ名の生成
    local branch_name="feature/$(echo "$task_id" | tr '[:upper:]' '[:lower:]')-$(echo "$task_title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-20)"
    local worktree_path="../$branch_name"
    
    echo -e "${CYAN}📂 Worktree Path: $worktree_path${NC}"
    echo -e "${CYAN}🌿 Branch Name: $branch_name${NC}"
    echo ""
    
    # task-start.sh スクリプトが存在する場合は使用
    if [ -f "$MAIN_DIR/scripts/task-start.sh" ]; then
        echo -e "${BLUE}📋 Using task-start.sh script...${NC}"
        "$MAIN_DIR/scripts/task-start.sh" "$task_id" "$task_title"
    else
        # 手動でworktree作成
        echo -e "${BLUE}🌿 Creating worktree...${NC}"
        if git worktree add -b "$branch_name" "$worktree_path"; then
            echo -e "${GREEN}✅ Worktree created successfully${NC}"
            echo ""
            echo -e "${BOLD}Next steps:${NC}"
            echo -e "1. ${CYAN}cd $worktree_path${NC}"
            echo -e "2. Update TASKS.md to mark $task_id as IN_PROGRESS"
            echo -e "3. Start development"
            echo ""
        else
            echo -e "${RED}❌ Failed to create worktree${NC}"
            return 1
        fi
    fi
    
    # 進捗トラッキングスクリプトが存在する場合は実行
    if [ -f "$MAIN_DIR/scripts/task-tracker.sh" ]; then
        echo -e "${BLUE}📊 Starting progress tracking...${NC}"
        "$MAIN_DIR/scripts/task-tracker.sh" "$task_id" start
    fi
    
    echo -e "${GREEN}${BOLD}🎉 Task $task_id is ready to start!${NC}"
}

# メインメニューの表示
show_main_menu() {
    echo ""
    echo -e "${PURPLE}${BOLD}🎯 What would you like to do?${NC}"
    echo -e "${PURPLE}==============================${NC}"
    echo ""
    echo -e "${CYAN}1.${NC} Start a new task (interactive selection)"
    echo -e "${CYAN}2.${NC} View detailed report only"
    echo -e "${CYAN}3.${NC} Manage existing worktrees"
    echo -e "${CYAN}q.${NC} Quit"
    echo ""
    
    while true; do
        echo -ne "${BOLD}Choose an option (1-3, q): ${NC}"
        read -r choice
        
        case "$choice" in
            1)
                show_interactive_menu
                return
                ;;
            2)
                echo -e "${BLUE}📊 Report completed. Run the script again for interactive features.${NC}"
                return
                ;;
            3)
                if [ -f "$MAIN_DIR/scripts/worktree-manager.sh" ]; then
                    "$MAIN_DIR/scripts/worktree-manager.sh" status
                else
                    echo -e "${YELLOW}⚠️  Worktree management script not found${NC}"
                    git worktree list
                fi
                return
                ;;
            q|Q)
                echo -e "${BLUE}👋 Goodbye!${NC}"
                return
                ;;
            *)
                echo -e "${RED}❌ Invalid choice. Please enter 1-3 or q${NC}"
                ;;
        esac
    done
}

echo -e "${GREEN}${BOLD}📊 Report Complete${NC}"

# コマンドライン引数をチェック
if [ "$1" = "--interactive" ] || [ "$1" = "-i" ]; then
    show_main_menu
elif [ "$#" -eq 0 ]; then
    # 引数なしの場合はインタラクティブメニューを表示
    show_main_menu
fi

echo ""