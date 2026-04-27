from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.query_log import QueryLog
from app.repositories.base import BaseRepository


class QueryLogRepository(BaseRepository[QueryLog]):
    def __init__(self, db: Session):
        super().__init__(QueryLog, db)

    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 20) -> List[QueryLog]:
        stmt = (
            select(QueryLog)
            .where(QueryLog.user_id == user_id)
            .order_by(desc(QueryLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def count_by_user(self, user_id: int) -> int:
        from sqlalchemy import func

        stmt = select(func.count()).select_from(QueryLog).where(QueryLog.user_id == user_id)
        return self.db.scalar(stmt) or 0

    def get_by_session(self, session_id: str, limit: int = 10) -> List[QueryLog]:
        stmt = (
            select(QueryLog)
            .where(QueryLog.session_id == session_id)
            .order_by(desc(QueryLog.created_at))
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
