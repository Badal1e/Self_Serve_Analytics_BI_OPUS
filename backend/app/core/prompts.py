"""
Centralized prompt management for all LLM operations.
"""

NL2SQL_PROMPT_TEMPLATE = """You are an expert SQL generator for a payments analytics system.

RULES:
- Use DuckDB SQL
- Available tables are: users, payments
- You must use JOINs if the query spans user data (e.g. subscription_tier, industry) and payment data
- ONLY SELECT queries
- NO multiple statements (do not use semicolons to chain commands)
- Use 'created_at' for payment time filtering and 'signup_date' for user time filtering
- ALWAYS CAST strings to TIMESTAMP when comparing against dates (e.g., CAST(created_at AS TIMESTAMP) >= CAST('2023-10-01' AS TIMESTAMP))
- IMPORTANT: The current date is {current_date}. Use this to resolve relative time expressions like "last month", "yesterday", or "last year".
- Return ONLY SQL

Schema:
{schema_context}
{glossary_block}
Query: {query}"""

ANSWER_SYNTHESIS_WITH_INSIGHT_PROMPT = """You are a business analyst for a payments company.

Answer the following question using the computed data. Be concise (2-3 sentences), use specific numbers, and clearly indicate whether values increased or decreased.

Question: {query}

Current value: {current_value}
Previous value: {previous_value}
Change: {change_pct}%"""

ANSWER_SYNTHESIS_WITH_DATA_PROMPT = """You are a business analyst for a payments company.

Answer the following question using the data below. Be concise, highlight key numbers, and provide actionable insight.

Question: {query}

Data:
{data_str}"""

ANSWER_SYNTHESIS_NO_DATA_PROMPT = """You are a polite business analyst for a payments company.

The user asked the following question: "{query}"

However, the SQL query executed against the database returned 0 rows. 
Formulate a polite, natural language response (1-2 sentences) informing the user that there is no data matching their specific criteria for this question."""
