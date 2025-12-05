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
        rag_enabled: Toggle RAG vs normal GPT mode - optional, defaults to True
        sources: Retrieved document metadata for citations
    """

    messages: Annotated[list, add_messages]
    repository: NotRequired[str]
    rag_enabled: NotRequired[bool]
    sources: NotRequired[List[Dict]]
