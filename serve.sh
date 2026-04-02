#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting server at $(date)..."
  node .next/standalone/server.js &
  PID=$!
  # Wait for process to die
  wait $PID 2>/dev/null
  echo "Server died, restarting in 2s..."
  sleep 2
done
