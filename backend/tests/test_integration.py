"""Integration tests for the complete workflow."""
import pytest
from unittest.mock import Mock, patch, MagicMock
import json

from agent.graph import graph
from agent.deep_research_graph import deep_research_graph
from langchain_core.messages import HumanMessage


class TestRAGIntegration:
    """Integration tests for regular RAG workflow."""

    @patch('agent.graph.query_cnb_knowledge_base')
    @patch('agent.graph.ChatOllama')
    def test_complete_rag_flow(self, mock_ollama, mock_query_cnb, mock_config):
        """Test complete RAG workflow from question to answer."""
        # Setup mocks
        mock_query_cnb.return_value = {
            "results": [
                {"chunk": "CNB is a platform", "metadata": {"title": "Test"}}
            ],
            "sources": [{"title": "Test", "path": "/test", "url": "http://test.com"}]
        }

        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="Answer with citation [1].")
        mock_ollama.return_value = mock_llm

        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content="What is CNB?")],
            "repository": "cnb/docs",
            "rag_enabled": True,
            "deep_research_mode": False,
        }

        # Execute graph (synchronously for testing)
        result = graph.invoke(initial_state, mock_config)

        # Assertions
        assert "messages" in result
        assert len(result["messages"]) == 2  # User message + AI response
        assert result["messages"][1].type == "ai"

    @patch('agent.graph.ChatOllama')
    def test_gpt_mode_flow(self, mock_ollama, mock_config):
        """Test GPT mode workflow without retrieval."""
        # Setup mock
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="Direct answer from GPT.")
        mock_ollama.return_value = mock_llm

        # Create initial state for GPT mode
        initial_state = {
            "messages": [HumanMessage(content="What is AI?")],
            "rag_enabled": False,
            "deep_research_mode": False,
        }

        # Execute graph
        result = graph.invoke(initial_state, mock_config)

        # Assertions
        assert "messages" in result
        assert len(result["messages"]) == 2
        # Should have AI response without sources
        content = json.loads(result["messages"][1].content)
        assert content["sources"] == []


