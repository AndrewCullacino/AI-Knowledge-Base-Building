# Quick Start Guide - DeepResearch Feature

## 🚀 Get Started in 5 Minutes

### Prerequisites

1. **Ollama** - Local LLM server
   ```bash
   # Install Ollama (if not installed)
   curl https://ollama.ai/install.sh | sh

   # Pull required model
   ollama pull qwen3:8b

   # Start Ollama server
   ollama serve
   ```

2. **CNB Token** - Knowledge base API access
   - Get token from https://cnb.cool
   - Or use existing token

3. **Node.js & Python**
   - Node.js 18+ (for frontend)
   - Python 3.11+ (for backend)

---

## 📦 Installation

### Step 1: Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env and add your CNB_TOKEN
echo "CNB_TOKEN=your_token_here" >> .env

# Install dependencies
pip install .

# Start backend
langgraph dev
```

**Backend should be running on:** http://localhost:2024

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend should be running on:** http://localhost:5173

---

## 🎯 Using DeepResearch

### 1. Open the Application
Navigate to http://localhost:5173 in your browser

### 2. Select DeepResearch Mode
Click the **"🔬 DeepResearch"** button at the top of the page

![Mode Selection](assets/deepsearch.png)

### 3. Choose Knowledge Base (Optional)
- Default: `cnb/docs`
- Or enter your own repository: `your/repo`

### 4. Ask a Question
Try these example questions:

**Good for DeepResearch:**
```
- "What is CNB and how does its knowledge base system work?"
- "Explain CNB's architecture, components, and deployment process"
- "How do I build and deploy a CNB application? What are the best practices?"
```

**Simple questions (Regular RAG is better):**
```
- "What is the CNB API endpoint?"
- "How do I install CNB?"
```

### 5. Watch the Research Process

You'll see real-time progress in the activity timeline:

```
🔍 Generating Search Queries
   - Creating diverse research queries...

📚 Retrieving Knowledge (Round 1)
   - Gathered 15 contexts from knowledge base

🤔 Analyzing Research Progress
   - Need more research (confidence: 60%)

🔍 Generating Search Queries
   - Creating additional queries...

📚 Retrieving Knowledge (Round 2)
   - Gathered 25 contexts from knowledge base

🤔 Analyzing Research Progress
   - ✅ Sufficient information (confidence: 85%)

📝 Generating Research Report
   - Synthesizing findings into comprehensive report...
```

### 6. Review the Research Report

- **Comprehensive answer** synthesizing all findings
- **Numeric citations** [1], [2], [3] linking to sources
- **Source list** at bottom with titles and URLs
- **Clickable citations** - click to view source document

---

## 💡 Tips & Best Practices

### When to Use DeepResearch

✅ **Use DeepResearch for:**
- Complex questions requiring multiple perspectives
- Topics needing comprehensive explanation
- Questions with multiple parts
- Research requiring synthesis of many sources

❌ **Use Regular RAG for:**
- Quick factual lookups
- Simple how-to questions
- Already well-documented topics
- When speed is more important than depth

### Optimizing Performance

1. **Adjust Max Loops**
   - Edit `backend/src/agent/configuration.py`
   - Change `max_research_loops: int = 3`
   - Fewer loops = faster, less comprehensive
   - More loops = slower, more comprehensive

2. **Control Query Generation**
   - Edit `queries_per_iteration: int = 3`
   - Fewer queries = faster retrieval
   - More queries = broader coverage

3. **Model Selection**
   - Fast model (llama3.2): Quick but less accurate
   - Balanced model (qwen3:8b): Good balance (recommended)
   - Powerful model (qwen2.5:32b): Slow but comprehensive

---

## 🐛 Troubleshooting

### "Cannot connect to Ollama"

**Problem:** Backend can't reach Ollama server

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# In another terminal, verify model is available
ollama list

# If model not found, pull it
ollama pull qwen3:8b
```

### "CNB API Error"

**Problem:** Cannot query knowledge base

**Solution:**
```bash
# 1. Check your token in backend/.env
cat backend/.env | grep CNB_TOKEN

# 2. Test token manually
curl -X POST https://api.cnb.cool/cnb/docs/-/knowledge/base/query \
  -H "Authorization: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "top_k": 5}'

# 3. Verify repository name
# Must be in format: owner/repo (e.g., cnb/docs)
```

### "Frontend Not Loading"

**Problem:** Blank page or errors in browser console

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:2024/health

# 2. Check frontend build
cd frontend
npm run build

# 3. Clear cache and reload
# In browser: Ctrl/Cmd + Shift + R

# 4. Check console for errors
# Open browser DevTools (F12) → Console tab
```

### "No Activity Timeline"

**Problem:** DeepResearch runs but no progress shown

**Solution:**
1. Open browser DevTools (F12) → Network tab
2. Filter by "SSE" or "EventSource"
3. Check for connection to backend
4. Verify no CORS errors in Console

### "Research Takes Too Long"

**Problem:** DeepResearch running > 1 minute

**Solution:**
```python
# Reduce max loops in backend/src/agent/configuration.py
max_research_loops: int = 2  # Instead of 3

# Or reduce queries per iteration
queries_per_iteration: int = 2  # Instead of 3
```

---

## 📊 Understanding the Results

### Research Report Structure

```markdown
# Answer begins directly

CNB is a cloud-native platform [1] that provides...

**Key Features:**
- Feature 1 [2]
- Feature 2 [3]

The architecture consists of... [1][4]

## Sources

[1] CNB Documentation - Overview
    https://docs.cnb.cool/overview

[2] CNB Architecture Guide
    https://docs.cnb.cool/architecture

[3] CNB Features Reference
    https://docs.cnb.cool/features

[4] CNB Deployment Guide
    https://docs.cnb.cool/deployment
```

### Activity Timeline Explanation

| Step | What's Happening | Duration |
|------|------------------|----------|
| 🔍 Generating Search Queries | LLM creates diverse queries | 1-2s |
| 📚 Retrieving Knowledge | Queries CNB API for each query | 1-2s |
| 🤔 Analyzing Research Progress | LLM evaluates sufficiency | 1-2s |
| 🔄 Loop (if needed) | Repeat above steps | Variable |
| 📝 Generating Research Report | LLM synthesizes final answer | 3-5s |

---

## 🎓 Next Steps

### Learn More
1. Read the [Comprehensive Guide](DEEPRESEARCH_GUIDE.md)
2. Review [Implementation Details](IMPLEMENTATION_SUMMARY.md)
3. Explore the code in `backend/src/agent/deep_research_graph.py`

### Experiment
1. Try different types of questions
2. Adjust configuration parameters
3. Test with your own knowledge bases
4. Compare DeepResearch vs Regular RAG

### Contribute
1. Report bugs and issues
2. Suggest improvements
3. Add new features
4. Improve documentation

---

## 📞 Need Help?

- **Documentation Issues:** Check DEEPRESEARCH_GUIDE.md
- **Code Questions:** Review inline comments in source files
- **Bug Reports:** Include error logs and steps to reproduce
- **Feature Requests:** Describe use case and expected behavior

---

**Happy Researching! 🔬✨**
