import os
import requests
from typing import List, Dict

def query_cnb_knowledge_base(
    query: str,
    repository: str = "cnb/docs",
    top_k: int = 5
) -> Dict:
    """_summary_

    Args:
        query (str): User's question
        repository (str, optional): Repository name. Defaults to "cnb/docs".
        top_k (int, optional): Number of top results. Defaults to 5;.

    Returns:
        Dict: with 'results' and 'sources'
    """
    
    # Retrieve token from .env
    cnb_token = os.getenv("CNB_TOKEN")
    if not cnb_token:
        raise ValueError("CNB token not found in environment")
    
    # CNB api endpoint - Updated to match CNB API format
    api_url = f"https://api.cnb.cool/{repository}/-/knowledge/base/query"

    headers = {
        "Authorization": cnb_token,
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
        
        sources = []
        seen_urls = set()

        # Process results - API returns array of chunks with metadata
        for idx, result in enumerate(data.get("results", [])):
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
            "results": data.get("results", []),
            "sources": sources
        }
    except requests.RequestException as e:
        print(f"CNB APi error: {e}")
        return {"results": [], "sources": []}
    
    
