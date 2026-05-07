from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"           # Esperando pago
    paid = "paid"                 # Pagado
    preparing = "preparing"       # Vendedor preparando envío
    shipped = "shipped"           # Enviado
    delivered = "delivered"       # Entregado
    cancelled = "cancelled"       # Cancelado


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    total = Column(Float, nullable=False)

    # Dirección de envío
    shipping_address = Column(String, nullable=False)
    shipping_city = Column(String, nullable=False)
    shipping_province = Column(String, nullable=False)
    shipping_zip = Column(String, nullable=False)

    # Pago MercadoPago
    mp_preference_id = Column(String, nullable=True)
    mp_payment_id = Column(String, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    buyer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    size = Column(String, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    @property
    def product_title(self):
        return self.product.title if self.product else None
