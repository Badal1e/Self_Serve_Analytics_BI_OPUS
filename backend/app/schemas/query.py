from pydantic import BaseModel, Field
from typing import Any, Optional, List
from datetime import datetime


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None


class HypothesisResult(BaseModel):
    hypothesis: str
    metric: Optional[str] = None
    current: Optional[float] = None
    previous: Optional[float] = None
    change_pct: Optional[float] = None
    supported: Optional[bool] = None


class ProvenanceInfo(BaseModel):
    source_tables: List[str]
    row_count: int
    timestamp: str


class QueryResponse(BaseModel):
    id: int
    answer: str
    sql: Optional[str] = None
    data: List[Any] = []
    hypotheses: List[str] = []
    best_hypothesis: Optional[HypothesisResult] = None
    confidence: float = 0.0
    confidence_reason: Optional[str] = None
    chart: Optional[dict] = None
    follow_up_suggestions: List[str] = []
    provenance: Optional[ProvenanceInfo] = None
    latency_ms: Optional[float] = None
    created_at: Optional[datetime] = None


class QueryHistoryItem(BaseModel):
    id: int
    natural_language_query: str
    answer_text: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
