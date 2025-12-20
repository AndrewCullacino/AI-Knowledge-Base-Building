"""Knowledge Base Router - Routes retrieval to appropriate KB based on type."""
from typing import Dict, Any, Optional
from agent.cnb_retrieval import query_cnb_knowledge_base
from agent.wikipedia_retrieval import query_wikipedia
from agent.kb_manager import kb_manager


def route_knowledge_base_query(
    query: str,
    kb_type: str = "cnb",
    repository: str = "cnb/docs",
    top_k: int = 5,
    custom_kb_id: Optional[str] = None
) -> Dict[str, Any]:
    """Route query to appropriate knowledge base.

    Args:
        query: Search query
        kb_type: Type of knowledge base - "cnb", "wikipedia", or "custom"
        repository: Repository name (for CNB)
        top_k: Number of results to return
        custom_kb_id: Custom knowledge base ID (required when kb_type="custom")

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
        if not custom_kb_id:
            print(f"⚠️ Custom KB ID not provided, falling back to Wikipedia...")
            return query_wikipedia(query, top_k=top_k)

        print(f"📁 Routing to Custom KB: {custom_kb_id}...")
        return kb_manager.query_knowledge_base(custom_kb_id, query, top_k=top_k)

    else:
        # Default to CNB
        print(f"⚠️ Unknown KB type '{kb_type}', defaulting to CNB...")
        return query_cnb_knowledge_base(query, repository=repository, top_k=top_k)
