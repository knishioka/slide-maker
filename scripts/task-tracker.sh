#!/bin/bash

# Google Slides Content Generator - Task Progress Tracker
# Claude Code開発時の進捗を可視化し、完了確認を支援

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
ACTION=$2

# プロジェクトルートディレクトリ
MAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 使用方法表示
show_usage() {
    echo -e "${BLUE}${BOLD}📊 Task Progress Tracker for Claude Code${NC}"
    echo -e "${BLUE}${BOLD}=========================================${NC}"
    echo ""
    echo "Usage: $0 [TASK-ID] [ACTION]"
    echo ""
    echo "Actions:"
    echo "  start      - タスク開始時の進捗トラッキング設定"
    echo "  update     - 現在の進捗状況表示・更新"
    echo "  milestone  - マイルストーン進捗表示"
    echo "  checklist  - 完了確認チェックリスト表示"
    echo "  complete   - タスク完了時の最終確認"
    echo "  summary    - タスクサマリー表示"
    echo ""
    echo "Examples:"
    echo "  $0 TASK-001 start"
    echo "  $0 TASK-001 update"
    echo "  $0 TASK-001 checklist"
}

# 引数チェック
if [ -z "$TASK_ID" ]; then
    show_usage
    exit 1
fi

# タスクIDフォーマットチェック
if [[ ! "$TASK_ID" =~ ^TASK-[0-9]{3}$ ]]; then
    echo -e "${RED}❌ Error: Invalid task ID format. Use TASK-XXX (e.g., TASK-001)${NC}"
    exit 1
fi

# TASKS.mdの存在確認
if [ ! -f "$MAIN_DIR/TASKS.md" ]; then
    echo -e "${RED}❌ Error: TASKS.md not found in $MAIN_DIR${NC}"
    exit 1
fi

cd "$MAIN_DIR"

# タスク情報取得
get_task_info() {
    local task_line=$(grep -n "\[$TASK_ID\]" TASKS.md | head -1)
    if [ -z "$task_line" ]; then
        echo -e "${RED}❌ Error: $TASK_ID not found in TASKS.md${NC}"
        exit 1
    fi
    
    local line_num=$(echo "$task_line" | cut -d: -f1)
    local task_title=$(echo "$task_line" | sed 's/.*\*\*\[TASK-[0-9]\{3\}\]\*\* \(.*\)/\1/' | cut -d' ' -f1-10)
    local task_status="UNKNOWN"
    
    if echo "$task_line" | grep -q "📝.*TODO"; then
        task_status="TODO"
    elif echo "$task_line" | grep -q "🚧.*IN_PROGRESS"; then
        task_status="IN_PROGRESS"
    elif echo "$task_line" | grep -q "✅.*DONE"; then
        task_status="DONE"
    elif echo "$task_line" | grep -q "⏸️.*BLOCKED"; then
        task_status="BLOCKED"
    fi
    
    echo "$line_num:$task_title:$task_status"
}

# プログレスバー表示
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

# タスク開始時の設定
start_task_tracking() {
    local task_info=$(get_task_info)
    local task_title=$(echo "$task_info" | cut -d: -f2)
    local task_status=$(echo "$task_info" | cut -d: -f3)
    
    echo -e "${BLUE}${BOLD}🚀 [$TASK_ID] 開発セッション開始${NC}"
    echo -e "${BLUE}${BOLD}============================${NC}"
    echo ""
    echo -e "${CYAN}📝 タスク名: $task_title${NC}"
    echo -e "${CYAN}📊 現在状況: $task_status${NC}"
    echo -e "${CYAN}⏰ 開始時刻: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    if [ "$task_status" = "TODO" ]; then
        echo -e "${YELLOW}⚠️  このタスクはまだTODO状態です。TASKS.mdでIN_PROGRESSに変更してください。${NC}"
    fi
    
    echo -e "${PURPLE}${BOLD}📋 今回のセッションで実装予定${NC}"
    echo "1. [ ] [具体的な実装項目1を記入]"
    echo "2. [ ] [具体的な実装項目2を記入]"
    echo "3. [ ] [具体的な実装項目3を記入]"
    echo ""
    
    echo -e "${PURPLE}${BOLD}🔗 関連リソース${NC}"
    echo "- TASKS.md: Line $(echo "$task_info" | cut -d: -f1)"
    echo "- Worktree: feature/task-$(echo "$TASK_ID" | tr '[:upper:]' '[:lower:]')-*"
    echo "- Progress Doc: docs/claude-code-progress-tracking.md"
    echo ""
    
    show_milestone_progress
}

