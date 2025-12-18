"""DeepResearch LangGraph workflow for multi-round knowledge base research."""
import json
from typing import Literal

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langchain_ollama import ChatOllama

# Import for emitting custom events to frontend
from langchain_core.callbacks.manager import adispatch_custom_event, dispatch_custom_event

from agent.state import AgentState
from agent.configuration import Configuration
from agent.prompts import (
    get_user_query,
    query_generation_prompt_template,
    reflection_prompt_template,
    research_report_prompt_template,
)
from agent.kb_router import route_knowledge_base_query

load_dotenv()


def initialize_research(state: AgentState, config: RunnableConfig) -> AgentState:
    """Initialize the research state with starting status.

    Args:
        state: Current state
        config: Configuration

    Returns:
        Updated state with initialization status
    """
    print(f"\n{'='*80}")
    print(f"🚀 INITIALIZING DEEP RESEARCH")
    print(f"{'='*80}\n")

    return {
        **state,
        "step_status": "initializing",
        "research_loop_count": 0,
        "max_research_loops": state.get("max_research_loops", 3),
    }


def generate_research_queries(state: AgentState, config: RunnableConfig) -> AgentState:
    """Generate multiple search queries to research the user's question comprehensively.

    Args:
        state: Current state with user question
        config: Configuration

    Returns:
        Updated state with research queries
    """
    configurable = Configuration.from_runnable_config(config)
    messages = state["messages"]
    user_question = get_user_query(messages)

    # Get previous queries to avoid duplication
    previous_queries = state.get("research_queries", [])
    all_contexts = state.get("all_contexts", [])

    # Context summary for prompt
    context_summary = "No context yet" if not all_contexts else f"{len(all_contexts)} contexts gathered"

    # Determine number of queries to generate
    loop_count = state.get("research_loop_count", 0)
    num_queries = 3 if loop_count == 0 else 2  # More queries on first iteration

    print(f"\n{'='*80}")
    print(f"🔍 GENERATE_RESEARCH_QUERIES - Loop {loop_count}")
    print(f"{'='*80}")
    print(f"User Question: {user_question}")
    print(f"Previous Queries: {previous_queries}")
    print(f"Generating {num_queries} new queries...")

    # Initialize LLM for query generation
    # Use lightweight model for speed (Optional Bonus Feature: Multiple Models)
    llm = ChatOllama(
        model=configurable.query_generation_model,
        base_url=configurable.ollama_base_url,
        temperature=0.7,
        reasoning=False,  # Disable reasoning for query generation
    )

    print(f"ℹ️ Using model: {configurable.query_generation_model} for query generation")

    # Generate queries
    prompt = query_generation_prompt_template.format(
        user_question=user_question,
        previous_queries=", ".join(previous_queries) if previous_queries else "None",
        context_summary=context_summary,
        num_queries=num_queries,
    )

    print(f"⏳ Waiting for LLM response...")
    
    # Emit custom event for frontend - starting query generation
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "generate_queries_start",
            "loop_count": loop_count,
            "message": "Analyzing question and planning search strategy...",
        },
        config=config,
    )
    
    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        # Parse JSON response
        result = json.loads(response.content.strip())
        new_queries = result.get("queries", [])
    except json.JSONDecodeError:
        # Fallback: use original question
        print("⚠️ Failed to parse query generation response, using original question")
        new_queries = [user_question]

    # Update queries list
    all_queries = previous_queries + new_queries

    print(f"✅ Generated Queries: {new_queries}")
    print(f"{'='*80}\n")

    # Emit custom event for frontend - queries generated
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "generate_queries_complete",
            "queries": new_queries,
            "total_queries": len(all_queries),
            "loop_count": loop_count,
        },
        config=config,
    )

    # Emit event data for frontend
    # Return state with event markers for frontend processing
    return {
        **state,
        "research_queries": all_queries,
        "step_status": "query_generation",
        "generate_queries": {  # Event data for frontend
            "queries": new_queries,
            "total_queries": len(all_queries),
            "loop_count": loop_count,
        }
    }


