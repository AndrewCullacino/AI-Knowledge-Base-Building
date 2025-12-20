#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# 设置前端依赖
echo "📦 Installing frontend dependencies..."
if [ -d /tmp/frontend/node_modules ]; then
  echo "   Using cached node_modules from /tmp/frontend/"
  cd frontend
  ln -sf /tmp/frontend/node_modules node_modules 2>/dev/null || true
  cd ..
else
  echo "   Installing fresh node_modules..."
  cd frontend && npm install --prefer-offline --no-audit && cd ..
fi

# 设置后端虚拟环境
echo "🐍 Setting up Python virtual environment..."
if [ ! -d .venv ]; then
  echo "   Creating virtual environment..."
  python3 -m venv .venv
fi

# 激活虚拟环境并安装依赖
echo "   Installing backend dependencies..."
source .venv/bin/activate
cd backend && pip install . && cd ..

# 检查 Ollama 是否运行
echo "🤖 Checking Ollama service..."
if ! pgrep -x "ollama" > /dev/null; then
  echo "   Starting Ollama service..."
  nohup ollama serve >/dev/null 2>&1 &
  sleep 2
fi

echo "✅ Development environment ready!"
echo ""
echo "Run 'make dev' to start the application"
