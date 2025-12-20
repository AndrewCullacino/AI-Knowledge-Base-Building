"""Unit tests for Deep Research Graph nodes."""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from langchain_core.messages import HumanMessage, AIMessage

from agent.deep_research_graph import (
    generate_research_queries,
    retrieve_multi_contexts,
    reflect_on_research,
    finalize_research_report,
    should_continue_research,
    increment_loop_counter,
)
from agent.state import AgentState


class TestGenerateResearchQueries:
    """Test suite for query generation node."""

    @patch('agent.deep_research_graph.ChatOllama')
    def test_generate_queries_first_iteration(self, mock_ollama, deep_research_state, mock_config):
        """Test query generation on first iteration."""
        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(
            content='{"queries": ["query 1", "query 2", "query 3"]}'
        )
        mock_ollama.return_value = mock_llm

        # Execute
        result = generate_research_queries(deep_research_state, mock_config)

        # Assertions
        assert "research_queries" in result
        assert len(result["research_queries"]) == 3
        assert result["research_queries"][0] == "query 1"
        assert result["step_status"] == "query_generation"
        assert "generate_queries" in result

    @patch('agent.deep_research_graph.ChatOllama')
    def test_generate_queries_subsequent_iteration(self, mock_ollama, deep_research_state, mock_config):
        """Test query generation on subsequent iterations."""
        # Setup state with previous queries
        deep_research_state["research_queries"] = ["previous query 1", "previous query 2"]
        deep_research_state["research_loop_count"] = 1

        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(
            content='{"queries": ["new query 1", "new query 2"]}'
        )
        mock_ollama.return_value = mock_llm

        # Execute
        result = generate_research_queries(deep_research_state, mock_config)

        # Assertions
        assert len(result["research_queries"]) == 4  # 2 previous + 2 new
        assert "new query 1" in result["research_queries"]
        assert "previous query 1" in result["research_queries"]

    @patch('agent.deep_research_graph.ChatOllama')
    def test_generate_queries_json_parse_error(self, mock_ollama, deep_research_state, mock_config):
        """Test fallback behavior when JSON parsing fails."""
        # Setup mock to return invalid JSON
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="Invalid JSON response")
        mock_ollama.return_value = mock_llm

        # Execute
        result = generate_research_queries(deep_research_state, mock_config)

        # Assertions - should fallback to using original question
        assert "research_queries" in result
        assert len(result["research_queries"]) > 0


class TestRetrieveMultiContexts:
    """Test suite for context retrieval node."""

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    def test_retrieve_contexts_first_iteration(self, mock_query_cnb, deep_research_state, mock_config, mock_cnb_response):
        """Test context retrieval on first iteration."""
        # Setup mocks
        deep_research_state["research_queries"] = ["query 1", "query 2", "query 3"]
        mock_query_cnb.return_value = mock_cnb_response

        # Execute
        result = retrieve_multi_contexts(deep_research_state, mock_config)

        # Assertions
        assert "all_contexts" in result
        assert len(result["all_contexts"]) > 0
        assert "sources" in result
        assert result["step_status"] == "retrieval"
        # Should call CNB API 3 times (once per query)
        assert mock_query_cnb.call_count == 3

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    def test_retrieve_contexts_subsequent_iteration(self, mock_query_cnb, deep_research_state, mock_config, mock_cnb_response):
        """Test context retrieval on subsequent iterations."""
        # Setup state with previous contexts
        deep_research_state["research_queries"] = ["q1", "q2", "q3", "q4", "q5"]
        deep_research_state["research_loop_count"] = 1
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Previous context", "metadata": {}}
        ]
        mock_query_cnb.return_value = mock_cnb_response

        # Execute
        result = retrieve_multi_contexts(deep_research_state, mock_config)

        # Assertions
        assert len(result["all_contexts"]) > len(deep_research_state["all_contexts"])
        # Should only call for last 2 queries on subsequent iterations
        assert mock_query_cnb.call_count == 2

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    def test_retrieve_contexts_deduplication(self, mock_query_cnb, deep_research_state, mock_config):
        """Test that sources are deduplicated by URL."""
        # Setup state
        deep_research_state["research_queries"] = ["query 1", "query 2"]

        # Mock CNB response with duplicate URLs
        mock_query_cnb.return_value = {
            "results": [
                {"chunk": "Content 1", "metadata": {}}
            ],
            "sources": [
                {"title": "Doc", "path": "/doc", "url": "https://example.com/doc"}
            ]
        }

        # Execute
        result = retrieve_multi_contexts(deep_research_state, mock_config)

        # Assertions - should deduplicate sources
        assert "sources" in result
        assert len(result["sources"]) == 1  # Deduplicated


