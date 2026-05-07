from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.shipping import ShipmentStatus


class ShipmentCreate(BaseModel):
    order_id: int
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None


class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    status: Optional[ShipmentStatus] = None
    estimated_delivery: Optional[datetime] = None


class ShipmentOut(BaseModel):
    id: int
    order_id: int
    tracking_number: Optional[str]
    carrier: Optional[str]
    status: ShipmentStatus
    estimated_delivery: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
