#!/bin/bash

# Google Slides Content Generator - Development Aliases Setup
# 開発用エイリアスとショートカットの設定

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

MAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔧 Setting up development aliases...${NC}"

# エイリアス定義
setup_aliases() {
    local shell_config=""
    
    # シェル設定ファイルを判定
    if [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_config="$HOME/.bashrc"
        [ -f "$HOME/.bash_profile" ] && shell_config="$HOME/.bash_profile"
    else
        echo -e "${YELLOW}⚠️  Unknown shell, please add aliases manually${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📝 Adding aliases to: $shell_config${NC}"
    
    # エイリアス追加
    cat >> "$shell_config" << EOF

# Google Slides Content Generator - Development Aliases
# Generated: $(date)

# Project status and quick start
alias slides-status='$MAIN_DIR/scripts/project-status.sh'
alias slides-start='$MAIN_DIR/scripts/quick-start.sh'

# Task management with auto-cd
alias task-done='function _task_done() { 
    current_dir=\$(pwd)
    $MAIN_DIR/scripts/task-complete.sh "\$1"
    if [[ \$current_dir == */task-* ]]; then
        cd "$MAIN_DIR"
        echo "📁 Auto-moved to main directory"
    fi
}; _task_done'

# Quick navigation
alias slides-main='cd "$MAIN_DIR"'
alias slides-scripts='cd "$MAIN_DIR/scripts"'

# Development helpers
alias slides-lint='cd "$MAIN_DIR" && npm run lint'
alias slides-test='cd "$MAIN_DIR" && npm run test'
alias slides-build='cd "$MAIN_DIR" && npm run lint && npm run test'

EOF

    echo -e "${GREEN}✅ Aliases added successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Available aliases:${NC}"
    echo "  slides-status    # Project progress"
    echo "  slides-start     # Quick task start"
    echo "  task-done TASK-X # Complete task + auto cd to main"
    echo "  slides-main      # Navigate to main directory"
    echo "  slides-scripts   # Navigate to scripts directory"
    echo "  slides-lint      # Run lint"
    echo "  slides-test      # Run tests"
    echo "  slides-build     # Run full quality checks"
    echo ""
    echo -e "${BLUE}🔄 Reload your shell or run: source $shell_config${NC}"
}

# 実行確認
read -p "Setup development aliases? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
    setup_aliases
else
    echo -e "${YELLOW}ℹ️  Alias setup skipped${NC}"
fi