def retrieve_multi_contexts(state: AgentState, config: RunnableConfig) -> AgentState:
    """Retrieve contexts for all generated queries and aggregate results.

    Args:
        state: Current state with research queries
        config: Configuration

    Returns:
        Updated state with aggregated contexts
    """
    configurable = Configuration.from_runnable_config(config)
    queries = state.get("research_queries", [])
    repo = state.get("repository", "cnb/docs")
    kb_type = state.get("knowledge_base_type", "cnb")  # NEW: Get KB type
    all_contexts = state.get("all_contexts", [])
    loop_count = state.get("research_loop_count", 0)

    # Determine which queries to use for this iteration
    previous_count = len(all_contexts) if all_contexts else 0
    if loop_count == 0:
        # First iteration: use first 3 queries
        queries_to_search = queries[:3]
    else:
        # Subsequent iterations: use newest queries
        queries_to_search = queries[-2:]  # Last 2 queries generated

    print(f"\n{'='*80}")
    print(f"📚 RETRIEVE_MULTI_CONTEXTS - Loop {loop_count}")
    print(f"{'='*80}")
    print(f"Knowledge Base Type: {kb_type}")  # NEW: Log KB type
    print(f"Repository: {repo}")
    print(f"Queries to search: {queries_to_search}")
    print(f"Previous contexts: {previous_count}")

    # Emit custom event for frontend - starting retrieval
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "retrieve_start",
            "loop_count": loop_count,
            "queries": queries_to_search,
            "message": f"Searching knowledge base for: {', '.join(queries_to_search[:2])}...",
        },
        config=config,
    )

    # Retrieve for each query
    new_contexts = []
    all_sources = []
    seen_urls = set()

    for query in queries_to_search:
        print(f"\n🔍 Searching: {query}")
        # NEW: Use router instead of direct CNB call
        result = route_knowledge_base_query(
            query=query,
            kb_type=kb_type,
            repository=repo,
            top_k=5,  # 5 results per query
        )

        # Add results with query attribution
        for idx, chunk_data in enumerate(result.get("results", [])):
            context_item = {
                "query": query,
                "content": chunk_data.get("chunk", ""),
                "metadata": chunk_data.get("metadata", {}),
            }
            new_contexts.append(context_item)

        # Aggregate unique sources
        for source in result.get("sources", []):
            url = source.get("url", "")
            if url and url not in seen_urls:
                all_sources.append(source)
                seen_urls.add(url)

        print(f"  ✅ Found {len(result.get('results', []))} results")

    # Combine with previous contexts
    combined_contexts = all_contexts + new_contexts

    print(f"\n📊 Retrieval Summary:")
    print(f"  - New contexts: {len(new_contexts)}")
    print(f"  - Total contexts: {len(combined_contexts)}")
    print(f"  - Unique sources: {len(all_sources)}")
    print(f"{'='*80}\n")

    # Emit custom event for frontend - retrieval complete
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "retrieve_complete",
            "loop_count": loop_count,
            "new_contexts": len(new_contexts),
            "total_contexts": len(combined_contexts),
            "sources_count": len(all_sources),
        },
        config=config,
    )

    # Emit event data for frontend
    return {
        **state,
        "all_contexts": combined_contexts,
        "sources": all_sources,
        "step_status": "retrieval",
        "retrieve_contexts": {  # Event data for frontend
            "num_contexts": len(combined_contexts),
            "new_contexts": len(new_contexts),
            "loop_count": loop_count,
        }
    }


