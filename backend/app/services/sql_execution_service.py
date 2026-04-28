import logging
import sqlite3
import os
from typing import Optional, Tuple

import duckdb
import pandas as pd

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_cached_users: Optional[pd.DataFrame] = None
_cached_payments: Optional[pd.DataFrame] = None


def _load_dataframes() -> Tuple[pd.DataFrame, pd.DataFrame]:
    global _cached_users, _cached_payments
    if _cached_users is not None and _cached_payments is not None:
        return _cached_users, _cached_payments

    settings = get_settings()
    db_path = settings.payments_db_path

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        _cached_users = pd.read_sql("SELECT * FROM users", conn)
        _cached_payments = pd.read_sql("SELECT * FROM payments", conn)
        conn.close()
    else:
        # Fallback if DB doesn't exist yet
        from seed.seed_data import generate_users, generate_payments
        _cached_users = generate_users(1000)
        _cached_payments = generate_payments(_cached_users, settings.payments_row_count)

    # Normalize datetimes for duckdb
    _cached_users["signup_date"] = pd.to_datetime(_cached_users["signup_date"]).dt.tz_localize(None)
    _cached_payments["created_at"] = pd.to_datetime(_cached_payments["created_at"]).dt.tz_localize(None)
    
    logger.info("Loaded DataFrames: %d users, %d payments", len(_cached_users), len(_cached_payments))
    return _cached_users, _cached_payments


class SQLExecutionService:
    def execute(self, sql: str) -> Tuple[Optional[pd.DataFrame], bool]:
        users, payments = _load_dataframes()
        con = duckdb.connect()
        try:
            # Register both tables
            con.register("users", users)
            con.register("payments", payments)
            
            result = con.execute(sql).fetchdf()
            logger.debug("SQL executed successfully, %d rows returned", len(result))
            return result, True
        except Exception as e:
            logger.warning("SQL execution failed: %s | Query: %s", e, sql[:200])
            return None, False
        finally:
            con.close()
