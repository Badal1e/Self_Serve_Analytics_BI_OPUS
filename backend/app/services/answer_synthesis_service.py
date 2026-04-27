import logging
from typing import Optional

import pandas as pd

from app.integrations.llm_client import LLMClient

logger = logging.getLogger(__name__)


class AnswerSynthesisService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def synthesize(
        self,
        query: str,
        result_df: Optional[pd.DataFrame],
        insight_data: Optional[dict] = None,
    ) -> str:
        if result_df is None or result_df.empty:
            return "No data available to answer this question."

        if insight_data:
            prompt = (
                "You are a business analyst for a payments company.\n\n"
                "Answer the following question using the computed data. "
                "Be concise (2-3 sentences), use specific numbers, and clearly indicate "
                "whether values increased or decreased.\n\n"
                f"Question: {query}\n\n"
                f"Current value: {insight_data['current']}\n"
                f"Previous value: {insight_data['previous']}\n"
                f"Change: {insight_data['change_pct']}%"
            )
        else:
            data_str = result_df.head(50).to_string(index=False)
            prompt = (
                "You are a business analyst for a payments company.\n\n"
                "Answer the following question using the data below. "
                "Be concise, highlight key numbers, and provide actionable insight.\n\n"
                f"Question: {query}\n\n"
                f"Data:\n{data_str}"
            )

        try:
            return self.llm.chat(prompt, max_tokens=300)
        except Exception as e:
            logger.warning("Answer synthesis failed: %s", e)
            return "Unable to generate a natural language answer at this time."

    @staticmethod
    def compute_insight(df: Optional[pd.DataFrame]) -> Optional[dict]:
        if df is None or len(df) < 2:
            return None

        cols = df.columns.tolist()
        value_col = None
        for col in cols:
            if col.lower() in ("revenue", "value", "total", "amount", "count"):
                value_col = col
                break
        if value_col is None:
            value_col = cols[-1]

        try:
            current = float(df.iloc[0][value_col])
            previous = float(df.iloc[1][value_col])
            change_pct = ((current - previous) / previous * 100) if previous != 0 else 0
            return {
                "current": current,
                "previous": previous,
                "change_pct": round(change_pct, 2),
            }
        except (ValueError, TypeError, KeyError):
            return None