def reflect_on_research(state: AgentState, config: RunnableConfig) -> AgentState:
    """Analyze gathered contexts to determine if more research is needed.

    Args:
        state: Current state with contexts
        config: Configuration

    Returns:
        Updated state with reflection result
    """
    configurable = Configuration.from_runnable_config(config)
    messages = state["messages"]
    user_question = get_user_query(messages)
    all_contexts = state.get("all_contexts", [])
    loop_count = state.get("research_loop_count", 0)
    max_loops = state.get("max_research_loops", 3)

    print(f"\n{'='*80}")
    print(f"🤔 REFLECT_ON_RESEARCH - Loop {loop_count}")
    print(f"{'='*80}")
    print(f"Contexts gathered: {len(all_contexts)}")
    print(f"Loop: {loop_count}/{max_loops}")

    # Prepare context summary for reflection
    context_text = "\n\n".join([
        f"Context {i+1} (from query: '{ctx['query']}'):\n{ctx['content'][:300]}..."
        for i, ctx in enumerate(all_contexts[:10])  # Limit to first 10 for prompt
    ])

    print(f"⏳ Analyzing research quality...")

    # Emit custom event for frontend - starting reflection
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "reflect_start",
            "loop_count": loop_count,
            "contexts_count": len(all_contexts),
            "message": f"Evaluating {len(all_contexts)} gathered contexts...",
        },
        config=config,
    )

    # Initialize LLM for reflection
    # Use more capable model for analysis (Optional Bonus Feature: Multiple Models)
    llm = ChatOllama(
        model=configurable.reflection_model,
        base_url=configurable.ollama_base_url,
        temperature=0.3,  # Lower temperature for analysis
        reasoning=False,
    )

    print(f"ℹ️ Using model: {configurable.reflection_model} for reflection")

    # Reflect on sufficiency
    prompt = reflection_prompt_template.format(
        user_question=user_question,
        num_contexts=len(all_contexts),
        all_contexts=context_text,
        research_loop_count=loop_count + 1,
        max_research_loops=max_loops,
    )

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        # Parse JSON response
        reflection = json.loads(response.content.strip())
    except json.JSONDecodeError:
        # Fallback: assume sufficient if we have contexts
        print("⚠️ Failed to parse reflection response, defaulting to sufficient=True")
        reflection = {
            "sufficient": True,
            "confidence": 0.7,
            "reasoning": "Fallback decision: contexts gathered",
            "suggested_focus": ""
        }

    print(f"\n💭 Reflection Result:")
    print(f"  - Sufficient: {reflection.get('sufficient', False)}")
    print(f"  - Confidence: {reflection.get('confidence', 0.0):.2f}")
    print(f"  - Reasoning: {reflection.get('reasoning', 'N/A')}")
    print(f"  - Suggested Focus: {reflection.get('suggested_focus', 'N/A')}")
    print(f"{'='*80}\n")

    # Emit custom event for frontend - reflection complete
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "reflect_complete",
            "loop_count": loop_count + 1,
            "sufficient": reflection.get("sufficient", False),
            "confidence": reflection.get("confidence", 0.0),
            "reasoning": reflection.get("reasoning", ""),
        },
        config=config,
    )

    # Emit event data for frontend
    return {
        **state,
        "reflection_result": reflection,
        "step_status": "reflection",
        "reflect": {  # Event data for frontend
            "sufficient": reflection.get("sufficient", False),
            "confidence": reflection.get("confidence", 0.0),
            "reasoning": reflection.get("reasoning", ""),
            "loop_count": loop_count + 1,
        }
    }


def finalize_research_report(state: AgentState, config: RunnableConfig) -> AgentState:
    """Generate comprehensive research report from all gathered contexts.

    Args:
        state: Current state with all contexts
        config: Configuration

    Returns:
        Updated state with final answer message
    """
    configurable = Configuration.from_runnable_config(config)
    messages = state["messages"]
    user_question = get_user_query(messages)
    all_contexts = state.get("all_contexts", [])
    sources = state.get("sources", [])

    print(f"\n{'='*80}")
    print(f"📝 FINALIZE_RESEARCH_REPORT")
    print(f"{'='*80}")
    print(f"Total contexts: {len(all_contexts)}")
    print(f"Unique sources: {len(sources)}")

    # Prepare full context for report generation
    full_context = "\n\n".join([
        f"Source [{i+1}] (from query: '{ctx['query']}'):\n{ctx['content']}"
        for i, ctx in enumerate(all_contexts)
    ])

    # Initialize LLM for report generation
    # Use most capable model for quality (Optional Bonus Feature: Multiple Models)
    # IMPORTANT: Disable reasoning for final report to prevent timeouts
    # Reasoning mode can take 60+ seconds and cause connection errors
    llm = ChatOllama(
        model=configurable.report_generation_model,
        base_url=configurable.ollama_base_url,
        temperature=0.7,
        reasoning=False,  # Always False to prevent timeouts
        timeout=120,  # 2 minute timeout for long reports
    )

    print(f"⏳ Generating comprehensive research report...")
    print(f"ℹ️ Using model: {configurable.report_generation_model} for report generation")
    print(f"ℹ️ Reasoning disabled for report generation to ensure reliability")

    # Emit custom event for frontend - starting report generation
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "finalize_start",
            "contexts_count": len(all_contexts),
            "sources_count": len(sources),
            "message": f"Synthesizing {len(all_contexts)} contexts from {len(sources)} sources...",
        },
        config=config,
    )

    # Generate research report
    prompt = research_report_prompt_template.format(
        user_question=user_question,
        num_contexts=len(all_contexts),
        all_contexts=full_context,
    )

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
    except Exception as e:
        # Fallback: Generate a simple summary if report generation fails
        print(f"⚠️ Report generation failed: {e}")
        print(f"📝 Generating fallback summary...")
        fallback_content = f"Research completed with {len(all_contexts)} contexts from {len(sources)} sources.\n\nNote: Full report generation encountered an error. Please try again or reduce research depth."
        response = type('obj', (object,), {'content': fallback_content})()

    # Format response with sources
    answer_with_sources = {
        "content": response.content,
        "sources": sources
    }

    print(f"\n✅ Research Report Generated")
    print(f"  - Report length: {len(response.content)} characters")
    print(f"  - Sources included: {len(sources)}")
    print(f"{'='*80}\n")

    # Emit custom event for frontend - report generation complete
    dispatch_custom_event(
        "deep_research_step",
        {
            "step": "finalize_complete",
            "report_length": len(response.content),
            "sources_count": len(sources),
        },
        config=config,
    )

    # Create AI message with the research report
    ai_message = AIMessage(content=json.dumps(answer_with_sources))

    # Emit event data for frontend
    return {
        **state,
        "messages": messages + [ai_message],  # Append AI message to conversation
        "step_status": "finalized",
        "finalize_report": {  # Event data for frontend
            "report_length": len(response.content),
            "num_sources": len(sources),
            "num_contexts": len(all_contexts),
        },
        "sources": sources,  # Final sources for frontend
    }


