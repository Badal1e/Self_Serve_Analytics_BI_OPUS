# ============================================
# HYPOTHESIS TESTING MODULE
# ============================================
 
from sql.executor import execute_sql
from utils.time_utils import fix_time_filters
 
 
# --------------------------------------------
# Helper: Generate comparative SQL
# --------------------------------------------

def generate_comparison_sql(metric_type, time_filter):
    
    if time_filter == "30d":
        interval = "30 days"
    elif time_filter == "7d":
        interval = "7 days"
    else:
        interval = "7 days"
    
    if metric_type == "revenue":
        return f"""
        SELECT 
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '{interval}' THEN amount ELSE 0 END) AS current,
            SUM(CASE WHEN created_at < NOW() - INTERVAL '{interval}' 
                     AND created_at >= NOW() - INTERVAL '{interval}' * 2 THEN amount ELSE 0 END) AS previous
        FROM df
        WHERE status='SUCCESS';
        """
    
    if metric_type == "transactions":
        return f"""
        SELECT 
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '{interval}' THEN 1 END) AS current,
            COUNT(CASE WHEN created_at < NOW() - INTERVAL '{interval}' 
                       AND created_at >= NOW() - INTERVAL '{interval}' * 2 THEN 1 END) AS previous
        FROM df;
        """
    
    return None
 
 
# --------------------------------------------
# Core: Evaluate hypothesis
# --------------------------------------------
def evaluate_hypothesis(client, hypothesis, df, metric, time_filter):
    
    try:
        plan = generate_test_plan(client, hypothesis, metric, time_filter)
    except:
        return None
    
    sql, direction = generate_sql_from_plan(plan, time_filter)
    
    sql = fix_time_filters(sql)
    
    result, success = execute_sql(sql, df)
    
    if not success or result is None:
        return None
    
    current = result.iloc[0][0]
    previous = result.iloc[0][1]
    
    if previous == 0:
        change = 0
    else:
        change = ((current - previous) / previous) * 100
    
    # Direction-aware evaluation
    if direction == "increase":
        supported = current > previous
    else:
        supported = current < previous
    
    return {
        "hypothesis": hypothesis,
        "metric": plan["metric"],
        "current": float(current),
        "previous": float(previous),
        "change_pct": round(change, 2),
        "supported": supported
    }
 
# --------------------------------------------
# Main: Run hypothesis testing
# --------------------------------------------
 
def test_hypotheses(hypotheses, df, metric, time_filter, client):
    
    results = []
    
    for h in hypotheses:
        res = evaluate_hypothesis(client, h, df, metric, time_filter)
        
        if res:
            results.append(res)
    
    return results
 

def select_best_hypothesis(hypothesis_results):
    
    if not hypothesis_results:
        return None
    
    # Sort by absolute % change (strongest signal)
    ranked = sorted(
        hypothesis_results,
        key=lambda x: abs(x["change_pct"]),
        reverse=True
    )
    
    return ranked[0]

# Test Plan section----------------------------------------------- 
def generate_test_plan(client, hypothesis, metric, time_filter):
    
    prompt = f"""
    Convert the hypothesis into a structured test plan.
 
    Return JSON only:
 
    {{
      "metric": "revenue | transactions | avg_value | failures",
      "aggregation": "sum | count | avg",
      "condition": "optional filter condition",
      "direction": "increase or decrease"
    }}
 
    Hypothesis: {hypothesis}
    Context Metric: {metric}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )
    
    import json
    return json.loads(response.choices[0].message.content)
 
def generate_sql_from_plan(plan, time_filter):
    
    metric = plan["metric"]
    agg = plan["aggregation"]
    direction = plan["direction"]
    condition = plan.get("condition", "")
    
    if time_filter == "30d":
        interval = "30 days"
    else:
        interval = "7 days"
    
    # Metric → column
    if metric == "revenue":
        column = "amount"
        where_clause = "WHERE status='SUCCESS'"
    elif metric == "transactions":
        column = "*"
        where_clause = ""
    elif metric == "failures":
        column = "*"
        where_clause = "WHERE status='FAILED'"
    else:
        column = "amount"
        where_clause = ""
    
    # Aggregation
    if agg == "sum":
        expr = f"SUM({column})"
    elif agg == "avg":
        expr = f"AVG({column})"
    else:
        expr = "COUNT(*)"
    
    sql = f"""
    SELECT
        {expr} FILTER (WHERE created_at >= NOW() - INTERVAL '{interval}') AS current,
        {expr} FILTER (
            WHERE created_at < NOW() - INTERVAL '{interval}'
            AND created_at >= NOW() - INTERVAL '{interval}' * 2
        ) AS previous
    FROM df
    {where_clause};
    """
    
    return sql, direction