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
from agent.kb_manager import kb_manager
from agent.conversation_manager import conversation_manager
from agent.voice_service import transcribe_audio_async
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


# Knowledge Base API Endpoints
@app.post("/api/knowledge-base/upload")
async def upload_knowledge_base(files: List[UploadFile] = File(...)):
    """Upload documents to create a new knowledge base."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Generate unique KB ID
    kb_id = f"custom_{uuid.uuid4().hex[:12]}"
    kb_name = f"Custom KB {kb_id[-6:]}"

    try:
        # Create KB
        kb_manager.create_knowledge_base(kb_id, kb_name)

        # Upload and process documents
        result = kb_manager.upload_documents(kb_id, files)

        return {
            "status": "success",
            "kb_id": kb_id,
            "kb_name": kb_name,
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/knowledge-base/list")
async def list_knowledge_bases():
    """List all available knowledge bases."""
    try:
        kbs = kb_manager.list_knowledge_bases()
        return {"knowledge_bases": kbs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/knowledge-base/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    """Delete a knowledge base."""
    try:
        kb_manager.delete_knowledge_base(kb_id)
        return {"status": "success", "message": f"Knowledge base '{kb_id}' deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


# Voice API Endpoints


class TranscriptionResponse(BaseModel):
    """Response model for voice transcription."""

    text: str
    success: bool
    error: str | None = None


@app.post("/api/voice/transcribe", response_model=TranscriptionResponse)
async def transcribe_voice(audio: UploadFile = File(...)):
    """Transcribe audio file to text using Whisper.

    Args:
        audio: The audio file to transcribe (webm, mp3, wav, m4a, ogg, flac).

    Returns:
        TranscriptionResponse with transcribed text and success status.

    Raises:
        HTTPException: For various error conditions with appropriate status codes.
    """
    temp_file_path = None

    try:
        # Validate file was provided
        if not audio:
            raise HTTPException(
                status_code=400, detail="No audio file provided"
            )

        # Validate content type
        if not audio.content_type or not audio.content_type.startswith("audio"):
            logger.warning(
                f"Invalid content type: {audio.content_type}. "
                "Proceeding anyway as browser may send incorrect MIME type."
            )

        # Get file extension from filename
        file_extension = os.path.splitext(audio.filename or "")[1].lower()
        if not file_extension:
            file_extension = ".webm"  # Default for browser recordings

        logger.info(
            f"Received audio file: {audio.filename} "
            f"(type: {audio.content_type}, ext: {file_extension})"
        )

        # Create temporary file to store uploaded audio
        with tempfile.NamedTemporaryFile(
            suffix=file_extension, delete=False
        ) as temp_file:
            temp_file_path = temp_file.name

            # Write uploaded file content to temporary file
            content = await audio.read()
            temp_file.write(content)
            temp_file.flush()

        logger.info(f"Saved audio to temporary file: {temp_file_path}")

        # Validate file size (prevent extremely large files)
        file_size = os.path.getsize(temp_file_path)
        max_size = 25 * 1024 * 1024  # 25MB limit
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"Audio file too large: {file_size} bytes "
                f"(max: {max_size} bytes)",
            )

        if file_size == 0:
            raise HTTPException(
                status_code=400, detail="Audio file is empty"
            )

        logger.info(f"Audio file size: {file_size} bytes")

        # Transcribe audio
        transcribed_text = await transcribe_audio_async(temp_file_path)

        if not transcribed_text:
            logger.warning("Transcription returned empty text")
            return TranscriptionResponse(
                text="",
                success=True,
                error="No speech detected in audio",
            )

        logger.info(
            f"Transcription successful: '{transcribed_text[:100]}...' "
            f"({len(transcribed_text)} chars)"
        )

        return TranscriptionResponse(
            text=transcribed_text,
            success=True,
            error=None,
        )

    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(f"File not found error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Transcription runtime error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during transcription",
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.debug(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary file {temp_file_path}: {e}"
                )


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
