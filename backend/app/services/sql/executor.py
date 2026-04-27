def execute_sql(query, df):
    import duckdb
    import pandas as pd
    
    con = duckdb.connect()
    
    # FIX : normalize datetime (REMOVE timezone issues)
    df["created_at"] = pd.to_datetime(df["created_at"]).dt.tz_localize(None)
    
    con.register("df", df)
    
    try:
        result = con.execute(query).fetchdf()
        print("EXECUTION SUCCESS")
        return result, True
    
    except Exception as e:
        print("SQL ERROR:", e)
        print("FAILED QUERY:", query)  # IMPORTANT DEBUG
        return None, False
 