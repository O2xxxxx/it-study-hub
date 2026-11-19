#!/usr/bin/env bash
# 重建本地演示库或测试库，按顺序加载版本控制内的种子。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MYSQL_BIN="${MYSQL_BIN:-$ROOT/.tools/mysql-8.0.29-winx64/bin/mysql.exe}"
DB_NAME="${DB_NAME:-itstudy}"
case "$DB_NAME" in
  itstudy|itstudy_test) ;;
  *) printf '[reset-db] unsupported database %s\n' "$DB_NAME" >&2; exit 1 ;;
esac
mysql_args=(--protocol=TCP "--host=${DB_HOST:-127.0.0.1}" "--port=${DB_PORT:-3307}" "--user=${DB_USER:-root}" --default-character-set=utf8mb4)
if [[ -n "${DB_PASS:-}" ]]; then
  mysql_args+=("--password=$DB_PASS")
fi

for file in schema.sql seed.sql seed-content.sql seed-qa.sql; do
  printf '[reset-db] %s → %s\n' "$file" "$DB_NAME"
  sed -E "s/^(DROP DATABASE IF EXISTS|CREATE DATABASE|USE) itstudy([ ;])/\1 $DB_NAME\2/" "$ROOT/db/$file" |
    "$MYSQL_BIN" "${mysql_args[@]}"
done

"$MYSQL_BIN" "${mysql_args[@]}" --database="$DB_NAME" < "$ROOT/db/migrations/20261119_profile_social.sql"
"$MYSQL_BIN" "${mysql_args[@]}" --database="$DB_NAME" -N -e "
SELECT CONCAT('users=', COUNT(*)) FROM app_user;
SELECT CONCAT('sections=', COUNT(*)) FROM section;
SELECT CONCAT('articles=', COUNT(*)) FROM article;
SELECT CONCAT('questions=', COUNT(*)) FROM question;
SELECT CONCAT('answers=', COUNT(*)) FROM answer;
SELECT CONCAT('resources=', COUNT(*)) FROM resource;
SELECT CONCAT('exchanges=', COUNT(*)) FROM resource_exchange;
SELECT CONCAT('point_logs=', COUNT(*)) FROM point_log;
SELECT CONCAT('favorites=', COUNT(*)) FROM favorite;
SELECT CONCAT('post_likes=', COUNT(*)) FROM post_like;
SELECT CONCAT('follows=', COUNT(*)) FROM user_follow;
SELECT CONCAT('user=', username, ' points=', points) FROM app_user ORDER BY id;"
