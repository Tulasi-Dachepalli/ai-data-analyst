# python_service/routers/streaming.py
import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from services.streaming_profiling_service import stream_profile_dataset

router = APIRouter(prefix="/streaming", tags=["streaming"])

UPLOAD_SESSIONS_DIR = "streaming_uploads"
os.makedirs(UPLOAD_SESSIONS_DIR, exist_ok=True)

# In-memory registry for tracking chunked upload sessions
SESSIONS: Dict[str, Dict[str, Any]] = {}

class InitSessionRequest(BaseModel):
    upload_id: str
    file_name: str
    total_chunks: int
    expected_size_bytes: Optional[int] = None

class FinalizeSessionRequest(BaseModel):
    upload_id: str

@router.post("/init")
async def init_streaming_session(payload: InitSessionRequest):
    session_file_path = os.path.join(UPLOAD_SESSIONS_DIR, f"{payload.upload_id}_{payload.file_name}")
    # Reset file if exists
    if os.path.exists(session_file_path):
        os.remove(session_file_path)

    SESSIONS[payload.upload_id] = {
        "upload_id": payload.upload_id,
        "file_name": payload.file_name,
        "total_chunks": payload.total_chunks,
        "received_chunks": 0,
        "file_path": session_file_path,
        "status": "in_progress"
    }

    return {
        "status": "session_initialized",
        "upload_id": payload.upload_id,
        "total_chunks": payload.total_chunks
    }

@router.post("/chunk")
async def upload_streaming_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...)
):
    if upload_id not in SESSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streaming upload session not found.")

    session = SESSIONS[upload_id]
    expected_index = session["received_chunks"]

    # Verify chunk sequence
    if chunk_index != expected_index:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Out of order chunk. Expected chunk {expected_index}, received {chunk_index}."
        )

    # Append chunk stream to disk without holding entire payload in RAM
    with open(session["file_path"], "ab") as f:
        shutil.copyfileobj(chunk.file, f)

    session["received_chunks"] += 1

    return {
        "status": "chunk_accepted",
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "received_chunks": session["received_chunks"],
        "total_chunks": session["total_chunks"]
    }

@router.post("/finalize")
async def finalize_streaming_session(payload: FinalizeSessionRequest):
    if payload.upload_id not in SESSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streaming upload session not found.")

    session = SESSIONS[payload.upload_id]
    if session["received_chunks"] < session["total_chunks"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incomplete upload: received {session['received_chunks']} of {session['total_chunks']} chunks."
        )

    file_path = session["file_path"]
    try:
        # Perform memory-bounded streaming profile on assembled file
        profile = stream_profile_dataset(file_path, preview_limit=50)
        session["status"] = "completed"
        return {
            "success": True,
            "upload_id": payload.upload_id,
            "file_name": session["file_name"],
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Streaming profiling failed: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        SESSIONS.pop(payload.upload_id, None)
