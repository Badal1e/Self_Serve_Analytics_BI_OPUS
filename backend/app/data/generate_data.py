import pandas as pd
import random
from faker import Faker
 
fake = Faker()
 
def generate_payments_data(n=10000):
    data = []
    
    for _ in range(n):
        data.append([
            fake.uuid4(),
            random.randint(1000, 1100),
            round(random.uniform(10, 1000), 2),
            random.choice(["SUCCESS", "FAILED", "PENDING"]),
            random.choice(["CARD", "UPI", "WALLET"]),
            random.choice(["India", "USA", "UK"]),
            fake.date_time_between(start_date='-365d', end_date='now')
        ])
    
    df = pd.DataFrame(data, columns=[
        "txn_id", "user_id", "amount", "status",
        "payment_method", "country", "created_at"
    ])
    
    df["created_at"] = pd.to_datetime(df["created_at"]).dt.tz_localize(None)
    
    return df