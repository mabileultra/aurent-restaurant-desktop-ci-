#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
JAR="$(pwd)/target/restaurant-service-1.0.0.jar"
PORT="${RESTAURANT_PORT:-8087}"
PID_FILE=/tmp/rst-service.pid
LOG_FILE=/tmp/rst-service.log

echo "==> building"
mvn -q -DskipTests package

if [[ ! -f "$JAR" ]]; then
  echo "missing jar: $JAR"
  exit 1
fi

echo "==> stopping listeners on :$PORT"
if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${PIDS}" ]]; then
    # shellcheck disable=SC2086
    kill ${PIDS} 2>/dev/null || true
    sleep 2
    PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${PIDS}" ]]; then
      # shellcheck disable=SC2086
      kill -9 ${PIDS} 2>/dev/null || true
      sleep 1
    fi
  fi
fi
if [[ -f "$PID_FILE" ]]; then
  OLD="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD}" ]]; then
    kill "$OLD" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi
pkill -f 'restaurant-service-1.0.0.jar' 2>/dev/null || true
sleep 1

: > "$LOG_FILE"
# macOS: start in a new session via python so the process survives the parent shell.
python3 - "$JAR" "$LOG_FILE" "$PID_FILE" <<'PY'
import os, subprocess, sys
jar, log_path, pid_path = sys.argv[1], sys.argv[2], sys.argv[3]
env = os.environ.copy()
env.setdefault("RESTAURANT_DB_URL", "jdbc:postgresql://127.0.0.1:5433/restaurant_db")
env.setdefault("RESTAURANT_DB_USERNAME", "pos_user")
env.setdefault("RESTAURANT_DB_PASSWORD", "pos_password")
env.setdefault("DOMAIN_KAFKA_ENABLED", "false")
log = open(log_path, "a", buffering=1)
work_dir = os.path.dirname(jar)
proc = subprocess.Popen(
    ["java", "-jar", jar],
    env=env,
    stdout=log,
    stderr=subprocess.STDOUT,
    stdin=subprocess.DEVNULL,
    start_new_session=True,
    cwd=work_dir,
)
open(pid_path, "w").write(str(proc.pid))
print(proc.pid)
PY
PID="$(cat "$PID_FILE")"
echo "started pid=$PID log=$LOG_FILE"

for i in $(seq 1 45); do
  if curl -sf "http://127.0.0.1:${PORT}/api/v1/actuator/health" >/dev/null 2>&1; then
    echo "ready after ${i}s"
    exit 0
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "process died — last log lines:"
    tail -50 "$LOG_FILE" || true
    exit 1
  fi
  sleep 1
done

echo "timeout waiting for ready — last log lines:"
tail -50 "$LOG_FILE" || true
exit 1
