"""State definitions for the simplified CNB-powered agent."""
from __future__ import annotations

from typing import TypedDict, List, Dict, Any, NotRequired

from langgraph.graph import add_messages
from typing_extensions import Annotated

import operator


class AgentState(TypedDict):
    """
    State schema for enhanced dialogue workflow

    Attributes:
        messages: Conversation history
        repository: Knowledge base (e.g. cnb/docs) - optional, defaults to cnb/docs
        knowledge_base_type: Type of KB - "cnb", "wikipedia", or "custom"
        rag_enabled: Toggle RAG vs normal GPT mode - optional, defaults to True
        sources: Retrieved document metadata for citations

        # DeepResearch specific fields
        research_queries: NotRequired[List[str]]  # Generated search queries
        all_contexts: NotRequired[List[Dict]]  # All retrieved contexts
        research_loop_count: NotRequired[int]  # Current research iteration
        max_research_loops: NotRequired[int]  # Maximum loops allowed
        reflection_result: NotRequired[Dict]  # Reflection analysis result
        step_status: NotRequired[str]  # Current step for frontend display
        deep_research_mode: NotRequired[bool]  # Enable DeepResearch workflow
    """

    messages: Annotated[list, add_messages]
    repository: NotRequired[str]
    knowledge_base_type: NotRequired[str]  # "cnb", "wikipedia", or "custom"
    rag_enabled: NotRequired[bool]
    sources: NotRequired[List[Dict]]

    # DeepResearch fields
    research_queries: NotRequired[List[str]]
    all_contexts: NotRequired[List[Dict]]
    research_loop_count: NotRequired[int]
    max_research_loops: NotRequired[int]
    reflection_result: NotRequired[Dict]
    step_status: NotRequired[str]
    deep_research_mode: NotRequired[bool]

    # DeepResearch event data for frontend streaming
    generate_queries: NotRequired[Dict]  # Query generation event data
    retrieve_contexts: NotRequired[Dict]  # Retrieval event data
    reflect: NotRequired[Dict]  # Reflection event data
    finalize_report: NotRequired[Dict]  # Report generation event data
