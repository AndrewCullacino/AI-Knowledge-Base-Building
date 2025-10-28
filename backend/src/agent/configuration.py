import os
from pydantic import BaseModel, Field
from typing import Any, Optional

from langchain_core.runnables import RunnableConfig


class Configuration(BaseModel):
    """The configuration for the simplified CNB-powered agent."""

    cnb_api_base: str = Field(
        default="https://api.cnb.cool",
        metadata={
            "description": "The base URL for CNB API."
        },
    )

    cnb_repo_slug: str = Field(
        default="cnb/docs",
        metadata={
            "description": "The CNB repository slug (e.g., cnb/docs)."
        },
    )

    cnb_token: str = Field(
        default="",
        metadata={
            "description": "The CNB API access token with repo-code:r permission."
        },
    )

    ollama_model: str = Field(
        default="qwen3:32b",
        metadata={
            "description": "The Ollama model to use for generating answers."
        },
    )

    ollama_base_url: str = Field(
        default="http://localhost:11434",
        metadata={
            "description": "The base URL for the Ollama server."
        },
    )

    ollama_temperature: float = Field(
        default=0.7,
        metadata={
            "description": "Temperature setting for Ollama model generation."
        },
    )

    top_k_results: int = Field(
        default=5,
        metadata={"description": "Number of knowledge base results to retrieve."},
    )

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )

        # Get raw values from environment or config
        raw_values: dict[str, Any] = {
            name: os.environ.get(name.upper(), configurable.get(name))
            for name in cls.model_fields.keys()
        }

        # Filter out None values
        values = {k: v for k, v in raw_values.items() if v is not None}

        return cls(**values)
