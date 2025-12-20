# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
import tempfile
import os
import logging
from fastapi import FastAPI, Response, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from typing import List, Dict, Any
from pydantic import BaseModel
from agent.conversation_manager import conversation_manager
# Removed: kb_manager and voice_service (heavy dependencies not needed)
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Define the FastAPI app
app = FastAPI()

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://smith.langchain.com",  # Allow LangSmith Studio
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    return StaticFiles(directory=build_path, html=True)


# Knowledge Base API Endpoints - DISABLED (removed heavy dependencies)
# These endpoints required PyPDF2, python-docx which added significant install time
# Use CNB API or Wikipedia instead for knowledge base features
#
# @app.post("/api/knowledge-base/upload")
# @app.get("/api/knowledge-base/list")
# @app.delete("/api/knowledge-base/{kb_id}")


# Conversation API Endpoints

class CreateConversationRequest(BaseModel):
    kb_type: str = "wikipedia"
    mode: str = "gpt"


class AddMessageRequest(BaseModel):
    type: str  # "human" or "ai"
    content: Any  # Can be string or dict
    metadata: Dict[str, Any] = {}


class UpdateTitleRequest(BaseModel):
    title: str


@app.post("/api/conversations")
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    try:
        conversation = conversation_manager.create_conversation(
            kb_type=request.kb_type, mode=request.mode
        )
        return {"status": "success", "conversation": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations")
async def list_conversations():
    """List all conversations."""
    try:
        conversations = conversation_manager.list_conversations()
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    """Get a conversation with all messages."""
    try:
        conversation = conversation_manager.get_conversation(conv_id)
        return conversation
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    """Delete a conversation."""
    try:
        conversation_manager.delete_conversation(conv_id)
        return {"status": "success", "message": f"Conversation '{conv_id}' deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/conversations/{conv_id}")
async def update_conversation_title(conv_id: str, request: UpdateTitleRequest):
    """Update conversation title."""
    try:
        conversation = conversation_manager.update_title(conv_id, request.title)
        return {"status": "success", "conversation": conversation}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/conversations/{conv_id}/messages")
async def add_message(conv_id: str, request: AddMessageRequest):
    """Add a message to a conversation."""
    try:
        message = {
            "type": request.type,
            "content": request.content,
            **request.metadata,
        }
        conversation = conversation_manager.add_message(conv_id, message)
        return {"status": "success", "conversation": conversation}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: str):
    """Get all messages for a conversation."""
    try:
        messages = conversation_manager.get_messages(conv_id)
        return {"messages": messages}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Voice API Endpoints - DISABLED (removed heavy Whisper dependency)
# This endpoint required openai-whisper, pydub, ffmpeg-python which added 5+ minutes to install
# Removed to optimize dependency installation time
#
# class TranscriptionResponse(BaseModel):
#     text: str
#     success: bool
#     error: str | None = None
#
# Endpoint implementation removed to reduce dependencies


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
