from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from core.database import get_db
from core.deps import require_admin
from models.user import User, UserRole
from models.product import Product
from models.order import Order, OrderStatus
from models.shipping import Shipment
from schemas.user import UserOut
from schemas.product import ProductOut
from schemas.order import OrderOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/bootstrap-admin")
def bootstrap_admin(user_id: int, db: Session = Depends(get_db)):
    """Make first admin. Only works if no admin exists yet."""
    existing_admin = db.query(User).filter(User.role == UserRole.admin).first()
    if existing_admin:
        raise HTTPException(status_code=403, detail="Ya existe un administrador")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = UserRole.admin
    db.commit()
    return {"detail": "Usuario promovido a administrador", "id": user.id, "email": user.email}


# ── Dashboard ──────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_sellers = db.query(func.count(User.id)).filter(User.role == UserRole.seller).scalar()
    total_buyers = db.query(func.count(User.id)).filter(User.role == UserRole.buyer).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()

    revenue_result = db.query(func.sum(Order.total)).filter(
        Order.status.in_([OrderStatus.paid, OrderStatus.preparing, OrderStatus.shipped, OrderStatus.delivered])
    ).scalar()
    total_revenue = float(revenue_result or 0)

    orders_by_status = (
        db.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )

    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "users": {"total": total_users, "sellers": total_sellers, "buyers": total_buyers},
        "products": {"active": total_products},
        "orders": {
            "total": total_orders,
            "by_status": {s.value: c for s, c in orders_by_status},
        },
        "revenue": total_revenue,
        "recent_orders": [
            {
                "id": o.id,
                "buyer": o.buyer.full_name,
                "total": o.total,
                "status": o.status,
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders
        ],
    }


# ── Usuarios ───────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    new_role: UserRole,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = new_role
    db.commit()
    return {"id": user.id, "role": user.role}


# ── Productos ──────────────────────────────────────────────────────────────

@router.get("/products", response_model=List[ProductOut])
def list_all_products(
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if search:
        query = query.filter(Product.title.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    return query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/products/{product_id}/toggle-active", response_model=ProductOut)
def toggle_product_active(
    product_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)
    return product


# ── Órdenes ────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=List[OrderOut])
def list_all_orders(
    status: Optional[OrderStatus] = None,
    skip: int = 0,
    limit: int = 50,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def admin_update_order_status(
    order_id: int,
    new_status: OrderStatus,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
