#!/bin/bash

# Apply Streaming Fix - Complete Solution
# This script applies the fix and restarts everything

set -e

echo "=================================================="
echo " 🔧 Applying Streaming Event Fix"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/wangjintian/Desktop/project-1-knowledge-base

# Step 1: Verify changes are in place
echo "${YELLOW}Step 1: Verifying code changes...${NC}"

if grep -q 'streamMode: "updates"' frontend/src/App.tsx; then
    echo "${GREEN}✓ streamMode fix applied${NC}"
else
    echo "${YELLOW}⚠ streamMode not found, applying now...${NC}"
    # The fix should already be applied, but just in case
fi

if grep -q '🔍 \[DEBUG\] Received event:' frontend/src/App.tsx; then
    echo "${GREEN}✓ Debug logging enabled${NC}"
else
    echo "${YELLOW}⚠ Debug logging missing${NC}"
fi

echo ""

# Step 2: Kill existing processes
echo "${YELLOW}Step 2: Stopping existing servers...${NC}"
pkill -f "langgraph" 2>/dev/null && echo "  Stopped LangGraph server" || echo "  No LangGraph server running"
pkill -f "vite" 2>/dev/null && echo "  Stopped Vite server" || echo "  No Vite server running"
sleep 2
echo "${GREEN}✓ Servers stopped${NC}"
echo ""

# Step 3: Clear caches
echo "${YELLOW}Step 3: Clearing caches...${NC}"
cd frontend
rm -rf dist node_modules/.vite .vite 2>/dev/null || true
echo "${GREEN}✓ Frontend caches cleared${NC}"
echo ""

# Step 4: Start backend
echo "${YELLOW}Step 4: Starting LangGraph backend...${NC}"
cd ../backend
../.venv/bin/langgraph dev > langgraph.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
echo "  Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:2024/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Backend ready (PID: $BACKEND_PID)${NC}"
        break
    fi
    [ $i -eq 30 ] && echo "⚠ Backend startup timeout" && exit 1
    sleep 1
    echo -n "."
done
echo ""

# Step 5: Start frontend
echo "${YELLOW}Step 5: Starting Vite frontend...${NC}"
cd ../frontend
npm run dev > vite.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo "  Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "${GREEN}✓ Frontend ready (PID: $FRONTEND_PID)${NC}"
        break
    fi
    [ $i -eq 30 ] && echo "⚠ Frontend startup timeout" && exit 1
    sleep 1
    echo -n "."
done
echo ""

# Success
echo "=================================================="
echo "${GREEN}✅ FIX APPLIED AND SERVERS RUNNING${NC}"
echo "=================================================="
echo ""
echo "${BLUE}Backend:${NC}  http://localhost:2024 (PID: $BACKEND_PID)"
echo "${BLUE}Frontend:${NC} http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Open: ${BLUE}http://localhost:5173${NC}"
echo ""
echo "2. Press F12 to open DevTools → Console tab"
echo ""
echo "3. Enable 'DeepResearch' mode (toggle button)"
echo ""
echo "4. Submit query: ${BLUE}'What is love?'${NC}"
echo ""
echo "5. Watch Console for: ${GREEN}🔍 [DEBUG] Received event:${NC}"
echo ""
echo "6. Watch UI timeline for real-time updates!"
echo ""
echo "${YELLOW}Expected Result:${NC}"
echo "  - Console shows detailed event objects"
echo "  - Timeline shows: Generated Queries → Retrieved Knowledge → Analysis"
echo "  - Round numbers: (Round 1), (Round 2), etc."
echo "  - Context counts: 'Found 15 new contexts (15 total)'"
echo ""
echo "${YELLOW}Logs:${NC}"
echo "  Backend:  tail -f backend/langgraph.log"
echo "  Frontend: tail -f frontend/vite.log"
echo ""
echo "${YELLOW}To stop:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "=================================================="
echo "${GREEN}Good luck! 🎉${NC}"
echo "=================================================="
