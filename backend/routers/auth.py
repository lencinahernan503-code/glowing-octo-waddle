from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
import os, uuid
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token
from core.deps import get_current_user
from core.config import settings
from models.user import User, UserRole
from schemas.user import UserCreate, UserLogin, UserOut, Token, BecomeSeller
from utils.email_service import send_welcome_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        store_name=data.store_name,
        store_description=data.store_description,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    background_tasks.add_task(send_welcome_email, user.email, user.full_name, user.role.value)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/become-seller", response_model=Token)
def become_seller(
    data: BecomeSeller,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.buyer:
        raise HTTPException(status_code=400, detail="Solo compradores pueden convertirse en vendedores")
    if not data.store_name.strip():
        raise HTTPException(status_code=400, detail="El nombre de la tienda es obligatorio")

    current_user.role = UserRole.seller
    current_user.store_name = data.store_name.strip()
    current_user.store_description = data.store_description
    db.commit()
    db.refresh(current_user)

    token = create_access_token({"sub": str(current_user.id), "role": current_user.role})
    return Token(access_token=token, user=UserOut.model_validate(current_user))


@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes JPG, PNG o WebP")
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    contents = await file.read()
    if len(contents) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Imagen demasiado grande (máx {settings.MAX_IMAGE_SIZE_MB}MB)")
    with open(path, "wb") as f:
        f.write(contents)
    current_user.avatar_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserOut.model_validate(user))