class TestReflectOnResearch:
    """Test suite for reflection node."""

    @patch('agent.deep_research_graph.dispatch_custom_event')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_reflect_sufficient(self, mock_ollama, mock_dispatch, deep_research_state, mock_config):
        """Test reflection when research is sufficient."""
        # Setup state with contexts
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Detailed information about RAG", "metadata": {}}
        ]

        # Setup mock to indicate sufficiency
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(
            content=json.dumps({
                "sufficient": True,
                "confidence": 0.9,
                "reasoning": "Comprehensive information gathered",
                "suggested_focus": ""
            })
        )
        mock_ollama.return_value = mock_llm

        # Execute
        result = reflect_on_research(deep_research_state, mock_config)

        # Assertions
        assert "reflection_result" in result
        assert result["reflection_result"]["sufficient"] is True
        assert result["reflection_result"]["confidence"] == 0.9
        assert result["step_status"] == "reflection"

    @patch('agent.deep_research_graph.dispatch_custom_event')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_reflect_insufficient(self, mock_ollama, mock_dispatch, deep_research_state, mock_config):
        """Test reflection when more research is needed."""
        # Setup state with minimal contexts
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Minimal info", "metadata": {}}
        ]

        # Setup mock to indicate insufficiency
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(
            content=json.dumps({
                "sufficient": False,
                "confidence": 0.4,
                "reasoning": "Need more details on implementation",
                "suggested_focus": "RAG implementation details"
            })
        )
        mock_ollama.return_value = mock_llm

        # Execute
        result = reflect_on_research(deep_research_state, mock_config)

        # Assertions
        assert result["reflection_result"]["sufficient"] is False
        assert result["reflection_result"]["confidence"] == 0.4
        assert "implementation" in result["reflection_result"]["reasoning"].lower()

    @patch('agent.deep_research_graph.dispatch_custom_event')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_reflect_json_parse_error(self, mock_ollama, mock_dispatch, deep_research_state, mock_config):
        """Test fallback behavior when JSON parsing fails."""
        # Setup state
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Some content", "metadata": {}}
        ]

        # Setup mock to return invalid JSON
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="Invalid JSON")
        mock_ollama.return_value = mock_llm

        # Execute
        result = reflect_on_research(deep_research_state, mock_config)

        # Assertions - should have fallback reflection
        assert "reflection_result" in result
        assert result["reflection_result"]["sufficient"] is True  # Default fallback


class TestFinalizeResearchReport:
    """Test suite for report finalization node."""

    @patch('agent.deep_research_graph.ChatOllama')
    def test_finalize_report_success(self, mock_ollama, deep_research_state, mock_config):
        """Test successful report generation."""
        # Setup state with contexts and sources
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Context 1", "metadata": {}},
            {"query": "q2", "content": "Context 2", "metadata": {}}
        ]
        deep_research_state["sources"] = [
            {"title": "Source 1", "path": "/s1", "url": "https://example.com/s1"}
        ]

        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(
            content="Comprehensive research report with citations [1]."
        )
        mock_ollama.return_value = mock_llm

        # Execute
        result = finalize_research_report(deep_research_state, mock_config)

        # Assertions
        assert "messages" in result
        assert len(result["messages"]) > len(deep_research_state["messages"])
        last_message = result["messages"][-1]
        assert last_message.type == "ai"

        # Parse the message content
        content_json = json.loads(last_message.content)
        assert "content" in content_json
        assert "sources" in content_json
        assert len(content_json["sources"]) > 0

    @patch('agent.deep_research_graph.ChatOllama')
    def test_finalize_report_llm_error(self, mock_ollama, deep_research_state, mock_config):
        """Test report generation with LLM error."""
        # Setup state
        deep_research_state["all_contexts"] = [
            {"query": "q1", "content": "Context", "metadata": {}}
        ]
        deep_research_state["sources"] = []

        # Setup mock to raise exception
        mock_llm = Mock()
        mock_llm.invoke.side_effect = Exception("LLM timeout")
        mock_ollama.return_value = mock_llm

        # Execute
        result = finalize_research_report(deep_research_state, mock_config)

        # Assertions - should have fallback message
        assert "messages" in result
        last_message = result["messages"][-1]
        content_json = json.loads(last_message.content)
        assert "error" in content_json["content"].lower() or "fallback" in content_json["content"].lower()


class TestShouldContinueResearch:
    """Test suite for conditional routing."""

    def test_continue_when_insufficient(self):
        """Test routing when research is insufficient."""
        state = {
            "reflection_result": {
                "sufficient": False,
                "confidence": 0.5
            },
            "research_loop_count": 1,
            "max_research_loops": 3
        }

        result = should_continue_research(state)
        assert result == "generate_queries"

    def test_finalize_when_sufficient(self):
        """Test routing when research is sufficient."""
        state = {
            "reflection_result": {
                "sufficient": True,
                "confidence": 0.9
            },
            "research_loop_count": 1,
            "max_research_loops": 3
        }

        result = should_continue_research(state)
        assert result == "finalize_report"

    def test_finalize_when_max_loops_reached(self):
        """Test routing when max loops is reached."""
        state = {
            "reflection_result": {
                "sufficient": False,
                "confidence": 0.5
            },
            "research_loop_count": 3,
            "max_research_loops": 3
        }

        result = should_continue_research(state)
        assert result == "finalize_report"


class TestIncrementLoopCounter:
    """Test suite for loop counter increment."""

    def test_increment_from_zero(self, deep_research_state, mock_config):
        """Test incrementing counter from zero."""
        deep_research_state["research_loop_count"] = 0

        result = increment_loop_counter(deep_research_state, mock_config)

        assert result["research_loop_count"] == 1

    def test_increment_from_non_zero(self, deep_research_state, mock_config):
        """Test incrementing counter from non-zero."""
        deep_research_state["research_loop_count"] = 2

        result = increment_loop_counter(deep_research_state, mock_config)

        assert result["research_loop_count"] == 3
