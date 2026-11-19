#!/usr/bin/env bash
# 启动后端（默认使用 JDK 17；可通过 JAVA_HOME 覆盖）
set -e
cd "$(dirname "$0")/.."
if [ -z "${JAVA_HOME:-}" ] || [ ! -d "$JAVA_HOME" ]; then
  JAVA_HOME="C:/Program Files/Java/jdk-17"
fi
export JAVA_HOME
PROFILE="dev"
if [ -n "${SPRING_PROFILES_ACTIVE:-}" ]; then PROFILE="$SPRING_PROFILES_ACTIVE"; fi
echo "JAVA_HOME=$JAVA_HOME  profile=$PROFILE"
exec bash scripts/mvn.sh -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles="$PROFILE"
