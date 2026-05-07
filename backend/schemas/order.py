from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.order import OrderStatus


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int
    size: str


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    shipping_address: str
    shipping_city: str
    shipping_province: str
    shipping_zip: str
    notes: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    size: str
    unit_price: float
    product_title: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    buyer_id: int
    status: OrderStatus
    total: float
    shipping_address: str
    shipping_city: str
    shipping_province: str
    shipping_zip: str
    mp_preference_id: Optional[str]
    notes: Optional[str]
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
