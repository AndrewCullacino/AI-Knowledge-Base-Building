# Quick Start Guide - Fixed Knowledge Base System

## ✅ Dependencies Installed

All required dependencies have been installed:
- ✅ `python-multipart` - For file upload support
- ✅ `PyPDF2` - For PDF text extraction
- ✅ `python-docx` - For Word document processing

## 🚀 Starting the System

### 1. Start Backend Server

```bash
cd backend
langgraph dev
```

The server will start on **http://localhost:2024**

You should see:
```
Ready!
- API: http://127.0.0.1:2024
```

### 2. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

## 🧪 Testing the Fixes

### Test 1: Real-Time Thinking Process Display

1. Open browser to http://localhost:5173
2. Select **🔬 DeepResearch** mode
3. Enter question: "What is love?"
4. **Watch for real-time updates**:
   - 🧠 Generating Search Queries (Round 1)
   - 🔎 Searching Knowledge Base...
   - 📚 Retrieved Knowledge (Round 1)
   - 💭 Evaluating Research Quality (Round 1)
   - ✅ Research Analysis Complete OR 🔄 Need more research
   - (If continuing) Rounds 2 and 3...
   - 📝 Generating Final Report...
   - ✅ Final report with sources

5. **Open Browser DevTools** (F12):
   - Go to Console tab
   - Look for `🔍 [DEBUG] Received event:` messages
   - Verify events show full state updates

**Expected**: You see progress updates in real-time, not just final result

### Test 2: Backend Response Generation

1. Stay in **🔬 DeepResearch** mode
2. Ask: "Explain quantum computing"
3. **Verify**:
   - Multiple research rounds execute
   - Each round completes successfully
   - Final comprehensive report appears
   - Sources are cited with [1], [2], etc.
   - No hanging or timeout errors

4. **Check backend logs**:
   ```
   🔍 GENERATE_RESEARCH_QUERIES - Loop 0
   📚 RETRIEVE_MULTI_CONTEXTS - Loop 0
   🤔 REFLECT_ON_RESEARCH - Loop 0
   ✅ Research Report Generated
   ```

**Expected**: Full research report with sources, no errors

### Test 3: Custom Knowledge Base Upload

#### 3.1 Create Test Documents

Create a test file `test-kb.txt`:
```bash
cat > test-kb.txt << 'EOF'
SuperClaude Framework Overview

SuperClaude is an enhanced framework for Claude Code that provides:
- Multi-expert business analysis with panel discussions
- Deep research capabilities with iterative refinement
- Custom knowledge base management
- Token-efficient communication modes
- Intelligent task orchestration

The framework includes behavioral modes like brainstorming, introspection,
and orchestration that adapt Claude's responses to different scenarios.
EOF
```

Or create a simple PDF with sample content.

#### 3.2 Upload to System

1. In the web UI, click **📁 Manage** button (top bar)
2. Click **+ New Knowledge Base**
3. Click file selector, choose `test-kb.txt`
4. Click **Upload**
5. **Watch progress bar** fill to 100%
6. **Verify**:
   - New KB appears in list (e.g., "Custom KB abc123")
   - Shows "1 documents"
   - Shows creation date

#### 3.3 Query Custom KB

1. Click on the new KB to select it
2. Look for **✓ Active** indicator
3. Close the modal
4. Verify top bar shows: `📚 RAG: custom_abc123`
5. Select **📚 RAG** mode (not DeepResearch for quick test)
6. Ask: "What is SuperClaude?"
7. **Expected**: Response mentions SuperClaude framework details from your file

#### 3.4 Test KB Deletion

1. Click **📁 Manage** again
2. Find your custom KB
3. Click **Delete** button
4. Confirm deletion
5. **Verify**: KB removed from list

### Test 4: Mode Switching

#### GPT Mode
1. Click **💬 GPT**
2. Ask: "What is 2+2?"
3. **Expected**: Direct answer, no source citations

#### RAG Mode
1. Click **📚 RAG**
2. Ensure "cnb/docs" is selected
3. Ask: "What is CNB?"
4. **Expected**: Answer with source citations like [Source 1]

#### DeepResearch Mode
1. Click **🔬 DeepResearch**
2. Ask: "Compare TypeScript and JavaScript"
3. **Expected**: Multi-round research with progress updates

## 🐛 Troubleshooting

### Error: "python-multipart not installed"

**Already Fixed** - Dependencies are installed. If you still see this:
```bash
cd backend
../.venv/bin/pip install python-multipart
```

### Error: "PyPDF2 not found"

```bash
cd backend
../.venv/bin/pip install PyPDF2 python-docx
```

### Frontend not connecting

1. Check backend is running: http://localhost:2024
2. Check CORS in browser console
3. Verify port 2024 is not blocked

### Upload fails

1. **Check file format**: PDF, TXT, MD, DOCX only
2. **Check file size**: Large files (>50MB) may timeout
3. **Check backend logs**: Look for Python errors
4. **Verify permissions**: Backend needs write access to `knowledge_bases/` directory

### No results from custom KB

1. **Verify upload succeeded**: Check KB manager shows document count
2. **Check query keywords**: Simple keyword matching, use words from your document
3. **Look at backend logs**: Check for query execution
4. **Verify KB selected**: Top bar should show your KB ID

### DeepResearch hangs

1. **Check Ollama**: `curl http://localhost:11434/api/tags`
2. **Check model**: `ollama list` should show your model
3. **Backend logs**: Look for LLM timeout errors
4. **Try simpler query**: Complex questions take longer

## 📂 File Locations

**Backend**:
- API endpoints: `backend/src/agent/app.py`
- KB Manager: `backend/src/agent/kb_manager.py`
- Knowledge bases stored: `backend/knowledge_bases/`
- Index file: `backend/knowledge_bases/index.json`

**Frontend**:
- Upload UI: `frontend/src/components/KnowledgeBaseUpload.tsx`
- KB Manager: `frontend/src/components/KnowledgeBaseManager.tsx`
- Main App: `frontend/src/App.tsx`

## 📊 Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| File upload (1MB) | 1-3 sec | Depends on file type |
| Text chunking | < 1 sec | For most documents |
| Simple query | < 1 sec | Keyword search |
| RAG mode query | 2-5 sec | With LLM generation |
| DeepResearch (3 loops) | 30-60 sec | Depends on LLM speed |
| Stream update latency | < 100ms | Real-time updates |

## ✨ New Features Summary

### 1. Real-Time Progress Display
- See each step of DeepResearch process
- Round-by-round query generation
- Confidence scores and reasoning
- No more black box waiting

### 2. Reliable Backend
- Fixed message handling
- Proper state flow
- Complete responses
- Error recovery

### 3. Custom Knowledge Bases
- Upload your own documents
- Multiple KB support
- Easy switching
- Local storage

## 🎯 Next Steps

After testing, you can:

1. **Upload your own documents**: PDFs, Word docs, text files
2. **Create project-specific KBs**: Code documentation, research papers
3. **Experiment with DeepResearch**: Complex research questions
4. **Monitor progress**: Watch the thinking process in real-time

## 📖 Full Documentation

See `IMPLEMENTATION_SUMMARY.md` for:
- Complete architecture details
- Code documentation
- Advanced features
- Future enhancements

---

**All systems ready to go! 🚀**
