#!/bin/bash
# Simple browser check with Chrome
LOG_FILE="/tmp/chrome_console.log"

google-chrome-stable \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --virtual-time-budget=3000 \
  --dump-dom \
  http://localhost:3000/simulation/neural-ca \
  2>/dev/null | head -100

# Check canvas element
echo "---"
echo "Checking for canvas in page..."
