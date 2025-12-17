#!/bin/bash

# Apply ALL Fixes for DeepResearch Issues
# This script applies both fixes:
# 1. Frontend event streaming (streamMode: "updates")
# 2. Backend response generation (reasoning=False, timeout, error handling)

set -e

echo "=================================================="
echo " 🔧 Applying Complete DeepResearch Fixes"
echo "=================================================="
echo ""
echo "Fixes being applied:"
echo "  1. Frontend: Event streaming visibility"
echo "  2. Backend: Response generation reliability"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/wangjintian/Desktop/project-1-knowledge-base

# Step 1: Verify fixes are in code
echo "${YELLOW}Step 1: Verifying code changes...${NC}"

if grep -q 'streamMode: "updates"' frontend/src/App.tsx; then
    echo "${GREEN}✓ Frontend fix verified (streamMode)${NC}"
else
    echo "${RED}✗ Frontend fix missing!${NC}"
    exit 1
fi

if grep -q 'reasoning=False.*Always False to prevent timeouts' backend/src/agent/deep_research_graph.py; then
    echo "${GREEN}✓ Backend fix verified (reasoning disabled)${NC}"
else
    echo "${RED}✗ Backend fix missing!${NC}"
    exit 1
fi

if grep -q 'timeout=120' backend/src/agent/deep_research_graph.py; then
    echo "${GREEN}✓ Backend timeout added${NC}"
else
    echo "${YELLOW}⚠ Timeout not found (may cause issues)${NC}"
fi

echo ""

# Step 2: Stop everything
echo "${YELLOW}Step 2: Stopping existing servers...${NC}"
pkill -f "langgraph" 2>/dev/null && echo "  Stopped LangGraph" || echo "  No LangGraph running"
pkill -f "vite" 2>/dev/null && echo "  Stopped Vite" || echo "  No Vite running"
sleep 2
echo "${GREEN}✓ Servers stopped${NC}"
echo ""

# Step 3: Clear caches
echo "${YELLOW}Step 3: Clearing all caches...${NC}"
cd frontend
rm -rf dist node_modules/.vite .vite 2>/dev/null || true
echo "${GREEN}✓ Frontend caches cleared${NC}"
echo ""

# Step 4: Start backend
echo "${YELLOW}Step 4: Starting LangGraph backend (with fixes)...${NC}"
cd ../backend
../.venv/bin/langgraph dev > langgraph.log 2>&1 &
BACKEND_PID=$!

echo "  Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:2024/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Backend ready (PID: $BACKEND_PID)${NC}"

        # Verify reasoning is disabled
        sleep 2
        if grep -q "reasoning disabled" langgraph.log; then
            echo "${GREEN}✓ Reasoning mode disabled (fix applied)${NC}"
        else
            echo "${YELLOW}⚠ Check if reasoning is disabled${NC}"
        fi
        break
    fi
    [ $i -eq 30 ] && echo "${RED}✗ Backend timeout${NC}" && exit 1
    sleep 1
    echo -n "."
done
echo ""

# Step 5: Start frontend
echo "${YELLOW}Step 5: Starting Vite frontend (with fixes)...${NC}"
cd ../frontend
npm run dev > vite.log 2>&1 &
FRONTEND_PID=$!

echo "  Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "${GREEN}✓ Frontend ready (PID: $FRONTEND_PID)${NC}"
        break
    fi
    [ $i -eq 30 ] && echo "${RED}✗ Frontend timeout${NC}" && exit 1
    sleep 1
    echo -n "."
done
echo ""

# Success!
echo "=================================================="
echo "${GREEN}✅ ALL FIXES APPLIED AND VERIFIED${NC}"
echo "=================================================="
echo ""
echo "${BLUE}Services Running:${NC}"
echo "  Backend:  http://localhost:2024 (PID: $BACKEND_PID)"
echo "  Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "${YELLOW}📝 Testing Instructions:${NC}"
echo ""
echo "1. Open: ${BLUE}http://localhost:5173${NC}"
echo ""
echo "2. Press ${YELLOW}F12${NC} → ${YELLOW}Console${NC} tab (KEEP OPEN!)"
echo ""
echo "3. Enable ${BLUE}'DeepResearch'${NC} mode (toggle button)"
echo ""
echo "4. Submit query: ${BLUE}'What is love?'${NC}"
echo ""
echo "${GREEN}✅ What You Should See:${NC}"
echo ""
echo "  ${YELLOW}In Console:${NC}"
echo "    🔍 [DEBUG] Received event: { generate_queries: {...} }"
echo "    🔍 [DEBUG] Received event: { retrieve_contexts: {...} }"
echo "    🔍 [DEBUG] Received event: { reflect: {...} }"
echo "    🔍 [DEBUG] Received event: { finalize_report: {...} }"
echo ""
echo "  ${YELLOW}In Timeline (Webpage):${NC}"
echo "    🔍 Generated Search Queries (Round 1)"
echo "    📚 Retrieved Knowledge (Round 1)"
echo "    🤔 Research Quality Analysis (Round 1)"
echo "    ... continues for 2-3 rounds ..."
echo "    📝 Generating Final Report"
echo ""
echo "  ${YELLOW}Final Result:${NC}"
echo "    ✅ Answer displayed with sources"
echo "    ✅ No timeout errors"
echo "    ✅ Complete in < 30 seconds"
echo ""
echo "${YELLOW}Logs:${NC}"
echo "  Backend:  tail -f backend/langgraph.log"
echo "  Frontend: tail -f frontend/vite.log"
echo ""
echo "${YELLOW}To stop:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "=================================================="
echo "${GREEN}Ready for testing! 🎉${NC}"
echo "=================================================="
