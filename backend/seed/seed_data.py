"""
Seed script: generates payments data, populates business glossary and data catalog.
Run from backend/: python -m seed.seed_data
"""

import sys
import os
import random
import sqlite3

import pandas as pd
from faker import Faker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.database import engine, SessionLocal
from app.core.security import hash_password
from app.models.base import Base
from app.models.user import User
from app.models.business_glossary import BusinessGlossary
from app.models.data_catalog import DataCatalog

fake = Faker()


def generate_payments(n: int = 15000) -> pd.DataFrame:
    data = []
    for _ in range(n):
        data.append({
            "txn_id": fake.uuid4(),
            "user_id": random.randint(1000, 1100),
            "amount": round(random.uniform(10, 1000), 2),
            "status": random.choice(["SUCCESS", "FAILED", "PENDING"]),
            "payment_method": random.choice(["CARD", "UPI", "WALLET"]),
            "country": random.choice(["India", "USA", "UK"]),
            "created_at": fake.date_time_between(start_date="-365d", end_date="now"),
        })
    df = pd.DataFrame(data)
    df["created_at"] = pd.to_datetime(df["created_at"]).dt.tz_localize(None)
    return df


def seed_payments_db():
    settings = get_settings()
    db_path = settings.payments_db_path
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    if os.path.exists(db_path):
        print(f"Payments DB already exists at {db_path}, skipping generation.")
        return

    df = generate_payments(settings.payments_row_count)
    conn = sqlite3.connect(db_path)
    df.to_sql("payments", conn, index=False, if_exists="replace")
    conn.close()
    print(f"Created payments DB with {len(df)} rows at {db_path}")


def seed_admin_user(session):
    existing = session.query(User).filter(User.email == "admin@analytics.local").first()
    if existing:
        print("Admin user already exists.")
        return

    admin = User(
        email="admin@analytics.local",
        hashed_password=hash_password("admin123!"),
        full_name="System Admin",
        role="admin",
    )
    session.add(admin)
    session.commit()
    print("Created admin user: admin@analytics.local / admin123!")


def seed_glossary(session):
    if session.query(BusinessGlossary).count() > 0:
        print("Glossary already seeded.")
        return

    entries = [
        BusinessGlossary(
            term="Revenue",
            definition="Total monetary value of successful transactions",
            sql_expression="SUM(amount) WHERE status='SUCCESS'",
            category="Financial",
            created_by=1,
        ),
        BusinessGlossary(
            term="Transactions",
            definition="Total number of payment transactions",
            sql_expression="COUNT(*)",
            category="Volume",
            created_by=1,
        ),
        BusinessGlossary(
            term="Failures",
            definition="Number of failed payment transactions",
            sql_expression="COUNT(*) WHERE status='FAILED'",
            category="Quality",
            created_by=1,
        ),
        BusinessGlossary(
            term="Average Transaction Value",
            definition="Mean amount per transaction",
            sql_expression="AVG(amount)",
            category="Financial",
            created_by=1,
        ),
        BusinessGlossary(
            term="Success Rate",
            definition="Percentage of transactions that succeeded",
            sql_expression="COUNT(CASE WHEN status='SUCCESS' THEN 1 END) * 100.0 / COUNT(*)",
            category="Quality",
            created_by=1,
        ),
    ]
    session.add_all(entries)
    session.commit()
    print(f"Seeded {len(entries)} glossary entries.")


def seed_catalog(session):
    if session.query(DataCatalog).count() > 0:
        print("Catalog already seeded.")
        return

    columns = [
        DataCatalog(
            table_name="payments",
            column_name="txn_id",
            data_type="VARCHAR",
            description="Unique transaction identifier (UUID)",
            sample_values=["a1b2c3d4-...", "e5f6g7h8-..."],
            is_pii=False,
        ),
        DataCatalog(
            table_name="payments",
            column_name="user_id",
            data_type="INTEGER",
            description="Numeric identifier for the user who initiated the payment",
            sample_values=[1001, 1050, 1099],
            is_pii=True,
        ),
        DataCatalog(
            table_name="payments",
            column_name="amount",
            data_type="FLOAT",
            description="Transaction amount in the local currency",
            sample_values=[10.50, 250.00, 999.99],
            is_pii=False,
        ),
        DataCatalog(
            table_name="payments",
            column_name="status",
            data_type="VARCHAR",
            description="Transaction outcome status",
            sample_values=["SUCCESS", "FAILED", "PENDING"],
            is_pii=False,
        ),
        DataCatalog(
            table_name="payments",
            column_name="payment_method",
            data_type="VARCHAR",
            description="Payment method used for the transaction",
            sample_values=["CARD", "UPI", "WALLET"],
            is_pii=False,
        ),
        DataCatalog(
            table_name="payments",
            column_name="country",
            data_type="VARCHAR",
            description="Country where the transaction originated",
            sample_values=["India", "USA", "UK"],
            is_pii=False,
        ),
        DataCatalog(
            table_name="payments",
            column_name="created_at",
            data_type="TIMESTAMP",
            description="Date and time when the transaction was created",
            sample_values=["2025-06-15 10:30:00", "2026-01-20 14:15:00"],
            is_pii=False,
        ),
    ]
    session.add_all(columns)
    session.commit()
    print(f"Seeded {len(columns)} catalog entries.")


def main():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

    seed_payments_db()

    session = SessionLocal()
    try:
        seed_admin_user(session)
        seed_glossary(session)
        seed_catalog(session)
    finally:
        session.close()

    print("\nSeeding complete!")


if __name__ == "__main__":
    main()
