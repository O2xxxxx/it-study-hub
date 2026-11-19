#!/usr/bin/env bash
# 统一 Maven 启动器：绕过 MSYS 下 mvn 脚本对含空格路径的处理问题
set -uo pipefail
ROOT_POSIX="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cygpath -m "$ROOT_POSIX")"
JAVA_DIR="${JAVA_HOME:-C:/Program Files/Java/jdk-25}"
MVN_HOME="$ROOT/.tools/apache-maven-3.9.9"
repo_args=()
if [[ -n "${MAVEN_REPO_LOCAL:-}" ]]; then
  repo_args+=("-Dmaven.repo.local=$MAVEN_REPO_LOCAL")
fi
exec "$JAVA_DIR/bin/java.exe" \
  -classpath "$MVN_HOME/boot/plexus-classworlds-2.8.0.jar" \
  -Dclassworlds.conf="$MVN_HOME/bin/m2.conf" \
  -Dmaven.home="$MVN_HOME" \
  -Dmaven.multiModuleProjectDirectory="$ROOT" \
  org.codehaus.plexus.classworlds.launcher.Launcher \
  -s "$ROOT/.tools/settings.xml" "${repo_args[@]}" "$@"
