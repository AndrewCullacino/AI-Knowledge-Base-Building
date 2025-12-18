"""Unit tests for regular RAG graph nodes."""
import pytest
import json
from unittest.mock import Mock, patch

from agent.graph import retrieve_knowledge, generate_answer, should_retrieve, route_to_workflow
from agent.state import AgentState


class TestRetrieveKnowledge:
    """Test suite for knowledge retrieval node."""

    @patch('agent.graph.query_cnb_knowledge_base')
    def test_retrieve_knowledge_success(self, mock_query_cnb, sample_state, mock_config, mock_cnb_response):
        """Test successful knowledge base retrieval."""
        mock_query_cnb.return_value = mock_cnb_response

        result = retrieve_knowledge(sample_state, mock_config)

        # Assertions
        assert "context" in result
        assert "sources" in result
        assert len(result["sources"]) > 0
        assert "CNB is a collaborative" in result["context"]
        mock_query_cnb.assert_called_once()

    @patch('agent.graph.query_cnb_knowledge_base')
    def test_retrieve_knowledge_custom_repository(self, mock_query_cnb, sample_state, mock_config, mock_cnb_response):
        """Test retrieval with custom repository."""
        sample_state["repository"] = "custom/repo"
        mock_query_cnb.return_value = mock_cnb_response

        result = retrieve_knowledge(sample_state, mock_config)

        # Verify repository parameter was passed correctly
        call_args = mock_query_cnb.call_args
        assert call_args.kwargs["repository"] == "custom/repo"

    @patch('agent.graph.query_cnb_knowledge_base')
    def test_retrieve_knowledge_empty_results(self, mock_query_cnb, sample_state, mock_config):
        """Test behavior with empty search results."""
        mock_query_cnb.return_value = {"results": [], "sources": []}

        result = retrieve_knowledge(sample_state, mock_config)

        # Assertions
        assert "context" in result
        assert result["context"] == ""
        assert result["sources"] == []


class TestGenerateAnswer:
    """Test suite for answer generation node."""

    @patch('agent.graph.ChatOllama')
    def test_generate_answer_rag_mode(self, mock_ollama, sample_state, mock_config):
        """Test answer generation in RAG mode."""
        # Setup state with context
        sample_state["context"] = "CNB is a platform"
        sample_state["sources"] = [{"title": "Test", "path": "/test", "url": "http://test.com"}]
        sample_state["rag_enabled"] = True

        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="CNB is a collaborative platform [1].")
        mock_ollama.return_value = mock_llm

        # Execute
        result = generate_answer(sample_state, mock_config)

        # Assertions
        assert "messages" in result
        assert len(result["messages"]) == 1
        message = result["messages"][0]
        assert message.type == "ai"

        # Parse message content
        content = json.loads(message.content)
        assert "content" in content
        assert "sources" in content
        assert len(content["sources"]) > 0

    @patch('agent.graph.ChatOllama')
    def test_generate_answer_normal_gpt_mode(self, mock_ollama, sample_state, mock_config):
        """Test answer generation in normal GPT mode."""
        # Setup state for GPT mode
        sample_state["rag_enabled"] = False

        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="CNB is a platform.")
        mock_ollama.return_value = mock_llm

        # Execute
        result = generate_answer(sample_state, mock_config)

        # Assertions
        assert "messages" in result
        message = result["messages"][0]
        content = json.loads(message.content)
        assert "content" in content
        assert content["sources"] == []  # No sources in GPT mode


class TestRouting:
    """Test suite for routing logic."""

    def test_should_retrieve_rag_enabled(self, sample_state):
        """Test routing when RAG is enabled."""
        sample_state["rag_enabled"] = True
        result = should_retrieve(sample_state)
        assert result == "retrieve_knowledge"

    def test_should_retrieve_rag_disabled(self, sample_state):
        """Test routing when RAG is disabled."""
        sample_state["rag_enabled"] = False
        result = should_retrieve(sample_state)
        assert result == "generate_answer"

    def test_route_to_workflow_deep_research(self, sample_state):
        """Test routing to deep research workflow."""
        sample_state["deep_research_mode"] = True
        sample_state["rag_enabled"] = True

        result = route_to_workflow(sample_state)
        assert result == "deep_research"

    def test_route_to_workflow_rag(self, sample_state):
        """Test routing to regular RAG workflow."""
        sample_state["deep_research_mode"] = False
        sample_state["rag_enabled"] = True

        result = route_to_workflow(sample_state)
        assert result == "retrieve_knowledge"

    def test_route_to_workflow_gpt(self, sample_state):
        """Test routing to GPT mode."""
        sample_state["deep_research_mode"] = False
        sample_state["rag_enabled"] = False

        result = route_to_workflow(sample_state)
        assert result == "generate_answer"
