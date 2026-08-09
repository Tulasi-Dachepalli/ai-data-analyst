from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, ChatMessage
from chat.nlq_engine import run_chat_nlp_engine

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat_nlp_endpoint(payload: ChatRequest):
    # Empty parameter validations
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question prompt string cannot be empty.")
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
    if not payload.columns:
        raise HTTPException(status_code=400, detail="Dataset columns array is empty.")
    if not payload.profile:
        raise HTTPException(status_code=400, detail="Dataset profiling metadata is required.")
    if not payload.statistics:
        raise HTTPException(status_code=400, detail="Dataset statistics metadata is required.")
        
    try:
        # Enforce defensive limit of 10,000 rows in Python
        sampled_rows = payload.rows[:10000]
        
        # Convert ChatMessage items to list of dicts for nlp engine
        history_list = [{"role": msg.role, "content": msg.content} for msg in payload.history]
        
        res = run_chat_nlp_engine(
            question=payload.question,
            history=history_list,
            rows=sampled_rows,
            columns=payload.columns,
            profile=payload.profile,
            statistics=payload.statistics
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP query planner execution failure: {str(e)}")
