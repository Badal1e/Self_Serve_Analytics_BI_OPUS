from __future__ import annotations

import logging
import re
from typing import List
from datetime import datetime

from app.integrations.llm_client import LLMClient
from app.core.exceptions import UnsafeSQLException
from app.core.prompts import NL2SQL_PROMPT_TEMPLATE

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

        prompt = NL2SQL_PROMPT_TEMPLATE.format(
            schema_context=schema_context,
            glossary_block=glossary_block,
            query=query,
            current_date=datetime.now().strftime("%Y-%m-%d")
        )

        raw_sql = self.llm.chat(prompt, max_tokens=300, temperature=0)
        sql = self._clean(raw_sql)
        self._validate_safety(sql)

        return sql

    def _clean(self, sql: str) -> str:
        return sql.replace("```sql", "").replace("```", "").strip()

    def _validate_safety(self, sql: str) -> None:
        sql_upper = sql.upper().strip()
        
        # Enforce SELECT-only queries
        if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
            raise UnsafeSQLException("Only SELECT queries are permitted.")
            
        # Block multi-statement queries
        if ";" in sql:
            raise UnsafeSQLException("Multiple SQL statements are not permitted.")

        tokens = set(re.findall(r'\b\w+\b', sql.lower()))
        violations = tokens & UNSAFE_KEYWORDS
        if violations:
            raise UnsafeSQLException(f"Forbidden SQL keywords: {violations}")