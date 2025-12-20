#!/bin/bash
set -e

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Setting up development environment..."
echo "   Working directory: $(pwd)"

# 设置前端依赖
echo "📦 Installing frontend dependencies..."
if [ -d /tmp/frontend/node_modules ]; then
  echo "   Using cached node_modules from /tmp/frontend/"
  cd frontend
  ln -sf /tmp/frontend/node_modules node_modules 2>/dev/null || true
  cd ..
  echo "   ✓ Linked cached dependencies"
else
  echo "   Installing fresh node_modules..."
  cd frontend && npm install --legacy-peer-deps --prefer-offline --no-audit && cd ..
  echo "   ✓ Frontend dependencies installed"
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
echo "   ✓ Backend dependencies installed"

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
