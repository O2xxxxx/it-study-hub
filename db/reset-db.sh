#!/usr/bin/env bash
# 一键重建本地数据库：删库建表 -> 基础种子 -> 文章种子 -> 问答种子
# 用法：bash db/reset-db.sh   （在项目根目录执行）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MYSQL_BIN="${MYSQL_BIN:-$ROOT/.tools/mysql-8.0.29-winx64/bin/mysql.exe}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

if [ ! -x "$MYSQL_BIN" ] && [ ! -f "$MYSQL_BIN" ]; then
  echo "[reset-db] 找不到 mysql 客户端: $MYSQL_BIN" >&2
  echo "[reset-db] 可用 MYSQL_BIN=/path/to/mysql 覆盖" >&2
  exit 1
fi

run_sql_file() {
  local file="$1"
  echo "[reset-db] 执行 $(basename "$file")"
  "$MYSQL_BIN" --protocol=TCP -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"}     --default-character-set=utf8mb4 < "$file"
}

run_sql_file "$ROOT/db/schema.sql"
run_sql_file "$ROOT/db/seed.sql"
run_sql_file "$ROOT/db/seed-content.sql"
run_sql_file "$ROOT/db/seed-qa.sql"

echo "[reset-db] 校验数据"
"$MYSQL_BIN" --protocol=TCP -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} \
  --default-character-set=utf8mb4 -N -e "
SELECT CONCAT('users=', COUNT(*)) FROM itstudy.app_user;
SELECT CONCAT('sections=', COUNT(*)) FROM itstudy.section;
SELECT CONCAT('articles=', COUNT(*)) FROM itstudy.article;
SELECT CONCAT('questions=', COUNT(*)) FROM itstudy.question;
SELECT CONCAT('answers=', COUNT(*)) FROM itstudy.answer;
SELECT CONCAT('resources=', COUNT(*)) FROM itstudy.resource;
SELECT CONCAT('exchanges=', COUNT(*)) FROM itstudy.resource_exchange;
SELECT CONCAT('point_logs=', COUNT(*)) FROM itstudy.point_log;
SELECT CONCAT('favorites=', COUNT(*)) FROM itstudy.favorite;
SELECT CONCAT('user=', username, ' points=', points) FROM itstudy.app_user ORDER BY id;"

echo "[reset-db] 完成"
