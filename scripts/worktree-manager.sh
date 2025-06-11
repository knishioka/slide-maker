#!/bin/bash

# Google Slides Content Generator - Worktree Management Script
# worktreeの管理、統合、クリーンアップを行うユーティリティスクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

PROJECT_NAME="slide-maker"

# 使用方法表示
show_usage() {
    echo -e "${BLUE}🛠️  Google Slides Content Generator - Worktree Manager${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list                    - List all worktrees"
    echo "  status                  - Show status of all worktrees"
    echo "  sync [worktree]         - Sync worktree with develop branch"
    echo "  sync-all                - Sync all worktrees with develop"
    echo "  clean [worktree]        - Remove specific worktree"
    echo "  clean-all               - Remove all worktrees (confirmation required)"
    echo "  integrate [worktree]    - Create PR for worktree integration"
    echo "  update                  - Update main project dependencies"
    echo "  check-conflicts         - Check for potential merge conflicts"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 status"
    echo "  $0 sync core-services"
    echo "  $0 integrate ui"
    echo "  $0 clean mermaid"
}

# worktree一覧表示
list_worktrees() {
    echo -e "${BLUE}📋 Current worktrees:${NC}"
    git worktree list
}

# 全worktreeのステータス表示
show_status() {
    echo -e "${BLUE}📊 Worktree status summary:${NC}"
    
    # メインプロジェクトのステータス
    echo -e "\n${PURPLE}📁 Main Project:${NC}"
    git status --short
    
    # 各worktreeのステータス
    git worktree list --porcelain | grep worktree | while read -r line; do
        worktree_path=$(echo "$line" | sed 's/worktree //')
        worktree_name=$(basename "$worktree_path")
        
        if [ -d "$worktree_path" ]; then
            echo -e "\n${PURPLE}📁 ${worktree_name}:${NC}"
            cd "$worktree_path"
            
            # ブランチ情報
            branch=$(git branch --show-current)
            echo -e "   Branch: ${YELLOW}${branch}${NC}"
            
            # 変更状況
            status_output=$(git status --short)
            if [ -z "$status_output" ]; then
                echo -e "   Status: ${GREEN}Clean${NC}"
            else
                echo -e "   Status: ${YELLOW}Modified files detected${NC}"
                echo "$status_output" | sed 's/^/   /'
            fi
            
            # コミット状況
            commits_ahead=$(git rev-list --count HEAD ^origin/"$branch" 2>/dev/null || echo "0")
            commits_behind=$(git rev-list --count origin/"$branch" ^HEAD 2>/dev/null || echo "0")
            
            if [ "$commits_ahead" -gt 0 ]; then
                echo -e "   ${GREEN}↑ $commits_ahead commits ahead${NC}"
            fi
            if [ "$commits_behind" -gt 0 ]; then
                echo -e "   ${YELLOW}↓ $commits_behind commits behind${NC}"
            fi
        fi
    done
}

# worktreeを最新のdevelopと同期
sync_worktree() {
    local worktree_name=$1
    
    if [ -z "$worktree_name" ]; then
        echo -e "${RED}❌ Error: Worktree name required${NC}"
        echo "Usage: $0 sync [worktree-name]"
        return 1
    fi
    
    local worktree_path="../${PROJECT_NAME}-${worktree_name}"
    
    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}❌ Error: Worktree not found: ${worktree_path}${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Syncing worktree: ${worktree_name}${NC}"
    
    cd "$worktree_path"
    
    # 現在のブランチを保存
    current_branch=$(git branch --show-current)
    
    # 変更がある場合は警告
    if ! git diff --quiet; then
        echo -e "${YELLOW}⚠️  Uncommitted changes detected. Stashing...${NC}"
        git stash push -m "Auto-stash before sync $(date)"
    fi
    
    # developブランチの最新を取得
    echo -e "${BLUE}📥 Fetching latest develop branch...${NC}"
    git fetch origin develop
    
    # developブランチとマージ
    echo -e "${BLUE}🔀 Merging with develop...${NC}"
    git merge origin/develop
    
    # stashがある場合は復元
    if git stash list | grep -q "Auto-stash before sync"; then
        echo -e "${BLUE}📤 Restoring stashed changes...${NC}"
        git stash pop
    fi
    
    echo -e "${GREEN}✅ Sync completed for: ${worktree_name}${NC}"
}

# 全worktreeを同期
sync_all_worktrees() {
    echo -e "${BLUE}🔄 Syncing all worktrees with develop...${NC}"
    
    git worktree list --porcelain | grep worktree | while read -r line; do
        worktree_path=$(echo "$line" | sed 's/worktree //')
        worktree_name=$(basename "$worktree_path")
        
        # メインプロジェクトはスキップ
        if [[ "$worktree_name" != "main" && "$worktree_name" != *"${PROJECT_NAME}"* ]]; then
            continue
        fi
        
        # slide-maker-プレフィックスを削除してworktree名を取得
        clean_name=$(echo "$worktree_name" | sed "s/${PROJECT_NAME}-//")
        
        echo -e "\n${PURPLE}📁 Processing: ${clean_name}${NC}"
        sync_worktree "$clean_name"
    done
}

