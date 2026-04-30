"""
Seed script: generates users and payments data, populates business glossary and data catalog.
Run from backend/: python -m seed.seed_data
"""

import sys
import os
import random
import sqlite3

import numpy as np
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


def generate_users(n: int = 1000) -> pd.DataFrame:
    data = []
    for i in range(1, n + 1):
        tier = random.choices(["Free", "Pro", "Enterprise"], weights=[70, 25, 5])[0]
        data.append({
            "user_id": i,
            "subscription_tier": tier,
            "industry": random.choice(["Retail", "Tech", "Healthcare", "Finance", "Education"]),
            "signup_date": fake.date_time_between(start_date="-730d", end_date="-365d"),
            "country": random.choices(["USA", "India", "UK", "Canada"], weights=[50, 30, 10, 10])[0]
        })
    df = pd.DataFrame(data)
    df["signup_date"] = pd.to_datetime(df["signup_date"]).dt.tz_localize(None)
    return df


def generate_payments(users_df: pd.DataFrame, n: int = 15000) -> pd.DataFrame:
    data = []
    user_ids = users_df["user_id"].tolist()

    mu, sigma = 3.0, 1.0
    amounts = np.random.lognormal(mu, sigma, n)
    amounts = np.clip(amounts, 5.0, 5000.0)

    for i in range(n):
        status = random.choices(["SUCCESS", "FAILED", "PENDING"], weights=[88, 10, 2])[0]

        created_at = fake.date_time_between(start_date="-365d", end_date="now")
        if created_at.weekday() >= 5 and random.random() < 0.2:
            status = "FAILED"

        data.append({
            "txn_id": fake.uuid4(),
            "user_id": random.choice(user_ids),
            "amount": round(float(amounts[i]), 2),
            "status": status,
            "payment_method": random.choices(
                ["CARD", "UPI", "WALLET", "BANK_TRANSFER"],
                weights=[60, 20, 10, 10]
            )[0],
            "created_at": created_at,
        })

    df = pd.DataFrame(data)
    df["created_at"] = pd.to_datetime(df["created_at"]).dt.tz_localize(None)
    return df


def seed_analytics_db():
    settings = get_settings()
    db_path = settings.payments_db_path
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    users_df = generate_users(1000)
    payments_df = generate_payments(users_df, settings.payments_row_count)

    conn = sqlite3.connect(db_path)
    users_df.to_sql("users", conn, index=False, if_exists="replace")
    payments_df.to_sql("payments", conn, index=False, if_exists="replace")
    conn.close()

    print(f"Created Analytics DB with {len(users_df)} users and {len(payments_df)} payments at {db_path}")


def seed_admin_user(session):
    existing = session.query(User).filter(User.email == "admin@analytics.com").first()
    if existing:
        print("Admin user already exists.")
        return

    admin = User(
        email="admin@analytics.com",
        hashed_password=hash_password("admin123!"),
        full_name="System Admin",
        role="admin",
    )
    session.add(admin)
    session.commit()
    print("Created admin user: admin@analytics.com / admin123!")


def seed_glossary(session):
    if session.query(BusinessGlossary).count() > 0:
        session.query(BusinessGlossary).delete()
        session.commit()

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
            term="Pro Users",
            definition="Users who are subscribed to the Pro tier",
            sql_expression="subscription_tier = 'Pro'",
            category="Users",
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
        session.query(DataCatalog).delete()
        session.commit()

    columns = [
        DataCatalog(
            table_name="users", column_name="user_id", data_type="INTEGER",
            description="Numeric identifier for the user", sample_values=[1001, 1050], is_pii=False,
        ),
        DataCatalog(
            table_name="users", column_name="subscription_tier", data_type="VARCHAR",
            description="The pricing tier the user is on", sample_values=["Free", "Pro", "Enterprise"], is_pii=False,
        ),
        DataCatalog(
            table_name="users", column_name="industry", data_type="VARCHAR",
            description="The business sector of the user", sample_values=["Tech", "Retail", "Healthcare"], is_pii=False,
        ),
        DataCatalog(
            table_name="users", column_name="signup_date", data_type="TIMESTAMP",
            description="When the user joined", sample_values=["2025-01-01 10:00:00"], is_pii=False,
        ),
        DataCatalog(
            table_name="users", column_name="country", data_type="VARCHAR",
            description="Country where the user is based", sample_values=["USA", "India"], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="txn_id", data_type="VARCHAR",
            description="Unique transaction identifier (UUID)", sample_values=["a1b2c3d4-..."], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="user_id", data_type="INTEGER",
            description="Numeric identifier for the user who initiated the payment", sample_values=[1001, 1050], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="amount", data_type="FLOAT",
            description="Transaction amount in the local currency", sample_values=[10.50, 250.00], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="status", data_type="VARCHAR",
            description="Transaction outcome status", sample_values=["SUCCESS", "FAILED", "PENDING"], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="payment_method", data_type="VARCHAR",
            description="Payment method used", sample_values=["CARD", "UPI", "WALLET", "BANK_TRANSFER"], is_pii=False,
        ),
        DataCatalog(
            table_name="payments", column_name="created_at", data_type="TIMESTAMP",
            description="Date and time when the transaction was created", sample_values=["2025-06-15 10:30:00"], is_pii=False,
        ),
    ]
    session.add_all(columns)
    session.commit()
    print(f"Seeded {len(columns)} catalog entries.")


def main():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

    seed_analytics_db()

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