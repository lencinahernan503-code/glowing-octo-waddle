from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from core.database import engine, Base
from core.config import settings
from routers import auth, products, orders, shipments, webhooks, admin, reviews, sellers, favorites, messages, offers, subscriptions, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Feriant API", version="1.0.0")

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(shipments.router)
app.include_router(webhooks.router)
app.include_router(admin.router)
app.include_router(reviews.router)
app.include_router(sellers.router)
app.include_router(favorites.router)
app.include_router(messages.router)
app.include_router(offers.router)
app.include_router(subscriptions.router)
app.include_router(notifications.router)


@app.get("/health")
def health():
    return {"status": "ok"}
