from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from models.product import Product
from models.favorite import Favorite
from schemas.product import ProductOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{product_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Product).filter(Product.id == product_id, Product.is_active == True).first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id,
    ).first()
    if existing:
        return {"message": "Ya está en favoritos"}

    db.add(Favorite(user_id=current_user.id, product_id=product_id))
    db.commit()
    return {"message": "Agregado a favoritos"}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id,
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="No está en favoritos")
    db.delete(fav)
    db.commit()


@router.get("/", response_model=List[ProductOut])
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favs = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return [f.product for f in favs if f.product.is_active]


@router.get("/ids", response_model=List[int])
def get_favorite_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """IDs de productos favoritos del usuario — para marcar el ícono sin cargar todo."""
    favs = db.query(Favorite.product_id).filter(Favorite.user_id == current_user.id).all()
    return [f.product_id for f in favs]
