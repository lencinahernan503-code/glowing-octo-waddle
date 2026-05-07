import logging
from pathlib import Path
from typing import Any, Optional, Dict, List
from jinja2 import Environment, FileSystemLoader, select_autoescape
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from core.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "email_templates"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)

_mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=bool(settings.MAIL_USERNAME),
    VALIDATE_CERTS=True,
)


def _render(template_name: str, context: Dict[str, Any]) -> str:
    context.setdefault("frontend_url", settings.FRONTEND_URL)
    return _jinja_env.get_template(template_name).render(**context)


async def _send(to_email: str, subject: str, html: str) -> None:
    if not settings.EMAILS_ENABLED:
        logger.info(f"[EMAIL DISABLED] To: {to_email} | Subject: {subject}")
        return

    message = MessageSchema(
        subject=subject,
        recipients=[to_email],
        body=html,
        subtype=MessageType.html,
    )
    fm = FastMail(_mail_config)
    try:
        await fm.send_message(message)
        logger.info(f"Email enviado a {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Error al enviar email a {to_email}: {e}")


# ── Emails públicos ────────────────────────────────────────────────────────

async def send_welcome_email(to_email: str, full_name: str, role: str) -> None:
    html = _render("welcome.html", {
        "subject": "¡Bienvenido/a a TiendaRopa!",
        "full_name": full_name,
        "email": to_email,
        "role": role,
    })
    await _send(to_email, "¡Bienvenido/a a TiendaRopa!", html)


async def send_order_paid_email(
    to_email: str,
    buyer_name: str,
    order_id: int,
    shipping_address: str,
    shipping_city: str,
    items: List[Dict],
    total: float,
) -> None:
    formatted_items = [
        {
            "title": i["title"],
            "size": i["size"],
            "quantity": i["quantity"],
            "subtotal": f"{i['unit_price'] * i['quantity']:,.0f}".replace(",", "."),
        }
        for i in items
    ]
    html = _render("order_paid.html", {
        "subject": f"Pago confirmado – Orden #{order_id}",
        "buyer_name": buyer_name,
        "order_id": order_id,
        "shipping_address": shipping_address,
        "shipping_city": shipping_city,
        "items": formatted_items,
        "total": f"{total:,.0f}".replace(",", "."),
    })
    await _send(to_email, f"✅ Pago confirmado – Orden #{order_id}", html)


async def send_order_shipped_email(
    to_email: str,
    buyer_name: str,
    order_id: int,
    shipping_address: str,
    shipping_city: str,
    carrier: Optional[str],
    tracking_number: Optional[str],
    estimated_delivery: Optional[str],
) -> None:
    html = _render("order_shipped.html", {
        "subject": f"Tu pedido #{order_id} está en camino",
        "buyer_name": buyer_name,
        "order_id": order_id,
        "shipping_address": shipping_address,
        "shipping_city": shipping_city,
        "carrier": carrier,
        "tracking_number": tracking_number,
        "estimated_delivery": estimated_delivery,
    })
    await _send(to_email, f"🚚 Tu pedido #{order_id} está en camino", html)


async def send_order_delivered_email(
    to_email: str,
    buyer_name: str,
    order_id: int,
    carrier: Optional[str],
) -> None:
    html = _render("order_delivered.html", {
        "subject": f"Tu pedido #{order_id} fue entregado",
        "buyer_name": buyer_name,
        "order_id": order_id,
        "carrier": carrier,
    })
    await _send(to_email, f"🎉 Tu pedido #{order_id} fue entregado", html)
