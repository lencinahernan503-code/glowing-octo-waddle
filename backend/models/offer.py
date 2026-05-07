from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class OfferStatus(str, enum.Enum):
    pending = "pending"       # Esperando respuesta del vendedor
    accepted = "accepted"     # Aceptada
    rejected = "rejected"     # Rechazada
    expired = "expired"       # Expirada (sin respuesta)
    cancelled = "cancelled"   # Cancelada por el comprador


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)
    size = Column(String, nullable=False)
    message = Column(Text, nullable=True)

    status = Column(Enum(OfferStatus), default=OfferStatus.pending)
    seller_note = Column(Text, nullable=True)  # Mensaje del vendedor al responder

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
