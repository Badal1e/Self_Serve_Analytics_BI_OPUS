import logging
import sqlite3
import os
from typing import Optional, Tuple

import duckdb
import pandas as pd

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_cached_df: Optional[pd.DataFrame] = None


def _load_payments_df() -> pd.DataFrame:
    global _cached_df
    if _cached_df is not None:
        return _cached_df

    settings = get_settings()
    db_path = settings.payments_db_path

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        _cached_df = pd.read_sql("SELECT * FROM payments", conn)
        conn.close()
    else:
        from seed.seed_data import generate_payments
        _cached_df = generate_payments(settings.payments_row_count)

    _cached_df["created_at"] = pd.to_datetime(_cached_df["created_at"]).dt.tz_localize(None)
    logger.info("Loaded payments DataFrame with %d rows", len(_cached_df))
    return _cached_df


class SQLExecutionService:
    def execute(self, sql: str) -> Tuple[Optional[pd.DataFrame], bool]:
        df = _load_payments_df()
        con = duckdb.connect()
        try:
            con.register("df", df)
            result = con.execute(sql).fetchdf()
            logger.debug("SQL executed successfully, %d rows returned", len(result))
            return result, True
        except Exception as e:
            logger.warning("SQL execution failed: %s | Query: %s", e, sql[:200])
            return None, False
        finally:
            con.close()
