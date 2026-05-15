import json
import logging
from typing import List, Optional

from app.integrations.llm_client import LLMClient
from app.services.sql_execution_service import SQLExecutionService

logger = logging.getLogger(__name__)


class HypothesisTestingService:
    def __init__(self, llm: LLMClient, sql_service: SQLExecutionService):
        self.llm = llm
        self.sql_service = sql_service

    def test_hypotheses(
        self,
        hypotheses: List[str],
        metric: str,
        time_filter: str,
    ) -> List[dict]:
        results = []
        for h in hypotheses:
            result = self._evaluate_single(h, metric, time_filter)
            if result:
                results.append(result)
        return results

    def select_best(self, hypothesis_results: List[dict]) -> Optional[dict]:
        if not hypothesis_results:
            return None
        ranked = sorted(hypothesis_results, key=lambda x: abs(x.get("change_pct", 0)), reverse=True)
        return ranked[0]

    def _evaluate_single(self, hypothesis: str, metric: str, time_filter: str) -> Optional[dict]:
        plan = self._generate_test_plan(hypothesis, metric, time_filter)
        if plan is None:
            return None

        sql, direction = self._build_sql(plan, time_filter)
        if sql is None:
            return None

        result_df, success = self.sql_service.execute(sql)
        if not success or result_df is None or result_df.empty:
            return None

        try:
            current = float(result_df.iloc[0][0])
            previous = float(result_df.iloc[0][1])
        except (IndexError, ValueError, TypeError):
            return None

        change = ((current - previous) / previous * 100) if previous != 0 else 0

        if direction == "increase":
            supported = current > previous
        else:
            supported = current < previous

        return {
            "hypothesis": hypothesis,
            "metric": plan.get("metric", metric),
            "current": current,
            "previous": previous,
            "change_pct": round(change, 2),
            "supported": supported,
            "sql": sql,
        }

    def _generate_test_plan(self, hypothesis: str, metric: str, time_filter: str) -> Optional[dict]:
        prompt = (
            "Convert the hypothesis into a structured test plan.\n"
            "Return ONLY valid JSON:\n"
            '{\n'
            '  "metric": "revenue" | "transactions" | "avg_value" | "failures",\n'
            '  "aggregation": "sum" | "count" | "avg",\n'
            '  "condition": "optional SQL filter condition",\n'
            '  "direction": "increase" or "decrease"\n'
            '}\n\n'
            f"Hypothesis: {hypothesis}\n"
            f"Context Metric: {metric}"
        )

        try:
            content = self.llm.chat(prompt, json_mode=True, max_tokens=200, temperature=0)
            return json.loads(content)
        except Exception as e:
            logger.warning("Test plan generation failed: %s", e)
            return None

    def _build_sql(self, plan: dict, time_filter: str) -> tuple:
        metric = plan.get("metric", "revenue")
        agg = plan.get("aggregation", "sum")
        direction = plan.get("direction", "increase")

        interval = "30 days" if time_filter == "30d" else "7 days"

        metric_map = {
            "revenue": ("amount", "WHERE status='SUCCESS'"),
            "transactions": ("*", ""),
            "failures": ("*", "WHERE status='FAILED'"),
            "avg_value": ("amount", ""),
        }
        column, where_clause = metric_map.get(metric, ("amount", ""))

        agg_map = {"sum": f"SUM({column})", "avg": f"AVG({column})", "count": "COUNT(*)"}
        expr = agg_map.get(agg, "COUNT(*)")

        sql = (
            f"SELECT\n"
            f"  {expr} FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '{interval}') AS current_val,\n"
            f"  {expr} FILTER (\n"
            f"    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '{interval}'\n"
            f"    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '{interval}' * 2\n"
            f"  ) AS previous_val\n"
            f"FROM df\n"
            f"{where_clause};"
        )
        return sql, direction
