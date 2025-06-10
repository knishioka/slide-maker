#!/bin/bash

# Google Slides Content Generator - Worktree Setup Script
# このスクリプトは開発用のgit worktreeを自動的に作成します

set -e  # エラー時に終了

echo "🚀 Google Slides Content Generator - Worktree Setup"
echo "=================================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 現在のディレクトリを保存
ORIGINAL_DIR=$(pwd)
PROJECT_NAME="slide-maker"

# 親ディレクトリに移動
cd ..
PARENT_DIR=$(pwd)

echo -e "${BLUE}📁 Working in directory: ${PARENT_DIR}${NC}"

# 関数: ブランチが存在するかチェック
check_branch_exists() {
    local branch=$1
    cd "${ORIGINAL_DIR}"
    git show-ref --verify --quiet refs/heads/"${branch}" 2>/dev/null
}

# 関数: ブランチを作成
create_branch_if_not_exists() {
    local branch=$1
    cd "${ORIGINAL_DIR}"
    
    if ! check_branch_exists "${branch}"; then
        echo -e "${YELLOW}🌿 Creating branch: ${branch}${NC}"
        git checkout -b "${branch}" develop 2>/dev/null || git checkout -b "${branch}" main
        git push -u origin "${branch}"
    else
        echo -e "${GREEN}✅ Branch already exists: ${branch}${NC}"
    fi
}

# 関数: worktreeを作成
create_worktree() {
    local name=$1
    local branch=$2
    local description=$3
    
    local worktree_dir="${PARENT_DIR}/${PROJECT_NAME}-${name}"
    
    echo -e "\n${BLUE}🔧 Setting up: ${description}${NC}"
    echo -e "   Branch: ${branch}"
    echo -e "   Directory: ${worktree_dir}"
    
    # ブランチ作成
    create_branch_if_not_exists "${branch}"
    
    # worktreeディレクトリが既に存在する場合は削除
    if [ -d "${worktree_dir}" ]; then
        echo -e "${YELLOW}⚠️  Directory exists, removing: ${worktree_dir}${NC}"
        rm -rf "${worktree_dir}"
    fi
    
    # worktreeを作成
    cd "${ORIGINAL_DIR}"
    git worktree add "${worktree_dir}" "${branch}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Created worktree: ${name}${NC}"
        
        # 基本設定ファイルをコピー（必要に応じて）
        if [ -f "${ORIGINAL_DIR}/.eslintrc.js" ]; then
            cp "${ORIGINAL_DIR}/.eslintrc.js" "${worktree_dir}/"
            cp "${ORIGINAL_DIR}/.prettierrc.js" "${worktree_dir}/"
            cp "${ORIGINAL_DIR}/package.json" "${worktree_dir}/"
        fi
        
    else
        echo -e "${RED}❌ Failed to create worktree: ${name}${NC}"
        return 1
    fi
}

# メイン処理開始
echo -e "\n${BLUE}🏗️  Creating development worktrees...${NC}"

# 1. Core Services Implementation
create_worktree "core-services" "feature/core-services" "Core Services Implementation"

# 2. Layout Engine Implementation  
create_worktree "layout" "feature/layout-engine" "Layout Engine Implementation"

# 3. Mermaid Integration
create_worktree "mermaid" "feature/mermaid-integration" "Mermaid Integration"

# 4. Web UI Implementation
create_worktree "ui" "feature/web-ui" "Web UI Implementation"

# 5. Comprehensive Testing
create_worktree "testing" "test/comprehensive-suite" "Comprehensive Testing"

# 6. Documentation Maintenance
create_worktree "docs" "docs/maintenance" "Documentation Maintenance"

# オプション: 将来の機能用worktree
read -p "🤔 Create optional worktrees for future features? (y/N): " create_optional

if [[ $create_optional =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}🚀 Creating optional worktrees...${NC}"
    
    # Performance Optimization
    create_worktree "performance" "refactor/performance-optimization" "Performance Optimization"
    
    # Security Hardening
    create_worktree "security" "refactor/security-hardening" "Security Hardening"
    
    # Production Maintenance
    create_worktree "maintenance" "maintenance/production-fixes" "Production Maintenance"
    
    # Spreadsheet Integration (将来機能)
    create_worktree "sheets" "feature/spreadsheet-integration" "Spreadsheet Integration"
fi

# 結果表示
echo -e "\n${GREEN}🎉 Worktree setup completed!${NC}"
echo -e "\n${BLUE}📋 Current worktrees:${NC}"

cd "${ORIGINAL_DIR}"
git worktree list

echo -e "\n${BLUE}💡 Next steps:${NC}"
echo "1. Navigate to each worktree directory to start development"
echo "2. Run 'npm install' in each worktree if needed"
echo "3. Check the docs/worktree-strategy.md for detailed workflow"

echo -e "\n${BLUE}🛠️  Example commands:${NC}"
echo "   cd ../${PROJECT_NAME}-core-services && npm install"
echo "   cd ../${PROJECT_NAME}-layout && npm install"
echo "   cd ../${PROJECT_NAME}-ui && npm install"

echo -e "\n${BLUE}📖 For more information:${NC}"
echo "   📄 docs/worktree-strategy.md - Detailed worktree strategy"
echo "   📄 CLAUDE.md - Development guidelines"
echo "   📄 README.md - Project overview"

# 戻る
cd "${ORIGINAL_DIR}"

echo -e "\n${GREEN}✨ Setup completed successfully!${NC}"