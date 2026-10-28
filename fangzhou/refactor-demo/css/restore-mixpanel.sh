#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$DIR/app.css.bak-20261028-mixpanel.css" "$DIR/app.css"
echo "已恢复 Mixpanel 备份 → app.css。请硬刷浏览器。"
