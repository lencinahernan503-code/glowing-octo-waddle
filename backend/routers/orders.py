from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user, require_seller
from models.user import User
from models.product import Product, ProductSize
from models.order import Order, OrderItem, OrderStatus
from schemas.order import OrderCreate, OrderOut
from routers.notifications import create_notification
import mercadopago
from core.config import settings

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = 0.0
    items_data = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")

        size = db.query(ProductSize).filter(
            ProductSize.product_id == item.product_id,
            ProductSize.size == item.size,
        ).first()
        if not size or size.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para talle {item.size}")

        total += product.price * item.quantity
        items_data.append((product, size, item))

    order = Order(
        buyer_id=current_user.id,
        total=total,
        shipping_address=data.shipping_address,
        shipping_city=data.shipping_city,
        shipping_province=data.shipping_province,
        shipping_zip=data.shipping_zip,
        notes=data.notes,
    )
    db.add(order)
    db.flush()

    for product, size, item in items_data:
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            size=item.size,
            unit_price=product.price,
        ))
        size.stock -= item.quantity

    # Crear preferencia de pago en MercadoPago
    if settings.MERCADOPAGO_ACCESS_TOKEN:
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        preference_data = {
            "items": [
                {
                    "title": f"Orden #{order.id}",
                    "quantity": 1,
                    "unit_price": total,
                    "currency_id": "ARS",
                }
            ],
            "external_reference": str(order.id),
            "back_urls": {
                "success": "http://localhost:3000/checkout/success",
                "failure": "http://localhost:3000/checkout/failure",
            },
            "auto_return": "approved",
        }
        preference = sdk.preference().create(preference_data)
        if preference["status"] == 201:
            order.mp_preference_id = preference["response"]["id"]
    else:
        order.status = OrderStatus.paid

    # Notificar a cada vendedor involucrado
    seller_ids = {product.seller_id for product, _, _ in items_data}
    for seller_id in seller_ids:
        seller_items = [p.title for p, _, _ in items_data if p.seller_id == seller_id]
        create_notification(
            db, seller_id, "sale",
            "¡Nueva venta!",
            f"{current_user.full_name} compró: {', '.join(seller_items)}",
            "/vendedor/ventas",
        )

    db.commit()
    db.refresh(order)
    return order


@router.get("/my-orders", response_model=List[OrderOut])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Order).filter(Order.buyer_id == current_user.id).order_by(Order.created_at.desc()).all()


@router.get("/my-sales", response_model=List[OrderOut])
def my_sales(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .join(Order.items)
        .join(OrderItem.product)
        .filter(Product.seller_id == current_user.id)
        .distinct()
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if order.buyer_id != current_user.id and current_user.role not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Sin acceso a esta orden")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
