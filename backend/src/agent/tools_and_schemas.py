"""Schemas for the simplified CNB-powered agent."""
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class KnowledgeBaseResult(BaseModel):
    """Schema for knowledge base query result."""

    score: float = Field(description="Relevance score (0-1)")
    chunk: str = Field(description="Text chunk from knowledge base")
    metadata: Dict[str, Any] = Field(description="Metadata about the source")
