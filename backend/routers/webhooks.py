from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.order import Order, OrderStatus
from utils.email_service import send_order_paid_email
import mercadopago
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _notify_paid(order: Order) -> None:
    """Lanza el email de pago confirmado en background."""
    import asyncio
    items = [
        {
            "title": item.product.title,
            "size": item.size,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in order.items
    ]
    asyncio.create_task(
        send_order_paid_email(
            to_email=order.buyer.email,
            buyer_name=order.buyer.full_name,
            order_id=order.id,
            shipping_address=order.shipping_address,
            shipping_city=order.shipping_city,
            items=items,
            total=order.total,
        )
    )


@router.post("/mercadopago")
async def mercadopago_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    body = await request.json()
    logger.info(f"MP webhook: {body}")

    if body.get("type") != "payment":
        return {"status": "ignored"}

    payment_id = str(body.get("data", {}).get("id", ""))
    if not payment_id or not settings.MERCADOPAGO_ACCESS_TOKEN:
        return {"status": "ignored"}

    sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
    payment_info = sdk.payment().get(payment_id)

    if payment_info["status"] != 200:
        raise HTTPException(status_code=400, detail="No se pudo verificar el pago")

    payment = payment_info["response"]
    order_id = payment.get("external_reference")
    payment_status = payment.get("status")

    if not order_id:
        return {"status": "no_reference"}

    order = db.query(Order).filter(Order.id == int(order_id)).first()
    if not order:
        logger.warning(f"Orden {order_id} no encontrada")
        return {"status": "order_not_found"}

    if payment_status == "approved":
        order.status = OrderStatus.paid
        order.mp_payment_id = payment_id
        db.commit()
        db.refresh(order)
        logger.info(f"Orden {order_id} marcada como pagada")

        items = [
            {
                "title": item.product.title,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in order.items
        ]
        background_tasks.add_task(
            send_order_paid_email,
            order.buyer.email,
            order.buyer.full_name,
            order.id,
            order.shipping_address,
            order.shipping_city,
            items,
            order.total,
        )

    elif payment_status == "rejected":
        order.status = OrderStatus.cancelled
        db.commit()
        logger.info(f"Orden {order_id} cancelada por pago rechazado")

    return {"status": "ok"}


@router.get("/checkout/success")
async def checkout_success(
    payment_id: str = "",
    external_reference: str = "",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """MP redirige acá después de un pago exitoso (back_url)."""
    if external_reference:
        order = db.query(Order).filter(Order.id == int(external_reference)).first()
        if order and order.status == OrderStatus.pending:
            order.status = OrderStatus.paid
            if payment_id:
                order.mp_payment_id = payment_id
            db.commit()
            db.refresh(order)

            items = [
                {
                    "title": item.product.title,
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                }
                for item in order.items
            ]
            background_tasks.add_task(
                send_order_paid_email,
                order.buyer.email,
                order.buyer.full_name,
                order.id,
                order.shipping_address,
                order.shipping_city,
                items,
                order.total,
            )

    return {"status": "ok", "order_id": external_reference}
