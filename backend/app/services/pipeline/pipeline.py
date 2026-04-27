# ============================================
# PIPELINE
# ============================================
from app.data.generate_data import generate_payments_data

df = generate_payments_data(15000)
from rag.retriever import retrieve_schema
from llm.query_understanding import understand_query
from llm.hypothesis import generate_hypotheses
from llm.nl2sql import generate_sql
from llm.answer import synthesize_answer, compute_insight

from sql.cleaner import clean_sql
from sql.validator import validate_and_fix_sql
from sql.executor import execute_sql

from utils.time_utils import fix_time_filters
from utils.chart import generate_chart, decide_chart_type
from utils.confidence import compute_confidence

from analytics.hypotesting import test_hypotheses, select_best_hypothesis

# NEW
from config import get_client
from data.db import load_or_create_db


# --------------------------------------------
# INIT (for API usage)
# --------------------------------------------
_client = None
_df = None

def get_resources():
    global _client, _df

    if _client is None:
        _client = get_client()

    if _df is None:
        _df = load_or_create_db(15000)

    return _client, _df


# --------------------------------------------
# MAIN PIPELINE
# --------------------------------------------
def run_pipeline(query, client=None, df=None):

    # Auto-load for API
    if client is None or df is None:
        client, df = get_resources()

    # ----------------------------------------
    # 1. RAG
    # ----------------------------------------
    schema = retrieve_schema(query)

    # ----------------------------------------
    # 2. Query Understanding
    # ----------------------------------------
    parsed = understand_query(client, query)
    metric = parsed.get("metric")
    time_filter = parsed.get("time_filter")
    complexity = parsed.get("complexity", "simple")

    if "why" in query.lower():
        complexity = "complex"

    # ----------------------------------------
    # 3. Hypotheses
    # ----------------------------------------
    hypotheses = generate_hypotheses(client, query, complexity)

    # ----------------------------------------
    # 4. SQL Generation
    # ----------------------------------------
    raw_sql = generate_sql(client, query, schema)
    sql = fix_time_filters(clean_sql(raw_sql))

    if not is_safe_sql(sql):
        return safe_error("Unsafe query blocked", sql)

    # ----------------------------------------
    # 5. Execution
    # ----------------------------------------
    try:
        sql = validate_and_fix_sql(sql, query)
        result, success = execute_sql(sql, df)
    except Exception as e:
        result, success = None, False

    # ----------------------------------------
    # 6. Hypothesis Testing
    # ----------------------------------------
    hypothesis_results = test_hypotheses(
        hypotheses, df, metric, time_filter, client
    )
    best_hypothesis = select_best_hypothesis(hypothesis_results)

    # ----------------------------------------
    # 7. Chart
    # ----------------------------------------
    chart_df = result

    if best_hypothesis:
        metric = best_hypothesis["metric"]

        if metric == "transactions":
            chart_sql = """
            SELECT DATE(created_at) as date, COUNT(*) as value
            FROM df GROUP BY date ORDER BY date
            """
        elif metric == "revenue":
            chart_sql = """
            SELECT DATE(created_at) as date, SUM(amount) as value
            FROM df WHERE status='SUCCESS'
            GROUP BY date ORDER BY date
            """
        elif metric == "failures":
            chart_sql = """
            SELECT DATE(created_at) as date, COUNT(*) as value
            FROM df WHERE status='FAILED'
            GROUP BY date ORDER BY date
            """
        else:
            chart_sql = None

        if chart_sql:
            chart_sql = fix_time_filters(chart_sql)
            temp_df, ok = execute_sql(chart_sql, df)
            if ok:
                chart_df = temp_df

    chart_type = decide_chart_type(client, query, chart_df)
    chart = generate_chart(chart_df, chart_type)

    # ----------------------------------------
    # 8. Answer
    # ----------------------------------------
    if success:
        insight_data = compute_insight(result)
        answer = synthesize_answer(client, query, result, insight_data)
    else:
        answer = "Could not retrieve reliable results."

    # ----------------------------------------
    # 9. Confidence
    # ----------------------------------------
    confidence, confidence_reason = compute_confidence(
        success,
        len(result) if result is not None else 0,
        hypothesis_results,
        query
    )

    # ----------------------------------------
    # 10. OUTPUT (API SAFE)
    # ----------------------------------------
    return {
        "answer": answer,
        "sql": sql,
        "data": result.to_dict(orient="records") if result is not None else [],
        "hypotheses": hypotheses,
        "best_hypothesis": best_hypothesis,
        "confidence": confidence,
        "confidence_reason": confidence_reason,
        "chart": chart.to_dict() if chart else None
    }


# --------------------------------------------
# HELPERS
# --------------------------------------------
def is_safe_sql(sql):
    sql = sql.lower()
    unsafe_keywords = ["delete", "update", "insert", "drop", "alter", "truncate"]
    return not any(keyword in sql for keyword in unsafe_keywords)


def safe_error(msg, sql):
    return {
        "answer": msg,
        "sql": sql,
        "data": [],
        "hypotheses": [],
        "best_hypothesis": None,
        "confidence": 0,
        "confidence_reason": msg,
        "chart": None
    }


print(df.head())