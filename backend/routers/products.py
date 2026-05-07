from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Literal
from datetime import datetime, timezone
import os, shutil, uuid
from core.database import get_db
from core.deps import get_current_user, require_seller
from core.config import settings
from models.user import User, UserRole
from models.product import Product, ProductImage, ProductSize, ProductCategory, ProductGender
from models.subscription import Subscription, SubscriptionStatus
from models.review import Review
from schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[ProductOut])
def list_products(
    category: Optional[ProductCategory] = None,
    gender: Optional[ProductGender] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    size: Optional[str] = None,
    condition: Optional[str] = None,
    brand: Optional[str] = None,
    sort: Optional[Literal["price_asc", "price_desc", "newest", "rating"]] = "newest",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if gender:
        query = query.filter(Product.gender == gender)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(
            Product.title.ilike(f"%{search}%") | Product.brand.ilike(f"%{search}%")
        )
    if condition:
        query = query.filter(Product.condition == condition)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if size:
        query = query.join(Product.sizes).filter(
            ProductSize.size.ilike(size),
            ProductSize.stock > 0,
        )

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        avg_rating = (
            db.query(Review.product_id, func.avg(Review.rating).label("avg"))
            .group_by(Review.product_id)
            .subquery()
        )
        query = query.outerjoin(avg_rating, Product.id == avg_rating.c.product_id)
        query = query.order_by(avg_rating.c.avg.desc().nullslast())
    else:
        query = query.order_by(Product.created_at.desc())

    return query.distinct().offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        sub = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.end_date > datetime.now(timezone.utc),
        ).first()
        if not sub:
            raise HTTPException(
                status_code=402,
                detail="Necesitás una suscripción activa para publicar productos"
            )

    product = Product(
        seller_id=current_user.id,
        title=data.title,
        description=data.description,
        price=data.price,
        category=data.category,
        gender=data.gender,
        brand=data.brand,
        condition=data.condition,
    )
    db.add(product)
    db.flush()

    for s in data.sizes:
        db.add(ProductSize(product_id=product.id, size=s.size, stock=s.stock))

    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/images", response_model=ProductOut)
def upload_images(
    product_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.seller_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    is_first = len(product.images) == 0

    for i, file in enumerate(files):
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join(settings.UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        db.add(ProductImage(
            product_id=product.id,
            url=f"/uploads/{filename}",
            is_main=(is_first and i == 0),
        ))

    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.seller_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.seller_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.is_active = False
    db.commit()


@router.get("/seller/my-products", response_model=List[ProductOut])
def my_products(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    return db.query(Product).filter(Product.seller_id == current_user.id).all()
