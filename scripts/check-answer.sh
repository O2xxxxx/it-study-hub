set -e
B=http://127.0.0.1:8080
J=".tools/bob.jar"
Q=".tools/q.json"
rm -f "$J" "$Q"
curl -s -c "$J" -H 'Content-Type: application/json' -d '{"username":"bob","password":"bob12345"}' $B/api/auth/login >/dev/null
curl -s -b "$J" -H 'Content-Type: application/json' -d '{"title":"奖励校验：bob 回答测试题","sectionId":1,"contentMd":"这是一条用于校验回答奖励的测试内容，内容长度足够。"}' $B/api/questions > "$Q"
QID=$(python -c "import json;print(json.load(open('.tools/q.json'))['id'])")
echo "QID=$QID"
curl -s -b "$J" -H 'Content-Type: application/json' -d '{"contentMd":"回答内容：先复现问题再定位入口，确认参数绑定与分发链路，最后补一条回归测试。"}' $B/api/questions/$QID/answers
echo
curl -s -b "$J" $B/api/auth/me
echo