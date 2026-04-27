import time
import logging
from typing import Optional, List
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.integrations.llm_client import LLMClient
from app.models.user import User
from app.models.query_log import QueryLog
from app.repositories.query_log_repository import QueryLogRepository
from app.repositories.glossary_repository import GlossaryRepository
from app.services.query_understanding_service import QueryUnderstandingService
from app.services.schema_retrieval_service import SchemaRetrievalService
from app.services.hypothesis_service import HypothesisService
from app.services.hypothesis_testing_service import HypothesisTestingService
from app.services.nl2sql_service import NL2SQLService
from app.services.sql_execution_service import SQLExecutionService
from app.services.answer_synthesis_service import AnswerSynthesisService
from app.services.chart_service import ChartService
from app.services.confidence_service import ConfidenceService
from app.services.followup_service import FollowupService
from app.services.governance_service import GovernanceService
from app.schemas.query import QueryResponse, HypothesisResult, ProvenanceInfo

logger = logging.getLogger(__name__)


class PipelineService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.llm = LLMClient()
        self.sql_service = SQLExecutionService()

    def run(self, query: str, session_id: Optional[str] = None) -> QueryResponse:
        start_time = time.perf_counter()

        # 1. Schema Retrieval (RAG)
        schema_service = SchemaRetrievalService(self.db)
        schema_context = schema_service.retrieve(query)

        # 2. Query Understanding
        qu_service = QueryUnderstandingService(self.llm)
        parsed = qu_service.parse(query)
        metric = parsed.get("metric", "revenue")
        time_filter = parsed.get("time_filter", "none")
        complexity = parsed.get("complexity", "simple")

        # 3. Hypothesis Generation
        hyp_service = HypothesisService(self.llm)
        hypotheses = hyp_service.generate(query, complexity)

        # 4. Governance: get glossary definitions for NL2SQL prompt
        glossary_defs = self._get_glossary_definitions()

        # 5. Governance: mask PII from schema context
        gov_service = GovernanceService(self.db)
        schema_context = gov_service.mask_pii_in_context(schema_context, self.user.role)

        # 6. NL2SQL Generation
        nl2sql_service = NL2SQLService(self.llm)
        try:
            sql = nl2sql_service.generate(query, schema_context, glossary_defs)
        except Exception as e:
            logger.error("NL2SQL failed: %s", e)
            return self._error_response(query, str(e), session_id, start_time)

        # 7. SQL Execution
        result_df, success = self.sql_service.execute(sql)

        # 8. Hypothesis Testing (for complex queries)
        hypothesis_results: List[dict] = []
        best_hypothesis: Optional[dict] = None
        if complexity == "complex":
            ht_service = HypothesisTestingService(self.llm, self.sql_service)
            hypothesis_results = ht_service.test_hypotheses(hypotheses, metric, time_filter)
            best_hypothesis = ht_service.select_best(hypothesis_results)

        # 9. Chart Generation
        chart_service = ChartService(self.llm)
        chart_df = result_df
        chart_type = chart_service.decide_chart_type(query, chart_df)
        chart_spec = chart_service.generate_chart(chart_df, chart_type)

        # 10. Answer Synthesis
        answer_service = AnswerSynthesisService(self.llm)
        insight = answer_service.compute_insight(result_df)
        answer = answer_service.synthesize(query, result_df, insight)

        # 11. Confidence Scoring
        conf_service = ConfidenceService()
        row_count = len(result_df) if result_df is not None else 0
        confidence, confidence_reason = conf_service.compute(
            success, row_count, hypothesis_results, query
        )

        # 12. Follow-up Suggestions
        followup_service = FollowupService(self.llm)
        follow_ups = followup_service.suggest(query, answer)

        # 13. Build provenance
        provenance = ProvenanceInfo(
            source_tables=["payments"],
            row_count=row_count,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # 14. Persist to audit log
        data_records = result_df.head(100).to_dict(orient="records") if result_df is not None else []

        log = QueryLog(
            user_id=self.user.id,
            session_id=session_id,
            natural_language_query=query,
            generated_sql=sql,
            parsed_intent=parsed,
            hypotheses=hypotheses,
            best_hypothesis=best_hypothesis,
            result_summary={"data": data_records, "row_count": row_count},
            confidence_score=confidence,
            confidence_reason=confidence_reason,
            chart_spec=chart_spec,
            answer_text=answer,
            follow_up_suggestions=follow_ups,
            provenance=provenance.model_dump(),
            llm_tokens_used=self.llm.total_tokens_used,
            latency_ms=round(elapsed_ms, 1),
        )
        repo = QueryLogRepository(self.db)
        repo.create(log)

        return QueryResponse(
            id=log.id,
            answer=answer,
            sql=sql,
            data=data_records,
            hypotheses=hypotheses,
            best_hypothesis=(
                HypothesisResult(**best_hypothesis) if best_hypothesis else None
            ),
            confidence=confidence,
            confidence_reason=confidence_reason,
            chart=chart_spec,
            follow_up_suggestions=follow_ups,
            provenance=provenance,
            latency_ms=round(elapsed_ms, 1),
            created_at=log.created_at,
        )

    def _get_glossary_definitions(self) -> List[str]:
        repo = GlossaryRepository(self.db)
        entries = repo.get_all()
        return [f"{e.term}: {e.sql_expression}" for e in entries]

    def _error_response(
        self, query: str, error: str, session_id: Optional[str], start_time: float
    ) -> QueryResponse:
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        log = QueryLog(
            user_id=self.user.id,
            session_id=session_id,
            natural_language_query=query,
            answer_text=f"Error: {error}",
            confidence_score=0.0,
            confidence_reason=error,
            latency_ms=round(elapsed_ms, 1),
            llm_tokens_used=self.llm.total_tokens_used,
        )
        repo = QueryLogRepository(self.db)
        repo.create(log)

        return QueryResponse(
            id=log.id,
            answer=f"Error: {error}",
            confidence=0.0,
            confidence_reason=error,
            latency_ms=round(elapsed_ms, 1),
            created_at=log.created_at,
        )