from pydantic import BaseModel
from typing import Any, List, Optional

class QueryResponse(BaseModel):
    query: str
    sql: Optional[str]
    data: List[Any]
    chart: Optional[Any]
    confidence: float