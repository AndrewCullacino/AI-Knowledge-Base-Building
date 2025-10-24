"""CNB Knowledge Base utilities for retrieval and chat."""
import os
import requests
from typing import List, Dict, Any, Optional


class CNBKnowledgeBase:
    """Client for interacting with CNB knowledge base API."""

    def __init__(
        self,
        api_base: str = "https://api.cnb.cool",
        repo_slug: str = "cnb/docs",
        api_token: Optional[str] = None,
    ):
        """Initialize CNB knowledge base client.

        Args:
            api_base: Base URL for CNB API
            repo_slug: Repository slug (e.g., "cnb/docs")
            api_token: API access token with repo-code:r permission
        """
        self.api_base = api_base.rstrip("/")
        self.repo_slug = repo_slug
        self.api_token = api_token or os.getenv("CNB_TOKEN", "")
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        if self.api_token:
            self.headers["Authorization"] = f"Bearer {self.api_token}"

    def query_knowledge_base(
        self, query: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Query the CNB knowledge base.

        Args:
            query: The search query
            top_k: Number of results to return (default: 5)

        Returns:
            List of knowledge base results with score, chunk, and metadata
        """
        url = f"{self.api_base}/{self.repo_slug}/-/knowledge/base/query"
        payload = {"query": query, "top_k": top_k}

        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying knowledge base: {e}")
            return []

    def format_context_for_llm(self, results: List[Dict[str, Any]]) -> str:
        """Format knowledge base results as context for LLM.

        Args:
            results: List of knowledge base query results

        Returns:
            Formatted context string with sources
        """
        if not results:
            return "No relevant context found in the knowledge base."

        context_parts = []
        for idx, result in enumerate(results, 1):
            chunk = result.get("chunk", "")
            metadata = result.get("metadata", {})
            score = result.get("score", 0)
            path = metadata.get("path", "unknown")

            context_parts.append(
                f"[Source {idx}] (relevance: {score:.2f}, path: {path})\n{chunk}\n"
            )

        return "\n---\n\n".join(context_parts)

    def get_sources_from_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract source information from knowledge base results.

        Args:
            results: List of knowledge base query results

        Returns:
            List of source dictionaries with name, path, and score
        """
        sources = []
        for result in results:
            metadata = result.get("metadata", {})
            sources.append(
                {
                    "name": metadata.get("name", "Unknown"),
                    "path": metadata.get("path", ""),
                    "score": result.get("score", 0),
                    "hash": metadata.get("hash", ""),
                }
            )
        return sources


class CNBChatClient:
    """Client for interacting with CNB chat completion API (OpenAI format)."""

    def __init__(
        self,
        api_base: str = "https://api.cnb.cool",
        repo_slug: str = "cnb/docs",
        api_token: Optional[str] = None,
    ):
        """Initialize CNB chat client.

        Args:
            api_base: Base URL for CNB API
            repo_slug: Repository slug (e.g., "cnb/docs")
            api_token: API access token with repo-code:r permission
        """
        self.api_base = api_base.rstrip("/")
        self.repo_slug = repo_slug
        self.api_token = api_token or os.getenv("CNB_TOKEN", "")
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        if self.api_token:
            self.headers["Authorization"] = f"Bearer {self.api_token}"

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "hunyuan-a13b",
        stream: bool = False,
    ) -> Dict[str, Any]:
        """Send a chat completion request to CNB API.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model name to use
            stream: Whether to stream the response

        Returns:
            Chat completion response
        """
        url = f"{self.api_base}/{self.repo_slug}/-/ai/chat/completions"
        payload = {"messages": messages, "model": model, "stream": stream}

        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error in chat completion: {e}")
            return {
                "choices": [
                    {
                        "message": {
                            "content": f"Error communicating with CNB API: {str(e)}"
                        }
                    }
                ]
            }

    def chat_completion_stream(
        self, messages: List[Dict[str, str]], model: str = "gpt-4o-mini"
    ):
        """Send a streaming chat completion request to CNB API.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model name to use

        Yields:
            Response chunks from the API
        """
        url = f"{self.api_base}/{self.repo_slug}/-/ai/chat/completions"
        payload = {"messages": messages, "model": model, "stream": True}

        try:
            response = requests.post(
                url, json=payload, headers=self.headers, stream=True, timeout=60
            )
            response.raise_for_status()

            for chunk in response.iter_lines():
                if chunk:
                    yield chunk.decode("utf-8")
        except requests.exceptions.RequestException as e:
            print(f"Error in streaming chat completion: {e}")
            yield f"data: {{'error': '{str(e)}'}}\n\n"

