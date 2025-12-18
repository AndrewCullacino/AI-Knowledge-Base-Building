"""Tests for configuration management."""
import pytest
import os
from agent.configuration import Configuration


class TestConfiguration:
    """Test suite for Configuration class."""

    def test_default_configuration(self):
        """Test default configuration values."""
        config = Configuration()

        assert config.ollama_model == "qwen3:8b"
        assert config.cnb_api_base == "https://api.cnb.cool"
        assert config.max_research_loops == 3
        assert config.ollama_reasoning is False  # Should be False by default

    def test_multiple_models_configuration(self):
        """Test multiple models configuration (Optional Bonus Feature)."""
        config = Configuration()

        # Verify different models can be configured for different tasks
        assert hasattr(config, "query_generation_model")
        assert hasattr(config, "reflection_model")
        assert hasattr(config, "report_generation_model")

        # Default should be same as base model
        assert config.query_generation_model == "qwen3:8b"
        assert config.reflection_model == "qwen3:8b"
        assert config.report_generation_model == "qwen3:8b"

    def test_configuration_from_dict(self):
        """Test configuration creation from dictionary."""
        config_dict = {
            "configurable": {
                "ollama_model": "llama3:70b",
                "query_generation_model": "qwen3:8b",
                "reflection_model": "qwen3:14b",
                "report_generation_model": "llama3:70b",
                "max_research_loops": 5,
            }
        }

        config = Configuration.from_runnable_config(config_dict)

        assert config.ollama_model == "llama3:70b"
        assert config.query_generation_model == "qwen3:8b"
        assert config.reflection_model == "qwen3:14b"
        assert config.report_generation_model == "llama3:70b"
        assert config.max_research_loops == 5

    def test_configuration_from_env(self, monkeypatch):
        """Test configuration from environment variables."""
        # Set environment variables
        monkeypatch.setenv("OLLAMA_MODEL", "custom_model")
        monkeypatch.setenv("MAX_RESEARCH_LOOPS", "10")

        config = Configuration.from_runnable_config()

        assert config.ollama_model == "custom_model"
        assert config.max_research_loops == 10
