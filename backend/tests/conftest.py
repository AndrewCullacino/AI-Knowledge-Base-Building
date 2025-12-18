"""Pytest configuration and shared fixtures for testing."""
import pytest
from unittest.mock import Mock, MagicMock
from langchain_core.messages import HumanMessage, AIMessage
from agent.state import AgentState
from agent.configuration import Configuration


@pytest.fixture
def mock_config():
    """Create a mock configuration for testing."""
    return {
        "configurable": {
            "ollama_model": "qwen3:8b",
            "query_generation_model": "qwen3:8b",
            "reflection_model": "qwen3:8b",
            "report_generation_model": "qwen3:8b",
            "ollama_base_url": "http://localhost:11434",
            "ollama_temperature": 0.7,
            "ollama_reasoning": False,
            "cnb_api_base": "https://api.cnb.cool",
            "cnb_repo_slug": "cnb/docs",
            "cnb_token": "test_token",
            "max_research_loops": 3,
            "queries_per_iteration": 3,
        }
    }


@pytest.fixture
def sample_state():
    """Create a sample state for testing."""
    return {
        "messages": [HumanMessage(content="What is CNB?")],
        "repository": "cnb/docs",
        "rag_enabled": True,
        "deep_research_mode": False,
    }


@pytest.fixture
def deep_research_state():
    """Create a state for deep research testing."""
    return {
        "messages": [HumanMessage(content="Explain RAG architecture in detail")],
        "repository": "cnb/docs",
        "rag_enabled": True,
        "deep_research_mode": True,
        "research_queries": [],
        "all_contexts": [],
        "research_loop_count": 0,
        "max_research_loops": 3,
    }


@pytest.fixture
def mock_llm_response():
    """Create a mock LLM response."""
    mock_response = Mock()
    mock_response.content = '{"queries": ["query 1", "query 2", "query 3"]}'
    return mock_response


@pytest.fixture
def mock_cnb_response():
    """Create a mock CNB API response."""
    return {
        "results": [
            {
                "chunk": "CNB is a collaborative knowledge platform.",
                "metadata": {
                    "title": "Introduction to CNB",
                    "path": "/intro",
                    "url": "https://docs.cnb.cool/intro"
                }
            },
            {
                "chunk": "CNB provides knowledge base APIs.",
                "metadata": {
                    "title": "CNB API",
                    "path": "/api",
                    "url": "https://docs.cnb.cool/api"
                }
            }
        ],
        "sources": [
            {
                "title": "Introduction to CNB",
                "path": "/intro",
                "url": "https://docs.cnb.cool/intro"
            }
        ]
    }
