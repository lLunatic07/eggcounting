#!/bin/sh

# Start WebSocket server in background
echo "Starting WebSocket server on port ${WS_PORT:-3001}..."
node server/websocket.js &

# Start Next.js server in foreground
echo "Starting Next.js server on port ${PORT:-3000}..."
node server.js