# 進捗更新表示
update_progress() {
    local task_info=$(get_task_info)
    local task_title=$(echo "$task_info" | cut -d: -f2)
    local task_status=$(echo "$task_info" | cut -d: -f3)
    
    echo -e "${BLUE}${BOLD}📈 [$TASK_ID] 進捗更新 - $(date '+%H:%M')${NC}"
    echo -e "${BLUE}${BOLD}================================${NC}"
    echo ""
    echo -e "${CYAN}📝 タスク: $task_title${NC}"
    echo -e "${CYAN}📊 ステータス: $task_status${NC}"
    echo ""
    
    # Worktreeの変更確認
    echo -e "${PURPLE}${BOLD}📝 最近の変更${NC}"
    local worktree_changes=$(git status --porcelain 2>/dev/null | wc -l)
    if [ "$worktree_changes" -gt 0 ]; then
        echo -e "${YELLOW}🚧 変更中のファイル: $worktree_changes ファイル${NC}"
        git status --short | head -5
    else
        echo -e "${GREEN}✅ すべての変更がコミット済み${NC}"
    fi
    
    echo ""
    
    # 最近のコミット
    echo -e "${PURPLE}${BOLD}📈 最近のコミット${NC}"
    local recent_commits=$(git log --oneline --since="2 hours ago" | head -3)
    if [ -n "$recent_commits" ]; then
        echo "$recent_commits" | sed 's/^/  /'
    else
        echo "  (最近のコミットなし)"
    fi
    
    echo ""
    echo -e "${PURPLE}${BOLD}✅ 完了した作業 (このセッション)${NC}"
    echo "- [x] [完了項目1を記入]"
    echo "- [x] [完了項目2を記入]"
    echo ""
    
    echo -e "${PURPLE}${BOLD}🚧 現在作業中${NC}"
    echo "- [ ] [現在の作業内容を記入]"
    echo ""
    
    echo -e "${PURPLE}${BOLD}📋 次に予定している作業${NC}"
    echo "- [ ] [次の作業項目1を記入]"
    echo "- [ ] [次の作業項目2を記入]"
    echo ""
    
    # 推定進捗率表示
    echo -e "${PURPLE}${BOLD}📊 推定進捗${NC}"
    local estimated_progress=45  # TODO: 実際の進捗計算ロジック
    echo -ne "${GREEN}"
    show_progress_bar $estimated_progress
    echo -e "${NC}"
    
    echo ""
    show_quick_checklist
}

# マイルストーン進捗表示
show_milestone_progress() {
    echo -e "${PURPLE}${BOLD}🏁 マイルストーン進捗${NC}"
    echo -e "${PURPLE}${BOLD}=================${NC}"
    echo ""
    echo -e "${GREEN}✅ M1: 要件分析完了     ${CYAN}(推定: Day 1)${NC}"
    echo -e "${GREEN}✅ M2: 設計完了         ${CYAN}(推定: Day 2)${NC}"
    echo -e "${YELLOW}🚧 M3: 実装完了         ${CYAN}(推定: Day 4)${NC} ← 現在ここ"
    echo -e "${BLUE}⏸️ M4: テスト完了       ${CYAN}(推定: Day 5)${NC}"
    echo -e "${BLUE}⏸️ M5: リリース準備完了  ${CYAN}(推定: Day 6)${NC}"
    echo ""
}

# クイックチェックリスト表示
show_quick_checklist() {
    echo -e "${YELLOW}${BOLD}🔔 定期確認事項${NC}"
    echo "- [ ] 新しい依存関係は適切に管理されているか？"
    echo "- [ ] エラーハンドリングは実装されているか？"
    echo "- [ ] パフォーマンスへの影響は考慮されているか？"
    echo "- [ ] セキュリティリスクはないか？"
    echo "- [ ] ドキュメントは更新が必要か？"
    echo ""
}

# 完了確認チェックリスト表示
show_completion_checklist() {
    local task_info=$(get_task_info)
    local task_title=$(echo "$task_info" | cut -d: -f2)
    
    echo -e "${GREEN}${BOLD}🎯 [$TASK_ID] 完了確認チェックリスト${NC}"
    echo -e "${GREEN}${BOLD}================================${NC}"
    echo ""
    echo -e "${CYAN}📝 タスク: $task_title${NC}"
    echo ""
    
    echo -e "${PURPLE}${BOLD}✅ 必須項目${NC}"
    echo "- [ ] **機能実装完了**: すべての要件を満たしている"
    echo "- [ ] **テスト完了**: ユニット・統合テストが通過"
    echo "- [ ] **品質確認**: lint、build、security checkが通過"
    echo "- [ ] **ドキュメント**: README、API仕様、コメントが更新"
    echo "- [ ] **TASKS.md更新**: ステータスをDONEに変更"
    echo ""
    
    echo -e "${PURPLE}${BOLD}📋 推奨項目${NC}"
    echo "- [ ] **パフォーマンス**: 性能劣化がないことを確認"
    echo "- [ ] **セキュリティ**: 脆弱性スキャン実施"
    echo "- [ ] **互換性**: 既存機能への影響確認"
    echo "- [ ] **ユーザビリティ**: 使いやすさの確認"
    echo ""
    
    echo -e "${PURPLE}${BOLD}🧹 クリーンアップ${NC}"
    echo "- [ ] **Worktree削除**: 不要なworktreeを削除"
    echo "- [ ] **ブランチクリーンアップ**: マージ済みブランチを削除"
    echo "- [ ] **テンポラリファイル削除**: 作業中ファイルを削除"
    echo ""
    
    echo -e "${RED}${BOLD}🔔 最終確認${NC}"
    echo "上記のすべての項目が完了したら、TASKS.mdで該当タスクを✅DONEに変更してください。"
    echo ""
    
    # 完了支援コマンド表示
    echo -e "${BLUE}${BOLD}🔧 完了支援コマンド${NC}"
    echo "  npm run lint && npm run test && npm run build"
    echo "  ./scripts/complete-task.sh $TASK_ID"
    echo "  git worktree list"
    echo ""
}

