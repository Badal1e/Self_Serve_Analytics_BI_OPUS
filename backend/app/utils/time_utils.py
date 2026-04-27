import re
from datetime import datetime, timedelta
 
# TIME FILTER FIXER (DuckDB SAFE)

def fix_time_filters(sql):
    
    if not sql:
        return sql
    
    sql = sql.replace("NOW()", "CURRENT_TIMESTAMP")
    sql = sql.replace("INTERVAL 30 DAY", "INTERVAL '30 days'")
    sql = sql.replace("INTERVAL 7 DAY", "INTERVAL '7 days'")
    
    return sql