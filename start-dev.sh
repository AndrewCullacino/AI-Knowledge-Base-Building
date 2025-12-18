#!/bin/bash

# Kill any existing processes on the ports
echo "🧹 Cleaning up existing processes..."
pkill -f "langgraph dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:2024 -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true

sleep 2

# Verify ports are free
if lsof -ti:2024 >/dev/null 2>&1; then
    echo "❌ Port 2024 is still in use. Please manually kill the process."
    exit 1
fi

if lsof -ti:5173 >/dev/null 2>&1; then
    echo "❌ Port 5173 is still in use. Please manually kill the process."
    exit 1
fi

echo "✅ Ports are free. Starting servers..."

# Start make dev
cd "$(dirname "$0")"
exec make dev
