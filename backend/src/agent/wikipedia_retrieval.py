"""Wikipedia API integration for general knowledge retrieval."""
import requests
from typing import List, Dict, Any, Optional
import time


class WikipediaRetrieval:
    """Wikipedia API client for knowledge base retrieval."""

    BASE_URL = "https://en.wikipedia.org/w/api.php"
    USER_AGENT = "RAG-Knowledge-Base/1.0 (Educational Project)"

    def __init__(self, language: str = "en"):
        """Initialize Wikipedia retrieval client.

        Args:
            language: Wikipedia language code (default: en)
        """
        self.language = language
        self.base_url = f"https://{language}.wikipedia.org/w/api.php"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.USER_AGENT})

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search Wikipedia for relevant articles.

        Args:
            query: Search query string
            limit: Maximum number of results (default: 5)

        Returns:
            List of search results with title, page_id, and snippet
        """
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": limit,
            "srprop": "snippet|titlesnippet",
            "format": "json",
            "utf8": 1,
        }

        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("query", {}).get("search", []):
                results.append(
                    {
                        "title": item.get("title", ""),
                        "page_id": item.get("pageid", 0),
                        "snippet": self._clean_html(item.get("snippet", "")),
                    }
                )

            return results

        except requests.exceptions.RequestException as e:
            print(f"⚠️ Wikipedia search error: {e}")
            return []

    def get_page_content(
        self, title: str, extract_format: str = "plain"
    ) -> Optional[Dict[str, Any]]:
        """Get full content of a Wikipedia page.

        Args:
            title: Wikipedia page title
            extract_format: Content format - 'plain' or 'html' (default: plain)

        Returns:
            Dictionary with page content and metadata
        """
        params = {
            "action": "query",
            "titles": title,
            "prop": "extracts|info",
            "exintro": False,  # Get full article, not just intro
            "explaintext": extract_format == "plain",
            "inprop": "url",
            "format": "json",
            "utf8": 1,
        }

        try:
            response = self.session.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            if not pages:
                return None

            # Get first (and should be only) page
            page = next(iter(pages.values()))

            if "missing" in page:
                print(f"⚠️ Wikipedia page '{title}' not found")
                return None

            return {
                "title": page.get("title", ""),
                "page_id": page.get("pageid", 0),
                "url": page.get("fullurl", ""),
                "content": page.get("extract", ""),
            }

        except requests.exceptions.RequestException as e:
            print(f"⚠️ Wikipedia page fetch error: {e}")
            return None

    def get_page_sections(self, title: str) -> List[Dict[str, Any]]:
        """Get structured sections from a Wikipedia page.

        Args:
            title: Wikipedia page title

        Returns:
            List of sections with titles and content
        """
        params = {
            "action": "parse",
            "page": title,
            "prop": "sections",
            "format": "json",
            "utf8": 1,
        }

        try:
            response = self.session.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                print(f"⚠️ Wikipedia parse error: {data['error'].get('info', '')}")
                return []

            sections = data.get("parse", {}).get("sections", [])
            return [
                {
                    "index": sec.get("index", ""),
                    "level": sec.get("level", ""),
                    "title": sec.get("line", ""),
                    "anchor": sec.get("anchor", ""),
                }
                for sec in sections
            ]

        except requests.exceptions.RequestException as e:
            print(f"⚠️ Wikipedia sections fetch error: {e}")
            return []

    def retrieve_for_query(
        self, query: str, top_k: int = 5, max_chars_per_article: int = 3000
    ) -> Dict[str, Any]:
        """Retrieve and process Wikipedia content for a query.

        This is the main method to use for RAG retrieval.

        Args:
            query: Search query
            top_k: Number of articles to retrieve (default: 5)
            max_chars_per_article: Maximum characters to extract per article

        Returns:
            Dictionary with results and sources for RAG system
        """
        print(f"\n{'='*80}")
        print(f"🔍 WIKIPEDIA RETRIEVAL")
        print(f"{'='*80}")
        print(f"Query: {query}")
        print(f"Top K: {top_k}")

        # Step 1: Search for relevant articles
        search_results = self.search(query, limit=top_k)

        if not search_results:
            print("❌ No Wikipedia articles found")
            return {"results": [], "sources": []}

        print(f"\n📚 Found {len(search_results)} articles:")
        for i, result in enumerate(search_results, 1):
            print(f"  {i}. {result['title']}")

        # Step 2: Fetch content for each article
        results = []
        sources = []
        seen_titles = set()

        for search_result in search_results:
            title = search_result["title"]

            if title in seen_titles:
                continue
            seen_titles.add(title)

            # Get page content
            page_data = self.get_page_content(title)

            if not page_data:
                continue

            content = page_data["content"]

            # Truncate if too long
            if len(content) > max_chars_per_article:
                content = content[:max_chars_per_article] + "..."

            # Create result chunk
            chunk = {
                "chunk": content,
                "metadata": {
                    "title": title,
                    "url": page_data["url"],
                    "page_id": page_data["page_id"],
                    "source": "wikipedia",
                    "snippet": search_result["snippet"],
                },
            }

            results.append(chunk)

            # Create source entry
            source = {
                "title": title,
                "url": page_data["url"],
                "source": "wikipedia",
                "page_id": page_data["page_id"],
            }

            sources.append(source)

            # Small delay to be respectful to Wikipedia servers
            time.sleep(0.1)

        print(f"\n✅ Retrieved {len(results)} article contents")
        print(f"{'='*80}\n")

        return {"results": results, "sources": sources}

    @staticmethod
    def _clean_html(text: str) -> str:
        """Remove HTML tags from text.

        Args:
            text: Text with HTML tags

        Returns:
            Clean text without HTML
        """
        import re

        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        # Decode HTML entities
        text = text.replace("&quot;", '"')
        text = text.replace("&amp;", "&")
        text = text.replace("&lt;", "<")
        text = text.replace("&gt;", ">")
        text = text.replace("&#039;", "'")

        return text


def query_wikipedia(
    query: str, top_k: int = 5, language: str = "en"
) -> Dict[str, Any]:
    """Convenience function to query Wikipedia.

    Args:
        query: Search query
        top_k: Number of results to return
        language: Wikipedia language code

    Returns:
        Dictionary with results and sources
    """
    retriever = WikipediaRetrieval(language=language)
    return retriever.retrieve_for_query(query, top_k=top_k)


# Example usage
if __name__ == "__main__":
    # Test the retrieval
    result = query_wikipedia("what is love", top_k=3)

    print(f"\nFound {len(result['results'])} results")
    print(f"Sources: {[s['title'] for s in result['sources']]}")

    if result["results"]:
        first_result = result["results"][0]
        print(f"\nFirst result preview:")
        print(f"Title: {first_result['metadata']['title']}")
        print(f"URL: {first_result['metadata']['url']}")
        print(f"Content: {first_result['chunk'][:500]}...")
