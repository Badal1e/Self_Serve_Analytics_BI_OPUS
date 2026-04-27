import logging
from typing import Optional

import altair as alt
import pandas as pd

from app.integrations.llm_client import LLMClient

logger = logging.getLogger(__name__)


class ChartService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def decide_chart_type(self, query: str, df: Optional[pd.DataFrame]) -> str:
        if df is None or df.empty:
            return "none"

        if len(df.columns) < 2:
            return "none"

        columns = list(df.columns)
        sample = df.head(5).to_string(index=False)

        prompt = (
            "Decide the best chart type for the given data.\n"
            "Return ONLY one of: line, bar, none\n\n"
            "Rules:\n"
            "- line: for time series / trends over dates\n"
            "- bar: for categorical comparisons\n"
            "- none: if only a single scalar value\n\n"
            f"Query: {query}\n"
            f"Columns: {columns}\n"
            f"Sample:\n{sample}"
        )

        try:
            result = self.llm.chat(prompt, max_tokens=10, temperature=0)
            chart_type = result.strip().lower()

            if chart_type not in ("line", "bar", "none"):
                return "bar"

            return chart_type

        except Exception:
            return "none"

    def generate_chart(
        self,
        df: Optional[pd.DataFrame],
        chart_type: str,
    ) -> Optional[dict]:
        if df is None or df.empty or chart_type == "none":
            return None

        df_plot = df.copy()
        df_plot.columns = [str(c).lower() for c in df_plot.columns]

        if len(df_plot.columns) < 2:
            return None

        x, y = df_plot.columns[0], df_plot.columns[1]
        is_time = False

        try:
            df_plot[x] = pd.to_datetime(df_plot[x])
            is_time = True
        except (ValueError, TypeError):
            pass

        try:
            if chart_type == "line":
                chart = (
                    alt.Chart(df_plot)
                    .mark_line(point=True)
                    .encode(
                        x=alt.X(x, type="temporal" if is_time else "ordinal"),
                        y=alt.Y(y, type="quantitative"),
                    )
                    .properties(width=700, height=400)
                )
            else:
                chart = (
                    alt.Chart(df_plot)
                    .mark_bar()
                    .encode(
                        x=alt.X(x, type="nominal"),
                        y=alt.Y(y, type="quantitative"),
                    )
                    .properties(width=700, height=400)
                )

            return chart.to_dict()

        except Exception as e:
            logger.warning("Chart generation failed: %s", e)
            return None