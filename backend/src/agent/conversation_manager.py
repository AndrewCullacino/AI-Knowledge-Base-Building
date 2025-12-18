"""Conversation Management for chat history persistence."""
import json
import uuid
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


class ConversationManager:
    """Manages conversations with message storage and retrieval."""

    def __init__(self, storage_dir: str = "./conversations"):
        """Initialize conversation manager with storage directory.

        Args:
            storage_dir: Directory to store conversations
        """
        self.storage_dir = Path(storage_dir)
        # Use asyncio.to_thread for mkdir to avoid blocking
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_dir / "index.json"

        # Load or create index
        self.index = self._load_index()

    def _load_index(self) -> Dict[str, Any]:
        """Load conversation index from disk."""
        if self.index_file.exists():
            with open(self.index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"conversations": {}}

    def _save_index(self):
        """Save conversation index to disk."""
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(self.index, f, indent=2, ensure_ascii=False)

    def _generate_title(self, first_message: str, max_length: int = 50) -> str:
        """Generate conversation title from first message.

        Args:
            first_message: First user message
            max_length: Maximum title length

        Returns:
            Generated title
        """
        # Remove extra whitespace
        title = " ".join(first_message.split())

        # Truncate if too long
        if len(title) > max_length:
            # Try to break at word boundary
            title = title[:max_length].rsplit(' ', 1)[0] + "..."

        return title or "New conversation"

    def create_conversation(
        self, kb_type: str = "wikipedia", mode: str = "gpt"
    ) -> Dict[str, Any]:
        """Create a new conversation.

        Args:
            kb_type: Knowledge base type (wikipedia, cnb, custom)
            mode: Chat mode (gpt, rag, deep_research)

        Returns:
            Conversation metadata
        """
        conv_id = str(uuid.uuid4())
        conv_dir = self.storage_dir / conv_id
        conv_dir.mkdir(parents=True, exist_ok=True)

        # Create conversation metadata
        conv_metadata = {
            "id": conv_id,
            "title": "New conversation",  # Will be updated with first message
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "kb_type": kb_type,
            "mode": mode,
        }

        # Save to index
        self.index["conversations"][conv_id] = conv_metadata
        self._save_index()

        # Create empty messages file
        messages_file = conv_dir / "messages.json"
        with open(messages_file, "w", encoding="utf-8") as f:
            json.dump({"messages": []}, f, indent=2, ensure_ascii=False)

        return conv_metadata

    def list_conversations(self) -> List[Dict[str, Any]]:
        """List all conversations, sorted by updated_at descending.

        Returns:
            List of conversation metadata
        """
        conversations = list(self.index["conversations"].values())
        # Sort by updated_at, newest first
        conversations.sort(key=lambda x: x["updated_at"], reverse=True)
        return conversations

    def get_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Get conversation with all messages.

        Args:
            conv_id: Conversation identifier

        Returns:
            Conversation data with messages

        Raises:
            ValueError: If conversation not found
        """
        if conv_id not in self.index["conversations"]:
            raise ValueError(f"Conversation '{conv_id}' not found")

        conv_metadata = self.index["conversations"][conv_id]
        messages_file = self.storage_dir / conv_id / "messages.json"

        if messages_file.exists():
            with open(messages_file, "r", encoding="utf-8") as f:
                messages_data = json.load(f)
        else:
            messages_data = {"messages": []}

        return {
            **conv_metadata,
            "messages": messages_data["messages"],
        }

    def add_message(
        self, conv_id: str, message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a message to a conversation.

        Args:
            conv_id: Conversation identifier
            message: Message data (type, content, metadata, etc.)

        Returns:
            Updated conversation metadata

        Raises:
            ValueError: If conversation not found
        """
        if conv_id not in self.index["conversations"]:
            raise ValueError(f"Conversation '{conv_id}' not found")

        messages_file = self.storage_dir / conv_id / "messages.json"

        # Load existing messages
        if messages_file.exists():
            with open(messages_file, "r", encoding="utf-8") as f:
                messages_data = json.load(f)
        else:
            messages_data = {"messages": []}

        # Add message ID and timestamp if not present
        if "id" not in message:
            message["id"] = str(uuid.uuid4())
        if "timestamp" not in message:
            message["timestamp"] = datetime.utcnow().isoformat()

        # Append message
        messages_data["messages"].append(message)

        # Save messages
        with open(messages_file, "w", encoding="utf-8") as f:
            json.dump(messages_data, f, indent=2, ensure_ascii=False)

        # Update conversation metadata
        conv_metadata = self.index["conversations"][conv_id]
        conv_metadata["message_count"] = len(messages_data["messages"])
        conv_metadata["updated_at"] = datetime.utcnow().isoformat()

        # Auto-update title from first human message if still default
        if conv_metadata["title"] == "New conversation":
            # Find first human message
            human_messages = [
                m for m in messages_data["messages"] if m.get("type") == "human"
            ]
            if human_messages:
                first_content = human_messages[0].get("content", "")
                if isinstance(first_content, str) and first_content:
                    conv_metadata["title"] = self._generate_title(first_content)

        self._save_index()

        return conv_metadata

    def update_title(self, conv_id: str, title: str) -> Dict[str, Any]:
        """Update conversation title.

        Args:
            conv_id: Conversation identifier
            title: New title

        Returns:
            Updated conversation metadata

        Raises:
            ValueError: If conversation not found
        """
        if conv_id not in self.index["conversations"]:
            raise ValueError(f"Conversation '{conv_id}' not found")

        conv_metadata = self.index["conversations"][conv_id]
        conv_metadata["title"] = title
        conv_metadata["updated_at"] = datetime.utcnow().isoformat()

        self._save_index()

        return conv_metadata

    def delete_conversation(self, conv_id: str):
        """Delete a conversation.

        Args:
            conv_id: Conversation identifier

        Raises:
            ValueError: If conversation not found
        """
        if conv_id not in self.index["conversations"]:
            raise ValueError(f"Conversation '{conv_id}' not found")

        # Remove conversation directory
        conv_dir = self.storage_dir / conv_id
        if conv_dir.exists():
            import shutil
            shutil.rmtree(conv_dir)

        # Remove from index
        del self.index["conversations"][conv_id]
        self._save_index()

    def get_messages(self, conv_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation.

        Args:
            conv_id: Conversation identifier

        Returns:
            List of messages

        Raises:
            ValueError: If conversation not found
        """
        if conv_id not in self.index["conversations"]:
            raise ValueError(f"Conversation '{conv_id}' not found")

        messages_file = self.storage_dir / conv_id / "messages.json"

        if messages_file.exists():
            with open(messages_file, "r", encoding="utf-8") as f:
                messages_data = json.load(f)
                return messages_data["messages"]

        return []


# Global instance
conversation_manager = ConversationManager()
