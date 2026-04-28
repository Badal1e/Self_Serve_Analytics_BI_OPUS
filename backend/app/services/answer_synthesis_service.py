import logging
from typing import Optional

import pandas as pd

from app.integrations.llm_client import LLMClient
from app.core.prompts import (
    ANSWER_SYNTHESIS_WITH_INSIGHT_PROMPT,
    ANSWER_SYNTHESIS_WITH_DATA_PROMPT,
    ANSWER_SYNTHESIS_NO_DATA_PROMPT
)

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
            prompt = ANSWER_SYNTHESIS_NO_DATA_PROMPT.format(query=query)
        elif insight_data:
            prompt = ANSWER_SYNTHESIS_WITH_INSIGHT_PROMPT.format(
                query=query,
                current_value=insight_data['current'],
                previous_value=insight_data['previous'],
                change_pct=insight_data['change_pct']
            )
        else:
            data_str = result_df.head(50).to_string(index=False)
            prompt = ANSWER_SYNTHESIS_WITH_DATA_PROMPT.format(
                query=query,
                data_str=data_str
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
