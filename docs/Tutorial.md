# Project-1 Knowledge Base: Comprehensive 4-Hour Tutorial

**Learn to Build RAG Applications with LangGraph, React, TypeScript, and Python**

---

## Tutorial Overview

**Total Duration**: 4 hours
**Target Audience**: Developers familiar with basic Python and JavaScript/TypeScript
**What You'll Learn**: Full-stack RAG (Retrieval-Augmented Generation) application development using modern AI tools

**Important Note**: This repository uses **React** (not Vue) for the frontend. The tutorial covers TypeScript with React 19, Python backend with LangGraph, and modern AI development patterns.

### Technology Stack
- **Frontend**: React 19, TypeScript 5.7, Vite 6.3, Tailwind CSS 4.1, Radix UI
- **Backend**: Python 3.11+, LangGraph 0.2.6+, FastAPI, Ollama
- **Infrastructure**: Docker Compose, PostgreSQL 16, Redis 6

---

## Table of Contents

- [Hour 1: Architecture & Setup (0:00-1:00)](#hour-1-architecture--setup)
- [Hour 2: Backend Deep Dive - Python & LangGraph (1:00-2:00)](#hour-2-backend-deep-dive)
- [Hour 3: Frontend Deep Dive - TypeScript & React (2:00-3:00)](#hour-3-frontend-deep-dive)
- [Hour 4: Integration & Deployment (3:00-4:00)](#hour-4-integration--deployment)

---

# Hour 1: Architecture & Setup

## 1.1 Project Overview (15 minutes)

### What is RAG?
**Retrieval-Augmented Generation** combines:
1. **Retrieval**: Searching relevant documents from a knowledge base
2. **Augmentation**: Providing context to the LLM
3. **Generation**: LLM generates answer based on context

### This Project's Purpose
A full-stack AI application that:
- Queries CNB Knowledge Base for relevant documentation
- Uses Ollama (local LLM) to generate answers
- Streams responses in real-time to a React frontend

### Key Features
- 2-node LangGraph workflow
- Streaming architecture for progressive UI updates
- Docker-based deployment
- LangGraph Studio for visual debugging

---

## 1.2 Technology Stack Explained (15 minutes)

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.3.4 | Build tool (fast HMR) |
| Tailwind CSS | 4.1.5 | Utility-first styling |
| Radix UI | Latest | Accessible components |
| LangGraph SDK | Latest | Backend streaming client |

**Why These Choices?**
- **React 19**: Latest features, concurrent rendering
- **TypeScript**: Catches errors early, better IDE support
- **Vite**: 10x faster than Webpack, instant HMR
- **Tailwind**: Rapid UI development, small bundle size
- **Radix UI**: Accessibility built-in, unstyled primitives

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | >=3.11 | Main language |
| LangGraph | >=0.2.6 | Graph-based workflow orchestration |
| LangChain | >=0.3.19 | LLM utilities, message types |
| Ollama | Latest | Local LLM inference |
| FastAPI | Latest | High-performance web server |
| Pydantic | Latest | Data validation |

**Why These Choices?**
- **LangGraph**: Structured AI workflows, state management, visual debugging
- **Ollama**: Run LLMs locally without API costs
- **FastAPI**: Auto-generated docs, type hints, async support
- **Pydantic**: Type-safe configuration, auto-validation

---

## 1.3 Project Structure (15 minutes)

### Directory Organization

```
project-1-knowledge-base/
├── backend/
│   ├── src/agent/              # Core RAG logic
│   │   ├── app.py              # FastAPI server
│   │   ├── graph.py            # LangGraph workflow (MAIN LOGIC)
│   │   ├── state.py            # State schema
│   │   ├── configuration.py    # Config parameters
│   │   ├── cnb_utils.py        # CNB API client
│   │   ├── prompts.py          # LLM system prompts
│   │   └── tools_and_schemas.py
│   ├── pyproject.toml          # Python dependencies
│   ├── .env                    # Environment variables
│   └── test-agent.ipynb        # Working examples
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main component
│   │   ├── components/         # React components
│   │   │   ├── ChatMessagesView.tsx
│   │   │   ├── InputForm.tsx
│   │   │   └── ui/             # Radix UI components
│   │   ├── global.css          # Tailwind styles
│   │   └── main.tsx            # React entry point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts          # Build configuration
├── docs/                       # Educational materials
├── docker-compose.yml          # Service orchestration
└── Dockerfile                  # Container build
```

### Key File Purposes

| File | Purpose | When to Edit |
|------|---------|--------------|
| `backend/src/agent/graph.py` | Workflow definition | Add/modify workflow nodes |
| `backend/src/agent/state.py` | State schema | Add new state fields |
| `backend/src/agent/configuration.py` | Config parameters | Add configurable options |
| `frontend/src/App.tsx` | Main React component | Modify UI behavior |
| `.env` | Secrets and config | Change API keys, URLs |
| `docker-compose.yml` | Service setup | Change ports, add services |

---

## 1.4 Setup: Local Development (15 minutes)

### Prerequisites
```bash
# Check versions
python --version    # Should be >= 3.11
node --version      # Should be >= 18
npm --version       # Should be >= 9

# Install Ollama (macOS)
brew install ollama

# Install Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the LLM model
ollama pull qwen3:8b
```

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install .

# Create .env file
cat > .env << EOF
CNB_TOKEN=your_cnb_token_here
LANGSMITH_API_KEY=your_langsmith_key_here  # Optional
OLLAMA_MODEL=qwen3:8b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEMPERATURE=0.7
EOF

# Start Ollama server
ollama serve

# In a new terminal, start LangGraph dev server
langgraph dev
# Available at http://127.0.0.1:2024
```

### Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Available at http://localhost:5173/app
```

### Verify Setup
1. Open http://127.0.0.1:2024 → LangGraph Studio UI
2. Open http://localhost:5173/app → React app
3. Type a question, click "Send"
4. Watch the response stream in

**Common Issues**:
- Port 2024 in use? Change `LANGGRAPH_PORT` in `.env`
- Ollama not found? Check `OLLAMA_BASE_URL` points to running instance
- CNB API errors? Verify `CNB_TOKEN` is valid

---

# Hour 2: Backend Deep Dive

## 2.1 LangGraph Fundamentals (20 minutes)

### What is LangGraph?
LangGraph is a **graph-based workflow orchestration** framework for building AI applications.

**Core Concepts**:
1. **Nodes**: Functions that process data
2. **Edges**: Define flow between nodes
3. **State**: Data passed between nodes
4. **Graph**: Compiled workflow

### Advantages Over Simple Chains
- **Visual debugging**: See exactly what happens at each step
- **State management**: Automatic state updates with annotations
- **Flexibility**: Branching, loops, conditional flow
- **Traceability**: Every decision is logged

### Basic LangGraph Pattern

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

# 1. Define state
class MyState(TypedDict):
    messages: list
    result: str

# 2. Create graph
builder = StateGraph(MyState)

# 3. Add nodes
def my_node(state: MyState) -> MyState:
    # Process state
    return {"result": "processed"}

builder.add_node("my_node", my_node)

# 4. Add edges
builder.add_edge(START, "my_node")
builder.add_edge("my_node", END)

# 5. Compile
graph = builder.compile()
```

---

## 2.2 The Core Workflow (30 minutes)

### File: `backend/src/agent/graph.py`

This file contains the **MAIN LOGIC** of the application. Let's break it down:

#### The Workflow Structure

```
START
  ↓
[retrieve_knowledge]
  ↓
[generate_answer]
  ↓
END
```

**Two nodes only!** This keeps it simple for learning.

#### Node 1: retrieve_knowledge

**Location**: `backend/src/agent/graph.py` lines ~40-65

**Purpose**: Query CNB Knowledge Base for relevant documentation

```python
def retrieve_knowledge(state: AgentState, config: RunnableConfig) -> AgentState:
    """
    Retrieve relevant knowledge from CNB Knowledge Base.

    Flow:
    1. Extract latest user query from messages
    2. Query CNB API with the query
    3. Format results as context
    4. Update state with results and sources
    """

    # 1. Get configuration
    configurable = configuration.Configuration.from_runnable_config(config)

    # 2. Extract user query
    last_message = state["messages"][-1].content

    # 3. Query CNB API
    kb = CNBKnowledgeBase(
        api_base=configurable.cnb_api_base,
        repo_slug=configurable.cnb_repo_slug,
        token=configurable.cnb_token
    )
    results = kb.query(last_message, top_k=configurable.top_k_results)

    # 4. Format context
    context = "\n\n".join([
        f"Source {i+1}:\n{r['chunk']}"
        for i, r in enumerate(results)
    ])

    # 5. Return updated state
    return {
        "knowledge_base_results": results,
        "sources_gathered": [r["metadata"] for r in results],
        "context": context
    }
```

**Key Learning Points**:
- Uses `RunnableConfig` to access configuration
- Extracts latest message with `state["messages"][-1]`
- Returns dict that **merges** into existing state
- No need to return entire state, just updates

#### Node 2: generate_answer

**Location**: `backend/src/agent/graph.py` lines ~68-95

**Purpose**: Use LLM to generate answer based on context

```python
def generate_answer(state: AgentState, config: RunnableConfig) -> AgentState:
    """
    Generate answer using Ollama LLM with retrieved context.

    Flow:
    1. Initialize Ollama LLM with configuration
    2. Build system prompt with context
    3. Include conversation history
    4. Stream LLM response
    """

    # 1. Get configuration
    configurable = configuration.Configuration.from_runnable_config(config)

    # 2. Initialize Ollama LLM
    llm = ChatOllama(
        model=configurable.ollama_model,
        base_url=configurable.ollama_base_url,
        temperature=configurable.ollama_temperature
    )

    # 3. Build system prompt with context
    system_prompt = prompts.SYSTEM_PROMPT.format(
        context=state["context"]
    )

    # 4. Invoke LLM with conversation history
    messages = [
        SystemMessage(content=system_prompt),
        *state["messages"]  # Include conversation history
    ]

    response = llm.invoke(messages)

    # 5. Return updated messages
    return {"messages": [response]}
```

**Key Learning Points**:
- LLM initialized fresh each time (stateless)
- System prompt includes retrieved context
- Conversation history from `state["messages"]`
- Returns new message that **auto-merges** into messages list

#### Building the Graph

**Location**: `backend/src/agent/graph.py` lines ~98-110

```python
# Create graph builder
builder = StateGraph(AgentState, config_schema=Configuration)

# Add nodes
builder.add_node("retrieve_knowledge", retrieve_knowledge)
builder.add_node("generate_answer", generate_answer)

# Define flow
builder.add_edge(START, "retrieve_knowledge")
builder.add_edge("retrieve_knowledge", "generate_answer")
builder.add_edge("generate_answer", END)

# Compile
graph = builder.compile()
```

**Key Learning Points**:
- `StateGraph` takes state type and config schema
- Nodes are functions, not classes
- Edges are sequential (no branching in this demo)
- `graph.compile()` creates executable workflow

---

## 2.3 State Management (20 minutes)

### File: `backend/src/agent/state.py`

```python
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph.message import add_messages
import operator

class AgentState(TypedDict):
    """
    State passed between nodes.

    Special Annotations:
    - add_messages: Automatically merges new messages into conversation
    - operator.add: Concatenates lists
    """

    # Conversation history
    messages: Annotated[list, add_messages]

    # Knowledge base results
    knowledge_base_results: List[Dict]

    # Source metadata (auto-appended)
    sources_gathered: Annotated[list, operator.add]

    # Formatted context for LLM
    context: str
```

### Understanding Annotations

#### `Annotated[list, add_messages]`
**Purpose**: Automatically merge messages instead of replacing

```python
# Without annotation
state["messages"] = [new_message]  # REPLACES all messages

# With add_messages annotation
return {"messages": [new_message]}  # MERGES into existing messages
```

#### `Annotated[list, operator.add]`
**Purpose**: Concatenate lists

```python
# Without annotation
state["sources"] = [source1, source2]  # REPLACES

# With operator.add
return {"sources": [source1]}  # First call
return {"sources": [source2]}  # Second call
# Result: state["sources"] == [source1, source2]
```

### Why TypedDict?
- **Type safety**: IDE autocomplete and type checking
- **Clear schema**: Know exactly what fields exist
- **Immutability**: Can't accidentally modify state
- **Serialization**: Easily convert to JSON

---

## 2.4 Configuration System (15 minutes)

### File: `backend/src/agent/configuration.py`

```python
from dataclasses import dataclass, fields, field
from typing import Optional

@dataclass(kw_only=True)
class Configuration:
    """
    Configuration for the RAG agent.

    All fields can be overridden via:
    1. Environment variables (uppercase)
    2. Runtime configuration
    3. .env file
    """

    # CNB Knowledge Base
    cnb_api_base: str = field(
        default="https://api.cnb.cool",
        metadata={"description": "CNB API base URL"}
    )

    cnb_repo_slug: str = field(
        default="cnb/docs",
        metadata={"description": "Repository to query"}
    )

    cnb_token: str = field(
        default="",
        metadata={"description": "CNB API authentication token"}
    )

    # Ollama LLM
    ollama_model: str = field(
        default="qwen3:8b",
        metadata={"description": "Ollama model to use"}
    )

    ollama_base_url: str = field(
        default="http://localhost:11434",
        metadata={"description": "Ollama server URL"}
    )

    ollama_temperature: float = field(
        default=0.7,
        metadata={"description": "LLM temperature (0-1)"}
    )

    ollama_reasoning: bool = field(
        default=True,
        metadata={"description": "Enable reasoning mode"}
    )

    # Retrieval
    top_k_results: int = field(
        default=5,
        metadata={"description": "Number of KB results to retrieve"}
    )
```

### Using Configuration

**In nodes**:
```python
def my_node(state: AgentState, config: RunnableConfig):
    # Access configuration
    configurable = Configuration.from_runnable_config(config)

    # Use fields
    model = configurable.ollama_model
    temp = configurable.ollama_temperature
```

**Override at runtime**:
```python
# In LangGraph Studio or via API
graph.invoke(
    {"messages": [...]},
    config={"configurable": {"ollama_temperature": 0.9}}
)
```

---

## 2.5 CNB API Integration (15 minutes)

### File: `backend/src/agent/cnb_utils.py`

This implements the **API Adapter Pattern** for external integrations.

```python
import requests
from typing import List, Dict

class CNBKnowledgeBase:
    """
    Client for CNB Knowledge Base API.

    Responsibilities:
    1. Construct API requests
    2. Handle authentication
    3. Parse responses
    4. Format for LLM consumption
    """

    def __init__(self, api_base: str, repo_slug: str, token: str):
        self.api_base = api_base
        self.repo_slug = repo_slug
        self.token = token

    def query(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Query knowledge base for relevant documents.

        Args:
            query: User's question
            top_k: Number of results to return

        Returns:
            List of {score, chunk, metadata}
        """
        url = f"{self.api_base}/{self.repo_slug}/-/knowledge/base/query"

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        payload = {
            "query": query,
            "top_k": top_k
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        return response.json()
```

**Key Learning Points**:
- Encapsulates external API complexity
- Single responsibility: CNB API communication
- Easy to mock for testing
- Can swap implementation without changing workflow

---

# Hour 3: Frontend Deep Dive

## 3.1 React 19 Setup (15 minutes)

### Project Structure

```
frontend/src/
├── App.tsx                    # Main application component
├── components/
│   ├── ChatMessagesView.tsx  # Message display
│   ├── InputForm.tsx          # User input
│   ├── ActivityTimeline.tsx   # Progress indicator
│   └── ui/                    # Radix UI components
│       ├── scroll-area.tsx
│       ├── textarea.tsx
│       └── button.tsx
├── global.css                 # Tailwind directives
└── main.tsx                   # React entry point
```

### Entry Point: `frontend/src/main.tsx`

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Key Learning Points**:
- Uses React 19's `createRoot` (concurrent rendering)
- StrictMode catches common bugs
- Global CSS imported before App

---

## 3.2 The useStream Hook (25 minutes)

### File: `frontend/src/App.tsx`

The `useStream` hook from LangGraph SDK is the **core** of frontend-backend communication.

```typescript
import { useStream } from "@langchain/langgraph-sdk/react";

function App() {
  // Initialize streaming connection
  const thread = useStream({
    apiUrl: "http://localhost:2024",      // LangGraph API
    assistantId: "agent",                 // Graph name
    messagesKey: "messages",              // State field to track

    // Handle streaming updates
    onUpdateEvent: (event) => {
      if (event.type === "metadata") {
        // Node started/finished
      } else if (event.type === "messages") {
        // New message arrived
      }
    }
  });
}
```

### Stream API Methods

```typescript
// Submit new message
await thread.submit({
  messages: [
    { role: "user", content: "What is LangGraph?" }
  ]
});

// Access current state
const currentMessages = thread.state?.values.messages;
const kbResults = thread.state?.values.knowledge_base_results;

// Check status
const isProcessing = thread.status === "inflight";
const hasError = thread.error !== null;
```

### Understanding Stream Events

```typescript
onUpdateEvent: (event) => {
  // Event types
  switch (event.type) {
    case "metadata":
      // Node execution info
      console.log(event.data);
      // { node: "retrieve_knowledge", status: "started" }
      break;

    case "messages":
      // New message chunk
      console.log(event.data);
      // { role: "assistant", content: "LangGraph is..." }
      break;

    case "updates":
      // State updates
      console.log(event.data);
      // { knowledge_base_results: [...] }
      break;
  }
}
```

---

## 3.3 Component Architecture (30 minutes)

### Main App Component

**File**: `frontend/src/App.tsx`

```typescript
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);

  const thread = useStream({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    messagesKey: "messages",
    onUpdateEvent: (event) => {
      // Process events for ActivityTimeline
      const processed = processEvent(event);
      setProcessedEvents(prev => [...prev, processed]);
    }
  });

  const handleSubmit = async (message: string) => {
    setShowWelcome(false);

    // Submit to LangGraph
    await thread.submit({
      messages: [{ role: "user", content: message }]
    });
  };

  return (
    <div className="h-screen bg-neutral-800">
      {showWelcome ? (
        <WelcomeScreen onSubmit={handleSubmit} />
      ) : (
        <ChatMessagesView
          messages={thread.state?.values.messages || []}
          isProcessing={thread.status === "inflight"}
          onSubmit={handleSubmit}
          processedEvents={processedEvents}
        />
      )}
    </div>
  );
}
```

### ChatMessagesView Component

**File**: `frontend/src/components/ChatMessagesView.tsx`

```typescript
interface ChatMessagesViewProps {
  messages: Message[];
  isProcessing: boolean;
  onSubmit: (message: string) => void;
  processedEvents: ProcessedEvent[];
}

export function ChatMessagesView({
  messages,
  isProcessing,
  onSubmit,
  processedEvents
}: ChatMessagesViewProps) {
  return (
    <div className="flex h-screen">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-6">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
        </ScrollArea>

        <InputForm
          onSubmit={onSubmit}
          disabled={isProcessing}
        />
      </div>

      {/* Activity timeline */}
      <div className="w-80 border-l border-neutral-700">
        <ActivityTimeline events={processedEvents} />
      </div>
    </div>
  );
}
```

### MessageBubble with Markdown

```typescript
import ReactMarkdown from "react-markdown";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`mb-4 ${isUser ? "text-right" : "text-left"}`}>
      <div className={`inline-block max-w-[80%] p-4 rounded-lg ${
        isUser
          ? "bg-blue-600 text-white"
          : "bg-neutral-700 text-neutral-100"
      }`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              // Custom renderers
              code: ({ node, className, children, ...props }) => (
                <code className="bg-neutral-800 px-2 py-1 rounded">
                  {children}
                </code>
              ),
              a: ({ node, children, ...props }) => (
                <a className="text-blue-400 underline" {...props}>
                  {children}
                </a>
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
```

---

## 3.4 TypeScript Patterns (20 minutes)

### Type Definitions

```typescript
// Message type
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Stream state
interface StreamState {
  messages: Message[];
  knowledge_base_results: KBResult[];
  sources_gathered: Source[];
  context: string;
}

// Knowledge base result
interface KBResult {
  score: number;
  chunk: string;
  metadata: {
    source: string;
    section: string;
  };
}

// Processed event for timeline
interface ProcessedEvent {
  timestamp: Date;
  type: "node_start" | "node_finish" | "message";
  node?: string;
  data?: any;
}
```

### Type-Safe Event Processing

```typescript
function processEvent(event: StreamEvent): ProcessedEvent {
  if (event.type === "metadata") {
    return {
      timestamp: new Date(),
      type: event.data.status === "started" ? "node_start" : "node_finish",
      node: event.data.node,
      data: event.data
    };
  } else if (event.type === "messages") {
    return {
      timestamp: new Date(),
      type: "message",
      data: event.data
    };
  }

  // TypeScript ensures all cases handled
  return {
    timestamp: new Date(),
    type: "message",
    data: event
  };
}
```

---

## 3.5 Tailwind CSS & Radix UI (10 minutes)

### Tailwind Utility Classes

```typescript
<div className="
  h-screen              // 100vh height
  bg-neutral-800        // Dark background
  flex flex-col         // Vertical flexbox
  p-6                   // Padding 1.5rem
  gap-4                 // Gap 1rem
  rounded-lg            // Rounded corners
  border border-neutral-700  // Border
">
```

### Radix UI Components

**Why Radix?**
- Accessible by default (ARIA, keyboard navigation)
- Unstyled (you control styling with Tailwind)
- Composable primitives

**Example: Textarea**

```typescript
import { Textarea } from "@/components/ui/textarea";

<Textarea
  placeholder="Ask a question..."
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }}
  className="min-h-[100px] resize-none"
/>
```

**Example: ScrollArea**

```typescript
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="flex-1 p-6">
  {messages.map((msg, idx) => (
    <MessageBubble key={idx} message={msg} />
  ))}
</ScrollArea>
```

---

# Hour 4: Integration & Deployment

## 4.1 Full Workflow Walkthrough (20 minutes)

### End-to-End Flow

```
┌─────────────┐
│   FRONTEND  │
│  (Browser)  │
└──────┬──────┘
       │ 1. User types question, clicks Send
       │
       ▼
┌─────────────────────────────────────┐
│  App.tsx:handleSubmit               │
│  - Calls thread.submit(messages)    │
└──────┬──────────────────────────────┘
       │ 2. HTTP POST to LangGraph API
       │
       ▼
┌─────────────────────────────────────┐
│  LANGGRAPH API                      │
│  (http://localhost:2024/runs)       │
└──────┬──────────────────────────────┘
       │ 3. Executes graph
       │
       ▼
┌─────────────────────────────────────┐
│  Node 1: retrieve_knowledge         │
│  - Extract user query               │
│  - Call CNB API                     │
│  - Format context                   │
└──────┬──────────────────────────────┘
       │ 4. HTTP POST to CNB API
       │
       ▼
┌─────────────────────────────────────┐
│  CNB KNOWLEDGE BASE API             │
│  (https://api.cnb.cool)             │
│  - Search documents                 │
│  - Return scored chunks             │
└──────┬──────────────────────────────┘
       │ 5. Return KB results
       │
       ▼
┌─────────────────────────────────────┐
│  Node 2: generate_answer            │
│  - Initialize Ollama LLM            │
│  - Build prompt with context        │
│  - Stream LLM response              │
└──────┬──────────────────────────────┘
       │ 6. HTTP POST to Ollama
       │
       ▼
┌─────────────────────────────────────┐
│  OLLAMA LLM                         │
│  (http://localhost:11434)           │
│  - Generate answer                  │
│  - Stream tokens                    │
└──────┬──────────────────────────────┘
       │ 7. Stream response
       │
       ▼
┌─────────────────────────────────────┐
│  LANGGRAPH API                      │
│  - Stream events to frontend        │
└──────┬──────────────────────────────┘
       │ 8. Server-Sent Events (SSE)
       │
       ▼
┌─────────────────────────────────────┐
│  FRONTEND                           │
│  - onUpdateEvent receives chunks    │
│  - Update UI progressively          │
│  - Display in ChatMessagesView      │
└─────────────────────────────────────┘
```

### Timing Breakdown

1. **Frontend → LangGraph**: ~50ms (local network)
2. **retrieve_knowledge → CNB API**: ~500-2000ms (external API)
3. **generate_answer → Ollama**: ~3-30s (model-dependent)
4. **Total**: ~3-35 seconds end-to-end

---

## 4.2 LangGraph Studio Debugging (20 minutes)

### Accessing Studio

```bash
cd backend
langgraph dev
# Opens at http://127.0.0.1:2024
```

### Studio Features

1. **Graph Visualization**
   - See nodes and edges visually
   - Click nodes to inspect code
   - Understand flow at a glance

2. **Live Execution**
   - Submit messages directly
   - Watch state updates in real-time
   - Pause at breakpoints

3. **State Inspector**
   - View state at each node
   - See exactly what data passes between nodes
   - Inspect full conversation history

4. **Trace Explorer**
   - Full execution timeline
   - Node execution times
   - Error stack traces

### Debugging Workflow

**Problem**: LLM generating incorrect answers

**Steps**:
1. Open LangGraph Studio
2. Submit test query
3. Click on `retrieve_knowledge` node
4. Check `knowledge_base_results` in state
   - Are the results relevant?
   - Is `top_k` too low?
5. Click on `generate_answer` node
6. Check `context` field
   - Is context formatted correctly?
   - Is system prompt appropriate?
7. Adjust configuration
8. Re-run

---

## 4.3 Docker Deployment (30 minutes)

### Understanding docker-compose.yml

```yaml
version: '3'

services:
  # PostgreSQL database for state persistence
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: langgraph
      POSTGRES_USER: langgraph
      POSTGRES_PASSWORD: langgraph
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis for session management
  redis:
    image: redis:6
    ports:
      - "6380:6379"
    command: redis-server --save 60 1
    volumes:
      - redis_data:/data

  # Main application
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8123:8000"
    environment:
      CNB_TOKEN: ${CNB_TOKEN}
      LANGSMITH_API_KEY: ${LANGSMITH_API_KEY}
      OLLAMA_BASE_URL: http://host.docker.internal:11434
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build frontend
FROM node:20 AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM python:3.11-slim

WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install Python dependencies
RUN pip install ./backend

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "agent.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Deployment Steps

```bash
# 1. Set environment variables
export CNB_TOKEN=your_token_here
export LANGSMITH_API_KEY=your_key_here

# 2. Build and start services
docker-compose up --build

# 3. Access application
open http://localhost:8123/app/

# 4. View logs
docker-compose logs -f api

# 5. Stop services
docker-compose down

# 6. Clean up volumes (careful!)
docker-compose down -v
```

### Production Considerations

**Still Needed**:
- [ ] User authentication (OAuth, JWT)
- [ ] Rate limiting (Redis-based)
- [ ] Input validation and sanitization
- [ ] HTTPS with SSL certificates
- [ ] Monitoring and alerting (Prometheus, Grafana)
- [ ] Log aggregation (ELK stack)
- [ ] Backup procedures
- [ ] Horizontal scaling (load balancer)

---

## 4.4 Configuration Customization (20 minutes)

### Changing Knowledge Base Source

**Edit**: `backend/.env`

```bash
# Use different CNB repository
CNB_REPO_SLUG=your-org/your-docs

# Or your own knowledge base API
CNB_API_BASE=https://your-kb-api.com
CNB_TOKEN=your_custom_token
```

### Changing LLM Model

```bash
# Pull different model
ollama pull llama2:13b

# Update configuration
OLLAMA_MODEL=llama2:13b

# Or use OpenAI instead of Ollama
# (requires code changes in graph.py)
```

### Adjusting Retrieval

```bash
# Get more results
TOP_K_RESULTS=10

# More deterministic responses
OLLAMA_TEMPERATURE=0.3

# More creative responses
OLLAMA_TEMPERATURE=0.9
```

### Frontend Customization

**Edit**: `frontend/src/App.tsx`

```typescript
// Change API URL for production
const thread = useStream({
  apiUrl: import.meta.env.PROD
    ? "https://your-api.com"
    : "http://localhost:2024",
  // ... rest of config
});
```

**Edit**: `frontend/src/global.css`

```css
/* Change theme colors */
:root {
  --background: 0 0% 20%;      /* Lighter background */
  --foreground: 0 0% 98%;      /* Text color */
  --primary: 210 100% 50%;     /* Blue accent */
}
```

---

## 4.5 Extension Scenarios (30 minutes)

### Scenario 1: Multi-Knowledge-Base Switching

**Goal**: Allow users to select which KB to query

**Implementation**:

1. **Update Configuration**:
```python
# backend/src/agent/configuration.py
available_repos: List[str] = field(
    default_factory=lambda: ["cnb/docs", "cnb/api-reference"],
    metadata={"description": "Available repositories"}
)

selected_repo: str = field(
    default="cnb/docs",
    metadata={"description": "Currently selected repo"}
)
```

2. **Update Frontend**:
```typescript
// Add dropdown
<Select
  value={selectedRepo}
  onChange={(repo) => {
    setSelectedRepo(repo);
    // Re-submit with new config
  }}
>
  <option value="cnb/docs">Documentation</option>
  <option value="cnb/api-reference">API Reference</option>
</Select>
```

3. **Update Workflow**:
```python
# Use selected_repo in retrieve_knowledge
kb = CNBKnowledgeBase(
    api_base=configurable.cnb_api_base,
    repo_slug=configurable.selected_repo,  # Use selected
    token=configurable.cnb_token
)
```

### Scenario 2: DeepResearch with Multi-Hop

**Goal**: Follow-up queries for deeper context

**Implementation**:

1. **Add Conditional Edge**:
```python
def should_research_deeper(state: AgentState) -> str:
    """Decide if we need more context."""
    if len(state["sources_gathered"]) < 3:
        return "retrieve_more"
    return "generate_answer"

# Update graph
builder.add_conditional_edges(
    "retrieve_knowledge",
    should_research_deeper,
    {
        "retrieve_more": "retrieve_knowledge",  # Loop back
        "generate_answer": "generate_answer"
    }
)
```

2. **Add Loop Counter**:
```python
# state.py
class AgentState(TypedDict):
    # ... existing fields
    research_depth: int  # Track iterations
```

3. **Update Node**:
```python
def retrieve_knowledge(state: AgentState, config: RunnableConfig):
    # ... existing code

    depth = state.get("research_depth", 0)
    if depth >= 3:  # Max 3 iterations
        return {"research_depth": depth}

    # ... retrieve logic
    return {
        "knowledge_base_results": results,
        "research_depth": depth + 1
    }
```

### Scenario 3: VuePress Plugin Integration

**Goal**: Embed chat widget in VuePress docs

**Implementation**:

1. **Create Plugin**:
```javascript
// vuepress-plugin-kb-chat/index.js
module.exports = {
  name: 'kb-chat',

  clientAppEnhanceFiles() {
    return {
      name: 'kb-chat-enhancer',
      content: `
        export default ({ Vue }) => {
          Vue.component('KBChat', () => import('./KBChat.vue'))
        }
      `
    }
  }
}
```

2. **Create Component**:
```vue
<!-- vuepress-plugin-kb-chat/KBChat.vue -->
<template>
  <div class="kb-chat-widget">
    <button @click="toggleChat">Ask AI</button>

    <div v-if="isOpen" class="chat-panel">
      <iframe
        :src="chatUrl"
        frameborder="0"
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isOpen: false,
      chatUrl: 'http://localhost:8123/app/'
    }
  }
}
</script>
```

3. **Use in VuePress**:
```md
# My Documentation

<KBChat />

Regular content...
```

---

## Summary & Next Steps

### What You've Learned

✅ **Hour 1**: Architecture, setup, project structure
✅ **Hour 2**: Python backend, LangGraph workflows, state management
✅ **Hour 3**: TypeScript, React 19, streaming, Tailwind CSS
✅ **Hour 4**: End-to-end integration, debugging, deployment, extensions

### Skills Acquired

- **LangGraph**: Graph-based AI workflows
- **State Management**: TypedDict with annotations
- **Streaming**: Real-time UI updates
- **RAG Pattern**: Retrieval-augmented generation
- **Modern React**: Hooks, TypeScript, Radix UI
- **Docker**: Multi-stage builds, orchestration
- **API Integration**: External services, adapters

### Practice Exercises

1. **Add Message History Persistence**
   - Store messages in PostgreSQL
   - Load previous conversations
   - Implement session management

2. **Implement Feedback System**
   - Add thumbs up/down to messages
   - Store feedback in database
   - Use for improving responses

3. **Create Custom Node**
   - Add "web_search" node
   - Integrate web search API
   - Combine KB + web results

4. **Build Admin Dashboard**
   - View all conversations
   - Analytics on queries
   - Monitor performance

### Resources

**Official Documentation**:
- [LangGraph Docs](https://docs.langchain.com/oss/python/langgraph/)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://radix-ui.com)

**Project Files**:
- `docs/LangGraph-quick-start.md` - LangGraph tutorial
- `docs/AI_Development_Guide_2025.md` - Architecture guide
- `backend/test-agent.ipynb` - Working examples
- `REPOSITORY_ANALYSIS.md` - Detailed technical analysis
- `QUICK_REFERENCE.md` - Developer cheat sheet

### Getting Help

1. **LangGraph Studio**: Visual debugging
2. **Browser DevTools**: Frontend debugging
3. **LangSmith**: Request tracing (requires API key)
4. **Community**: LangChain Discord, GitHub Discussions

---

## Appendix: Common Issues

### Backend Issues

| Problem | Solution |
|---------|----------|
| `Module not found: agent` | Run `pip install .` in backend/ |
| `CNB API 401 Unauthorized` | Check CNB_TOKEN in .env |
| `Ollama connection refused` | Start Ollama: `ollama serve` |
| `Port 2024 already in use` | Kill process: `lsof -ti:2024 | xargs kill` |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| `Cannot find module` | Run `npm install` in frontend/ |
| `CORS error` | Check API URL matches backend |
| `Blank screen` | Check browser console for errors |
| `Vite HMR not working` | Restart dev server: `npm run dev` |

### Docker Issues

| Problem | Solution |
|---------|----------|
| `Cannot connect to database` | Check postgres service is running |
| `Build failed` | Check Dockerfile paths are correct |
| `Port already in use` | Change port in docker-compose.yml |
| `Ollama not reachable` | Use `host.docker.internal` for Mac/Windows |

---

**Tutorial Version**: 1.0
**Last Updated**: December 3, 2024
**Project**: project-1-knowledge-base
**License**: Educational Use

Happy Learning! 🚀
