from __future__ import annotations

import logging
import re
from typing import List

from app.integrations.llm_client import LLMClient
from app.core.exceptions import UnsafeSQLException

logger = logging.getLogger(__name__)

UNSAFE_KEYWORDS = {"delete", "update", "insert", "drop", "alter", "truncate", "create", "grant", "revoke"}


class NL2SQLService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def generate(
        self,
        query: str,
        schema_context: str,
        glossary_definitions: List[str] | None = None,
    ) -> str:

        glossary_block = ""
        if glossary_definitions:
            glossary_block = (
                "\nBusiness Glossary:\n"
                + "\n".join(f"- {d}" for d in glossary_definitions)
                + "\n"
            )

        prompt = (
            "You are an expert SQL generator for a payments analytics system.\n\n"
            "RULES:\n"
            "- Use DuckDB SQL\n"
            "- The table name is: df\n"
            "- ONLY SELECT queries\n"
            "- Use 'created_at' for time filtering\n"
            "- Use simple SQL (avoid complex date functions if possible)\n"
            "- Return ONLY SQL\n\n"
            f"Schema:\n{schema_context}\n"
            f"{glossary_block}\n"
            f"Query: {query}"
        )

        raw_sql = self.llm.chat(prompt, max_tokens=300, temperature=0)
        sql = self._clean(raw_sql)
        self._validate_safety(sql)

        return sql

    def _clean(self, sql: str) -> str:
        return sql.replace("```sql", "").replace("```", "").strip()

    def _validate_safety(self, sql: str) -> None:
        tokens = set(re.findall(r'\b\w+\b', sql.lower()))
        violations = tokens & UNSAFE_KEYWORDS
        if violations:
            raise UnsafeSQLException(f"Forbidden SQL keywords: {violations}")