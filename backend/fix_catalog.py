import sqlite3
import os

db_path = 'data/analytics.db'
if not os.path.exists(db_path):
    print(f"{db_path} not found!")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("UPDATE data_catalog SET is_pii=0 WHERE column_name='user_id'")
    conn.commit()
    print(f"Updated {cur.rowcount} rows in data_catalog to is_pii=0")
    conn.close()
