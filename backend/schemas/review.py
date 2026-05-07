from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime


class ReviewCreate(BaseModel):
    product_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    product_id: int
    buyer_id: int
    buyer_name: str
    rating: float
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductRatingSummary(BaseModel):
    average: float
    count: int
    distribution: Dict[int, int]
