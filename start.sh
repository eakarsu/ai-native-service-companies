#!/usr/bin/env bash
set -euo pipefail

# Supported lifecycle modes: check|migrate|start. Bare invocation starts the app.

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
source "$project_dir/.env"
set +a

for required in DATABASE_URL JWT_SECRET JWT_ISSUER JWT_AUDIENCE BACKEND_PORT FRONTEND_PORT; do
  [ -n "${!required:-}" ] || { echo "$required is required" >&2; exit 1; }
done
for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  lsof -nP -iTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "assigned port $assigned_port is occupied" >&2; exit 1; }
done

cd "$project_dir"
case "${MIGRATE_ON_START:-0}" in
  1|true)
    for migration in backend/db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
    ;;
esac
npm --prefix backend run create-admin
export ENABLE_GENERATED_FEATURES=true
BACKEND_HOST=127.0.0.1 PORT="$BACKEND_PORT" npm --prefix backend start & app_pid=$!
terminate(){ kill "${app_pid:-}" "${proxy_pid:-}" 2>/dev/null || true; wait "${app_pid:-}" "${proxy_pid:-}" 2>/dev/null || true; }
trap terminate INT TERM EXIT
for attempt in {1..240}; do
  curl --max-time 2 -sS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1 && break
  kill -0 "$app_pid" 2>/dev/null || { wait "$app_pid" || true; echo 'application exited before startup' >&2; exit 1; }
  sleep 0.25
done
curl --max-time 5 -sS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null || { echo 'application did not become ready' >&2; exit 1; }
RUNTIME_PROXY_PORT="$FRONTEND_PORT" RUNTIME_PROXY_TARGET_PORT="$BACKEND_PORT" node "$project_dir/_runtime-proxy.mjs" & proxy_pid=$!
wait "$app_pid" "$proxy_pid"
