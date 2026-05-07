from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from core.database import get_db
from models.user import User, UserRole
from models.product import Product
from models.review import Review
from models.order import Order, OrderStatus
from schemas.product import ProductOut

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("/{seller_id}")
def get_seller_profile(seller_id: int, db: Session = Depends(get_db)):
    seller = db.query(User).filter(
        User.id == seller_id,
        User.role == UserRole.seller,
        User.is_active == True,
    ).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")

    products = (
        db.query(Product)
        .filter(Product.seller_id == seller_id, Product.is_active == True)
        .order_by(Product.created_at.desc())
        .all()
    )

    # Promedio de reseñas de todos sus productos
    avg_result = (
        db.query(func.avg(Review.rating))
        .join(Product, Review.product_id == Product.id)
        .filter(Product.seller_id == seller_id)
        .scalar()
    )
    review_count = (
        db.query(func.count(Review.id))
        .join(Product, Review.product_id == Product.id)
        .filter(Product.seller_id == seller_id)
        .scalar()
    )

    # Ventas completadas
    sales_count = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.delivered)
        .join(Order.items)
        .join(Product, Product.id == Order.items.property.mapper.class_.product_id)
        .filter(Product.seller_id == seller_id)
        .scalar()
    ) or 0

    return {
        "id": seller.id,
        "store_name": seller.store_name or seller.full_name,
        "store_description": seller.store_description,
        "avatar_url": seller.avatar_url,
        "member_since": seller.created_at.isoformat(),
        "rating": round(float(avg_result), 1) if avg_result else None,
        "review_count": review_count or 0,
        "sales_count": sales_count,
        "products_count": len(products),
        "products": [ProductOut.model_validate(p) for p in products],
    }


@router.get("/", response_model=List[dict])
def list_sellers(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    sellers = (
        db.query(User)
        .filter(User.role == UserRole.seller, User.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "store_name": s.store_name or s.full_name,
            "store_description": s.store_description,
            "avatar_url": s.avatar_url,
            "products_count": len([p for p in s.products if p.is_active]),
        }
        for s in sellers
    ]
