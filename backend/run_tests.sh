#!/bin/bash
# Test runner script for the Knowledge Base RAG application

set -e

echo "======================================"
echo "Running Knowledge Base RAG Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install test dependencies if needed
echo -e "${YELLOW}Installing test dependencies...${NC}"
pip install -q -r test-requirements.txt || true
echo ""

# Run all tests with coverage
echo -e "${GREEN}Running all tests with coverage...${NC}"
pytest tests/ -v --cov=agent --cov-report=term-missing --cov-report=html

echo ""
echo "======================================"
echo "Test suite completed!"
echo "Coverage report: htmlcov/index.html"
echo "======================================"
