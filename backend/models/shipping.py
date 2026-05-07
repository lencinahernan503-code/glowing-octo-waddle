from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class ShipmentStatus(str, enum.Enum):
    pending = "pending"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delivered = "delivered"


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    tracking_number = Column(String, nullable=True)
    carrier = Column(String, nullable=True)  # Correo Argentino, OCA, Andreani...
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.pending)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    order = relationship("Order", back_populates="shipment")
