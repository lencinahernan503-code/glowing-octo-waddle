from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class ProductCategory(str, enum.Enum):
    remeras = "remeras"
    pantalones = "pantalones"
    vestidos = "vestidos"
    camperas = "camperas"
    buzos = "buzos"
    calzado = "calzado"
    accesorios = "accesorios"
    bijouterie = "bijouterie"
    deportiva = "deportiva"
    interior = "interior"
    otros = "otros"


class ProductGender(str, enum.Enum):
    hombre = "hombre"
    mujer = "mujer"
    unisex = "unisex"
    nino = "nino"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(Enum(ProductCategory), nullable=False)
    gender = Column(Enum(ProductGender), nullable=False)
    brand = Column(String, nullable=True)
    condition = Column(String, default="nuevo")  # nuevo / usado
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seller = relationship("User", back_populates="products")

    @property
    def seller_name(self):
        return self.seller.full_name if self.seller else None
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    sizes = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    url = Column(Text, nullable=False)
    is_main = Column(Boolean, default=False)

    product = relationship("Product", back_populates="images")


class ProductSize(Base):
    __tablename__ = "product_sizes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    size = Column(String, nullable=False)  # XS, S, M, L, XL, 38, 40, etc.
    stock = Column(Integer, default=0)

    product = relationship("Product", back_populates="sizes")
