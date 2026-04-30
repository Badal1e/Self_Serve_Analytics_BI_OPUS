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
    ) -> tuple[str, str]:

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

        raw_response = self.llm.chat(prompt, max_tokens=300, temperature=0)
        sql, explanation = self._parse_json_response(raw_response)
        self._validate_safety(sql)

        return sql, explanation

    def _parse_json_response(self, raw_text: str) -> tuple[str, str]:
        import json
        text = raw_text.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(text)
            return data.get("sql", ""), data.get("explanation", "No explanation provided.")
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response: {e}. Falling back to raw text.")
            return raw_text, "Failed to generate an explanation."

    def _validate_safety(self, sql: str) -> None:
        sql_upper = sql.upper().strip()
        
        # Enforce SELECT-only queries
        if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
            raise UnsafeSQLException("Security Alert: Only read-only (SELECT) queries are permitted. Modifying the database is blocked.")
            
        # Block multi-statement queries
        if ";" in sql and len([s for s in sql.split(";") if s.strip()]) > 1:
            raise UnsafeSQLException("Security Alert: Multiple SQL statements are not permitted to prevent injection attacks.")

        tokens = set(re.findall(r'\b\w+\b', sql.lower()))
        violations = tokens & UNSAFE_KEYWORDS
        if violations:
            violation_list = ", ".join(v.upper() for v in violations)
            raise UnsafeSQLException(f"Security Alert: The generated query contained forbidden destructive keywords ({violation_list}).")