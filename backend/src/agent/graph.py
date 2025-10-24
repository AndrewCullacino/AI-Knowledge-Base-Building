"""Simplified LangGraph agent using CNB knowledge base."""
import os

from dotenv import load_dotenv
from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph
from langgraph.graph import START, END
from langchain_core.runnables import RunnableConfig

from agent.state import AgentState
from agent.configuration import Configuration
from agent.prompts import get_current_date, get_user_query, system_prompt_template
from agent.cnb_utils import CNBKnowledgeBase, CNBChatClient

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

    # Initialize CNB knowledge base client
    kb_client = CNBKnowledgeBase(
        api_base=configurable.cnb_api_base,
        repo_slug=configurable.cnb_repo_slug,
        api_token=configurable.cnb_token,
    )

    # Extract user query from messages
    user_query = get_user_query(state["messages"])

    # Query the knowledge base
    results = kb_client.query_knowledge_base(
        query=user_query, top_k=configurable.top_k_results
    )

    # Format context for LLM
    context = kb_client.format_context_for_llm(results)

    # Extract sources
    sources = kb_client.get_sources_from_results(results)

    return {
        "knowledge_base_results": results,
        "context": context,
        "sources_gathered": sources,
    }


def generate_answer(state: AgentState, config: RunnableConfig) -> AgentState:
    """Generate answer using CNB chat API with knowledge base context.

    Args:
        state: Current graph state containing context and messages
        config: Configuration for the runnable

    Returns:
        Dictionary with state update including the AI response message
    """
    configurable = Configuration.from_runnable_config(config)

    # Initialize CNB chat client
    chat_client = CNBChatClient(
        api_base=configurable.cnb_api_base,
        repo_slug=configurable.cnb_repo_slug,
        api_token=configurable.cnb_token,
    )

    # Prepare messages for chat API
    current_date = get_current_date()
    system_message = system_prompt_template.format(
        current_date=current_date, context=state.get("context", "")
    )

    # Build message list
    messages = [{"role": "system", "content": system_message}]

    # Add conversation history
    for msg in state["messages"]:
        if hasattr(msg, "type"):
            role = "user" if msg.type == "human" else "assistant"
            messages.append({"role": role, "content": msg.content})
        elif isinstance(msg, dict):
            messages.append(msg)

    # Call CNB chat API
    response = chat_client.chat_completion(
        messages=messages, model=configurable.chat_model, stream=False
    )

    # Extract response content
    answer_content = ""
    if "choices" in response and len(response["choices"]) > 0:
        choice = response["choices"][0]
        if "message" in choice:
            answer_content = choice["message"].get("content", "")
        elif "content" in choice:
            answer_content = choice["content"]

    return {"messages": [AIMessage(content=answer_content)]}


# Create the simplified agent graph
builder = StateGraph(AgentState, config_schema=Configuration)

# Define nodes
builder.add_node("retrieve_knowledge", retrieve_knowledge)
builder.add_node("generate_answer", generate_answer)

# Define edges
builder.add_edge(START, "retrieve_knowledge")
builder.add_edge("retrieve_knowledge", "generate_answer")
builder.add_edge("generate_answer", END)

# Compile the graph
graph = builder.compile(name="cnb-knowledge-agent")
