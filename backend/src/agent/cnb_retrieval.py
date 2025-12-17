import os
import requests
from typing import List, Dict

def query_cnb_knowledge_base(
    query: str,
    repository: str = "cnb/docs",
    top_k: int = 5
) -> Dict:
    """Query knowledge base - supports both CNB API and custom local KBs.

    Args:
        query (str): User's question
        repository (str, optional): Repository name or custom KB ID. Defaults to "cnb/docs".
        top_k (int, optional): Number of top results. Defaults to 5.

    Returns:
        Dict: with 'results' and 'sources'
    """

    # Check if this is a custom knowledge base
    if repository.startswith("custom_"):
        return query_custom_knowledge_base(query, repository, top_k)

    # Otherwise, use CNB API
    return query_cnb_api(query, repository, top_k)


def query_custom_knowledge_base(
    query: str,
    kb_id: str,
    top_k: int = 5
) -> Dict:
    """Query a custom local knowledge base.

    Args:
        query: User's question
        kb_id: Custom knowledge base ID
        top_k: Number of results to return

    Returns:
        Dict with 'results' and 'sources'
    """
    from agent.kb_manager import kb_manager

    try:
        return kb_manager.query_knowledge_base(kb_id, query, top_k)
    except Exception as e:
        print(f"Error querying custom KB '{kb_id}': {e}")
        return {"results": [], "sources": []}


def query_cnb_api(
    query: str,
    repository: str,
    top_k: int = 5
) -> Dict:
    """Query CNB API knowledge base.

    Args:
        query: User's question
        repository: CNB repository name
        top_k: Number of results to return

    Returns:
        Dict with 'results' and 'sources'
    """
    # Retrieve token from .env
    cnb_token = os.getenv("CNB_TOKEN")
    if not cnb_token:
        raise ValueError("CNB token not found in environment")

    # CNB api endpoint - Updated to match CNB API format
    api_url = f"https://api.cnb.cool/{repository}/-/knowledge/base/query"

    headers = {
        "Authorization": f"Bearer {cnb_token}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.cnb.api+json, application/vnd.cnb.web+json"
    }

    payload = {
        "query": query,
        "top_k": top_k
    }
    
    try:
        # Make api request
        response = requests.post(url = api_url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # CNB API returns a direct array, not a dict with "results" key
        # Handle both formats for backward compatibility
        if isinstance(data, list):
            results = data  # Direct array format
        elif isinstance(data, dict):
            results = data.get("results", [])  # Dict format (if API changes)
        else:
            results = []

        sources = []
        seen_urls = set()

        # Process results - API returns array of chunks with metadata
        for idx, result in enumerate(results):
            metadata = result.get("metadata", {})
            url = metadata.get("url", "")

            if url and url not in seen_urls:
                sources.append({
                    "id": len(sources) + 1,
                    "title": metadata.get("title", f"Source {len(sources) + 1}"),
                    "url": url,
                    "path": metadata.get("path", "")
                })
                seen_urls.add(url)

        return {
            "results": results,
            "sources": sources
        }
    except requests.RequestException as e:
        print(f"CNB APi error: {e}")
        return {"results": [], "sources": []}
    
    
