from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.buyer, nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)

    # Solo para vendedores
    store_name = Column(String, nullable=True)
    store_description = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="buyer")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
