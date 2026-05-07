from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user, require_seller
from models.user import User
from models.order import Order, OrderStatus
from models.shipping import Shipment, ShipmentStatus
from schemas.shipping import ShipmentCreate, ShipmentUpdate, ShipmentOut
from utils.email_service import send_order_shipped_email, send_order_delivered_email

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.post("/", response_model=ShipmentOut, status_code=status.HTTP_201_CREATED)
def create_shipment(
    data: ShipmentCreate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Verificar que el vendedor tenga productos en esa orden
    seller_product_ids = {p.id for p in current_user.products}
    order_product_ids = {item.product_id for item in order.items}
    if not seller_product_ids & order_product_ids and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tenés acceso a esta orden")

    if order.shipment:
        raise HTTPException(status_code=400, detail="Esta orden ya tiene envío registrado")

    shipment = Shipment(
        order_id=data.order_id,
        carrier=data.carrier,
        tracking_number=data.tracking_number,
        estimated_delivery=data.estimated_delivery,
    )
    db.add(shipment)

    order.status = OrderStatus.preparing
    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch("/{shipment_id}", response_model=ShipmentOut)
async def update_shipment(
    shipment_id: int,
    data: ShipmentUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Envío no encontrado")

    prev_status = shipment.status
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(shipment, field, value)

    # Sincronizar estado de la orden con el del envío
    status_map = {
        ShipmentStatus.dispatched: OrderStatus.shipped,
        ShipmentStatus.in_transit: OrderStatus.shipped,
        ShipmentStatus.delivered: OrderStatus.delivered,
    }
    if data.status and data.status in status_map:
        shipment.order.status = status_map[data.status]

    db.commit()
    db.refresh(shipment)

    # Notificar al comprador según el nuevo estado
    order = shipment.order
    buyer = order.buyer

    if data.status == ShipmentStatus.dispatched and prev_status != ShipmentStatus.dispatched:
        estimated = None
        if shipment.estimated_delivery:
            estimated = shipment.estimated_delivery.strftime("%-d de %B")
        background_tasks.add_task(
            send_order_shipped_email,
            buyer.email,
            buyer.full_name,
            order.id,
            order.shipping_address,
            order.shipping_city,
            shipment.carrier,
            shipment.tracking_number,
            estimated,
        )

    elif data.status == ShipmentStatus.delivered and prev_status != ShipmentStatus.delivered:
        background_tasks.add_task(
            send_order_delivered_email,
            buyer.email,
            buyer.full_name,
            order.id,
            shipment.carrier,
        )

    return shipment


@router.get("/order/{order_id}", response_model=ShipmentOut)
def get_shipment_by_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if order.buyer_id != current_user.id and current_user.role not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Sin acceso")

    if not order.shipment:
        raise HTTPException(status_code=404, detail="Esta orden aún no tiene envío registrado")

    return order.shipment


@router.get("/seller/pending", response_model=List[dict])
def seller_pending_orders(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """Órdenes pagas que el vendedor debe despachar."""
    seller_product_ids = {p.id for p in current_user.products}

    paid_orders = (
        db.query(Order)
        .filter(Order.status.in_([OrderStatus.paid, OrderStatus.preparing]))
        .all()
    )

    result = []
    for order in paid_orders:
        order_product_ids = {item.product_id for item in order.items}
        if seller_product_ids & order_product_ids:
            items_for_seller = [
                {
                    "product_id": item.product_id,
                    "product_title": item.product.title,
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                }
                for item in order.items
                if item.product_id in seller_product_ids
            ]
            result.append({
                "order_id": order.id,
                "status": order.status,
                "buyer_name": order.buyer.full_name,
                "shipping_address": order.shipping_address,
                "shipping_city": order.shipping_city,
                "shipping_province": order.shipping_province,
                "shipping_zip": order.shipping_zip,
                "total": order.total,
                "created_at": order.created_at.isoformat(),
                "has_shipment": order.shipment is not None,
                "shipment": {
                    "id": order.shipment.id,
                    "status": order.shipment.status,
                    "carrier": order.shipment.carrier,
                    "tracking_number": order.shipment.tracking_number,
                } if order.shipment else None,
                "items": items_for_seller,
            })

    return result
