import re

def clean_sql(sql):
    if not sql:
        return sql
    
    # ----------------------------------------
    # Fix NOW() and CURRENT_TIMESTAMP 
    # to be timezone-naive to match Pandas
    # ----------------------------------------
    sql = sql.replace("NOW()", "LOCALTIMESTAMP")
    sql = sql.replace("CURRENT_TIMESTAMP", "LOCALTIMESTAMP")
    
    # ----------------------------------------
    # Remove markdown (LLM output)
    # ----------------------------------------
    sql = sql.replace("```sql", "").replace("```", "")
    
    # ----------------------------------------
    # Strip spaces
    # ----------------------------------------
    sql = sql.strip()
    
    return sql