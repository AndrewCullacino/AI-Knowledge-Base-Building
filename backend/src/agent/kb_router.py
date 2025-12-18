"""Knowledge Base Router - Routes retrieval to appropriate KB based on type."""
from typing import Dict, Any
from agent.cnb_retrieval import query_cnb_knowledge_base
from agent.wikipedia_retrieval import query_wikipedia


def route_knowledge_base_query(
    query: str, kb_type: str = "cnb", repository: str = "cnb/docs", top_k: int = 5
) -> Dict[str, Any]:
    """Route query to appropriate knowledge base.

    Args:
        query: Search query
        kb_type: Type of knowledge base - "cnb", "wikipedia", or "custom"
        repository: Repository name (for CNB)
        top_k: Number of results to return

    Returns:
        Dictionary with results and sources in standard format
    """
    print(f"\n🔀 KB Router: type={kb_type}, query='{query}'")

    if kb_type == "wikipedia":
        print(f"📖 Routing to Wikipedia...")
        return query_wikipedia(query, top_k=top_k)

    elif kb_type == "cnb":
        print(f"📚 Routing to CNB Knowledge Base (repo: {repository})...")
        return query_cnb_knowledge_base(query, repository=repository, top_k=top_k)

    elif kb_type == "custom":
        # Future: route to custom knowledge bases
        print(f"⚠️ Custom KB not yet implemented, falling back to Wikipedia...")
        return query_wikipedia(query, top_k=top_k)

    else:
        # Default to CNB
        print(f"⚠️ Unknown KB type '{kb_type}', defaulting to CNB...")
        return query_cnb_knowledge_base(query, repository=repository, top_k=top_k)
