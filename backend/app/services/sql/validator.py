# ============================================
# SQL VALIDATION + CORRECTION
# ============================================
 
def validate_and_fix_sql(sql, query):
    
    q = query.lower()
    s = sql.lower()
    
    # ----------------------------------------
    # Revenue Fix
    # ----------------------------------------
    if "revenue" in q:
        if "sum(amount)" not in s:
            # force fix
            sql = "SELECT SUM(amount) as revenue FROM df WHERE status='SUCCESS';"
    
    # ----------------------------------------
    # Transactions Fix
    # ----------------------------------------
    if "transaction" in q:
        if "count" not in s:
            sql = "SELECT COUNT(*) as transactions FROM df;"
    
    # ----------------------------------------
    # Prevent dangerous SQL
    # ----------------------------------------
    forbidden = ["insert", "update", "delete", "drop"]
    
    for word in forbidden:
        if word in s:
            raise ValueError("Unsafe SQL detected")
    
    return sql
 