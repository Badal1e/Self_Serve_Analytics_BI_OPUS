import pytest
from app.services.nl2sql_service import NL2SQLService
from app.core.exceptions import UnsafeSQLException


class FakeLLM:
    total_tokens_used = 0
    def chat(self, prompt, **kwargs):
        return "SELECT SUM(amount) as revenue FROM df WHERE status='SUCCESS'"


class UnsafeFakeLLM:
    total_tokens_used = 0
    def chat(self, prompt, **kwargs):
        return "DROP TABLE df; SELECT 1"


def test_generate_sql_clean():
    service = NL2SQLService(FakeLLM())
    sql = service.generate("What is total revenue?", "amount: transaction amount")
    assert "SELECT" in sql
    assert "SUM(amount)" in sql


def test_generate_sql_blocks_unsafe():
    service = NL2SQLService(UnsafeFakeLLM())
    with pytest.raises(UnsafeSQLException):
        service.generate("Drop the table", "some schema")


def test_clean_removes_markdown():
    service = NL2SQLService(FakeLLM())
    result = service._clean("```sql\nSELECT 1\n```")
    assert "```" not in result
    assert "SELECT 1" in result
