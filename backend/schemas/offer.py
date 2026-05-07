from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models.offer import OfferStatus


class OfferCreate(BaseModel):
    product_id: int
    amount: float = Field(..., gt=0)
    size: str
    message: Optional[str] = None


class OfferRespond(BaseModel):
    status: OfferStatus  # accepted o rejected
    seller_note: Optional[str] = None


class OfferOut(BaseModel):
    id: int
    product_id: int
    product_title: str
    product_image: Optional[str]
    original_price: float
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    amount: float
    size: str
    message: Optional[str]
    status: OfferStatus
    seller_note: Optional[str]
    created_at: datetime
    discount_pct: float  # porcentaje de descuento vs precio original

    class Config:
        from_attributes = True
