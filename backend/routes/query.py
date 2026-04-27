from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from pipeline.pipeline import run_pipeline

router = APIRouter()

# Request model
class QueryRequest(BaseModel):
    query: str


@router.post("/query")
def handle_query(request: QueryRequest):
    try:
        result = run_pipeline(request.query)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Optional (very useful for testing in browser)
@router.get("/query")
def query_get(q: str):
    try:
        return run_pipeline(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))