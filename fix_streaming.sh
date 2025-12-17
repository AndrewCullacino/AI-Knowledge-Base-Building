#!/bin/bash

# Fix Streaming Issues - Restart Everything Cleanly
# Run this from the project root directory

set -e  # Exit on error

echo "=================================================="
echo "  Deep Research Streaming Fix"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Kill existing processes
echo "${YELLOW}Step 1: Stopping existing servers...${NC}"
pkill -f "langgraph" 2>/dev/null || echo "  No LangGraph server running"
pkill -f "vite" 2>/dev/null || echo "  No Vite dev server running"
sleep 2
echo "${GREEN}✓ Servers stopped${NC}"
echo ""

# Step 2: Clear frontend caches
echo "${YELLOW}Step 2: Clearing frontend caches...${NC}"
cd frontend
rm -rf dist node_modules/.vite 2>/dev/null || true
echo "${GREEN}✓ Frontend caches cleared${NC}"
echo ""

# Step 3: Reinstall frontend dependencies (quick)
echo "${YELLOW}Step 3: Ensuring frontend dependencies are up to date...${NC}"
npm install --prefer-offline
echo "${GREEN}✓ Frontend dependencies ready${NC}"
echo ""

# Step 4: Start backend in background
echo "${YELLOW}Step 4: Starting LangGraph backend server...${NC}"
cd ../backend
../.venv/bin/langgraph dev > langgraph.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "  Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:2024/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Backend ready at http://localhost:2024${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "${RED}✗ Backend failed to start. Check backend/langgraph.log${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Step 5: Start frontend in background
echo "${YELLOW}Step 5: Starting Vite frontend server...${NC}"
cd ../frontend
npm run dev > vite.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "  Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "${GREEN}✓ Frontend ready at http://localhost:5173${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "${RED}✗ Frontend failed to start. Check frontend/vite.log${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Success message
echo "=================================================="
echo "${GREEN}✓ All systems ready!${NC}"
echo "=================================================="
echo ""
echo "Backend:  http://localhost:2024"
echo "Frontend: http://localhost:5173"
echo ""
echo "Backend logs:  tail -f backend/langgraph.log"
echo "Frontend logs: tail -f frontend/vite.log"
echo ""
echo "${YELLOW}Next steps:${NC}"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Open browser DevTools (F12) and go to Console tab"
echo "3. Enable Deep Research mode"
echo "4. Submit a query (e.g., 'What is love?')"
echo "5. Watch for debug logs starting with '🔍 [DEBUG]'"
echo ""
echo "Expected: You should see detailed processing steps in the timeline"
echo ""
echo "${YELLOW}To stop servers:${NC}"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