# worktreeを削除
clean_worktree() {
    local worktree_name=$1
    
    if [ -z "$worktree_name" ]; then
        echo -e "${RED}❌ Error: Worktree name required${NC}"
        echo "Usage: $0 clean [worktree-name]"
        return 1
    fi
    
    local worktree_path="../${PROJECT_NAME}-${worktree_name}"
    
    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}❌ Error: Worktree not found: ${worktree_path}${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  This will remove the worktree: ${worktree_name}${NC}"
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️  Removing worktree: ${worktree_name}${NC}"
        git worktree remove "$worktree_path" --force
        echo -e "${GREEN}✅ Removed: ${worktree_name}${NC}"
    else
        echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
    fi
}

# 全worktreeを削除
clean_all_worktrees() {
    echo -e "${RED}⚠️  WARNING: This will remove ALL worktrees!${NC}"
    echo -e "${YELLOW}This action cannot be undone.${NC}"
    read -p "Type 'CONFIRM' to proceed: " confirm
    
    if [ "$confirm" = "CONFIRM" ]; then
        echo -e "${BLUE}🗑️  Removing all worktrees...${NC}"
        
        git worktree list --porcelain | grep worktree | while read -r line; do
            worktree_path=$(echo "$line" | sed 's/worktree //')
            worktree_name=$(basename "$worktree_path")
            
            # メインプロジェクトはスキップ
            if [[ "$worktree_path" != *"${PROJECT_NAME}-"* ]]; then
                continue
            fi
            
            echo -e "${BLUE}  Removing: ${worktree_name}${NC}"
            git worktree remove "$worktree_path" --force
        done
        
        echo -e "${GREEN}✅ All worktrees removed${NC}"
    else
        echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
    fi
}

# PR作成支援
integrate_worktree() {
    local worktree_name=$1
    
    if [ -z "$worktree_name" ]; then
        echo -e "${RED}❌ Error: Worktree name required${NC}"
        echo "Usage: $0 integrate [worktree-name]"
        return 1
    fi
    
    local worktree_path="../${PROJECT_NAME}-${worktree_name}"
    
    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}❌ Error: Worktree not found: ${worktree_path}${NC}"
        return 1
    fi
    
    cd "$worktree_path"
    
    current_branch=$(git branch --show-current)
    
    echo -e "${BLUE}🔍 Checking worktree status for integration...${NC}"
    
    # 変更がコミットされているかチェック
    if ! git diff --quiet; then
        echo -e "${YELLOW}⚠️  Uncommitted changes detected. Please commit first.${NC}"
        git status --short
        return 1
    fi
    
    # リモートにプッシュ
    echo -e "${BLUE}📤 Pushing to remote...${NC}"
    git push origin "$current_branch"
    
    # PR作成のためのコマンド表示
    echo -e "${GREEN}✅ Ready for integration!${NC}"
    echo -e "\n${BLUE}💡 Next steps:${NC}"
    echo "1. Create a Pull Request on GitHub:"
    echo "   From: $current_branch"
    echo "   To: develop"
    echo ""
    echo "2. Or use GitHub CLI:"
    echo "   gh pr create --base develop --title \"feat: implement $worktree_name\" --body \"Implementation of $worktree_name feature\""
    echo ""
    echo "3. Review checklist:"
    echo "   - [ ] All tests pass"
    echo "   - [ ] Code follows style guidelines"
    echo "   - [ ] Documentation updated"
    echo "   - [ ] No breaking changes"
}

# 競合チェック
check_conflicts() {
    echo -e "${BLUE}🔍 Checking for potential conflicts...${NC}"
    
    # 各worktreeで変更されたファイルを収集
    declare -A changed_files
    
    git worktree list --porcelain | grep worktree | while read -r line; do
        worktree_path=$(echo "$line" | sed 's/worktree //')
        worktree_name=$(basename "$worktree_path")
        
        if [ -d "$worktree_path" ]; then
            cd "$worktree_path"
            
            # ステージされた変更とコミット済み変更を取得
            files=$(git diff --name-only HEAD origin/develop 2>/dev/null || true)
            
            if [ -n "$files" ]; then
                echo -e "\n${PURPLE}📁 ${worktree_name}:${NC}"
                echo "$files" | sed 's/^/   /'
            fi
        fi
    done
}

# プロジェクト依存関係更新
update_dependencies() {
    echo -e "${BLUE}📦 Updating project dependencies...${NC}"
    
    # メインプロジェクト
    echo -e "${PURPLE}📁 Main project:${NC}"
    npm update
    
    # 各worktree
    git worktree list --porcelain | grep worktree | while read -r line; do
        worktree_path=$(echo "$line" | sed 's/worktree //')
        worktree_name=$(basename "$worktree_path")
        
        if [ -d "$worktree_path" ] && [ -f "$worktree_path/package.json" ]; then
            echo -e "\n${PURPLE}📁 ${worktree_name}:${NC}"
            cd "$worktree_path"
            npm update
        fi
    done
    
    echo -e "${GREEN}✅ Dependencies updated${NC}"
}

# メイン処理
case "${1:-}" in
    "list")
        list_worktrees
        ;;
    "status")
        show_status
        ;;
    "sync")
        sync_worktree "$2"
        ;;
    "sync-all")
        sync_all_worktrees
        ;;
    "clean")
        clean_worktree "$2"
        ;;
    "clean-all")
        clean_all_worktrees
        ;;
    "integrate")
        integrate_worktree "$2"
        ;;
    "update")
        update_dependencies
        ;;
    "check-conflicts")
        check_conflicts
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac