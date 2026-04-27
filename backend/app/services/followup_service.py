import json
import logging
from typing import List

from app.integrations.llm_client import LLMClient

logger = logging.getLogger(__name__)


class FollowupService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def suggest(self, query: str, answer: str) -> List[str]:
        prompt = (
            "You are a business analytics assistant.\n\n"
            "Based on the user's question and the answer they received, suggest "
            "3-5 follow-up questions they might want to explore next.\n\n"
            "Return ONLY a JSON array of strings.\n\n"
            f"Original question: {query}\n"
            f"Answer summary: {answer[:300]}"
        )

        try:
            content = self.llm.chat(prompt, json_mode=True, max_tokens=300)
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return [str(s) for s in parsed[:5]]
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        return [str(s) for s in v[:5]]
            return []
        except Exception as e:
            logger.warning("Follow-up suggestion failed: %s", e)
            return []
