#!/bin/bash

# Google Slides Content Generator - Task Complete with Auto CD
# タスク完了後にmainディレクトリに自動移動する版

# このスクリプトは以下のように使用:
# source ./scripts/complete-task-and-cd.sh TASK-XXX

# 通常のタスク完了処理を実行
./scripts/task-complete.sh "$@"

# worktree削除後、確実にmainディレクトリに移動
if [ -f "TASKS.md" ]; then
    echo "✅ Already in main directory"
else
    # mainディレクトリを探して移動
    if [ -f "../main/TASKS.md" ]; then
        cd "../main"
        echo "📁 Moved to main directory: $(pwd)"
    elif [ -f "../../main/TASKS.md" ]; then
        cd "../../main"
        echo "📁 Moved to main directory: $(pwd)"
    else
        echo "⚠️  Main directory not found"
    fi
fi