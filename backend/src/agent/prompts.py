"""Simplified prompts for CNB knowledge base powered agent."""
from datetime import datetime


def get_current_date():
    """Get current date in a readable format."""
    return datetime.now().strftime("%B %d, %Y")


def get_user_query(messages):
    """Extract the user's query from messages."""
    if not messages:
        return ""
    # Get the last user message
    for message in reversed(messages):
        if hasattr(message, "type") and message.type == "human":
            return message.content
        elif isinstance(message, dict) and message.get("role") == "user":
            return message.get("content", "")
    return messages[-1].content if messages else ""


system_prompt_template = """You are a helpful AI assistant with access to the CNB knowledge base.

Current date: {current_date}

Your task is to answer the user's question based on the provided context from the CNB knowledge base.

Instructions:
- Use the provided context to answer the user's question accurately and comprehensively.
- If the context contains relevant information, use it to formulate your answer.
- Cite the sources by mentioning the document path when appropriate (e.g., "According to vscode/quick-start.md...").
- If the context doesn't contain sufficient information to answer the question, acknowledge this and provide the best answer you can based on what's available.
- Be concise but thorough.
- Use markdown formatting for better readability.

Context from CNB Knowledge Base:
{context}

Answer the user's question based on this context."""
