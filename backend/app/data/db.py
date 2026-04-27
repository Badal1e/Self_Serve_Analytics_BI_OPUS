import sqlite3
import pandas as pd
import os

from data.generate_data import generate_payments_data

DB_PATH = "data/payments.db"
TABLE_NAME = "payments"


def load_or_create_db(n=15000):
    # Check if DB already exists
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql(f"SELECT * FROM {TABLE_NAME}", conn)
        conn.close()
        return df

    # If not, generate and store
    df = generate_payments_data(n)

    conn = sqlite3.connect(DB_PATH)
    df.to_sql(TABLE_NAME, conn, index=False, if_exists="replace")
    conn.close()

    print("Database created and saved to SQLite")

    return df