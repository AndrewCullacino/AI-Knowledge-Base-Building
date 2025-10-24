"""State definitions for the simplified CNB-powered agent."""
from __future__ import annotations

from typing import TypedDict, List, Dict, Any

from langgraph.graph import add_messages
from typing_extensions import Annotated

import operator


class AgentState(TypedDict):
    """Main state for the simplified agent."""

    messages: Annotated[list, add_messages]
    knowledge_base_results: List[Dict[str, Any]]
    sources_gathered: Annotated[list, operator.add]
    context: str