# タスク完了時の最終確認
complete_task() {
    local task_info=$(get_task_info)
    local task_title=$(echo "$task_info" | cut -d: -f2)
    local task_status=$(echo "$task_info" | cut -d: -f3)
    
    echo -e "${GREEN}${BOLD}🎉 [$TASK_ID] タスク完了処理${NC}"
    echo -e "${GREEN}${BOLD}========================${NC}"
    echo ""
    echo -e "${CYAN}📝 タスク: $task_title${NC}"
    echo -e "${CYAN}📊 現在ステータス: $task_status${NC}"
    echo ""
    
    if [ "$task_status" != "DONE" ]; then
        echo -e "${YELLOW}⚠️  TASKS.mdのステータスがまだDONEになっていません。${NC}"
        echo -e "${YELLOW}   完了前に必ずステータスを✅DONEに変更してください。${NC}"
        echo ""
    fi
    
    # 最終チェック実行
    echo -e "${BLUE}${BOLD}🔍 最終品質チェック実行中...${NC}"
    
    # Git状況確認
    local uncommitted=$(git status --porcelain | wc -l)
    if [ "$uncommitted" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  未コミットの変更が $uncommitted ファイルあります${NC}"
        git status --short | head -5
    else
        echo -e "${GREEN}✅ すべての変更がコミット済み${NC}"
    fi
    
    # 品質チェック
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📝 Lint チェック...${NC}"
        if npm run lint > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Lint通過${NC}"
        else
            echo -e "${RED}❌ Lint失敗${NC}"
        fi
        
        echo -e "${BLUE}🧪 テスト実行...${NC}"
        if npm run test > /dev/null 2>&1; then
            echo -e "${GREEN}✅ テスト通過${NC}"
        else
            echo -e "${RED}❌ テスト失敗${NC}"
        fi
    fi
    
    echo ""
    
    # 完了サマリー
    echo -e "${GREEN}${BOLD}📊 完了サマリー${NC}"
    echo "  タスクID: $TASK_ID"
    echo "  タスク名: $task_title"
    echo "  完了時刻: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  ステータス: $task_status"
    echo ""
    
    echo -e "${BLUE}${BOLD}🔄 次のステップ${NC}"
    echo "1. TASKS.mdでステータスをDONEに変更（未実施の場合）"
    echo "2. ./scripts/complete-task.sh $TASK_ID でクリーンアップ実行"
    echo "3. 次のタスクを選択して開始"
    echo ""
    
    echo -e "${PURPLE}${BOLD}🎯 お疲れさまでした！${NC}"
}

# タスクサマリー表示
show_task_summary() {
    local task_info=$(get_task_info)
    local task_title=$(echo "$task_info" | cut -d: -f2)
    local task_status=$(echo "$task_info" | cut -d: -f3)
    
    echo -e "${BLUE}${BOLD}📋 [$TASK_ID] タスクサマリー${NC}"
    echo -e "${BLUE}${BOLD}=======================${NC}"
    echo ""
    echo -e "${CYAN}📝 タスク名: $task_title${NC}"
    echo -e "${CYAN}📊 ステータス: $task_status${NC}"
    echo -e "${CYAN}📅 確認時刻: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # TASKS.mdから詳細情報取得
    local line_num=$(echo "$task_info" | cut -d: -f1)
    echo -e "${PURPLE}${BOLD}📋 タスク詳細 (TASKS.md:$line_num)${NC}"
    sed -n "${line_num},$((line_num + 10))p" TASKS.md | head -10
    echo ""
    
    # Worktree状況
    echo -e "${PURPLE}${BOLD}🌿 関連Worktree${NC}"
    local task_pattern=$(echo "$TASK_ID" | tr '[:upper:]' '[:lower:]')
    git worktree list | grep -i "$task_pattern" || echo "  (関連worktree未検出)"
    echo ""
    
    # クイックアクション
    echo -e "${BLUE}${BOLD}🔧 クイックアクション${NC}"
    echo "  開始:   $0 $TASK_ID start"
    echo "  更新:   $0 $TASK_ID update"
    echo "  確認:   $0 $TASK_ID checklist"
    echo "  完了:   $0 $TASK_ID complete"
    echo ""
}

# メイン処理
case "${ACTION:-summary}" in
    "start")
        start_task_tracking
        ;;
    "update")
        update_progress
        ;;
    "milestone")
        show_milestone_progress
        ;;
    "checklist")
        show_completion_checklist
        ;;
    "complete")
        complete_task
        ;;
    "summary")
        show_task_summary
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown action: $ACTION${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac