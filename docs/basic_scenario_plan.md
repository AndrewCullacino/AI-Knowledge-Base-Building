# Basic Scenario Implementation Plan

## 📑 Table of Contents

### 1. [Overview](#-overview)
   - [Scenarios Summary](#scenarios-summary)
   - [Prerequisites](#prerequisites)

### 2. [Foundational Knowledge](#-foundational-knowledge)
   - 2.1 [What is RAG (Retrieval-Augmented Generation)?](#21-what-is-rag-retrieval-augmented-generation)
   - 2.2 [Understanding LangGraph and State Machines](#22-understanding-langgraph-and-state-machines)
   - 2.3 [CNB Knowledge Base Architecture](#23-cnb-knowledge-base-architecture)
   - 2.4 [Citations and Source Attribution](#24-citations-and-source-attribution)
   - 2.5 [Streaming and Server-Sent Events (SSE)](#25-streaming-and-server-sent-events-sse)
   - 2.6 [State Management in LangGraph](#26-state-management-in-langgraph)
   - 2.7 [Node-based Workflow Architecture](#27-node-based-workflow-architecture)

### 3. [Scenario 1: Enhanced Dialogue](#-scenario-1-enhanced-dialogue-)
   - 3.1 [Architecture Overview](#31-architecture-overview)
     - [Component Interaction Flow](#component-interaction-flow)
     - [Design Decisions Explained](#design-decisions-explained)
   - 3.2 [Implementation Steps](#32-implementation-steps)
     - [Step 1: Frontend - Repository Selector Component](#step-1-frontend---repository-selector-component)
     - [Step 2: Frontend - Citation Display Component](#step-2-frontend---citation-display-component)
     - [Step 3: Backend - Modify LangGraph State](#step-3-backend---modify-langgraph-state)
     - [Step 4: Backend - Update CNB API Query Function](#step-4-backend---update-cnb-api-query-function)
     - [Step 5: Backend - Update Retrieval Node in LangGraph](#step-5-backend---update-retrieval-node-in-langgraph)
     - [Step 6: Frontend - Update Message Display](#step-6-frontend---update-message-display)
   - 3.3 [Testing Guide](#33-testing-guide)
   - 3.4 [Common Issues & Solutions](#34-common-issues--solutions)

### 4. [Scenario 2: DeepResearch](#-scenario-2-deepresearch-)
   - 4.1 [Architecture Overview](#41-architecture-overview)
     - [Multi-Round Retrieval Concept](#multi-round-retrieval-concept)
     - [Workflow Node Detailed Explanation](#workflow-node-detailed-explanation)
   - 4.2 [LangGraph Workflow Design](#42-langgraph-workflow-design)
     - [State Schema Design Philosophy](#state-schema-design-philosophy)
     - [Node Implementations with Detailed Explanations](#node-implementations-with-detailed-explanations)
     - [Conditional Logic and Routing](#conditional-logic-and-routing)
   - 4.3 [Streaming Implementation](#43-streaming-implementation)
     - [Backend Streaming Architecture](#backend-streaming-architecture)
     - [Frontend Streaming Handling](#frontend-streaming-handling)
     - [SSE Protocol Details](#sse-protocol-details)
   - 4.4 [Multi-Model Configuration](#44-multi-model-configuration-optional-enhancement)
   - 4.5 [Testing Guide](#45-testing-guide)
   - 4.6 [Common Issues & Solutions](#46-common-issues--solutions)

### 5. [Integration Tips](#-integration-tips)
   - [Combining Scenario 1 & 2](#combining-scenario-1--2)
   - [Performance Optimization](#performance-optimization)

### 6. [Resources & References](#-resources--references)

### 7. [Implementation Checklist](#-implementation-checklist)

### 8. [Next Steps](#-next-steps)

---

## 📋 Overview

This guide provides step-by-step instructions for implementing **Scenario 1** and **Scenario 2** from the RAG Knowledge Base project. These scenarios build upon each other, starting with basic enhanced dialogue capabilities and progressing to advanced deep research features.

### Scenarios Summary

| Scenario | Difficulty | Est. Time | Core Features |
|----------|-----------|-----------|---------------|
| **Scenario 1**: Enhanced Dialogue | ⭐⭐ | 1-2 weeks | Repository switching, Citation display |
| **Scenario 2**: DeepResearch | ⭐⭐⭐ | 2-3 weeks | Multi-round retrieval, Structured reports, Streaming |

### Prerequisites

Before starting, ensure you have:

- ✅ Demo application running successfully
- ✅ CNB Token configured in `.env`
- ✅ LangSmith API Key configured (for debugging)
- ✅ Basic understanding of:
  - React (frontend)
  - Python + LangGraph (backend)
  - CNB Knowledge Base API
- ✅ Access to [CNB Knowledge Base API Documentation](https://docs.cnb.cool/zh/ai/knowledge-base.html)

---

## 🎓 Foundational Knowledge

Before diving into implementation, it's crucial to understand the core concepts that underpin these scenarios. This section provides comprehensive background knowledge.

### 2.1 What is RAG (Retrieval-Augmented Generation)?

**RAG (Retrieval-Augmented Generation)** is a powerful AI pattern that combines the benefits of information retrieval systems with large language models (LLMs).

#### The Problem RAG Solves

Traditional LLMs have several limitations:
1. **Knowledge Cutoff**: They only know information up to their training date
2. **Hallucination**: They may generate plausible but incorrect information
3. **Domain Limitations**: They lack specialized or proprietary knowledge
4. **No Source Attribution**: Users can't verify where information came from

#### How RAG Works

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  1. Retrieval Phase                 │
│  ─────────────────────              │
│  • Convert query to embedding       │
│  • Search knowledge base            │
│  • Find relevant documents          │
│  • Rank by relevance                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  2. Augmentation Phase              │
│  ──────────────────────             │
│  • Combine retrieved docs           │
│  • Format as context                │
│  • Add to LLM prompt                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  3. Generation Phase                │
│  ────────────────────               │
│  • LLM processes context + query    │
│  • Generates grounded response      │
│  • Includes citations               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
│  with       │
│  Sources    │
└─────────────┘
```

#### Key Benefits

1. **Accuracy**: Responses grounded in retrieved documents reduce hallucination
2. **Freshness**: Knowledge base can be updated without retraining the LLM
3. **Verifiability**: Users can check sources and verify information
4. **Domain Expertise**: Can incorporate specialized knowledge not in training data
5. **Transparency**: Clear attribution of information sources

#### RAG in This Project

In both scenarios, we implement RAG using:
- **Retrieval**: CNB Knowledge Base API for document search
- **Augmentation**: Formatting retrieved chunks as context
- **Generation**: LLM (via LangGraph) creates responses with citations

### 2.2 Understanding LangGraph and State Machines

**LangGraph** is a framework for building stateful, multi-actor applications with LLMs. It's built on the concept of state machines and directed graphs.

#### What is a State Machine?

A **state machine** is a computational model that:
- Has a defined **state** (data/context at a point in time)
- Transitions between states based on **events** or **conditions**
- Executes **actions** during transitions

Example: Traffic Light
```
       GREEN ──timer expires──▶ YELLOW ──timer expires──▶ RED
         ▲                                                   │
         └─────────────────timer expires─────────────────────┘
```

#### LangGraph Core Concepts

##### 1. State
The **state** is a TypedDict that holds all data flowing through your workflow:

```python
class AgentState(TypedDict):
    messages: List[Message]      # Conversation history
    repository: str              # Current knowledge base
    sources: List[Dict]          # Retrieved documents
    iteration: int               # Loop counter
```

**Why State Matters**:
- All nodes read from and write to the same state
- State persists across node executions
- State enables complex multi-step workflows

##### 2. Nodes
**Nodes** are Python functions that:
- Take state as input
- Perform operations (API calls, LLM invocations, etc.)
- Return updated state

```python
def retrieval_node(state: AgentState) -> AgentState:
    query = state["messages"][-1].content
    results = search_knowledge_base(query)
    return {**state, "sources": results}
```

##### 3. Edges
**Edges** define the flow between nodes:

- **Regular Edge**: Always go to next node
  ```python
  workflow.add_edge("retrieval", "generation")
  ```

- **Conditional Edge**: Choose next node based on state
  ```python
  workflow.add_conditional_edges(
      "reflection",
      should_continue_research,  # Function returns node name
      {
          "continue": "query_generation",
          "answer": "answer_generation"
      }
  )
  ```

##### 4. Graph Structure

```python
from langgraph.graph import StateGraph

# Define workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("generation", generation_node)

# Connect nodes
workflow.set_entry_point("retrieval")
workflow.add_edge("retrieval", "generation")
workflow.add_edge("generation", END)

# Compile and run
app = workflow.compile()
result = app.invoke(initial_state)
```

#### Why LangGraph for RAG?

1. **Stateful Workflows**: Maintain context across multiple LLM calls
2. **Conditional Logic**: Dynamic routing based on LLM outputs
3. **Iterative Refinement**: Loop back for additional information
4. **Streaming Support**: Stream intermediate results to users
5. **Debugging**: LangSmith integration for workflow visualization

#### LangGraph vs Simple Chain

**Simple Chain** (Sequential):
```
Query → Retrieval → Generation → Response
```

**LangGraph** (Complex, Conditional):
```
Query → Retrieval → Reflection → {sufficient? → Generation
                                  insufficient? → Query Expansion → Retrieval → ...}
```

### 2.3 CNB Knowledge Base Architecture

**CNB (Code and Beyond) Knowledge Base** is a managed vector database service designed for RAG applications.

#### What is a Vector Database?

Traditional databases store structured data (tables, rows). **Vector databases** store:
- **Embeddings**: Numerical representations of text (e.g., 768-dimensional vectors)
- **Metadata**: Title, URL, path, etc.
- **Original Content**: The actual text

#### CNB Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Application                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP API
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   CNB API Gateway                       │
│  • Authentication (Bearer Token)                        │
│  • Rate Limiting                                        │
│  • Request Routing                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Knowledge Base Engine                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Embedding   │  │   Vector     │  │  Metadata   │  │
│  │   Model      │  │   Search     │  │  Filtering  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Vector Database                        │
│  Repository: cnb/docs                                   │
│  ├─ Chunk 1: embedding, metadata, content              │
│  ├─ Chunk 2: embedding, metadata, content              │
│  └─ ...                                                 │
└─────────────────────────────────────────────────────────┘
```

#### Key Concepts

##### 1. Repository
A **repository** is a namespace for your knowledge base:
- Format: `organization/project` (e.g., `cnb/docs`)
- Contains chunked documents with embeddings
- Isolated from other repositories

##### 2. Chunking
Documents are split into **chunks**:
- Typical size: 500-1000 tokens
- Overlap: 100-200 tokens for context continuity
- Each chunk has its own embedding

Why chunking?
- **Precision**: Find specific relevant sections, not entire documents
- **Context Window**: LLMs have limited input sizes
- **Ranking**: Better granularity for relevance scoring

##### 3. Embeddings
Text → Embedding Model → Vector (e.g., 768-dimensional array)

Similar meanings → Similar vectors:
```
"dog" → [0.2, 0.8, 0.1, ...]
"puppy" → [0.25, 0.75, 0.15, ...]  # Close in vector space
"car" → [-0.3, 0.1, 0.9, ...]       # Far in vector space
```

##### 4. Similarity Search
Given a query:
1. Convert query to embedding
2. Calculate distance to all chunk embeddings (e.g., cosine similarity)
3. Return top-k most similar chunks

##### 5. Metadata
Each chunk includes metadata:
```json
{
  "title": "LangGraph Introduction",
  "url": "https://docs.cnb.cool/zh/ai/langgraph",
  "path": "ai/langgraph.md",
  "section": "Getting Started",
  "repository": "cnb/docs"
}
```

Used for:
- Citation display (title, URL)
- Filtering (e.g., only search specific sections)
- Source attribution

#### CNB API Usage

**Request**:
```python
POST https://api.cnb.cool/v1/knowledge-base/query
Headers:
  Authorization: Bearer YOUR_CNB_TOKEN
  Content-Type: application/json
Body:
{
  "repository": "cnb/docs",
  "query": "How does LangGraph handle state?",
  "top_k": 5
}
```

**Response**:
```json
{
  "results": [
    {
      "content": "LangGraph uses TypedDict for state management...",
      "score": 0.89,
      "metadata": {
        "title": "LangGraph State Management",
        "url": "https://...",
        "path": "ai/langgraph-state.md"
      }
    },
    ...
  ]
}
```

### 2.4 Citations and Source Attribution

**Citations** are references to the sources used to generate an answer. They provide transparency and verifiability.

#### Why Citations Matter

1. **Trustworthiness**: Users can verify information
2. **Legal/Compliance**: Proper attribution in professional contexts
3. **Learning**: Users can explore topics deeper
4. **Debugging**: Developers can trace incorrect responses to source documents

#### Citation Formats

##### Academic Style
```
LangGraph uses TypedDict for state management [1].

References:
[1] LangGraph Documentation - State Management
    https://docs.langchain.com/...
```

##### Inline Style (Used in This Project)
```
LangGraph uses TypedDict for state management [1] and supports
conditional edges for dynamic routing [2].

Sources:
1. LangGraph Documentation - State Management (https://...)
2. LangGraph Documentation - Edges (https://...)
```

#### Implementation Strategy

##### Backend: Citation Injection
The LLM is instructed to include citation markers:

```python
prompt = f"""Based on the context below, answer the question.
Cite sources using [1], [2], etc.

Context:
[Source 1]: LangGraph uses TypedDict...
[Source 2]: Conditional edges enable...

Question: {user_query}

Answer with citations:"""
```

##### Frontend: Citation Rendering
Parse and replace citation markers with clickable links:

```tsx
// Input: "LangGraph uses TypedDict [1] and supports edges [2]."
// Output: "LangGraph uses TypedDict <a>[1]</a> and supports edges <a>[2]</a>."

const renderWithCitations = (content: string, sources: Source[]) => {
  return content.split(/(\[\d+\])/g).map((part, index) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const sourceIndex = parseInt(match[1]) - 1;
      const source = sources[sourceIndex];
      return (
        <sup key={index}>
          <a href={source.url} target="_blank">[{match[1]}]</a>
        </sup>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
```

#### Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| LLM forgets to cite | Improve prompt with examples, add system instructions |
| Citation numbers incorrect | Validate and renumber in post-processing |
| Duplicate sources | Deduplicate by URL before rendering |
| Broken links | Validate URLs, provide fallback for missing sources |
| Citation in middle of word | Use regex with word boundaries: `\b\[\d+\]\b` |

### 2.5 Streaming and Server-Sent Events (SSE)

**Streaming** allows sending data to the client progressively, rather than waiting for the entire response.

#### Why Streaming?

Traditional Request/Response:
```
Client ──request──▶ Server
                    │
                    │ (30 seconds of processing)
                    │
Client ◀──response─┘
```
**Problem**: User sees nothing for 30 seconds → poor UX

Streaming:
```
Client ──request──▶ Server
                    │
Client ◀─chunk 1────┤ (2 seconds)
Client ◀─chunk 2────┤ (4 seconds)
Client ◀─chunk 3────┤ (6 seconds)
Client ◀─chunk 4────┤ (8 seconds)
Client ◀─complete───┘
```
**Benefit**: User sees progress in real-time → better UX

#### Server-Sent Events (SSE)

**SSE** is a standard protocol for server-to-client streaming over HTTP.

##### Protocol Structure

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "progress", "node": "retrieval", "iteration": 1}

data: {"type": "progress", "node": "reflection", "iteration": 1}

data: {"type": "complete", "report": "..."}

```

Each event:
- Starts with `data: `
- Contains JSON payload
- Ends with double newline `\n\n`

##### Client-Side Handling

```javascript
const response = await fetch('/api/stream');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      handleEvent(data); // Update UI
    }
  }
}
```

##### Server-Side Generation (Python/FastAPI)

```python
from fastapi.responses import StreamingResponse

async def event_generator():
    yield f"data: {json.dumps({'type': 'start'})}\n\n"

    for result in process_workflow():
        yield f"data: {json.dumps(result)}\n\n"

    yield f"data: {json.dumps({'type': 'complete'})}\n\n"

@app.post("/api/stream")
async def stream_endpoint():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

#### LangGraph Streaming

LangGraph has built-in streaming support:

```python
# Stream graph execution
async for event in graph.astream(initial_state):
    # event = {node_name: node_output}
    for node_name, node_output in event.items():
        yield f"data: {json.dumps({'node': node_name, 'output': node_output})}\n\n"
```

**Benefits**:
- Automatic node-by-node streaming
- State updates streamed in real-time
- No manual checkpoint management

#### Streaming Best Practices

1. **Keep Events Small**: Don't send entire state, only essential updates
2. **Include Progress Indicators**: Let users know what's happening
3. **Handle Disconnections**: Implement reconnection logic
4. **Compression**: Use JSON, avoid verbose formats
5. **Error Handling**: Stream errors gracefully

```python
try:
    async for event in graph.astream(state):
        yield format_event(event)
except Exception as e:
    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
```

### 2.6 State Management in LangGraph

**State management** is how data flows through your workflow.

#### State Design Principles

##### 1. Completeness
Include all data needed by any node:

```python
class AgentState(TypedDict):
    messages: List[Message]          # For LLM context
    repository: str                  # For retrieval
    sources: List[Dict]              # For citations
    iteration: int                   # For loop control
    max_iterations: int              # For termination
```

##### 2. Immutability with Updates
Nodes return updates, not mutations:

```python
# ❌ Bad: Mutate state
def node(state):
    state["count"] += 1  # Modifies input
    return state

# ✅ Good: Return updates
def node(state):
    return {**state, "count": state["count"] + 1}
```

Why? Enables:
- Time travel debugging
- State checkpointing
- Rollback on errors

##### 3. Type Safety
Use TypedDict for IDE support:

```python
from typing import TypedDict

class AgentState(TypedDict):
    messages: List[Message]  # IDE knows this is a list
    repository: str          # IDE knows this is a string
```

#### State Reducers

**Reducers** control how state updates are merged.

##### Default Behavior: Override
```python
class State(TypedDict):
    counter: int

# Node 1 returns: {"counter": 5}
# Node 2 returns: {"counter": 10}
# Final state: {"counter": 10}  # Override
```

##### Custom Behavior: Accumulate
```python
from typing import Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]  # Accumulate messages

# Node 1 returns: {"messages": [msg1]}
# Node 2 returns: {"messages": [msg2]}
# Final state: {"messages": [msg1, msg2]}  # Accumulated
```

#### State Persistence

LangGraph supports checkpointing for:
- Resuming interrupted workflows
- Human-in-the-loop patterns
- Time-travel debugging

```python
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver("checkpoints.db")
graph = workflow.compile(checkpointer=checkpointer)

# Run with checkpointing
config = {"configurable": {"thread_id": "user123"}}
result = graph.invoke(initial_state, config)

# Resume later
result = graph.invoke(None, config)  # Resumes from checkpoint
```

### 2.7 Node-based Workflow Architecture

**Node-based architecture** breaks complex processes into discrete, composable units.

#### Principles

##### 1. Single Responsibility
Each node does **one thing well**:

```python
# ❌ Bad: Monolithic node
def process_node(state):
    queries = generate_queries(state)
    results = retrieve_documents(queries)
    reflection = assess_quality(results)
    answer = generate_answer(results)
    return {**state, "answer": answer}

# ✅ Good: Single-responsibility nodes
def query_generation_node(state):
    queries = generate_queries(state)
    return {**state, "queries": queries}

def retrieval_node(state):
    results = retrieve_documents(state["queries"])
    return {**state, "results": results}

def reflection_node(state):
    reflection = assess_quality(state["results"])
    return {**state, "reflection": reflection}

def answer_generation_node(state):
    answer = generate_answer(state["results"])
    return {**state, "answer": answer}
```

**Benefits**:
- Easier to test
- Easier to debug
- Easier to reuse
- Easier to modify

##### 2. Composability
Nodes can be reused in different workflows:

```python
# Workflow 1: Quick Answer
workflow1.add_node("retrieval", retrieval_node)
workflow1.add_node("answer", answer_node)

# Workflow 2: Deep Research (reuses retrieval_node)
workflow2.add_node("query_gen", query_gen_node)
workflow2.add_node("retrieval", retrieval_node)  # Reused!
workflow2.add_node("reflection", reflection_node)
workflow2.add_node("answer", answer_node)        # Reused!
```

##### 3. Testability
Nodes are pure functions → easy to test:

```python
def test_retrieval_node():
    # Arrange
    state = {
        "messages": [HumanMessage(content="What is LangGraph?")],
        "repository": "cnb/docs"
    }

    # Act
    result = retrieval_node(state)

    # Assert
    assert "sources" in result
    assert len(result["sources"]) > 0
```

#### Common Node Patterns

##### 1. Retrieval Node
Purpose: Fetch external data

```python
def retrieval_node(state: State) -> State:
    query = state["messages"][-1].content
    results = api.search(query)
    return {**state, "results": results}
```

##### 2. Processing Node
Purpose: Transform data

```python
def formatting_node(state: State) -> State:
    raw_results = state["results"]
    formatted = [format_chunk(r) for r in raw_results]
    return {**state, "formatted_results": formatted}
```

##### 3. Decision Node
Purpose: Assess state and decide

```python
def reflection_node(state: State) -> State:
    quality_score = assess_quality(state["results"])
    should_continue = quality_score < threshold
    return {
        **state,
        "quality_score": quality_score,
        "should_continue": should_continue
    }
```

##### 4. Generation Node
Purpose: Call LLM

```python
def generation_node(state: State) -> State:
    context = state["formatted_results"]
    query = state["messages"][-1].content

    prompt = f"Context: {context}\nQuestion: {query}"
    response = llm.invoke(prompt)

    return {
        **state,
        "messages": state["messages"] + [response]
    }
```

#### Workflow Patterns

##### 1. Sequential
Simple linear flow:

```
A → B → C → END
```

```python
workflow.add_edge("A", "B")
workflow.add_edge("B", "C")
workflow.add_edge("C", END)
```

##### 2. Conditional
Branching based on state:

```
      ┌─→ B ─→ END
A ─→ ?
      └─→ C ─→ END
```

```python
workflow.add_conditional_edges(
    "A",
    decide_next,
    {"option1": "B", "option2": "C"}
)
```

##### 3. Loop
Iterate until condition met:

```
A → B → C → D
    ↑       │
    └───?───┘
```

```python
workflow.add_conditional_edges(
    "D",
    should_continue,
    {"continue": "B", "stop": END}
)
```

##### 4. Parallel (via sub-workflows)
Process multiple paths:

```
      ┌─→ B ─┐
A ─→ ?        ? ─→ E → END
      └─→ C ─┘
```

---

## 🎯 Scenario 1: Enhanced Dialogue (⭐⭐)

**Goal**: Build a RAG-powered chat that allows users to switch between knowledge bases and see citations for all information.

**Key Features**:
1. Repository switching (e.g., switch from `cnb/docs` to your custom knowledge base)
2. Citation display (inline clickable references)
3. Source list (detailed bibliography)

### 3.1 Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  CNB API    │─────▶│Knowledge │
│  (React)    │      │  (LangGraph) │      │             │      │   Base   │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────┘
      │                     │                      │
      │  1. User Query +    │  2. Query with      │  3. Return results
      │     Repository      │     Repository      │     + metadata
      │                     │                      │     (title, url)
      ▼                     ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Display    │◀────│  Format      │◀─────│  Response   │
│  Citations  │      │  Response    │      │  Processing │
└─────────────┘      └──────────────┘      └─────────────┘
```

#### Component Interaction Flow

**Step-by-Step Execution**:

1. **User Action**: User types question + selects repository
2. **Frontend**: Sends `{message, repository}` to backend API
3. **Backend Entry**: LangGraph receives request, initializes state
4. **Retrieval Node**:
   - Extracts query from state
   - Calls CNB API with repository parameter
   - Receives chunks with metadata
5. **Processing**: Formats chunks as context, extracts sources
6. **Generation Node**:
   - Constructs prompt with context
   - Instructs LLM to include citations
   - LLM generates answer with [1], [2], etc.
7. **Response Formatting**: Backend packages answer + sources as JSON
8. **Frontend Rendering**:
   - Parses JSON response
   - Replaces [1], [2] with clickable links
   - Displays source list below answer

#### Design Decisions Explained

##### Why Repository Parameter?
**Problem**: Users have multiple knowledge bases (documentation, internal wiki, etc.)
**Solution**: Pass repository as parameter to CNB API
**Benefit**: Single application serves multiple knowledge bases

##### Why Separate Sources from Content?
**Problem**: LLM can't reliably generate valid URLs
**Solution**: Extract metadata (title, URL) from CNB API, LLM only references by number
**Benefit**: Guaranteed valid, clickable links

##### Why Client-Side Citation Rendering?
**Problem**: Backend doesn't know about UI (styling, interactivity)
**Solution**: Backend returns structured data, frontend renders UI
**Benefit**: Separation of concerns, UI flexibility

##### Why TypedDict for State?
**Problem**: Runtime errors from typos or wrong types
**Solution**: TypedDict provides type hints for IDE and type checkers
**Benefit**: Catch errors during development, not production

**Key Components:**
1. **Repository Selector** (Frontend): Input field for repository name
2. **Citation Renderer** (Frontend): Superscript numbers linking to sources
3. **Repository State Management** (Backend): LangGraph state with repository parameter
4. **Metadata Extraction** (Backend): Parse and format CNB API metadata

### 3.2 Implementation Steps

#### Step 1: Frontend - Repository Selector Component

**Purpose**: Allow users to switch between different knowledge bases dynamically.

**Design Philosophy**:
- **User Control**: Explicit switching (button) vs automatic (on every query)
- **Validation**: Trim whitespace, prevent empty submissions
- **Feedback**: Show current repository clearly

**File**: `frontend/src/components/RepositorySelector.tsx`

```tsx
import { useState } from 'react';

interface RepositorySelectorProps {
  currentRepo: string;
  onRepoChange: (repo: string) => void;
}

export function RepositorySelector({ currentRepo, onRepoChange }: RepositorySelectorProps) {
  // Local state for input field (controlled component)
  const [inputRepo, setInputRepo] = useState(currentRepo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // Prevent page reload

    // Validation: Ensure non-empty after trimming
    if (inputRepo.trim()) {
      onRepoChange(inputRepo.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="repo-selector">
      <label htmlFor="repo-input">Knowledge Base:</label>

      {/* Controlled input: value tied to state */}
      <input
        id="repo-input"
        type="text"
        value={inputRepo}
        onChange={(e) => setInputRepo(e.target.value)}
        placeholder="e.g., cnb/docs"
        className="repo-input"
      />

      <button type="submit">Switch</button>
    </form>
  );
}
```

**Code Walkthrough**:

- **Line 7-8**: Props include current repository and change handler
- **Line 10**: Local state for input field (allows typing without triggering API calls)
- **Line 12-17**: Form submission handler
  - Prevent default form behavior (page reload)
  - Validate input (non-empty after trim)
  - Call parent handler to trigger API update
- **Line 23-28**: Controlled input component
  - `value={inputRepo}`: Input displays state
  - `onChange`: Update state on every keystroke
  - User experience: Type → See changes → Click "Switch" → API call

**Integration**: Add to your main Chat component:

```tsx
const [repository, setRepository] = useState('cnb/docs');

// Pass repository to your API calls
const sendMessage = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      repository, // Include repository
    }),
  });
  // ... handle response
};
```

**Why This Design**:
- **Controlled Component**: React controls input value, enabling validation
- **Form Submission**: Enter key submits (standard UX)
- **Validation Before API**: Prevent unnecessary API calls with empty input
- **Local State**: Avoid triggering parent re-renders on every keystroke

#### Step 2: Frontend - Citation Display Component

**Purpose**: Render text with clickable citation links and display source bibliography.

**Parsing Strategy**:
1. Split content by citation pattern `[1]`, `[2]`, etc.
2. Replace citations with React elements (clickable links)
3. Preserve non-citation text as-is
4. Display source list separately

**File**: `frontend/src/components/CitationRenderer.tsx`

```tsx
import React from 'react';

// Type definitions
interface Source {
  id: number;
  title: string;
  url: string;
  path?: string;  // Optional: file path in repository
}

interface CitationRendererProps {
  content: string;     // Text with [1], [2], etc.
  sources: Source[];   // Array of source metadata
}

export function CitationRenderer({ content, sources }: CitationRendererProps) {
  // Parse content and replace citations with clickable links
  const renderWithCitations = () => {
    // Split by citation pattern, capturing the citations
    // Input: "Text [1] more text [2]."
    // Output: ["Text ", "[1]", " more text ", "[2]", "."]
    const parts = content.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      // Check if this part is a citation
      const match = part.match(/\[(\d+)\]/);

      if (match) {
        // This is a citation: [1], [2], etc.
        const citationNumber = match[1];
        const sourceIndex = parseInt(citationNumber) - 1;  // 0-indexed
        const source = sources[sourceIndex];

        if (source) {
          // Render as clickable superscript link
          return (
            <sup key={index}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"  // Security: prevent tabnabbing
                className="citation-link"
                title={source.title}       // Tooltip on hover
              >
                [{citationNumber}]
              </a>
            </sup>
          );
        }
      }

      // Not a citation, render as plain text
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="citation-content">
      {/* Main content with inline citations */}
      <div className="message-text">{renderWithCitations()}</div>

      {/* Source bibliography */}
      {sources.length > 0 && (
        <div className="sources-list">
          <h4>Sources:</h4>
          <ol>
            {sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title}
                </a>
                {source.path && <span className="source-path"> ({source.path})</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
```

**Code Walkthrough**:

**Line 23**: `split(/(\[\d+\])/g)`
- **Regex**: `/(\[\d+\])/` matches `[1]`, `[2]`, etc.
- **Capture Group**: `()` includes matched citations in output array
- **Global Flag**: `g` finds all matches, not just first

**Line 27**: `match(/\[(\d+)\]/)`
- Extract citation number from matched string
- `\d+` captures one or more digits

**Line 30-31**: Convert citation to array index
- Citations are 1-indexed (`[1]`, `[2]`)
- Arrays are 0-indexed (need `sourceIndex = num - 1`)

**Line 36-46**: Render citation as superscript link
- `<sup>`: Superscript for academic style
- `target="_blank"`: Open in new tab
- `rel="noopener noreferrer"`: Security (prevents reverse tabnapping)
- `title={source.title}`: Hover tooltip shows source title

**Line 51**: Render non-citation text
- Use `<span>` for consistent DOM structure
- Preserve whitespace and formatting

**Line 63-79**: Source bibliography
- Conditional rendering: only show if sources exist
- Ordered list for numbering alignment with citations
- Include optional path for additional context

**CSS** (`frontend/src/styles/citations.css`):

```css
/* Inline citation links */
.citation-link {
  color: #2563eb;              /* Blue for visibility */
  text-decoration: none;       /* No underline until hover */
  margin: 0 1px;               /* Spacing around citation */
  font-weight: 600;            /* Bold for emphasis */
}

.citation-link:hover {
  text-decoration: underline;  /* Visual feedback */
}

/* Source list container */
.sources-list {
  margin-top: 16px;            /* Separation from main content */
  padding: 12px;               /* Internal spacing */
  background: #f3f4f6;         /* Light gray background */
  border-radius: 8px;          /* Rounded corners */
  font-size: 14px;             /* Slightly smaller than body text */
}

.sources-list h4 {
  margin: 0 0 8px 0;           /* Spacing below heading */
  font-size: 14px;             /* Match list font size */
  color: #6b7280;              /* Muted color for secondary info */
}

.sources-list ol {
  margin: 0;                   /* Reset default margin */
  padding-left: 20px;          /* Indent for numbers */
}

.sources-list li {
  margin-bottom: 4px;          /* Spacing between sources */
}

/* Optional file path */
.source-path {
  color: #9ca3af;              /* Lighter gray for tertiary info */
  font-size: 12px;             /* Smaller than source title */
}
```

**Styling Philosophy**:
- **Hierarchy**: Main content > Source titles > File paths (size and color)
- **Interactivity**: Hover states for all links
- **Separation**: Visual distinction between content and sources
- **Accessibility**: Sufficient color contrast for readability

#### Step 3: Backend - Modify LangGraph State

**Purpose**: Extend state schema to include repository and source metadata.

**Design Considerations**:
- **Repository**: String parameter passed from frontend
- **Sources**: List of dictionaries with title, URL, path
- **Accumulation**: Messages accumulate (via `add_messages`), other fields override

**File**: `backend/src/agent/state.py`

```python
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    State schema for enhanced dialogue workflow.

    Attributes:
        messages: Conversation history (accumulated via add_messages reducer)
        repository: Knowledge base identifier (e.g., "cnb/docs")
        sources: Retrieved document metadata for citations
    """

    # Messages accumulate (don't override)
    messages: Annotated[list, add_messages]

    # Repository overrides on each update
    repository: str

    # Sources override on each retrieval
    sources: List[Dict]
```

**Code Walkthrough**:

**Line 13**: `Annotated[list, add_messages]`
- **Type**: List of messages (HumanMessage, AIMessage, etc.)
- **Reducer**: `add_messages` from LangGraph
  - New messages are appended, not replaced
  - Example:
    ```python
    # Current state: {"messages": [msg1, msg2]}
    # Node returns: {"messages": [msg3]}
    # New state: {"messages": [msg1, msg2, msg3]}  # Accumulated!
    ```

**Line 16**: `repository: str`
- No reducer annotation → default override behavior
- Example:
  ```python
  # Current state: {"repository": "cnb/docs"}
  # Node returns: {"repository": "user/custom"}
  # New state: {"repository": "user/custom"}  # Overridden!
  ```

**Line 19**: `sources: List[Dict]`
- Override on each retrieval (latest sources)
- Structure:
  ```python
  [
      {"id": 1, "title": "...", "url": "...", "path": "..."},
      {"id": 2, "title": "...", "url": "...", "path": "..."},
  ]
  ```

**Why This Design**:
- **Conversation History**: Accumulated messages maintain context across turns
- **Current Repository**: Overridden to reflect latest user selection
- **Fresh Sources**: Each query gets new sources (no stale references)

#### Step 4: Backend - Update CNB API Query Function

**Purpose**: Query CNB Knowledge Base with repository parameter and extract source metadata.

**Key Responsibilities**:
1. Authenticate with CNB API (Bearer token)
2. Send query with repository parameter
3. Extract and deduplicate sources
4. Handle errors gracefully

**File**: `backend/src/agent/cnb_retrieval.py`

```python
import os
import requests
from typing import List, Dict

def query_cnb_knowledge_base(
    query: str,
    repository: str = "cnb/docs",
    top_k: int = 5
) -> Dict:
    """
    Query CNB knowledge base with specified repository.

    Args:
        query: User's question
        repository: Repository name (e.g., "cnb/docs")
        top_k: Number of top results to return

    Returns:
        Dict with 'results' (list of chunks) and 'sources' (metadata)

    Example:
        {
            "results": [
                {"content": "...", "metadata": {...}},
                ...
            ],
            "sources": [
                {"id": 1, "title": "...", "url": "...", "path": "..."},
                ...
            ]
        }
    """
    # Retrieve token from environment
    cnb_token = os.getenv("CNB_TOKEN")
    if not cnb_token:
        raise ValueError("CNB_TOKEN not found in environment")

    # CNB API endpoint
    api_url = "https://api.cnb.cool/v1/knowledge-base/query"

    # Prepare request
    headers = {
        "Authorization": f"Bearer {cnb_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "repository": repository,
        "query": query,
        "top_k": top_k
    }

    try:
        # Make API request
        response = requests.post(api_url, json=payload, headers=headers)
        response.raise_for_status()  # Raise exception for 4xx/5xx
        data = response.json()

        # Extract sources with metadata
        sources = []
        seen_urls = set()  # For deduplication

        for idx, result in enumerate(data.get("results", [])):
            metadata = result.get("metadata", {})
            url = metadata.get("url", "")

            # Avoid duplicate sources (same URL from multiple chunks)
            if url and url not in seen_urls:
                sources.append({
                    "id": len(sources) + 1,  # 1-indexed for citations
                    "title": metadata.get("title", f"Source {len(sources) + 1}"),
                    "url": url,
                    "path": metadata.get("path", "")
                })
                seen_urls.add(url)

        return {
            "results": data.get("results", []),
            "sources": sources
        }

    except requests.RequestException as e:
        # Log error and return empty results
        print(f"CNB API error: {e}")
        return {"results": [], "sources": []}
```

**Code Walkthrough**:

**Line 33-35**: Environment variable retrieval
- **Security**: Never hardcode API keys
- **Configuration**: Use `.env` file for local development
- **Error Handling**: Fail fast if token missing (clear error message)

**Line 43-48**: Request payload
- **repository**: Dynamic knowledge base selection
- **query**: User's question (verbatim)
- **top_k**: Limit results (balance relevance vs context size)

**Line 52-54**: HTTP request with error handling
- **POST**: Send payload in request body
- **raise_for_status()**: Convert 4xx/5xx responses to exceptions
- **json()**: Parse response body as JSON

**Line 57-73**: Source extraction and deduplication
- **Problem**: Multiple chunks can reference same document
  - Example: 3 chunks from "LangGraph Introduction" → 1 source
- **Solution**: Track seen URLs in set, skip duplicates
- **ID Assignment**: 1-indexed for citation display (`[1]`, `[2]`)
- **Fallback Title**: If metadata missing, use "Source N"

**Line 79-82**: Error handling
- **Catch**: All network/HTTP errors
- **Log**: Print error for debugging (replace with proper logging in production)
- **Fallback**: Return empty results (graceful degradation)

**Why This Design**:
- **Deduplication**: User sees each unique source once
- **Graceful Errors**: API failures don't crash application
- **Structured Output**: Consistent return format for downstream nodes

#### Step 5: Backend - Update Retrieval Node in LangGraph

**Purpose**: Integrate CNB query function into LangGraph workflow and format results for LLM.

**Node Responsibilities**:
1. Extract query and repository from state
2. Call CNB API via `query_cnb_knowledge_base`
3. Format retrieved chunks as context
4. Update state with sources and context

**File**: `backend/src/agent/graph.py`

```python
from langchain_core.messages import HumanMessage, AIMessage
from .cnb_retrieval import query_cnb_knowledge_base

def retrieval_node(state: AgentState) -> AgentState:
    """
    Retrieve relevant documents from CNB knowledge base.

    Flow:
        1. Extract query (last user message)
        2. Extract repository from state
        3. Query CNB API
        4. Format results as context
        5. Update state with sources
    """
    messages = state["messages"]
    repository = state.get("repository", "cnb/docs")

    # Get the last user message
    last_message = messages[-1].content if messages else ""

    # Query CNB API with repository parameter
    result = query_cnb_knowledge_base(
        query=last_message,
        repository=repository,
        top_k=5
    )

    # Store sources in state (for citation rendering)
    state["sources"] = result["sources"]

    # Format context from results
    # Each chunk gets a citation number
    context = "\n\n".join([
        f"Source [{i+1}]: {chunk['content']}"
        for i, chunk in enumerate(result["results"])
    ])

    # Add context to messages for LLM
    return {
        **state,
        "context": context,
        "sources": result["sources"]
    }

def generate_node(state: AgentState) -> AgentState:
    """
    Generate answer with citations using LLM.

    Flow:
        1. Extract context and sources
        2. Build prompt with citation instructions
        3. Call LLM
        4. Format response with sources
    """
    context = state.get("context", "")
    sources = state.get("sources", [])
    messages = state["messages"]
    last_message = messages[-1].content

    # Prompt with citation instructions
    prompt = f"""Based on the following context, answer the question.
When referencing information, use citation format like [1], [2], etc.

Context:
{context}

Question: {last_message}

Answer (with citations):"""

    # Call LLM (replace with your configured LLM)
    response = llm.invoke(prompt)

    # Format response with sources for frontend
    answer_with_sources = {
        "content": response.content,
        "sources": sources
    }

    # Add to conversation history
    return {
        **state,
        "messages": messages + [AIMessage(content=str(answer_with_sources))]
    }
```

**Code Walkthrough**:

**Retrieval Node**:

**Line 17**: Extract repository with fallback
- `state.get("repository", "cnb/docs")`: Default if not set
- Allows workflow to function without explicit repository parameter

**Line 20**: Extract last message
- Conversation context: `messages = [HumanMessage("Hi"), AIMessage("Hello"), HumanMessage("What is X?")]`
- Last message: `"What is X?"` (what we want to query)

**Line 23-27**: Call CNB API
- Pass extracted query and repository
- `top_k=5`: Balance between relevance and context size
  - Too few: Miss important information
  - Too many: Exceed LLM context window, add noise

**Line 30**: Store sources in state
- Needed later for citation rendering in frontend
- Persists across nodes

**Line 33-37**: Format context for LLM
- **Citation Numbering**: `Source [1]:`, `Source [2]:`, etc.
- **Why Number Sources?**: LLM learns to reference by number
- **Newlines**: Separate chunks for clarity

**Line 40-44**: Return state update
- **Spread Operator**: `{**state, ...}` preserves existing state
- **Updates**: Add `context` and `sources` fields
- **Immutability**: Original state unchanged (functional pattern)

**Generation Node**:

**Line 66-74**: Prompt engineering
- **Instruction**: "use citation format like [1], [2]"
- **Context**: Numbered sources
- **Clear Task**: "Answer (with citations):"
- **Why Explicit?**: LLMs follow instructions better with examples

**Line 77**: LLM invocation
- Replace `llm` with your configured model (e.g., `ChatOllama`, `ChatOpenAI`)
- Consider temperature:
  - Lower (0.3): More focused, factual
  - Higher (0.7): More creative, varied

**Line 80-83**: Structure response
- **content**: LLM-generated text (with `[1]`, `[2]`)
- **sources**: Metadata from retrieval
- **Format**: Dict → JSON for frontend parsing

**Line 86-89**: Update conversation
- Add AI response to message history
- Convert dict to string for message content
- Frontend will parse JSON from string

**Why This Design**:
- **Separation of Concerns**: Retrieval ≠ Generation
- **Testability**: Each node independently testable
- **Reusability**: Nodes reusable in other workflows
- **Clarity**: Single responsibility per node

#### Step 6: Frontend - Update Message Display

**Purpose**: Parse backend responses and render with citations.

**Challenge**: Backend returns JSON as string in message content.

**Solution**: Try parsing as JSON; if successful, extract content and sources; otherwise, render as plain text.

Update your message rendering to use `CitationRenderer`:

```tsx
import { CitationRenderer } from './components/CitationRenderer';

function MessageDisplay({ message }) {
  // Parse response if it contains sources
  let content = message.content;
  let sources = [];

  try {
    // Attempt to parse as JSON
    const parsed = JSON.parse(message.content);

    // Check if it has citation structure
    if (parsed.content && parsed.sources) {
      content = parsed.content;
      sources = parsed.sources;
    }
  } catch {
    // Not JSON, use as-is (plain text message)
  }

  return (
    <div className="message">
      <CitationRenderer content={content} sources={sources} />
    </div>
  );
}
```

**Code Walkthrough**:

**Line 5-6**: Initialize default values
- Assume plain text (no citations)
- Fallback if parsing fails

**Line 9-16**: Attempt JSON parsing
- **Try Block**: Parse might fail if content is plain text
- **Validation**: Check for `content` and `sources` fields
  - Prevents false positives from other JSON structures
- **Extraction**: Separate content and sources

**Line 17-19**: Error handling
- **Catch Block**: Silent failure (expected for plain text)
- **Result**: `content` and `sources` remain at defaults
- **Why Silent?**: Not all messages have citations (user messages, errors, etc.)

**Line 21-25**: Render with CitationRenderer
- **Unified Component**: Handles both plain text and citations
- **Conditional Rendering**: CitationRenderer shows sources only if array not empty

**Why This Design**:
- **Backward Compatibility**: Works with both citation and non-citation messages
- **Graceful Degradation**: Invalid JSON → plain text display
- **Type Safety**: Check for expected fields before using

### 3.3 Testing Guide

**Testing Philosophy**: Validate each layer independently, then test integration.

**Test Cases:**

#### 1. Repository Switching

**Objective**: Verify that repository parameter is passed correctly through the stack.

```
Test Steps:
1. Start with default repository "cnb/docs"
2. Enter a query and observe response
3. Change repository to "user/custom" via selector
4. Enter same query
5. Observe different response (if knowledge bases differ)

Validation Points:
- [ ] Repository selector updates UI when changed
- [ ] Network tab shows correct repository in API request body
- [ ] Backend receives correct repository parameter
- [ ] CNB API query uses correct repository
- [ ] Response sources come from correct knowledge base

Debugging:
- Check browser DevTools > Network tab
- Inspect request payload: should contain {"repository": "user/custom"}
- Check backend logs for repository value
```

**Manual Test**:
```bash
# Terminal 1: Start backend with logging
cd backend
LOG_LEVEL=DEBUG python -m uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev

# Browser:
# 1. Open DevTools > Network tab
# 2. Ask: "What is LangGraph?"
# 3. Check request payload in Network tab
# 4. Change repository and repeat
```

#### 2. Citation Display

**Objective**: Ensure citations are parsed, rendered, and linked correctly.

```
Test Steps:
1. Ask a question that requires multiple sources
   Example: "Explain LangGraph state management and conditional edges"
2. Observe response contains [1], [2], etc.
3. Hover over citation links (should show tooltip)
4. Click citation link (should open source in new tab)
5. Scroll to source list (should match citation numbers)

Validation Points:
- [ ] Citations appear as superscript
- [ ] Citations are clickable
- [ ] Citations open correct URL in new tab
- [ ] Source list matches citation numbers
- [ ] Source titles are descriptive
- [ ] No broken links

Edge Cases:
- [ ] Response with no citations (no sources shown)
- [ ] Response with 10+ citations (proper numbering)
- [ ] Citation in middle of sentence (proper spacing)
- [ ] Multiple citations in a row "[1][2]" (readable)
```

**Automated Test** (Frontend):
```tsx
import { render, screen } from '@testing-library/react';
import { CitationRenderer } from './CitationRenderer';

test('renders citations as clickable links', () => {
  const content = "LangGraph uses TypedDict [1] and supports edges [2].";
  const sources = [
    { id: 1, title: "State Management", url: "https://..." },
    { id: 2, title: "Edges", url: "https://..." }
  ];

  render(<CitationRenderer content={content} sources={sources} />);

  // Check citations are rendered
  const citation1 = screen.getByText('[1]');
  const citation2 = screen.getByText('[2]');

  expect(citation1).toBeInTheDocument();
  expect(citation2).toBeInTheDocument();

  // Check links are correct
  expect(citation1.closest('a')).toHaveAttribute('href', sources[0].url);
  expect(citation2.closest('a')).toHaveAttribute('href', sources[1].url);
});

test('handles content with no citations', () => {
  const content = "Plain text without citations.";
  const sources = [];

  render(<CitationRenderer content={content} sources={sources} />);

  // Check no citations are rendered
  expect(screen.queryByText(/\[\d+\]/)).not.toBeInTheDocument();

  // Check sources list is not shown
  expect(screen.queryByText('Sources:')).not.toBeInTheDocument();
});
```

#### 3. Citation Numbering

**Objective**: Verify citation numbers are consistent and independent per message.

```
Test Scenario:
1. Ask Question 1: "What is LangGraph?"
   Response: "LangGraph is a framework [1] for stateful applications [2]."
   Sources: [1] Intro, [2] State Docs

2. Ask Question 2: "What is RAG?"
   Response: "RAG combines retrieval [1] with generation [2]."
   Sources: [1] RAG Overview, [2] Architecture

Validation:
- [ ] Each response has independent citation numbering (both start at [1])
- [ ] Source lists match respective citations
- [ ] No citation conflicts or carryover between messages

Edge Case:
- [ ] Ask 10 questions in a row
- [ ] Verify last message still has correct citations
- [ ] Check no citation number overflow or collision
```

#### 4. Error Handling

**Objective**: Ensure graceful degradation on failures.

```
Test Scenarios:

A. Invalid Repository
   1. Enter non-existent repository "invalid/repo"
   2. Ask question
   Expected:
   - [ ] Backend returns empty results
   - [ ] Frontend shows user-friendly message
   - [ ] No application crash
   - [ ] User can recover by switching repository

B. Network Failure
   1. Disconnect network
   2. Ask question
   Expected:
   - [ ] Timeout or connection error
   - [ ] Error message displayed
   - [ ] Retry mechanism available

C. Malformed API Response
   1. Mock CNB API to return invalid JSON
   2. Ask question
   Expected:
   - [ ] Backend catches parsing error
   - [ ] Returns empty results
   - [ ] Frontend displays fallback message

D. Missing Citations
   1. Configure LLM to skip citations
   2. Ask question
   Expected:
   - [ ] Response displays without citations
   - [ ] Source list still shown (if sources retrieved)
   - [ ] No parsing errors
```

**Automated Test** (Backend):
```python
import pytest
from agent.cnb_retrieval import query_cnb_knowledge_base

def test_invalid_repository():
    result = query_cnb_knowledge_base(
        query="test",
        repository="invalid/repo"
    )

    # Should return empty results, not raise exception
    assert result["results"] == []
    assert result["sources"] == []

def test_missing_api_token(monkeypatch):
    # Remove CNB_TOKEN from environment
    monkeypatch.delenv("CNB_TOKEN", raising=False)

    with pytest.raises(ValueError, match="CNB_TOKEN not found"):
        query_cnb_knowledge_base(query="test")
```

### 3.4 Common Issues & Solutions

| Issue | Cause | Solution | Prevention |
|-------|-------|----------|------------|
| **Citations not clickable** | Missing URL in metadata | Check CNB API response format; add fallback URL | Validate API response structure in retrieval node |
| **Duplicate sources** | Same URL appearing multiple times | Deduplicate by URL (see code above) | Implement deduplication in `query_cnb_knowledge_base` |
| **Repository switch not working** | State not propagated to API | Verify repository passed in request body; check backend state extraction | Add logging to track repository value through stack |
| **Citations misaligned** | LLM not following citation format | Improve prompt with examples; validate LLM output | Add post-processing to renumber citations |
| **Broken citation links** | Invalid URLs from API or missing metadata | Validate URLs before rendering; provide fallback | Implement URL validation in source extraction |
| **Slow repository switching** | Re-fetching all data on switch | Implement caching by repository | Use LRU cache with repository as key |
| **Citations in code blocks** | Regex matches `[1]` in code | Exclude code blocks from citation replacement | Parse markdown structure before citation replacement |
| **Multiple citations display badly** | `[1][2][3]` no spacing | Add margin in CSS | Test edge cases with consecutive citations |

**Debugging Workflow**:

```
1. Frontend Issue?
   → Check browser console for errors
   → Inspect React component state (React DevTools)
   → Verify API response format (Network tab)

2. Backend Issue?
   → Check backend logs
   → Verify state at each node (add debug prints)
   → Test CNB API directly (curl or Postman)

3. CNB API Issue?
   → Check API documentation for changes
   → Verify token is valid and has correct permissions
   → Test with different repositories
```

---

## 🔬 Scenario 2: DeepResearch (⭐⭐⭐)

**Goal**: Implement an advanced multi-round retrieval system that iteratively gathers information until sufficient to answer complex questions.

**Key Features**:
1. **Multi-Round Retrieval**: Multiple iterations of query → retrieval → reflection
2. **Structured Reports**: Comprehensive, well-organized research outputs
3. **Streaming**: Real-time progress updates during research

**Complexity Factors**:
- **State Management**: Track iterations, accumulated results, reflection outcomes
- **Conditional Logic**: Dynamic routing based on information sufficiency
- **Streaming Protocol**: SSE for real-time updates
- **Context Management**: Handle growing context across iterations

### 4.1 Architecture Overview

```
User Question
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Workflow                       │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │Query         │─────▶│Retrieval     │                   │
│  │Generation    │      │Node          │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                     │                             │
│         │                     ▼                             │
│         │              ┌──────────────┐                    │
│         │              │Reflection    │                    │
│         │              │Node          │                    │
│         │              └──────────────┘                    │
│         │                     │                             │
│         │          ┌──────────┴──────────┐                │
│         │          │                      │                │
│         │    Sufficient?             Needs more?           │
│         │          │                      │                │
│         │          ▼                      │                │
│         │   ┌──────────────┐            │                │
│         └───│Answer        │◀────────────┘                │
│             │Generation    │                               │
│             └──────────────┘                               │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     ▼
              Final Report
```

#### Multi-Round Retrieval Concept

**Problem with Single-Round RAG**:
- Complex questions require information from multiple sources
- Single query may miss important aspects
- Context insufficiency leads to incomplete answers

**Multi-Round Solution**:

**Iteration 1**:
```
Query: "Compare microservices vs monolithic architectures"
Generated Queries:
  1. "microservices architecture benefits drawbacks"
  2. "monolithic architecture characteristics"
Retrieved: 5 chunks about microservices, 3 chunks about monoliths
Reflection: "Missing deployment and scaling information"
Decision: CONTINUE
```

**Iteration 2**:
```
Generated Queries:
  1. "microservices deployment strategies"
  2. "monolithic application scaling"
Retrieved: 4 chunks about deployment, 4 chunks about scaling
Reflection: "Good coverage of technical aspects, but missing organizational impact"
Decision: CONTINUE
```

**Iteration 3**:
```
Generated Queries:
  1. "microservices team organization Conway's law"
  2. "monolithic vs microservices team structure"
Retrieved: 5 chunks about team structures
Reflection: "Comprehensive information gathered across technical and organizational dimensions"
Decision: ANSWER
```

**Final Report**: Synthesize all 21 chunks into comprehensive comparison

#### Workflow Node Detailed Explanation

##### 1. Query Generation Node

**Purpose**: Create targeted search queries to fill information gaps.

**Iteration Strategies**:
- **First Iteration**: Broad exploratory queries from original question
- **Subsequent Iterations**: Targeted queries based on gaps identified in reflection

**Example Evolution**:
```
Original Question: "How does LangGraph work?"

Iteration 1 Queries:
- "LangGraph architecture"
- "LangGraph state management"

Iteration 2 Queries (after reflection identifies gaps):
- "LangGraph conditional edges"
- "LangGraph vs LangChain differences"

Iteration 3 Queries:
- "LangGraph streaming support"
- "LangGraph checkpoint persistence"
```

##### 2. Retrieval Node

**Purpose**: Execute queries against knowledge base and accumulate results.

**Key Features**:
- **Parallelization**: Query multiple sources concurrently
- **Accumulation**: Add to existing results (don't override)
- **Deduplication**: Prevent redundant sources across iterations

**Accumulation Logic**:
```python
# Iteration 1: results = [chunk1, chunk2, chunk3]
# Iteration 2: results = [chunk1, chunk2, chunk3, chunk4, chunk5, chunk6]
# Iteration 3: results = [chunk1, ..., chunk6, chunk7, chunk8, chunk9]
```

##### 3. Reflection Node

**Purpose**: Assess information quality and decide whether to continue or answer.

**Assessment Criteria**:
1. **Coverage**: Do we have information on all aspects of the question?
2. **Depth**: Is the information detailed enough?
3. **Consistency**: Are there contradictions that need resolution?
4. **Iteration Limit**: Have we reached max iterations?

**Decision Logic**:
```python
if iteration >= max_iterations:
    decision = "ANSWER"  # Force stop
elif coverage < 0.7:
    decision = "CONTINUE"
elif contradictions_detected:
    decision = "CONTINUE"  # Need clarification
else:
    decision = "ANSWER"  # Sufficient information
```

##### 4. Answer Generation Node

**Purpose**: Synthesize all gathered information into comprehensive report.

**Report Structure**:
```markdown
# [Question]

## Executive Summary
[High-level answer in 2-3 sentences]

## Main Findings
- Key Point 1 [1][2]
- Key Point 2 [3][4]
- Key Point 3 [5][6]

## Detailed Analysis

### Aspect 1
[Comprehensive explanation with citations]

### Aspect 2
[Comprehensive explanation with citations]

## Conclusions
[Summary and implications]

## Sources
[Numbered list of all sources]
```

**Workflow Nodes:**
1. **Query Generation**: Break user question into sub-queries
2. **Retrieval**: Search knowledge base with generated queries
3. **Reflection**: Assess information sufficiency
4. **Answer Generation**: Synthesize comprehensive report

### 4.2 LangGraph Workflow Design

#### State Schema Design Philosophy

**Principles**:
1. **Completeness**: State must contain all information needed by any node
2. **Clarity**: Each field has single, clear purpose
3. **Efficiency**: Avoid redundant data storage
4. **Debuggability**: State should be human-readable

**File**: `backend/src/agent/deep_research_state.py`

```python
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph.message import add_messages

class DeepResearchState(TypedDict):
    """
    State for deep research workflow.

    This state schema supports multi-round retrieval with reflection.
    All nodes read from and update this shared state.
    """

    # ========== User Input ==========
    original_question: str
    """
    The user's original research question.
    Preserved throughout workflow for reference.
    """

    # ========== Conversation ==========
    messages: Annotated[list, add_messages]
    """
    Conversation history with messages accumulated.
    Includes user queries and assistant responses.
    """

    # ========== Query Management ==========
    generated_queries: List[str]
    """
    Search queries generated in current iteration.
    Updated by query_generation_node.
    Example: ["query 1", "query 2", "query 3"]
    """

    # ========== Retrieval Results ==========
    all_retrieval_results: List[Dict]
    """
    Accumulated retrieval results from all iterations.
    Each dict contains chunk content and metadata.
    Grows with each iteration.
    Example: [
        {"content": "...", "metadata": {...}},
        {"content": "...", "metadata": {...}},
    ]
    """

    all_sources: List[Dict]
    """
    Deduplicated source metadata from all retrievals.
    Used for final citation rendering.
    Example: [
        {"id": 1, "title": "...", "url": "..."},
        {"id": 2, "title": "...", "url": "..."},
    ]
    """

    # ========== Reflection ==========
    reflection: Dict
    """
    Assessment of information sufficiency.
    Updated by reflection_node.
    Structure: {
        "assessment": "text explanation",
        "should_continue": bool,
        "iteration": int
    }
    """

    # ========== Iteration Control ==========
    iteration: int
    """
    Current iteration number (0-indexed).
    Incremented by query_generation_node.
    """

    max_iterations: int
    """
    Maximum iterations before forced termination.
    Prevents infinite loops.
    Typical value: 3-5
    """

    # ========== Output ==========
    final_report: str
    """
    The comprehensive research report.
    Generated by answer_generation_node.
    """

    # ========== Configuration ==========
    repository: str
    """
    Knowledge base repository to query.
    Example: "cnb/docs"
    """
```

**State Design Rationale**:

**original_question**:
- **Why Store Separately?**: Messages accumulate (questions + answers), but we need the original question for query generation
- **Immutable**: Never changes throughout workflow

**generated_queries**:
- **Override Behavior**: Each iteration generates new queries (don't accumulate)
- **Why List?**: Multiple queries per iteration for comprehensive coverage

**all_retrieval_results** and **all_sources**:
- **Accumulation**: Grow with each iteration
- **Separation**: Results (for context) vs Sources (for citations)
- **Deduplication**: Sources deduplicated by URL to avoid repetitive references

**reflection**:
- **Dictionary**: Flexible structure for assessment metadata
- **Keys**: `assessment` (text), `should_continue` (bool), `iteration` (int)

**iteration** and **max_iterations**:
- **Loop Control**: Essential for conditional routing
- **Safety**: `max_iterations` prevents infinite loops

#### Node Implementations with Detailed Explanations

**File**: `backend/src/agent/deep_research_nodes.py`

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from .cnb_retrieval import query_cnb_knowledge_base
from .deep_research_state import DeepResearchState

# ========== Node 1: Query Generation ==========

def query_generation_node(state: DeepResearchState) -> DeepResearchState:
    """
    Generate search queries based on original question and previous results.

    Strategy:
    - First iteration: Generate broad exploratory queries
    - Later iterations: Generate targeted queries for gaps

    Args:
        state: Current workflow state

    Returns:
        Updated state with generated_queries and incremented iteration
    """
    original_question = state["original_question"]
    iteration = state.get("iteration", 0)
    previous_results = state.get("all_retrieval_results", [])

    # ===== First Iteration: Broad Queries =====
    if iteration == 0:
        prompt = f"""Given the following research question, generate 2-3 specific search queries
to find relevant information.

Research Question: {original_question}

Generate focused, specific queries (one per line):"""

    # ===== Subsequent Iterations: Gap-Filling Queries =====
    else:
        # Provide context from recent results
        existing_info = "\n".join([
            r.get("content", "")[:200]  # First 200 chars for context
            for r in previous_results[-3:]  # Last 3 results
        ])

        prompt = f"""Research Question: {original_question}

We have gathered some information:
{existing_info}

What specific queries would help fill gaps in our understanding?
Generate 1-2 additional focused queries (one per line):"""

    # ===== LLM Call =====
    # Use faster model for efficiency (query generation is simple task)
    response = fast_llm.invoke(prompt)

    # ===== Parse Queries =====
    # Split by newline, filter empty lines
    queries = [q.strip() for q in response.content.split('\n') if q.strip()]

    # ===== Return State Update =====
    return {
        **state,
        "generated_queries": queries,
        "iteration": iteration + 1  # Increment iteration counter
    }


# ========== Node 2: Retrieval ==========

def retrieval_node(state: DeepResearchState) -> DeepResearchState:
    """
    Retrieve documents for all generated queries and accumulate results.

    Features:
    - Retrieves for each generated query
    - Accumulates results across iterations
    - Deduplicates sources by URL

    Args:
        state: Current workflow state

    Returns:
        Updated state with accumulated results and sources
    """
    queries = state["generated_queries"]
    repository = state.get("repository", "cnb/docs")

    # Get existing accumulated data
    all_retrieval_results = state.get("all_retrieval_results", [])
    all_sources = state.get("all_sources", [])

    # ===== Retrieve for Each Query =====
    for query in queries:
        result = query_cnb_knowledge_base(
            query=query,
            repository=repository,
            top_k=3  # Fewer per query since we have multiple queries
        )

        # Accumulate results
        all_retrieval_results.extend(result["results"])

        # ===== Deduplicate Sources =====
        # Track existing URLs to avoid duplicates
        existing_urls = {s["url"] for s in all_sources}

        for source in result["sources"]:
            if source["url"] not in existing_urls:
                # Assign new ID based on current sources count
                source["id"] = len(all_sources) + 1
                all_sources.append(source)
                existing_urls.add(source["url"])

    # ===== Return State Update =====
    return {
        **state,
        "all_retrieval_results": all_retrieval_results,
        "all_sources": all_sources
    }


# ========== Node 3: Reflection ==========

def reflection_node(state: DeepResearchState) -> DeepResearchState:
    """
    Assess if gathered information is sufficient to answer the question.

    Assessment Criteria:
    1. Coverage: All aspects addressed?
    2. Depth: Sufficient detail?
    3. Consistency: No contradictions?
    4. Iteration limit: Max iterations reached?

    Args:
        state: Current workflow state

    Returns:
        Updated state with reflection assessment
    """
    original_question = state["original_question"]
    all_results = state.get("all_retrieval_results", [])
    iteration = state["iteration"]
    max_iterations = state.get("max_iterations", 3)

    # ===== Prepare Context Summary =====
    # Use only recent results for efficiency
    context_summary = "\n\n".join([
        f"Chunk {i+1}: {r.get('content', '')[:300]}..."
        for i, r in enumerate(all_results[-10:])  # Last 10 chunks
    ])

    # ===== Reflection Prompt =====
    prompt = f"""Research Question: {original_question}

Gathered Information (Iteration {iteration}):
{context_summary}

Assessment Task:
1. Is the information sufficient to comprehensively answer the research question?
2. What key aspects are still missing (if any)?
3. Recommendation: CONTINUE searching or ANSWER now?

Provide your assessment:"""

    # ===== LLM Call =====
    # Use reasoning model (higher quality for assessment task)
    response = reasoning_llm.invoke(prompt)

    # ===== Parse Decision =====
    reflection_text = response.content.lower()

    # Check for continue indicators and iteration limit
    should_continue = (
        # Check for continue keywords
        ("continue" in reflection_text or
         "more" in reflection_text or
         "insufficient" in reflection_text)
        # AND not at max iterations
        and iteration < max_iterations
    )

    # ===== Return State Update =====
    return {
        **state,
        "reflection": {
            "assessment": response.content,
            "should_continue": should_continue,
            "iteration": iteration
        }
    }


# ========== Node 4: Answer Generation ==========

def answer_generation_node(state: DeepResearchState) -> DeepResearchState:
    """
    Generate comprehensive research report from all gathered information.

    Report Structure:
    - Executive Summary
    - Main Findings
    - Detailed Analysis
    - Conclusions
    - Sources

    Args:
        state: Current workflow state

    Returns:
        Updated state with final_report
    """
    original_question = state["original_question"]
    all_results = state.get("all_retrieval_results", [])
    all_sources = state.get("all_sources", [])

    # ===== Prepare Full Context =====
    context = "\n\n".join([
        f"[Source {i+1}]: {r.get('content', '')}"
        for i, r in enumerate(all_results)
    ])

    # ===== Answer Generation Prompt =====
    prompt = f"""You are a research analyst. Based on the gathered information below,
write a comprehensive, well-structured report answering the research question.

Research Question: {original_question}

Gathered Information:
{context}

Instructions:
1. Provide a clear, structured answer
2. Use markdown formatting (headers, lists, etc.)
3. Cite sources using [1], [2], etc.
4. Include:
   - Executive Summary (2-3 sentences)
   - Main Findings (bulleted list with citations)
   - Detailed Analysis (organized by themes/aspects)
   - Conclusions (implications and takeaways)

Research Report:"""

    # ===== LLM Call =====
    # Use powerful model for high-quality final output
    response = powerful_llm.invoke(prompt)

    # ===== Format Final Output =====
    final_output = {
        "report": response.content,
        "sources": all_sources,
        "iterations": state["iteration"]
    }

    # ===== Return State Update =====
    return {
        **state,
        "final_report": str(final_output),
        "messages": state["messages"] + [AIMessage(content=str(final_output))]
    }
```

**Node Implementation Details**:

**Query Generation**:
- **Adaptive Prompting**: Different prompts for first vs later iterations
- **Context Window**: Only recent results (last 3) to avoid overwhelming LLM
- **Query Parsing**: Simple newline split (could be enhanced with structured output)

**Retrieval**:
- **Loop Through Queries**: Sequential execution (could be parallelized with async)
- **Accumulation**: `extend()` adds to existing list
- **Deduplication**: Set of existing URLs prevents duplicates
- **ID Reassignment**: Continuous numbering across iterations

**Reflection**:
- **Keyword Detection**: Simple text matching (could use structured output)
- **Safety Limit**: `and iteration < max_iterations` prevents infinite loops
- **Context Pruning**: Only last 10 chunks to stay within context window

**Answer Generation**:
- **Full Context**: Include all accumulated results
- **Structured Prompt**: Clear instructions for report format
- **JSON Output**: Structured for frontend parsing

#### Conditional Logic and Routing

**Purpose**: Decide whether to continue research or generate final answer.

**File**: `backend/src/agent/deep_research_graph.py`

```python
from langgraph.graph import StateGraph, END
from .deep_research_state import DeepResearchState
from .deep_research_nodes import (
    query_generation_node,
    retrieval_node,
    reflection_node,
    answer_generation_node
)

# ========== Routing Function ==========

def should_continue_research(state: DeepResearchState) -> str:
    """
    Determine next step based on reflection assessment.

    Decision Logic:
    - If should_continue = True: Loop back to query generation
    - If should_continue = False: Proceed to answer generation

    Args:
        state: Current workflow state

    Returns:
        "continue" or "answer" (edge name)
    """
    reflection = state.get("reflection", {})

    if reflection.get("should_continue", False):
        return "continue"  # Go back to query generation
    else:
        return "answer"    # Proceed to answer generation


# ========== Build Graph ==========

# Initialize state graph
workflow = StateGraph(DeepResearchState)

# ===== Add Nodes =====
workflow.add_node("query_generation", query_generation_node)
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("reflection", reflection_node)
workflow.add_node("answer_generation", answer_generation_node)

# ===== Add Edges =====

# Set entry point
workflow.set_entry_point("query_generation")

# Sequential edges
workflow.add_edge("query_generation", "retrieval")
workflow.add_edge("retrieval", "reflection")

# ===== Conditional Edge from Reflection =====
workflow.add_conditional_edges(
    "reflection",              # Source node
    should_continue_research,  # Routing function
    {
        "continue": "query_generation",  # Loop back
        "answer": "answer_generation"    # Proceed to end
    }
)

# Terminal edge
workflow.add_edge("answer_generation", END)

# ===== Compile Graph =====
deep_research_graph = workflow.compile()
```

**Graph Structure Visualization**:

```
                     ┌─────────────────┐
                     │ query_generation│
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   retrieval     │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   reflection    │
                     └────────┬────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
         should_continue?          sufficient?
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌─────────────────┐
         │ query_generation │  │answer_generation│
         │  (loop back)     │  └────────┬────────┘
         └──────────────────┘           │
                                        ▼
                                      [END]
```

**Execution Flow Example**:

```python
# Initial state
initial_state = {
    "original_question": "Compare microservices vs monolithic architectures",
    "messages": [],
    "generated_queries": [],
    "all_retrieval_results": [],
    "all_sources": [],
    "reflection": {},
    "iteration": 0,
    "max_iterations": 3,
    "final_report": "",
    "repository": "cnb/docs"
}

# Execute graph
result = deep_research_graph.invoke(initial_state)

# Execution trace:
# 1. query_generation → generates ["microservices architecture", "monolithic architecture"]
# 2. retrieval → retrieves 6 chunks
# 3. reflection → assesses "CONTINUE" (missing deployment info)
# 4. query_generation → generates ["microservices deployment", "monolithic scaling"]
# 5. retrieval → retrieves 6 more chunks (total 12)
# 6. reflection → assesses "CONTINUE" (missing team organization info)
# 7. query_generation → generates ["microservices team structure"]
# 8. retrieval → retrieves 3 more chunks (total 15)
# 9. reflection → assesses "ANSWER" (sufficient information)
# 10. answer_generation → generates comprehensive report
# 11. END
```

### 4.3 Streaming Implementation

**Purpose**: Provide real-time feedback to users during long-running research.

**Benefits**:
- **Transparency**: Users see what's happening
- **Engagement**: Progress indicators keep users engaged
- **Debugging**: Developers can monitor workflow execution
- **UX**: Perceived performance improvement

#### Backend Streaming Architecture

**File**: `backend/src/agent/deep_research_api.py`

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from .deep_research_graph import deep_research_graph
from .deep_research_state import DeepResearchState
import json
import asyncio

app = FastAPI()

@app.post("/api/deep-research")
async def deep_research_endpoint(request: dict):
    """
    Streaming endpoint for deep research workflow.

    Protocol: Server-Sent Events (SSE)

    Event Types:
    - progress: Node execution updates
    - complete: Final research report
    - error: Error information

    Args:
        request: {"question": str, "repository": str}

    Returns:
        StreamingResponse with SSE events
    """
    question = request.get("question")
    repository = request.get("repository", "cnb/docs")

    async def event_generator():
        """
        Generate SSE events for each workflow step.

        Yields:
            SSE-formatted strings with JSON payloads
        """

        try:
            # ===== Initialize State =====
            initial_state: DeepResearchState = {
                "original_question": question,
                "messages": [],
                "generated_queries": [],
                "all_retrieval_results": [],
                "all_sources": [],
                "reflection": {},
                "iteration": 0,
                "max_iterations": 3,
                "final_report": "",
                "repository": repository
            }

            # ===== Stream Graph Execution =====
            # LangGraph astream yields events for each node
            async for event in deep_research_graph.astream(initial_state):
                # Event structure: {node_name: node_output_state}
                for node_name, node_output in event.items():

                    # ===== Format Progress Event =====
                    progress_event = {
                        "type": "progress",
                        "node": node_name,
                        "data": {
                            "iteration": node_output.get("iteration", 0),
                            "queries": node_output.get("generated_queries", []),
                            "reflection": node_output.get("reflection", {}),
                            "sources_count": len(node_output.get("all_sources", []))
                        }
                    }

                    # ===== Send SSE Event =====
                    # Format: "data: <json>\n\n"
                    yield f"data: {json.dumps(progress_event)}\n\n"

                    # ===== Optional: Flush Delay =====
                    # Give client time to process
                    await asyncio.sleep(0.1)

            # ===== Send Final Result =====
            final_event = {
                "type": "complete",
                "data": initial_state.get("final_report", "")
            }
            yield f"data: {json.dumps(final_event)}\n\n"

        except Exception as e:
            # ===== Error Handling =====
            error_event = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    # ===== Return Streaming Response =====
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
```

**Key Implementation Details**:

**Line 36**: `async for event in deep_research_graph.astream(initial_state)`
- **LangGraph Streaming**: Built-in support for node-by-node streaming
- **Event Structure**: `{node_name: node_output_state}`
- **Async**: Non-blocking execution

**Line 43-50**: Progress event formatting
- **Selective Data**: Don't send entire state (too large)
- **Relevant Fields**: iteration, queries, reflection, sources_count
- **Client-Friendly**: Structured for easy frontend parsing

**Line 54**: SSE format: `data: <json>\n\n`
- **Standard**: SSE protocol requires this format
- **Double Newline**: Signals end of event

**Line 57**: Optional delay
- **Buffering**: Ensure events are sent separately
- **Client Processing**: Give frontend time to update UI

**Line 69-73**: Error handling
- **Graceful Degradation**: Send error as SSE event, not HTTP error
- **Client Recovery**: Frontend can display error and allow retry

**Line 79-83**: Response headers
- **Cache-Control**: Prevent caching of stream
- **Connection**: Keep connection alive
- **X-Accel-Buffering**: Disable proxy buffering (for nginx/Apache)

#### Frontend Streaming Handling

**File**: `frontend/src/components/DeepResearch.tsx`

```tsx
import { useState } from 'react';

// ========== Type Definitions ==========

interface ProgressStep {
  node: string;        // Node name (e.g., "retrieval")
  iteration: number;   // Current iteration
  queries?: string[];  // Generated queries (if available)
  reflection?: any;    // Reflection assessment (if available)
  sourcesCount?: number; // Number of sources accumulated
}

// ========== Main Component ==========

export function DeepResearch() {
  // ===== State Management =====
  const [question, setQuestion] = useState('');
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Start Research =====
  const startResearch = async () => {
    // Reset state
    setIsResearching(true);
    setProgress([]);
    setFinalReport('');
    setError(null);

    try {
      // ===== Fetch with Streaming =====
      const response = await fetch('/api/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      // ===== Check Response Status =====
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ===== Setup Stream Reader =====
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';  // Buffer for partial chunks

      // ===== Read Stream =====
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;  // Stream ended

        // ===== Decode Chunk =====
        buffer += decoder.decode(value, { stream: true });

        // ===== Process Complete Events =====
        // SSE events are separated by double newlines
        const lines = buffer.split('\n');

        // Keep last line in buffer (might be incomplete)
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              // ===== Parse Event Data =====
              const data = JSON.parse(line.slice(6));  // Remove "data: " prefix

              // ===== Handle Event Types =====
              if (data.type === 'progress') {
                // Update progress display
                setProgress(prev => [...prev, {
                  node: data.node,
                  iteration: data.data.iteration,
                  queries: data.data.queries,
                  reflection: data.data.reflection,
                  sourcesCount: data.data.sources_count
                }]);

              } else if (data.type === 'complete') {
                // Display final report
                setFinalReport(data.data);
                setIsResearching(false);

              } else if (data.type === 'error') {
                // Display error
                setError(data.message);
                setIsResearching(false);
              }

            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError);
            }
          }
        }
      }

    } catch (fetchError) {
      setError(fetchError.message);
      setIsResearching(false);
    }
  };

  // ===== UI Helper Functions =====

  const getNodeLabel = (node: string): string => {
    const labels: Record<string, string> = {
      'query_generation': '🔍 Generating Search Queries',
      'retrieval': '📚 Searching Knowledge Base',
      'reflection': '🤔 Analyzing Information',
      'answer_generation': '📝 Writing Report'
    };
    return labels[node] || node;
  };

  const getNodeDescription = (step: ProgressStep): string => {
    switch (step.node) {
      case 'query_generation':
        return `Generated ${step.queries?.length || 0} search queries`;
      case 'retrieval':
        return `Found ${step.sourcesCount || 0} sources`;
      case 'reflection':
        const shouldContinue = step.reflection?.should_continue;
        return shouldContinue ? 'Need more information' : 'Sufficient information gathered';
      case 'answer_generation':
        return 'Synthesizing comprehensive report';
      default:
        return '';
    }
  };

  // ===== Render ==========

  return (
    <div className="deep-research">
      {/* ===== Input Section ===== */}
      <div className="research-input">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your research question...&#10;Example: Compare microservices vs monolithic architectures"
          rows={4}
          disabled={isResearching}
        />
        <button
          onClick={startResearch}
          disabled={isResearching || !question.trim()}
        >
          {isResearching ? 'Researching...' : 'Start Research'}
        </button>
      </div>

      {/* ===== Error Display ===== */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ===== Progress Display ===== */}
      {progress.length > 0 && (
        <div className="research-progress">
          <h3>Research Progress</h3>

          {progress.map((step, idx) => (
            <div key={idx} className="progress-step">
              {/* Step Header */}
              <div className="step-header">
                <span className="step-icon">{getNodeLabel(step.node)}</span>
                <span className="step-iteration">Iteration {step.iteration}</span>
                <span className="step-description">{getNodeDescription(step)}</span>
              </div>

              {/* Queries List (if available) */}
              {step.queries && step.queries.length > 0 && (
                <ul className="queries-list">
                  {step.queries.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              )}

              {/* Reflection Details (if available) */}
              {step.reflection && (
                <div className="reflection-details">
                  <strong>Assessment:</strong>
                  <p>{step.reflection.assessment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== Final Report Display ===== */}
      {finalReport && (
        <div className="research-report">
          <h3>Research Report</h3>

          {/* Render report with citations */}
          <CitationRenderer
            content={JSON.parse(finalReport).report}
            sources={JSON.parse(finalReport).sources}
          />

          {/* Metadata */}
          <div className="report-metadata">
            <p>Completed in {JSON.parse(finalReport).iterations} iterations</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Frontend Implementation Details**:

**Line 51-56**: Stream reader setup
- **getReader()**: Get ReadableStream reader
- **TextDecoder**: Convert binary data to text
- **Buffer**: Accumulate partial chunks

**Line 59-64**: Read loop
- **await reader.read()**: Async read from stream
- **done**: True when stream ends
- **value**: Uint8Array chunk

**Line 67**: Decode with `stream: true`
- **Partial Chunks**: SSE events might be split across chunks
- **Buffer**: Accumulate until complete event

**Line 71-74**: Split by newlines
- **SSE Format**: Events separated by `\n`, terminated by double `\n\n`
- **Keep Last**: Last line might be incomplete (keep in buffer)

**Line 79-98**: Event handling
- **Type Dispatch**: Different handlers for progress/complete/error
- **State Updates**: Append to progress array, set final report, etc.
- **Error Handling**: Try-catch around JSON parsing

**Line 117-133**: UI helper functions
- **Node Labels**: Human-readable names with emojis
- **Descriptions**: Contextual information for each step
- **Dynamic**: Based on step data (queries count, reflection result)

#### SSE Protocol Details

**Server-Sent Events (SSE)** is a standard for server-to-client streaming.

**Protocol Structure**:

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "progress", "node": "query_generation", ...}

data: {"type": "progress", "node": "retrieval", ...}

data: {"type": "complete", "report": "..."}

```

**Key Elements**:

1. **Content-Type**: `text/event-stream`
   - Tells client to expect SSE format
   - Browser creates EventSource or ReadableStream

2. **Event Format**: `data: <payload>\n\n`
   - **data:** prefix required
   - Payload typically JSON
   - **Double newline** terminates event

3. **Keep-Alive**: Connection stays open
   - Server pushes events as they occur
   - No polling required

**Advanced SSE Features** (not used in basic implementation):

```
# Named events
event: custom_event_name
data: {"message": "hello"}

# Event IDs (for reconnection)
id: 12345
data: {"message": "hello"}

# Retry timeout
retry: 10000
data: {"message": "hello"}

# Comments (ignored by client)
: This is a comment
data: {"message": "hello"}
```

**SSE vs WebSocket**:

| Feature | SSE | WebSocket |
|---------|-----|-----------|
| **Direction** | Server → Client only | Bidirectional |
| **Protocol** | HTTP | Custom (ws://) |
| **Reconnection** | Automatic | Manual |
| **Complexity** | Simple | More complex |
| **Use Case** | Real-time updates, logging | Chat, gaming, collaboration |

**For DeepResearch**: SSE is perfect (server pushes progress, client doesn't need to send data mid-stream)

### 4.4 Multi-Model Configuration (Optional Enhancement)

**Rationale**: Different tasks have different requirements.

| Task | Requirement | Optimal Model |
|------|-------------|---------------|
| Query Generation | Fast, creative | Small model (3B) |
| Reflection | Balanced reasoning | Medium model (7B) |
| Answer Generation | High quality, comprehensive | Large model (14B-32B) |

**File**: `backend/src/agent/models.py`

```python
from langchain_ollama import ChatOllama

# ========== Fast Model ==========
# Purpose: Query generation, simple transformations
# Trade-off: Speed > Quality
fast_llm = ChatOllama(
    model="qwen2.5:3b",
    temperature=0.7  # Higher for creativity in query generation
)

# ========== Reasoning Model ==========
# Purpose: Reflection, assessment, decision-making
# Trade-off: Balanced speed and quality
reasoning_llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0.5  # Moderate for consistent reasoning
)

# ========== Powerful Model ==========
# Purpose: Final answer generation, comprehensive synthesis
# Trade-off: Quality > Speed
powerful_llm = ChatOllama(
    model="qwen2.5:14b",
    temperature=0.3  # Lower for factual, consistent output
)
```

**Usage in Nodes**:

```python
# In query_generation_node
response = fast_llm.invoke(prompt)  # Fast, creative queries

# In reflection_node
response = reasoning_llm.invoke(prompt)  # Balanced assessment

# In answer_generation_node
response = powerful_llm.invoke(prompt)  # High-quality report
```

**Benefits**:
- **Performance**: Fast model for frequent operations (query generation happens every iteration)
- **Cost**: Smaller models cheaper if using paid APIs
- **Quality**: Powerful model only for final output (where quality matters most)

**Trade-offs**:
- **Complexity**: Manage multiple model instances
- **Consistency**: Different models may have different output styles
- **Debugging**: Harder to isolate issues to specific models

### 4.5 Testing Guide

**Testing Strategy**: Validate each component independently, then test full workflow.

**Test Cases:**

#### 1. Simple Question (1-2 iterations)

**Objective**: Verify workflow terminates quickly when information is readily available.

```
Question: "What is LangGraph?"

Expected Behavior:
- Iteration 1: Query generation → Retrieval → Reflection → "ANSWER"
- Total iterations: 1-2
- Duration: < 30 seconds

Validation:
- [ ] Workflow completes in 1-2 iterations
- [ ] Final report is coherent and complete
- [ ] Sources cited correctly
- [ ] No unnecessary iterations

Test Code:
result = deep_research_graph.invoke({
    "original_question": "What is LangGraph?",
    "iteration": 0,
    "max_iterations": 3,
    "repository": "cnb/docs",
    ...
})

assert result["iteration"] <= 2
assert len(result["final_report"]) > 0
assert len(result["all_sources"]) > 0
```

#### 2. Complex Question (3+ iterations)

**Objective**: Verify workflow continues until sufficient information gathered.

```
Question: "Compare the architecture of microservices vs monolithic applications, including deployment strategies and team organization"

Expected Behavior:
- Iteration 1: Broad queries about architectures
- Iteration 2: Targeted queries about deployment
- Iteration 3: Targeted queries about team organization
- Total iterations: 3
- Duration: 60-90 seconds

Validation:
- [ ] Each iteration adds new, relevant information
- [ ] Reflection correctly identifies gaps
- [ ] Final report comprehensively addresses all aspects
- [ ] No redundant iterations

Test Code:
result = deep_research_graph.invoke({
    "original_question": "Compare microservices vs monolithic...",
    "iteration": 0,
    "max_iterations": 3,
    "repository": "cnb/docs",
    ...
})

# Verify multiple iterations
assert result["iteration"] >= 3

# Verify progressive accumulation
iterations_results = []
# Track results at each reflection step
assert len(iterations_results[2]) > len(iterations_results[1]) > len(iterations_results[0])
```

#### 3. Streaming Functionality

**Objective**: Verify real-time progress updates via SSE.

```
Test Steps:
1. Open browser DevTools > Network tab
2. Start research with complex question
3. Monitor SSE connection
4. Observe progress events

Validation:
- [ ] SSE connection established (EventStream type)
- [ ] Progress events received for each node
- [ ] Events contain correct data (iteration, queries, etc.)
- [ ] Final complete event received
- [ ] No connection errors or timeouts

Browser Test:
const events = [];
const response = await fetch('/api/deep-research', {
  method: 'POST',
  body: JSON.stringify({ question: "..." })
});

const reader = response.body.getReader();
while (true) {
  const {done, value} = await reader.read();
  if (done) break;

  const text = new TextDecoder().decode(value);
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      events.push(JSON.parse(line.slice(6)));
    }
  }
}

// Verify events
assert(events.length > 0);
assert(events[events.length - 1].type === 'complete');
```

#### 4. Max Iteration Limit

**Objective**: Verify workflow terminates even when information insufficient.

```
Test Setup:
1. Use repository with limited knowledge
2. Ask question requiring information not in knowledge base
3. Set max_iterations = 3

Expected Behavior:
- Iteration 1-3: Reflection says "CONTINUE" (insufficient)
- Iteration 3: Forced termination despite insufficient information
- Final report generated with disclaimer

Validation:
- [ ] Workflow stops at max_iterations
- [ ] No infinite loop
- [ ] Final report generated (even if incomplete)
- [ ] Reflection at iteration 3 shows "insufficient" but workflow ends

Test Code:
result = deep_research_graph.invoke({
    "original_question": "Explain quantum computing algorithms in detail",
    "iteration": 0,
    "max_iterations": 3,
    "repository": "cnb/docs",  # Doesn't have quantum computing info
    ...
})

assert result["iteration"] == 3  # Exactly max_iterations
assert "final_report" in result
# Report should mention information limitations
```

#### 5. Source Aggregation

**Objective**: Verify sources from all iterations are collected and deduplicated.

```
Test Steps:
1. Run workflow with complex question (3 iterations)
2. Track sources at each iteration
3. Verify final sources list

Validation:
- [ ] Sources accumulated across iterations
- [ ] No duplicate sources (same URL appears once)
- [ ] All unique sources included in final report
- [ ] Source IDs are sequential (1, 2, 3, ...)

Test Code:
# Track sources after each retrieval
sources_per_iteration = []

# After workflow completes
final_sources = result["all_sources"]

# Check deduplication
urls = [s["url"] for s in final_sources]
assert len(urls) == len(set(urls))  # No duplicates

# Check sequential IDs
ids = [s["id"] for s in final_sources]
assert ids == list(range(1, len(ids) + 1))  # [1, 2, 3, ...]
```

### 4.6 Common Issues & Solutions

| Issue | Cause | Solution | Prevention |
|-------|-------|----------|------------|
| **Infinite loop** | Reflection always returns "continue" | Add strict max_iterations limit; improve reflection prompt with clearer criteria | Test with diverse questions; monitor reflection decisions |
| **Sources duplicated** | Same source from multiple retrievals | Deduplicate by URL in retrieval_node (see code) | Use set to track seen URLs |
| **Streaming delays** | Large context in progress events | Send only essential data (iteration, queries, not full results) | Profile event sizes; optimize JSON structure |
| **Context window exceeded** | Too many retrieval rounds accumulating context | Limit total chunks (e.g., max 30) or summarize earlier results | Monitor token counts; implement context pruning |
| **Poor query generation** | Vague or repetitive queries | Add examples in prompt; use structured output with query types | Test query generation separately; review generated queries |
| **Report quality low** | Insufficient context or poor synthesis | Increase top_k in retrieval; improve answer prompt with structure | Review report structure; provide clear formatting instructions |
| **Slow performance** | Sequential queries, large models | Parallelize retrieval (async); use fast model for query generation | Profile execution time per node; optimize bottlenecks |
| **SSE connection timeout** | Long-running workflow exceeds server timeout | Send periodic keep-alive comments; increase server timeout | Configure reverse proxy (nginx) to allow long connections |
| **Frontend not updating** | Event parsing errors or React state issues | Add error logging; verify SSE format; check React state updates | Test with mock SSE server; validate event structure |

**Advanced Debugging**:

```python
# Add logging to each node
import logging

def query_generation_node(state):
    logging.info(f"Query Generation - Iteration {state['iteration']}")
    queries = ...
    logging.info(f"Generated queries: {queries}")
    return {...}

# Visualize workflow execution with LangSmith
from langsmith import trace

@trace
def deep_research_workflow(question):
    result = deep_research_graph.invoke(...)
    return result

# Test individual nodes
def test_reflection_node():
    mock_state = {
        "original_question": "test",
        "all_retrieval_results": [...],
        "iteration": 1,
        "max_iterations": 3
    }
    result = reflection_node(mock_state)
    assert "reflection" in result
    print(result["reflection"])
```

---

## 🔄 Integration Tips

### Combining Scenario 1 & 2

You can implement both scenarios in the same application:

1. **UI Toggle**: Let users switch between "Quick Answer" and "Deep Research" modes
2. **Shared Components**: Reuse `CitationRenderer` for both scenarios
3. **Shared Backend**: Both use same CNB API, different LangGraph workflows

**Example Frontend Integration:**

```tsx
function App() {
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [repository, setRepository] = useState('cnb/docs');

  return (
    <div>
      <RepositorySelector
        currentRepo={repository}
        onRepoChange={setRepository}
      />

      <ModeToggle mode={mode} onModeChange={setMode} />

      {mode === 'quick' ? (
        <QuickChat repository={repository} />
      ) : (
        <DeepResearch repository={repository} />
      )}
    </div>
  );
}
```

### Performance Optimization

1. **Caching**: Cache CNB API responses for identical queries
   ```python
   from functools import lru_cache

   @lru_cache(maxsize=100)
   def cached_query_cnb(query: str, repository: str):
       return query_cnb_knowledge_base(query, repository)
   ```

2. **Batch Processing**: Retrieve multiple queries in parallel
   ```python
   import asyncio

   async def batch_retrieval(queries: List[str], repository: str):
       tasks = [
           async_query_cnb(q, repository) for q in queries
       ]
       return await asyncio.gather(*tasks)
   ```

3. **Context Pruning**: Summarize earlier retrieval results to save tokens
   ```python
   if len(all_retrieval_results) > 20:
       # Summarize older results
       old_results = all_retrieval_results[:-10]
       summary = summarize_llm.invoke(str(old_results))
       all_retrieval_results = [summary] + all_retrieval_results[-10:]
   ```

---

## 📚 Resources & References

### Official Documentation
- [CNB Knowledge Base API](https://docs.cnb.cool/zh/ai/knowledge-base.html)
- [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph DeepResearch Course](https://academy.langchain.com/courses/deep-research-with-langgraph)
- [LangSmith for Debugging](https://smith.langchain.com)

### Code Examples
- Demo Repository: Check your project's `backend/` and `frontend/` directories
- CNB Knowledge Base Examples: See CNB documentation for more API usage patterns

### Community Support
- Training Camp Group: Ask questions in your course community
- CNB Documentation: Detailed guides and examples

---

## ✅ Implementation Checklist

### Scenario 1
- [ ] Repository selector UI component
- [ ] Citation rendering component
- [ ] Backend state updated with repository field
- [ ] CNB API function accepts repository parameter
- [ ] Metadata extraction and formatting
- [ ] Frontend displays clickable citations
- [ ] Sources list with links
- [ ] Error handling for invalid repositories
- [ ] Testing with multiple repositories

### Scenario 2
- [ ] DeepResearch state schema defined
- [ ] Query generation node implemented
- [ ] Retrieval node with accumulation
- [ ] Reflection node with continue/stop logic
- [ ] Answer generation node
- [ ] Conditional routing logic
- [ ] Max iteration limit configured
- [ ] Streaming endpoint setup
- [ ] Frontend progress display
- [ ] Final report rendering with citations
- [ ] Testing with simple and complex questions
- [ ] Multi-model configuration (optional)

---

## 🎯 Next Steps

1. **Start with Scenario 1**: Easier to implement, provides immediate value
2. **Test Thoroughly**: Use real questions to validate functionality
3. **Add Scenario 2**: Build on Scenario 1's foundation
4. **Iterate**: Gather user feedback and improve
5. **Document**: Keep README updated with setup instructions

**Remember**: Start simple, make it work, then make it better!

Good luck with your implementation! 🚀
