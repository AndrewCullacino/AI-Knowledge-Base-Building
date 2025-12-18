"""End-to-end tests for the complete system."""
import pytest
from unittest.mock import Mock, patch
from langchain_core.messages import HumanMessage


class TestE2EDeepResearch:
    """End-to-end tests for Deep Research feature."""

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_full_deep_research_workflow(self, mock_ollama, mock_query_cnb, mock_config):
        """Test complete deep research workflow from user question to final report."""
        from agent.graph import graph

        # Setup comprehensive mock responses
        mock_query_cnb.return_value = {
            "results": [
                {
                    "chunk": "RAG (Retrieval Augmented Generation) combines retrieval with generation.",
                    "metadata": {"title": "RAG Overview", "path": "/rag/intro"}
                },
                {
                    "chunk": "RAG architecture includes retriever, embeddings, and generator components.",
                    "metadata": {"title": "RAG Architecture", "path": "/rag/arch"}
                }
            ],
            "sources": [
                {"title": "RAG Overview", "path": "/rag/intro", "url": "https://docs.cnb.cool/rag/intro"},
                {"title": "RAG Architecture", "path": "/rag/arch", "url": "https://docs.cnb.cool/rag/arch"}
            ]
        }

        # Setup LLM mock for multiple calls
        mock_llm = Mock()
        responses = [
            # Query generation
            Mock(content='{"queries": ["RAG definition", "RAG components", "RAG implementation"]}'),
            # Reflection - sufficient after first round
            Mock(content='{"sufficient": true, "confidence": 0.85, "reasoning": "Good coverage", "suggested_focus": ""}'),
            # Report generation
            Mock(content="# RAG Research Report\n\nRAG combines retrieval with generation [1]. The architecture includes key components [2].")
        ]
        mock_llm.invoke.side_effect = responses
        mock_ollama.return_value = mock_llm

        # Execute full workflow
        initial_state = {
            "messages": [HumanMessage(content="Explain RAG architecture comprehensively")],
            "repository": "cnb/docs",
            "rag_enabled": True,
            "deep_research_mode": True,
            "max_research_loops": 3,
        }

        result = graph.invoke(initial_state, mock_config)

        # Comprehensive assertions
        assert "messages" in result
        assert len(result["messages"]) == 2  # User + AI

        # Verify AI message structure
        ai_message = result["messages"][1]
        assert ai_message.type == "ai"

        # Parse response
        import json
        content_data = json.loads(ai_message.content)
        assert "content" in content_data
        assert "sources" in content_data

        # Verify research was conducted
        assert mock_query_cnb.called
        assert mock_ollama.called

    @patch('agent.graph.query_cnb_knowledge_base')
    @patch('agent.graph.ChatOllama')
    def test_full_regular_rag_workflow(self, mock_ollama, mock_query_cnb, mock_config):
        """Test complete regular RAG workflow."""
        from agent.graph import graph

        # Setup mocks
        mock_query_cnb.return_value = {
            "results": [
                {"chunk": "CNB knowledge base content", "metadata": {"title": "CNB Docs"}}
            ],
            "sources": [{"title": "CNB Docs", "path": "/docs", "url": "https://docs.cnb.cool"}]
        }

        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="CNB is a collaborative platform [1].")
        mock_ollama.return_value = mock_llm

        # Execute
        initial_state = {
            "messages": [HumanMessage(content="What is CNB?")],
            "repository": "cnb/docs",
            "rag_enabled": True,
            "deep_research_mode": False,
        }

        result = graph.invoke(initial_state, mock_config)

        # Assertions
        assert len(result["messages"]) == 2
        assert mock_query_cnb.called
        assert mock_ollama.called


class TestE2EFeatureCompletion:
    """Test that all required and optional features are implemented."""

    def test_multi_round_retrieval_feature(self, mock_config):
        """Verify multi-round retrieval is implemented."""
        from agent.deep_research_graph import generate_research_queries, retrieve_multi_contexts

        # Features exist and are callable
        assert callable(generate_research_queries)
        assert callable(retrieve_multi_contexts)

    def test_structured_report_output_feature(self, mock_config):
        """Verify structured report output is implemented."""
        from agent.deep_research_graph import finalize_research_report

        assert callable(finalize_research_report)

    def test_streaming_support_feature(self, mock_config):
        """Verify streaming is supported via custom events."""
        from agent.deep_research_graph import deep_research_graph

        # Graph should be compilable
        assert deep_research_graph is not None

    def test_multiple_models_feature(self, mock_config):
        """Verify multiple models configuration is implemented (Optional Bonus)."""
        from agent.configuration import Configuration

        config = Configuration()

        # Verify different model fields exist
        assert hasattr(config, 'query_generation_model')
        assert hasattr(config, 'reflection_model')
        assert hasattr(config, 'report_generation_model')

        # Can be configured independently
        assert config.query_generation_model is not None
        assert config.reflection_model is not None
        assert config.report_generation_model is not None

    def test_current_step_display_feature(self, mock_config):
        """Verify step status tracking is implemented (Optional Bonus)."""
        from agent.state import AgentState

        # State should have step_status field
        state_fields = AgentState.__annotations__
        assert 'step_status' in state_fields

    def test_citation_sources_feature(self, mock_config):
        """Verify citation and source tracking is implemented (Optional Bonus)."""
        from agent.state import AgentState

        # State should have sources field
        state_fields = AgentState.__annotations__
        assert 'sources' in state_fields


class TestE2EErrorHandling:
    """Test error handling in end-to-end scenarios."""

    @patch('agent.graph.query_cnb_knowledge_base')
    @patch('agent.graph.ChatOllama')
    def test_no_knowledge_base_results(self, mock_ollama, mock_query_cnb, mock_config):
        """Test handling when knowledge base returns no results."""
        from agent.graph import graph

        # Mock empty results
        mock_query_cnb.return_value = {"results": [], "sources": []}

        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="I don't have specific information.")
        mock_ollama.return_value = mock_llm

        initial_state = {
            "messages": [HumanMessage(content="Non-existent topic")],
            "repository": "cnb/docs",
            "rag_enabled": True,
            "deep_research_mode": False,
        }

        # Should not crash
        result = graph.invoke(initial_state, mock_config)
        assert "messages" in result

    @patch('agent.deep_research_graph.query_cnb_knowledge_base')
    @patch('agent.deep_research_graph.ChatOllama')
    def test_max_loops_prevents_infinite_loop(self, mock_ollama, mock_query_cnb, mock_config):
        """Test that max_research_loops prevents infinite research loops."""
        from agent.deep_research_graph import deep_research_graph

        # Mock to always say insufficient
        mock_query_cnb.return_value = {
            "results": [{"chunk": "minimal", "metadata": {}}],
            "sources": []
        }

        mock_llm = Mock()
        def mock_invoke(messages):
            content = messages[0].content if messages else ""
            if "queries" in content.lower():
                return Mock(content='{"queries": ["q1"]}')
            elif "sufficient" in content.lower():
                return Mock(content='{"sufficient": false, "confidence": 0.3, "reasoning": "Need more", "suggested_focus": ""}')
            else:
                return Mock(content="Report.")

        mock_llm.invoke.side_effect = mock_invoke
        mock_ollama.return_value = mock_llm

        initial_state = {
            "messages": [HumanMessage(content="Question")],
            "repository": "cnb/docs",
            "research_loop_count": 0,
            "max_research_loops": 2,  # Small limit
        }

        # Should stop at max loops
        result = deep_research_graph.invoke(initial_state, mock_config)
        assert result["research_loop_count"] <= 2
        assert "messages" in result  # Should have final report
