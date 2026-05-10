from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from models.message import Message
from models.product import Product
from routers.notifications import create_notification
from pydantic import BaseModel

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageSend(BaseModel):
    receiver_id: int
    content: str
    product_id: Optional[int] = None


class MessageOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    receiver_id: int
    receiver_name: str
    product_id: Optional[int]
    product_title: Optional[str]
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    other_user_id: int
    other_user_name: str
    product_id: Optional[int]
    product_title: Optional[str]
    last_message: str
    last_message_at: datetime
    unread_count: int


def _msg_to_out(m: Message) -> MessageOut:
    return MessageOut(
        id=m.id,
        sender_id=m.sender_id,
        sender_name=m.sender.full_name,
        receiver_id=m.receiver_id,
        receiver_name=m.receiver.full_name,
        product_id=m.product_id,
        product_title=m.product.title if m.product else None,
        content=m.content,
        is_read=m.is_read,
        created_at=m.created_at,
    )


@router.post("/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    data: MessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="No podés enviarte mensajes a vos mismo")

    receiver = db.query(User).filter(User.id == data.receiver_id, User.is_active == True).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        product_id=data.product_id,
        content=data.content.strip(),
    )
    db.add(msg)
    db.flush()
    create_notification(
        db, data.receiver_id, "message",
        f"Nuevo mensaje de {current_user.full_name}",
        data.content[:80],
        f"/mensajes/{current_user.id}",
    )
    db.commit()
    db.refresh(msg)
    return _msg_to_out(msg)


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista de conversaciones únicas agrupadas por el otro usuario y producto."""
    messages = (
        db.query(Message)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc())
        .all()
    )

    seen = set()
    conversations = []
    for m in messages:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        key = (other_id, m.product_id)
        if key in seen:
            continue
        seen.add(key)

        other = m.receiver if m.sender_id == current_user.id else m.sender
        unread = db.query(func.count(Message.id)).filter(
            Message.sender_id == other_id,
            Message.receiver_id == current_user.id,
            Message.product_id == m.product_id,
            Message.is_read == False,
        ).scalar() or 0

        conversations.append(ConversationOut(
            other_user_id=other_id,
            other_user_name=other.full_name,
            product_id=m.product_id,
            product_title=m.product.title if m.product else None,
            last_message=m.content[:80],
            last_message_at=m.created_at,
            unread_count=unread,
        ))

    return conversations


@router.get("/with/{other_user_id}", response_model=List[MessageOut])
def get_conversation(
    other_user_id: int,
    product_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
        )
    )
    if product_id:
        query = query.filter(Message.product_id == product_id)

    messages = query.order_by(Message.created_at.asc()).all()

    # Marcar como leídos los mensajes del otro usuario
    for m in messages:
        if m.receiver_id == current_user.id and not m.is_read:
            m.is_read = True
    db.commit()

    return [_msg_to_out(m) for m in messages]


@router.get("/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(func.count(Message.id)).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).scalar() or 0
    return {"count": count}