def should_continue_research(state: AgentState) -> Literal["generate_queries", "finalize_report"]:
    """Determine if we should continue researching or finalize the report.

    Args:
        state: Current state with reflection result

    Returns:
        Next node to execute
    """
    reflection = state.get("reflection_result", {})
    loop_count = state.get("research_loop_count", 0)
    max_loops = state.get("max_research_loops", 3)

    # Check if we've hit max loops
    if loop_count >= max_loops:
        print(f"🛑 Max loops reached ({max_loops}), finalizing report...")
        return "finalize_report"

    # Check reflection result
    sufficient = reflection.get("sufficient", False)
    if sufficient:
        print(f"✅ Research sufficient (confidence: {reflection.get('confidence', 0):.2f}), finalizing report...")
        return "finalize_report"

    print(f"🔄 More research needed, continuing to loop {loop_count + 1}...")
    return "generate_queries"


def increment_loop_counter(state: AgentState, config: RunnableConfig) -> AgentState:
    """Increment the research loop counter.

    Args:
        state: Current state
        config: Configuration

    Returns:
        Updated state with incremented counter
    """
    current_count = state.get("research_loop_count", 0)
    return {
        **state,
        "research_loop_count": current_count + 1,
    }


# Build the DeepResearch graph
def create_deep_research_graph():
    """Create and compile the DeepResearch LangGraph workflow."""

    builder = StateGraph(AgentState, config_schema=Configuration)

    # Add nodes
    builder.add_node("initialize", initialize_research)
    builder.add_node("generate_queries", generate_research_queries)
    builder.add_node("retrieve_contexts", retrieve_multi_contexts)
    builder.add_node("reflect", reflect_on_research)
    builder.add_node("finalize_report", finalize_research_report)
    builder.add_node("increment_counter", increment_loop_counter)

    # Define edges
    builder.add_edge(START, "initialize")
    builder.add_edge("initialize", "generate_queries")
    builder.add_edge("generate_queries", "retrieve_contexts")
    builder.add_edge("retrieve_contexts", "reflect")

    # Conditional edge after reflection
    builder.add_conditional_edges(
        "reflect",
        should_continue_research,
        {
            "generate_queries": "increment_counter",
            "finalize_report": "finalize_report",
        }
    )

    # Loop back to generate more queries
    builder.add_edge("increment_counter", "generate_queries")

    # End after finalizing
    builder.add_edge("finalize_report", END)

    return builder.compile(name="deep-research-agent")


# Export the compiled graph
deep_research_graph = create_deep_research_graph()
