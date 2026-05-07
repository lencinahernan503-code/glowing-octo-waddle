from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.subscription import SubscriptionStatus

SUBSCRIPTION_PRICE = 5000.0
SUBSCRIPTION_DAYS  = 30


class SubscriptionOut(BaseModel):
    id:            int
    status:        SubscriptionStatus
    amount:        float
    start_date:    datetime
    end_date:      datetime

    class Config:
        from_attributes = True
