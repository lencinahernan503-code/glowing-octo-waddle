from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class SubscriptionStatus(str, enum.Enum):
    active    = "active"
    expired   = "expired"
    cancelled = "cancelled"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    status        = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.active)
    amount        = Column(Float, default=5000.0)
    start_date    = Column(DateTime(timezone=True), server_default=func.now())
    end_date      = Column(DateTime(timezone=True), nullable=False)
    mp_payment_id = Column(String, nullable=True)

    user = relationship("User", back_populates="subscription")
