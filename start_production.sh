#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "==============================================================================="
echo "  RescuELINK: Autonomous Smart City Emergency Dispatch & Resilience Platform"
echo "  PRODUCTION SERVER LAUNCHER (Linux / macOS)"
echo "==============================================================================="
echo ""

echo "[1/2] Building React 19 Frontend for Production..."
cd "$DIR/frontend"
npm run build

echo ""
echo "[2/2] Starting Production ASGI Server on Port 8000..."
echo ""
echo "-------------------------------------------------------------------------------"
echo "  PRODUCTION URL:  http://localhost:8000"
echo "  API DOCS:        http://localhost:8000/docs"
echo "  HEALTH STATUS:   http://localhost:8000/health"
echo "-------------------------------------------------------------------------------"
echo ""

cd "$DIR/backend"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'
