"""Simplified LangGraph agent using CNB knowledge base."""
import os
import json

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langgraph.graph import StateGraph
from langgraph.graph import START, END
from langchain_core.runnables import RunnableConfig
from langchain_ollama import ChatOllama

from agent.state import AgentState
from agent.configuration import Configuration
from agent.prompts import get_current_date, get_user_query, system_prompt_template, normal_gpt_prompt_template
from agent.cnb_utils import CNBKnowledgeBase
from agent.cnb_retrieval import query_cnb_knowledge_base

load_dotenv()


# Nodes
def retrieve_knowledge(state: AgentState, config: RunnableConfig) -> AgentState:
    """Retrieve relevant context from CNB knowledge base.

    Args:
        state: Current graph state containing user messages
        config: Configuration for the runnable

    Returns:
        Dictionary with state update including knowledge_base_results and context
    """
    configurable = Configuration.from_runnable_config(config)

    messages = state["messages"]
    repo = state.get("repository", "cnb/docs")

    # Get last user message
    last_message = messages[-1].content if messages else ""

    # Extract user query from messages
    user_query = get_user_query(state["messages"])

    print(f"\n{'='*80}")
    print(f"🔍 RETRIEVE_KNOWLEDGE DEBUG")
    print(f"{'='*80}")
    print(f"Repository: {repo}")
    print(f"Query: {last_message}")
    print(f"Top K: 10")

    # Query the knowledge base
    result = query_cnb_knowledge_base(
        query=last_message,
        repository=repo,
        top_k=10
    )

    print(f"\n📊 CNB API Results:")
    print(f"  - Number of results: {len(result.get('results', []))}")
    print(f"  - Number of sources: {len(result.get('sources', []))}")

    # Each chunk gets a citation number - API returns "chunk" field, not "content"
    context = "\n\n".join([
        f"Source [{i+1}]: {chunk.get('chunk', '')}"
        for i, chunk in enumerate(result["results"])
    ])

    print(f"\n📝 Generated Context:")
    print(f"  - Context length: {len(context)} characters")
    print(f"  - Context preview (first 500 chars):")
    print(f"  {context[:500]}...")
    print(f"{'='*80}\n")

    return {
        **state,
        "context": context,
        "sources": result["sources"]
    }


def generate_answer(state: AgentState, config: RunnableConfig) -> AgentState:
    """Generate answer using Ollama with knowledge base context.

    Args:
        state: Current graph state containing context and messages
        config: Configuration for the runnable

    Returns:
        Dictionary with state update including the AI response message
    """
    configurable = Configuration.from_runnable_config(config)
    context = state.get("context", "")
    sources = state.get("sources", [])
    rag_enabled = state.get("rag_enabled", True)
    messages = state["messages"]
    last_message = messages[-1].content

    print(f"\n{'='*80}")
    print(f"🤖 GENERATE_ANSWER DEBUG")
    print(f"{'='*80}")
    print(f"RAG Enabled: {rag_enabled}")
    print(f"Context length: {len(context)} characters")
    print(f"Number of sources: {len(sources)}")
    print(f"User query: {last_message}")
    print(f"Model: {configurable.ollama_model}")

    # Initialize Ollama chat client
    llm = ChatOllama(
        model=configurable.ollama_model,
        base_url=configurable.ollama_base_url,
        temperature=configurable.ollama_temperature,
        reasoning=configurable.ollama_reasoning,
    )

    # Prepare messages for chat API - use appropriate prompt based on RAG mode
    current_date = get_current_date()
    if rag_enabled:
        system_message_content = system_prompt_template.format(
            current_date=current_date, context=context
        )
    else:
        # Normal GPT mode - no context needed
        system_message_content = normal_gpt_prompt_template.format(
            current_date=current_date
        )

    print(f"\n📤 System Message (first 1000 chars):")
    print(f"{system_message_content[:1000]}...")
    print(f"\nTotal system message length: {len(system_message_content)} characters")

    # Build message list using LangChain message types
    messages = [SystemMessage(content=system_message_content)]

    # Add conversation history
    for msg in state["messages"]:
        if hasattr(msg, "type"):
            if msg.type == "human":
                messages.append(HumanMessage(content=msg.content))
            elif msg.type == "ai":
                messages.append(AIMessage(content=msg.content))
        elif isinstance(msg, dict):
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    # Call Ollama
    response = llm.invoke(messages)

    # Format response based on mode
    if rag_enabled:
        # RAG mode: Include sources for citations
        answer_with_sources = {
            "content": response.content,
            "sources": sources
        }
    else:
        # Normal GPT mode: No sources, just content
        answer_with_sources = {
            "content": response.content,
            "sources": []  # Empty sources for normal mode
        }

    # Return ONLY the new AI message (add_messages reducer will append it to state)
    # Use json.dumps() to create valid JSON string for frontend parsing
    return {
        **state,
        "messages": [AIMessage(content=json.dumps(answer_with_sources))]
    }


# Conditional routing function
def should_retrieve(state: AgentState) -> str:
    """Determine if we should use RAG or skip to direct GPT answer."""
    rag_enabled = state.get("rag_enabled", True)  # Default to True for backward compatibility

    if rag_enabled:
        print("🔍 RAG Mode: Retrieving from knowledge base...")
        return "retrieve_knowledge"
    else:
        print("💬 GPT Mode: Direct answer without retrieval...")
        return "generate_answer"

# Create the simplified agent graph
builder = StateGraph(AgentState, config_schema=Configuration)

# Define nodes
builder.add_node("retrieve_knowledge", retrieve_knowledge)
builder.add_node("generate_answer", generate_answer)

# Define conditional edge from START
builder.add_conditional_edges(
    START,
    should_retrieve,
    {
        "retrieve_knowledge": "retrieve_knowledge",
        "generate_answer": "generate_answer"
    }
)

# Define edges
builder.add_edge("retrieve_knowledge", "generate_answer")
builder.add_edge("generate_answer", END)

# Compile the graph
graph = builder.compile(name="cnb-knowledge-agent")
