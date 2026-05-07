from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models.product import ProductCategory, ProductGender


class ProductSizeIn(BaseModel):
    size: str
    stock: int


class ProductSizeOut(ProductSizeIn):
    id: int

    class Config:
        from_attributes = True


class ProductImageOut(BaseModel):
    id: int
    url: str
    is_main: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: ProductCategory
    gender: ProductGender
    brand: Optional[str] = None
    condition: str = "nuevo"
    sizes: List[ProductSizeIn]


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[ProductCategory] = None
    gender: Optional[ProductGender] = None
    brand: Optional[str] = None
    condition: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: int
    seller_id: int
    seller_name: Optional[str] = None
    title: str
    description: Optional[str]
    price: float
    category: ProductCategory
    gender: ProductGender
    brand: Optional[str]
    condition: str
    is_active: bool
    created_at: datetime
    images: List[ProductImageOut] = []
    sizes: List[ProductSizeOut] = []

    class Config:
        from_attributes = True
