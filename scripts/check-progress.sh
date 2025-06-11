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
    local todo_count=$(grep -c "📝.*TODO" TASKS.md 2>/dev/null || echo "0")
    local in_progress_count=$(grep -c "🚧.*IN_PROGRESS" TASKS.md 2>/dev/null || echo "0")
    local blocked_count=$(grep -c "⏸️.*BLOCKED" TASKS.md 2>/dev/null || echo "0")
    local done_count=$(grep -c "✅.*DONE" TASKS.md 2>/dev/null || echo "0")
    local cancelled_count=$(grep -c "❌.*CANCELLED" TASKS.md 2>/dev/null || echo "0")
    
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
    grep -n "🚧.*IN_PROGRESS" TASKS.md | head -10 | while read -r line; do
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
    grep -n "⏸️.*BLOCKED" TASKS.md | while read -r line; do
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
recent_done=$(grep -n "✅.*DONE" TASKS.md | tail -5)
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
high_priority=$(grep -c "Priority.*High" TASKS.md 2>/dev/null || echo "0")
medium_priority=$(grep -c "Priority.*Medium" TASKS.md 2>/dev/null || echo "0")
low_priority=$(grep -c "Priority.*Low" TASKS.md 2>/dev/null || echo "0")

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
            if echo "$line" | grep -q "TODO\|IN_PROGRESS"; then
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
echo "  ./scripts/start-task.sh TASK-XXX 'task-name'  # Start new task"
echo "  ./scripts/complete-task.sh TASK-XXX           # Complete task"
echo ""
echo -e "${BLUE}Worktree Management:${NC}"
echo "  ./scripts/manage-worktrees.sh list            # List worktrees"
echo "  ./scripts/manage-worktrees.sh status          # Detailed status"
echo "  ./scripts/manage-worktrees.sh clean TASK-XXX  # Clean worktree"
echo ""
echo -e "${BLUE}Quality Checks:${NC}"
echo "  npm run lint && npm run test                   # Run quality checks"
echo "  git status                                     # Check git status"
echo ""

echo -e "${GREEN}${BOLD}📊 Report Complete${NC}"
echo ""