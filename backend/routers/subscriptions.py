from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from core.database import get_db
from core.deps import get_current_user, require_seller
from models.user import User, UserRole
from models.subscription import Subscription, SubscriptionStatus
from schemas.subscription import SubscriptionOut, SUBSCRIPTION_PRICE, SUBSCRIPTION_DAYS

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def get_active_subscription(user_id: int, db: Session):
    return db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == SubscriptionStatus.active,
        Subscription.end_date > datetime.now(timezone.utc),
    ).first()


@router.get("/my-subscription")
def my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        return {"active": False, "subscription": None}

    active = (
        sub.status == SubscriptionStatus.active
        and sub.end_date > datetime.now(timezone.utc)
    )
    return {"active": active, "subscription": SubscriptionOut.model_validate(sub)}


@router.post("/subscribe", response_model=SubscriptionOut)
def subscribe(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Promote buyer to seller automatically when subscribing
    if current_user.role == UserRole.buyer:
        current_user.role = UserRole.seller

    existing = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()

    if existing:
        # Renovar: si ya expiró empieza hoy, si está activa extiende desde end_date
        base = existing.end_date if (
            existing.status == SubscriptionStatus.active
            and existing.end_date > now
        ) else now
        existing.status   = SubscriptionStatus.active
        existing.start_date = now
        existing.end_date = base + timedelta(days=SUBSCRIPTION_DAYS)
        existing.amount   = SUBSCRIPTION_PRICE
        db.commit()
        db.refresh(existing)
        return existing

    sub = Subscription(
        user_id    = current_user.id,
        status     = SubscriptionStatus.active,
        amount     = SUBSCRIPTION_PRICE,
        start_date = now,
        end_date   = now + timedelta(days=SUBSCRIPTION_DAYS),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub or sub.status != SubscriptionStatus.active:
        raise HTTPException(status_code=404, detail="No tenés una suscripción activa")
    sub.status = SubscriptionStatus.cancelled
    db.commit()
    return {"detail": "Suscripción cancelada"}
