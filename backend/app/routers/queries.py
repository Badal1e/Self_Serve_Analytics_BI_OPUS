from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.repositories.query_log_repository import QueryLogRepository
from app.schemas.query import QueryRequest, QueryResponse, QueryHistoryItem
from app.schemas.common import PaginatedResponse
from app.services.pipeline_service import PipelineService

router = APIRouter()


@router.post("", response_model=QueryResponse)
def submit_query(
    body: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PipelineService(db, current_user)
    return service.run(body.query, session_id=body.session_id)


@router.get("", response_model=PaginatedResponse[QueryHistoryItem])
def list_queries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = QueryLogRepository(db)
    skip = (page - 1) * page_size
    items = repo.get_by_user(current_user.id, skip=skip, limit=page_size)
    total = repo.count_by_user(current_user.id)
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        items=[QueryHistoryItem.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{query_id}", response_model=QueryResponse)
def get_query(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = QueryLogRepository(db)
    log = repo.get_by_id(query_id)
    if log is None or log.user_id != current_user.id:
        raise NotFoundException("Query not found")

    return QueryResponse(
        id=log.id,
        answer=log.answer_text or "",
        sql=log.generated_sql,
        data=log.result_summary.get("data", []) if log.result_summary else [],
        hypotheses=log.hypotheses or [],
        best_hypothesis=log.best_hypothesis,
        confidence=log.confidence_score or 0.0,
        confidence_reason=log.confidence_reason,
        chart=log.chart_spec,
        follow_up_suggestions=log.follow_up_suggestions or [],
        provenance=log.provenance,
        latency_ms=log.latency_ms,
        created_at=log.created_at,
    )
