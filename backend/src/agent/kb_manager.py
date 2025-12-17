"""Knowledge Base Management for custom document uploads."""
import os
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import re

# For document processing
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None


class KnowledgeBaseManager:
    """Manages custom knowledge bases with document upload and indexing."""

    def __init__(self, storage_dir: str = "./knowledge_bases"):
        """Initialize KB manager with storage directory.

        Args:
            storage_dir: Directory to store knowledge bases
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_dir / "index.json"

        # Load or create index
        self.index = self._load_index()

    def _load_index(self) -> Dict[str, Any]:
        """Load knowledge base index from disk."""
        if self.index_file.exists():
            with open(self.index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"knowledge_bases": {}}

    def _save_index(self):
        """Save knowledge base index to disk."""
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(self.index, f, indent=2, ensure_ascii=False)

    def create_knowledge_base(self, kb_id: str, name: str) -> Dict[str, Any]:
        """Create a new knowledge base.

        Args:
            kb_id: Unique identifier for the knowledge base
            name: Human-readable name

        Returns:
            Knowledge base metadata
        """
        kb_dir = self.storage_dir / kb_id
        kb_dir.mkdir(parents=True, exist_ok=True)

        kb_metadata = {
            "id": kb_id,
            "name": name,
            "created_at": datetime.utcnow().isoformat(),
            "document_count": 0,
            "chunk_count": 0,
            "documents": {},
        }

        self.index["knowledge_bases"][kb_id] = kb_metadata
        self._save_index()

        return kb_metadata

    def upload_documents(self, kb_id: str, files: List[Any]) -> Dict[str, Any]:
        """Upload and process documents into a knowledge base.

        Args:
            kb_id: Knowledge base identifier
            files: List of file objects to process

        Returns:
            Upload result with processing status
        """
        if kb_id not in self.index["knowledge_bases"]:
            raise ValueError(f"Knowledge base '{kb_id}' not found")

        kb_dir = self.storage_dir / kb_id
        kb_metadata = self.index["knowledge_bases"][kb_id]

        processed_docs = []
        total_chunks = 0

        for file in files:
            try:
                # Read file content
                content_bytes = file.read()
                filename = getattr(file, "filename", "document.txt")

                # Generate document ID
                doc_id = hashlib.md5(content_bytes).hexdigest()

                # Process document based on type
                ext = Path(filename).suffix.lower()
                if ext == ".pdf":
                    text = self._extract_pdf_text(content_bytes)
                elif ext in [".docx", ".doc"]:
                    text = self._extract_docx_text(content_bytes)
                elif ext in [".txt", ".md"]:
                    text = content_bytes.decode("utf-8", errors="ignore")
                else:
                    text = content_bytes.decode("utf-8", errors="ignore")

                # Chunk the text
                chunks = self._chunk_text(text)

                # Save chunks
                chunks_file = kb_dir / f"{doc_id}.json"
                chunk_data = {
                    "document_id": doc_id,
                    "filename": filename,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "chunk_count": len(chunks),
                    "chunks": [
                        {
                            "id": f"{doc_id}_{i}",
                            "content": chunk,
                            "metadata": {
                                "filename": filename,
                                "chunk_index": i,
                                "total_chunks": len(chunks),
                            },
                        }
                        for i, chunk in enumerate(chunks)
                    ],
                }

                with open(chunks_file, "w", encoding="utf-8") as f:
                    json.dump(chunk_data, f, indent=2, ensure_ascii=False)

                # Update metadata
                kb_metadata["documents"][doc_id] = {
                    "filename": filename,
                    "uploaded_at": chunk_data["uploaded_at"],
                    "chunk_count": len(chunks),
                }

                processed_docs.append(
                    {"filename": filename, "chunks": len(chunks), "status": "success"}
                )
                total_chunks += len(chunks)

            except Exception as e:
                processed_docs.append(
                    {"filename": filename, "status": "error", "error": str(e)}
                )

        # Update KB metadata
        kb_metadata["document_count"] = len(kb_metadata["documents"])
        kb_metadata["chunk_count"] = sum(
            doc["chunk_count"] for doc in kb_metadata["documents"].values()
        )
        self._save_index()

        return {
            "kb_id": kb_id,
            "processed_documents": processed_docs,
            "total_chunks": kb_metadata["chunk_count"],
        }

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes."""
        if PdfReader is None:
            raise ImportError("PyPDF2 not installed. Install with: pip install PyPDF2")

        from io import BytesIO

        pdf_file = BytesIO(pdf_bytes)
        pdf_reader = PdfReader(pdf_file)

        text_parts = []
        for page in pdf_reader.pages:
            text_parts.append(page.extract_text())

        return "\n\n".join(text_parts)

    def _extract_docx_text(self, docx_bytes: bytes) -> str:
        """Extract text from DOCX bytes."""
        if DocxDocument is None:
            raise ImportError(
                "python-docx not installed. Install with: pip install python-docx"
            )

        from io import BytesIO

        docx_file = BytesIO(docx_bytes)
        doc = DocxDocument(docx_file)

        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)

        return "\n\n".join(text_parts)

    def _chunk_text(
        self, text: str, chunk_size: int = 500, overlap: int = 50
    ) -> List[str]:
        """Chunk text into smaller segments with overlap.

        Args:
            text: Text to chunk
            chunk_size: Target chunk size in words
            overlap: Number of overlapping words between chunks

        Returns:
            List of text chunks
        """
        # Split into sentences (simple approach)
        sentences = re.split(r"[.!?]+\s+", text)

        chunks = []
        current_chunk = []
        current_word_count = 0

        for sentence in sentences:
            words = sentence.split()
            word_count = len(words)

            if current_word_count + word_count > chunk_size and current_chunk:
                # Save current chunk
                chunks.append(" ".join(current_chunk))

                # Start new chunk with overlap
                overlap_words = min(overlap, len(current_chunk))
                current_chunk = current_chunk[-overlap_words:] if overlap_words > 0 else []
                current_word_count = len(current_chunk)

            current_chunk.extend(words)
            current_word_count += word_count

        # Add final chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def query_knowledge_base(
        self, kb_id: str, query: str, top_k: int = 5
    ) -> Dict[str, Any]:
        """Query a knowledge base using simple text matching.

        Args:
            kb_id: Knowledge base identifier
            query: Search query
            top_k: Number of results to return

        Returns:
            Query results with chunks and sources
        """
        if kb_id not in self.index["knowledge_bases"]:
            raise ValueError(f"Knowledge base '{kb_id}' not found")

        kb_dir = self.storage_dir / kb_id

        # Collect all chunks
        all_chunks = []
        for doc_file in kb_dir.glob("*.json"):
            with open(doc_file, "r", encoding="utf-8") as f:
                doc_data = json.load(f)
                all_chunks.extend(doc_data["chunks"])

        # Simple keyword matching (in production, use vector embeddings)
        query_lower = query.lower()
        query_words = set(query_lower.split())

        # Score chunks by keyword overlap
        scored_chunks = []
        for chunk in all_chunks:
            content_lower = chunk["content"].lower()
            content_words = set(content_lower.split())

            # Calculate overlap score
            overlap = len(query_words & content_words)
            if overlap > 0:
                scored_chunks.append((chunk, overlap))

        # Sort by score and take top_k
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        top_chunks = [chunk for chunk, score in scored_chunks[:top_k]]

        # Extract unique sources
        sources = []
        seen_files = set()
        for chunk in top_chunks:
            filename = chunk["metadata"]["filename"]
            if filename not in seen_files:
                sources.append(
                    {
                        "id": len(sources) + 1,
                        "title": filename,
                        "url": f"local://{kb_id}/{filename}",
                        "path": filename,
                    }
                )
                seen_files.add(filename)

        return {
            "results": [{"chunk": c["content"], "metadata": c["metadata"]} for c in top_chunks],
            "sources": sources,
        }

    def list_knowledge_bases(self) -> List[Dict[str, Any]]:
        """List all available knowledge bases."""
        return [
            {
                "id": kb_id,
                "name": kb_data["name"],
                "created_at": kb_data["created_at"],
                "document_count": kb_data["document_count"],
                "chunk_count": kb_data.get("chunk_count", 0),
            }
            for kb_id, kb_data in self.index["knowledge_bases"].items()
        ]

    def delete_knowledge_base(self, kb_id: str):
        """Delete a knowledge base and all its documents."""
        if kb_id not in self.index["knowledge_bases"]:
            raise ValueError(f"Knowledge base '{kb_id}' not found")

        # Delete directory
        kb_dir = self.storage_dir / kb_id
        if kb_dir.exists():
            import shutil

            shutil.rmtree(kb_dir)

        # Remove from index
        del self.index["knowledge_bases"][kb_id]
        self._save_index()


# Global instance
kb_manager = KnowledgeBaseManager()
