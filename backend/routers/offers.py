from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from models.product import Product
from models.offer import Offer, OfferStatus
from models.message import Message
from schemas.offer import OfferCreate, OfferRespond, OfferOut

router = APIRouter(prefix="/offers", tags=["offers"])


def _to_out(offer: Offer) -> OfferOut:
    API = "http://localhost:8000"
    img = None
    if offer.product.images:
        main = next((i for i in offer.product.images if i.is_main), offer.product.images[0])
        img = f"{API}{main.url}"
    discount = round((1 - offer.amount / offer.product.price) * 100, 1) if offer.product.price > 0 else 0
    return OfferOut(
        id=offer.id,
        product_id=offer.product_id,
        product_title=offer.product.title,
        product_image=img,
        original_price=offer.product.price,
        buyer_id=offer.buyer_id,
        buyer_name=offer.buyer.full_name,
        seller_id=offer.seller_id,
        seller_name=offer.seller.full_name,
        amount=offer.amount,
        size=offer.size,
        message=offer.message,
        status=offer.status,
        seller_note=offer.seller_note,
        created_at=offer.created_at,
        discount_pct=discount,
    )


@router.post("/", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
def create_offer(
    data: OfferCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == data.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="No podés hacer una oferta en tu propio producto")

    if data.amount >= product.price:
        raise HTTPException(status_code=400, detail="La oferta debe ser menor al precio original")

    # Verificar que el talle existe y tiene stock
    size_obj = next((s for s in product.sizes if s.size == data.size), None)
    if not size_obj:
        raise HTTPException(status_code=400, detail="Talle no disponible")
    if size_obj.stock <= 0:
        raise HTTPException(status_code=400, detail="Sin stock para ese talle")

    offer = Offer(
        product_id=data.product_id,
        buyer_id=current_user.id,
        seller_id=product.seller_id,
        amount=data.amount,
        size=data.size,
        message=data.message,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    # Enviar mensaje automático al vendedor
    msg_text = f"💰 Nueva oferta: ${data.amount:,.0f} por '{product.title}' (talle {data.size})"
    if data.message:
        msg_text += f"\n\"{data.message}\""
    msg = Message(
        sender_id=current_user.id,
        receiver_id=product.seller_id,
        content=msg_text,
        product_id=data.product_id,
    )
    db.add(msg)
    db.commit()

    return _to_out(offer)


@router.get("/my-offers", response_model=List[OfferOut])
def get_my_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offers = db.query(Offer).filter(Offer.buyer_id == current_user.id).order_by(Offer.created_at.desc()).all()
    return [_to_out(o) for o in offers]


@router.get("/received", response_model=List[OfferOut])
def get_received_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offers = db.query(Offer).filter(
        Offer.seller_id == current_user.id,
        Offer.status == OfferStatus.pending,
    ).order_by(Offer.created_at.desc()).all()
    return [_to_out(o) for o in offers]


@router.post("/{offer_id}/respond", response_model=OfferOut)
def respond_offer(
    offer_id: int,
    data: OfferRespond,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    if offer.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if offer.status != OfferStatus.pending:
        raise HTTPException(status_code=400, detail="Esta oferta ya fue respondida")

    if data.status not in (OfferStatus.accepted, OfferStatus.rejected):
        raise HTTPException(status_code=400, detail="Estado inválido")

    offer.status = data.status
    offer.seller_note = data.seller_note
    db.commit()
    db.refresh(offer)

    # Notificar al comprador por mensaje
    if data.status == OfferStatus.accepted:
        msg_text = f"✅ ¡Oferta aceptada! Tu oferta de ${offer.amount:,.0f} por '{offer.product.title}' fue aceptada."
        if data.seller_note:
            msg_text += f"\n{data.seller_note}"
        msg_text += "\nPodés coordinar el pago por este chat."
    else:
        msg_text = f"❌ Tu oferta de ${offer.amount:,.0f} por '{offer.product.title}' fue rechazada."
        if data.seller_note:
            msg_text += f"\n{data.seller_note}"

    msg = Message(
        sender_id=current_user.id,
        receiver_id=offer.buyer_id,
        content=msg_text,
        product_id=offer.product_id,
    )
    db.add(msg)
    db.commit()

    return _to_out(offer)


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    if offer.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if offer.status != OfferStatus.pending:
        raise HTTPException(status_code=400, detail="No se puede cancelar una oferta ya respondida")
    offer.status = OfferStatus.cancelled
    db.commit()
