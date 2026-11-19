#!/usr/bin/env bash
# IT 学习天地 · 端到端验收脚本（真实调用后端，无 mock）
# 用法：bash scripts/acceptance.sh [BASE_URL]
set -uo pipefail

BASE="${1:-}"
if [ -z "$BASE" ]; then BASE="http://localhost:8080"; fi
TMP="$(mktemp -d)"
PASS=0
FAIL=0

ok()   { PASS=$((PASS+1)); printf '  [PASS] %s\n' "$*"; }
bad()  { FAIL=$((FAIL+1)); printf '  [FAIL] %s\n' "$*"; }
say()  { printf '\n%s\n' "$*"; }
expect() { if [ "$2" = "$3" ]; then ok "$1 = $3"; else bad "$1 期望 $2 实际 $3"; fi }
jqv() { printf '%s' "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*[^,}]*" | head -1 | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d ' '; }
code_of() { printf '%s' "$1" | grep -o '"code"[[:space:]]*:[[:space:]]*"[A-Z_]*"' | head -1 | sed 's/.*"\([A-Z_]*\)"/\1/'; }
status_of() { printf '%s' "$1" | tail -n1; }
body_of()   { printf '%s' "$1" | sed '$d'; }

req() {
  local jar="$1" m="$2" p="$3" body=""
  if [ $# -ge 4 ]; then body="$4"; fi
  if [ -n "$body" ]; then
    printf '%s' "$body" | curl -sS -X "$m" "$BASE$p" -H 'Content-Type: application/json' -b "$jar" -c "$jar" --data-binary @- -w '\n%{http_code}'
  else
    curl -sS -X "$m" "$BASE$p" -b "$jar" -c "$jar" -w '\n%{http_code}'
  fi
}

STAMP=$(date +%H%M%S)
U1="qa$STAMP"
U2="qb$STAMP"

say "== 0. 服务可用性 =="
HEALTH=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/sections")
expect "GET /api/sections" 200 "$HEALTH"
if [ "$HEALTH" != "200" ]; then say "后端未启动，终止"; exit 1; fi

say "== 1. 游客可读、写操作被拦 =="
G="$TMP/guest.jar"
R=$(req "$G" GET /api/articles);               expect "游客读文章列表" 200 "$(status_of "$R")"
R=$(req "$G" POST /api/articles '{"title":"t","sectionId":1,"contentMd":"x"}'); expect "游客发文章 401" 401 "$(status_of "$R")"
R=$(req "$G" POST /api/resources/1/exchange);  expect "游客兑换 401" 401 "$(status_of "$R")"
R=$(req "$G" GET /api/resources/1/download);   expect "游客下载 401" 401 "$(status_of "$R")"

say "== 2. 注册新会员，积分 0 =="
J1="$TMP/u1.jar"
R=$(req "$J1" POST /api/auth/register "{\"username\":\"$U1\",\"password\":\"pass1234\",\"nickname\":\"验收甲\"}")
expect "注册" 201 "$(status_of "$R")"
B=$(body_of "$R"); expect "初始积分" 0 "$(jqv "$B" points)"

say "== 3. 0 分兑换 5 分资料被拒 =="
R=$(req "$J1" POST /api/resources/1/exchange)
expect "积分不足 400" 400 "$(status_of "$R")"
expect "错误码" POINTS_NOT_ENOUGH "$(code_of "$(body_of "$R")")"

say "== 4. 发文章 +5 =="
MD='{"title":"验收文章：Spring MVC 请求流程","sectionId":1,"summary":"验收","contentMd":"## 标题\n\n正文 code 示例。"}'
R=$(req "$J1" POST /api/articles "$MD")
expect "发文章 201" 201 "$(status_of "$R")"
B=$(body_of "$R"); ART_ID=$(jqv "$B" id); expect "发文章后余额" 5 "$(jqv "$B" balance)"

say "== 5. 回答他人问题 +3 =="
R=$(req "$J1" POST /api/questions/5/answers '{"contentMd":"先看 EXPLAIN，再确认是否命中联合索引最左前缀。"}')
expect "回答 201" 201 "$(status_of "$R")"
B=$(body_of "$R"); expect "回答后余额" 8 "$(jqv "$B" balance)"
R=$(req "$J1" POST /api/questions/5/answers '{"contentMd":"重复回答"}')
expect "同题重复回答 409" 409 "$(status_of "$R")"
expect "重复错误码" DUPLICATE_ANSWER "$(code_of "$(body_of "$R")")"

say "== 6. 兑换并下载，余额 3 =="
R=$(req "$J1" POST /api/resources/1/exchange)
expect "兑换 200" 200 "$(status_of "$R")"
B=$(body_of "$R"); expect "兑换后余额" 3 "$(jqv "$B" balance)"; expect "owned" true "$(jqv "$B" owned)"
DL=$(curl -sS -o "$TMP/dl.md" -w '%{http_code}' -b "$J1" "$BASE/api/resources/1/download")
expect "下载 200" 200 "$DL"
SIZE=$(wc -c < "$TMP/dl.md" | tr -d ' ')
if [ "$SIZE" -gt 500 ]; then ok "下载文件 $SIZE 字节"; else bad "下载文件过小 $SIZE"; fi

say "== 7. 重复兑换/下载不扣分 =="
R=$(req "$J1" POST /api/resources/1/exchange); B=$(body_of "$R")
expect "重复兑换余额" 3 "$(jqv "$B" balance)"
DL2=$(curl -sS -o /dev/null -w '%{http_code}' -b "$J1" "$BASE/api/resources/1/download")
expect "重复下载 200" 200 "$DL2"
R=$(req "$J1" GET /api/points); B=$(body_of "$R"); expect "最终余额" 3 "$(jqv "$B" balance)"

say "== 8. 未兑换会员下载同一文件被拒 =="
J2="$TMP/u2.jar"
req "$J2" POST /api/auth/register "{\"username\":\"$U2\",\"password\":\"pass1234\",\"nickname\":\"验收乙\"}" > /dev/null
R=$(req "$J2" GET /api/resources/1/download)
expect "未兑换下载 403" 403 "$(status_of "$R")"
expect "错误码" NOT_EXCHANGED "$(code_of "$(body_of "$R")")"

say "== 9. 并发兑换同一资源 =="
req "$J2" POST /api/articles '{"title":"乙的验收文章","sectionId":2,"contentMd":"内容"}' > /dev/null
req "$J2" POST /api/questions/2/answers '{"contentMd":"乙的回答：动态 SQL 与索引。"}' > /dev/null
R=$(req "$J2" GET /api/points); B=$(body_of "$R"); expect "并发前余额" 8 "$(jqv "$B" balance)"
cp "$J2" "$TMP/jar1"
cp "$J2" "$TMP/jar2"
req "$TMP/jar1" POST /api/resources/2/exchange > "$TMP/c1.txt" &
P1=$!
req "$TMP/jar2" POST /api/resources/2/exchange > "$TMP/c2.txt" &
P2=$!
wait $P1 $P2
R=$(req "$J2" GET /api/points); B=$(body_of "$R")
expect "并发后余额只扣一次" 3 "$(jqv "$B" balance)"
EX_COUNT=$(printf '%s' "$B" | grep -o '"pointsCost":[[:space:]]*5' | wc -l | tr -d ' ')
if [ "$EX_COUNT" -eq 1 ]; then ok "已兑换列表仅 1 条"; else bad "已兑换列表 $EX_COUNT 条"; fi

say "== 10. 编辑不加分、越权被拒 =="
R=$(req "$J1" PUT "/api/articles/$ART_ID" '{"title":"验收文章（已编辑）","sectionId":1,"contentMd":"编辑后正文"}')
expect "作者编辑 200" 200 "$(status_of "$R")"
R=$(req "$J1" GET /api/points); B=$(body_of "$R"); expect "编辑后余额不变" 3 "$(jqv "$B" balance)"
R=$(req "$J2" PUT "/api/articles/$ART_ID" '{"title":"越权","sectionId":1,"contentMd":"x"}')
expect "非作者编辑 403" 403 "$(status_of "$R")"

say "== 11. 搜索 / 草稿 / 收藏 / 采纳 =="
SR=$(curl -sS "$BASE/api/search?q=%E7%B4%A2%E5%BC%95" -b "$J1")
TOTAL=$(jqv "$SR" total)
if [ -n "$TOTAL" ] && [ "$TOTAL" -ge 1 ]; then ok "搜索命中 $TOTAL 条"; else bad "搜索无命中"; fi
R=$(req "$J1" PUT /api/drafts '{"draftType":"article","draftKey":"new","title":"草稿标题","sectionId":1,"contentMd":"草稿正文"}')
expect "保存草稿" 200 "$(status_of "$R")"
R=$(req "$J1" GET "/api/drafts?draftType=article&draftKey=new"); B=$(body_of "$R")
expect "读草稿标题" 草稿标题 "$(jqv "$B" title)"
R=$(req "$J1" DELETE "/api/drafts?draftType=article&draftKey=new"); expect "删除草稿" 200 "$(status_of "$R")"
R=$(req "$J1" POST /api/favorites/toggle '{"targetType":"article","targetId":1}'); B=$(body_of "$R")
expect "收藏" true "$(jqv "$B" favorited)"
R=$(req "$J1" POST /api/questions/1/accept '{"answerId":1}')
expect "非提问者采纳 403" 403 "$(status_of "$R")"


say "== 12. 用户主页 / 点赞 / 关注 =="
R=$(req "$G" GET /api/users/teacher); expect "游客看公开主页" 200 "$(status_of "$R")"
R=$(req "$G" GET /api/users/teacher/articles); expect "游客看用户文章" 200 "$(status_of "$R")"
R=$(req "$G" GET /api/users/teacher/questions); expect "游客看用户问答" 200 "$(status_of "$R")"
R=$(req "$G" GET /api/users/teacher/following); expect "游客看关注列表" 200 "$(status_of "$R")"
R=$(req "$G" POST /api/users/teacher/follow); expect "游客关注 401" 401 "$(status_of "$R")"
R=$(req "$J1" POST "/api/users/$U1/follow"); expect "关注自己 400" 400 "$(status_of "$R")"
R=$(req "$J1" POST "/api/users/$U2/follow"); B=$(body_of "$R")
expect "首次关注粉丝 +1" 1 "$(jqv "$B" followerCount)"
R=$(req "$J1" POST "/api/users/$U2/follow"); B=$(body_of "$R")
expect "重复关注幂等" 1 "$(jqv "$B" followerCount)"
R=$(req "$G" GET "/api/users/$U2/followers"); B=$(body_of "$R")
expect "粉丝列表包含关注者" "$U1" "$(jqv "$B" username)"
R=$(req "$J1" POST "/api/users/$U2/unfollow"); B=$(body_of "$R")
expect "取消关注恢复粉丝数" 0 "$(jqv "$B" followerCount)"
LIKE="{\"targetType\":\"article\",\"targetId\":$ART_ID,\"liked\":true}"
R=$(req "$G" POST /api/likes/toggle "$LIKE"); expect "游客点赞 401" 401 "$(status_of "$R")"
R=$(req "$J2" POST /api/likes/toggle "$LIKE"); B=$(body_of "$R")
expect "首次点赞计数为 1" 1 "$(jqv "$B" count)"
R=$(req "$J2" POST /api/likes/toggle "$LIKE"); B=$(body_of "$R")
expect "重复点赞幂等" 1 "$(jqv "$B" count)"
R=$(req "$J2" GET "/api/articles/$ART_ID"); B=$(body_of "$R")
expect "文章详情返回当前点赞态" true "$(jqv "$B" likedByMe)"
R=$(req "$J2" POST /api/likes/toggle "{\"targetType\":\"article\",\"targetId\":$ART_ID,\"liked\":false}"); B=$(body_of "$R")
expect "取消点赞恢复计数" 0 "$(jqv "$B" count)"
R=$(req "$J1" GET /api/points); B=$(body_of "$R")
expect "兑换流水链接指向资源" /resources/1 "$(jqv "$B" targetPath)"

say ""
say "================ PASS=$PASS  FAIL=$FAIL ================"
printf '临时目录：%s\n' "$TMP"
if [ "$FAIL" -ne 0 ]; then exit 1; fi