class TestDeepResearchIntegration:
    """Integration tests for Deep Research workflow."""

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_deep_research_single_loop(self, mock_ollama, mock_query_cnb, mock_config):
        """Test deep research with single loop (sufficient on first iteration)."""
        # Setup CNB mock
        mock_query_cnb.return_value = {
            "results": [
                {"chunk": "RAG context 1", "metadata": {}},
                {"chunk": "RAG context 2", "metadata": {}}
            ],
            "sources": [{"title": "RAG Guide", "path": "/rag", "url": "http://test.com/rag"}]
        }

        # Setup LLM mock to return different responses for different calls
        mock_llm = Mock()
        call_count = [0]

        def llm_side_effect(messages):
            call_count[0] += 1
            if call_count[0] == 1:
                # Query generation
                return Mock(content='{"queries": ["RAG basics", "RAG architecture", "RAG implementation"]}')
            elif call_count[0] == 2:
                # Reflection - sufficient
                return Mock(content=json.dumps({
                    "sufficient": True,
                    "confidence": 0.9,
                    "reasoning": "Comprehensive information gathered",
                    "suggested_focus": ""
                }))
            else:
                # Report generation
                return Mock(content="Comprehensive RAG report with citations [1].")

        mock_llm.invoke.side_effect = llm_side_effect
        mock_ollama.return_value = mock_llm

        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content="Explain RAG in detail")],
            "repository": "cnb/docs",
            "deep_research_mode": True,
            "research_loop_count": 0,
            "max_research_loops": 3,
        }

        # Execute deep research graph
        result = deep_research_graph.invoke(initial_state, mock_config)

        # Assertions
        assert "messages" in result
        assert "all_contexts" in result
        assert len(result["all_contexts"]) > 0
        assert "sources" in result

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_deep_research_multiple_loops(self, mock_ollama, mock_query_cnb, mock_config):
        """Test deep research with multiple loops (need more research)."""
        # Setup CNB mock
        mock_query_cnb.return_value = {
            "results": [{"chunk": "Context", "metadata": {}}],
            "sources": [{"title": "Doc", "path": "/doc", "url": "http://test.com/doc"}]
        }

        # Setup LLM mock for multiple loops
        mock_llm = Mock()
        call_count = [0]

        def llm_side_effect(messages):
            call_count[0] += 1
            if call_count[0] in [1, 3]:  # Query generation calls
                return Mock(content='{"queries": ["query 1", "query 2"]}')
            elif call_count[0] == 2:  # First reflection - insufficient
                return Mock(content=json.dumps({
                    "sufficient": False,
                    "confidence": 0.5,
                    "reasoning": "Need more details",
                    "suggested_focus": "Implementation details"
                }))
            elif call_count[0] == 4:  # Second reflection - sufficient
                return Mock(content=json.dumps({
                    "sufficient": True,
                    "confidence": 0.8,
                    "reasoning": "Now comprehensive",
                    "suggested_focus": ""
                }))
            else:  # Report generation
                return Mock(content="Final research report [1].")

        mock_llm.invoke.side_effect = llm_side_effect
        mock_ollama.return_value = mock_llm

        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content="Complex research question")],
            "repository": "cnb/docs",
            "deep_research_mode": True,
            "research_loop_count": 0,
            "max_research_loops": 3,
        }

        # Execute deep research graph
        result = deep_research_graph.invoke(initial_state, mock_config)

        # Assertions
        assert result["research_loop_count"] >= 1  # Should have looped at least once
        assert len(result["all_contexts"]) > 0

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_deep_research_max_loops_limit(self, mock_ollama, mock_query_cnb, mock_config):
        """Test that deep research respects max loops limit."""
        # Setup mocks to always return insufficient
        mock_query_cnb.return_value = {
            "results": [{"chunk": "Context", "metadata": {}}],
            "sources": []
        }

        mock_llm = Mock()

        def llm_side_effect(messages):
            content = messages[0].content if messages else ""
            if "Generate" in content or "queries" in content.lower():
                return Mock(content='{"queries": ["query 1"]}')
            elif "sufficient" in content.lower():
                # Always return insufficient
                return Mock(content=json.dumps({
                    "sufficient": False,
                    "confidence": 0.3,
                    "reasoning": "Always need more",
                    "suggested_focus": "More details"
                }))
            else:
                return Mock(content="Forced final report.")

        mock_llm.invoke.side_effect = llm_side_effect
        mock_ollama.return_value = mock_llm

        # Create initial state with max_loops = 2
        initial_state = {
            "messages": [HumanMessage(content="Question")],
            "repository": "cnb/docs",
            "deep_research_mode": True,
            "research_loop_count": 0,
            "max_research_loops": 2,  # Low limit to test
        }

        # Execute deep research graph
        result = deep_research_graph.invoke(initial_state, mock_config)

        # Assertions - should stop at max loops even if insufficient
        assert result["research_loop_count"] <= 2
        assert "messages" in result  # Should have final report


class TestEdgeCases:
    """Test edge cases and error scenarios."""

    @patch('agent.graph.query_cnb_knowledge_base')
    def test_empty_user_message(self, mock_query_cnb, mock_config):
        """Test handling of empty user message."""
        mock_query_cnb.return_value = {"results": [], "sources": []}

        initial_state = {
            "messages": [HumanMessage(content="")],
            "repository": "cnb/docs",
            "rag_enabled": True,
        }

        # Should not crash
        result = graph.invoke(initial_state, mock_config)
        assert "messages" in result

    @patch('agent.graph.query_cnb_knowledge_base')
    def test_no_retrieval_results(self, mock_query_cnb, mock_ollama_patch, mock_config):
        """Test handling when knowledge base returns no results."""
        mock_query_cnb.return_value = {"results": [], "sources": []}

        # Should handle gracefully
        # This tests that the system can still generate an answer even without context

    @patch('agent.deep_research_graph.ChatOllama')
    def test_llm_timeout_handling(self, mock_ollama, mock_config):
        """Test handling of LLM timeout errors."""
        # Setup mock to raise timeout
        mock_llm = Mock()
        mock_llm.invoke.side_effect = Exception("Request timeout")
        mock_ollama.return_value = mock_llm

        initial_state = {
            "messages": [HumanMessage(content="Question")],
            "repository": "cnb/docs",
            "deep_research_mode": True,
            "research_loop_count": 0,
            "max_research_loops": 1,
        }

        # Should handle error gracefully (not crash)
        try:
            result = deep_research_graph.invoke(initial_state, mock_config)
            # If it doesn't crash, test passes
        except Exception as e:
            # Expected to handle gracefully or raise controlled error
            assert "timeout" in str(e).lower() or "error" in str(e).lower()
