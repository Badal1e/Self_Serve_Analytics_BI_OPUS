import json
import logging

from app.integrations.llm_client import LLMClient

logger = logging.getLogger(__name__)

DEFAULT_PARSED = {
    "complexity": "simple",
    "metric": "revenue",
    "time_filter": "none",
    "comparison": "no",
}


class QueryUnderstandingService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def parse(self, query: str) -> dict:
        prompt = (
            "You are a query understanding engine for a payments analytics system.\n"
            "Extract structured information from the user's natural language query.\n\n"
            "Return ONLY valid JSON with these fields:\n"
            '{\n'
            '  "complexity": "simple" or "complex",\n'
            '  "metric": "revenue" | "transactions" | "avg_value" | "failures" | "success_rate",\n'
            '  "time_filter": "7d" | "30d" | "monthly" | "quarterly" | "yearly" | "none",\n'
            '  "comparison": "yes" or "no",\n'
            '  "entities": ["list", "of", "key", "entities"]\n'
            '}\n\n'
            f"Query: {query}"
        )

        try:
            content = self.llm.chat(prompt, json_mode=True, max_tokens=200)
            parsed = json.loads(content)

            if "why" in query.lower() or "reason" in query.lower():
                parsed["complexity"] = "complex"

            return parsed
        except (json.JSONDecodeError, Exception) as e:
            logger.warning("Query understanding fallback triggered: %s", e)
            return {**DEFAULT_PARSED}
