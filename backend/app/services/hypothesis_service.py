import logging
from typing import List

from app.integrations.llm_client import LLMClient

logger = logging.getLogger(__name__)


class HypothesisService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def generate(self, query: str, complexity: str) -> List[str]:
        if complexity == "simple":
            return ["Direct computation from data"]

        prompt = (
            "You are an analytical hypothesis generator for a payments analytics platform.\n\n"
            "Given the business question below, generate 3-5 analytical hypotheses that could "
            "explain the observation or answer the question. Each hypothesis should be testable "
            "with SQL on a payments table.\n\n"
            "Return each hypothesis on a new line, prefixed with a dash (-).\n\n"
            f"Question: {query}"
        )

        try:
            content = self.llm.chat(prompt, max_tokens=300)
            hypotheses = [
                h.strip().lstrip("- ").lstrip("•").strip()
                for h in content.split("\n")
                if h.strip() and not h.strip().startswith("#")
            ]
            return hypotheses[:5] if hypotheses else ["Direct computation from data"]
        except Exception as e:
            logger.warning("Hypothesis generation failed: %s", e)
            return ["Direct computation from data"]
