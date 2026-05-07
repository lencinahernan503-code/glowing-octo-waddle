from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from models.product import Product
from models.order import Order, OrderStatus
from models.review import Review
from schemas.review import ReviewCreate, ReviewOut, ProductRatingSummary

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _can_review(buyer_id: int, product_id: int, db: Session) -> bool:
    """El comprador solo puede reseñar si tiene una orden entregada con ese producto."""
    return db.query(Order).join(Order.items).filter(
        Order.buyer_id == buyer_id,
        Order.status == OrderStatus.delivered,
        Order.items.any(product_id=product_id),
    ).first() is not None


@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == data.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if not _can_review(current_user.id, data.product_id, db):
        raise HTTPException(
            status_code=403,
            detail="Solo podés reseñar productos que compraste y ya recibiste",
        )

    existing = db.query(Review).filter(
        Review.product_id == data.product_id,
        Review.buyer_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya dejaste una reseña para este producto")

    review = Review(
        product_id=data.product_id,
        buyer_id=current_user.id,
        rating=round(data.rating * 2) / 2,  # Redondeo a 0.5 más cercano
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.get("/product/{product_id}", response_model=List[ReviewOut])
def get_product_reviews(
    product_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_out(r) for r in reviews]


@router.get("/product/{product_id}/summary", response_model=ProductRatingSummary)
def get_rating_summary(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).all()

    if not reviews:
        return ProductRatingSummary(average=0.0, count=0, distribution={5: 0, 4: 0, 3: 0, 2: 0, 1: 0})

    total = sum(r.rating for r in reviews)
    distribution = {star: 0 for star in range(1, 6)}
    for r in reviews:
        star = round(r.rating)
        distribution[star] = distribution.get(star, 0) + 1

    return ProductRatingSummary(
        average=round(total / len(reviews), 1),
        count=len(reviews),
        distribution=distribution,
    )


@router.get("/my-review/{product_id}", response_model=Optional[ReviewOut])
def get_my_review(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(
        Review.product_id == product_id,
        Review.buyer_id == current_user.id,
    ).first()
    return _to_out(review) if review else None


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if review.buyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Sin permisos")
    db.delete(review)
    db.commit()


def _to_out(review: Review) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        buyer_id=review.buyer_id,
        buyer_name=review.buyer.full_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )
