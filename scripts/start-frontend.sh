#!/usr/bin/env bash
# 启动前端开发服务器（Vite，5173，/api 代理到 8080）
set -e
cd "$(dirname "$0")/../frontend"
exec npm run dev
