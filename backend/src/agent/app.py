# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
from fastapi import FastAPI, Response, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from agent.kb_manager import kb_manager
import uuid

# Define the FastAPI app
app = FastAPI()

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
