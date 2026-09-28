#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "================================"
echo "  CVForge - starting up..."
echo "================================"
echo

# 1. Ollama
if pgrep -x "ollama" > /dev/null; then
  echo "[1/3] Ollama already running."
else
  if command -v ollama > /dev/null; then
    echo "[1/3] Starting Ollama..."
    ollama serve > /tmp/cvforge-ollama.log 2>&1 &
    sleep 4
  else
    echo "[!] Ollama not found. Cloud providers will still work."
  fi
fi

# 2. Static server
echo "[2/3] Starting local server on port 8000..."
python3 -m http.server 8000 > /tmp/cvforge-server.log 2>&1 &
SERVER_PID=$!

# 3. Browser
sleep 2
echo "[3/3] Opening browser..."
if command -v open > /dev/null; then
  open "http://localhost:8000/index.html"
elif command -v xdg-open > /dev/null; then
  xdg-open "http://localhost:8000/index.html"
fi

echo
echo "================================"
echo "  CVForge is running."
echo "  URL:  http://localhost:8000"
echo "  Stop: press Ctrl+C to stop the server"
echo "================================"
wait $SERVER_PID