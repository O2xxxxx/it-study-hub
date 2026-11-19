#!/usr/bin/env bash
# 用版本控制内的种子初始化本地测试库。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME=itstudy_test exec bash "$ROOT/db/reset-db.sh"
