from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, vehicles, chat, sellers, notifications, profile, documents, transactions, insurance, ad_promotions, upload, reviews, calls, users as users_router, payments, dealers, video_ads, banner_ads, ad_analytics, trackers, tracker_devices, tracker_bookings, financing, admin, plans, chatbot
from fastapi.staticfiles import StaticFiles
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Autowizor API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(sellers.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(profile.router,       prefix="/api/v1")
app.include_router(documents.router,     prefix="/api/v1")
app.include_router(transactions.router,  prefix="/api/v1")
app.include_router(insurance.router,     prefix="/api/v1")
app.include_router(ad_promotions.router, prefix="/api/v1")
app.include_router(upload.router,        prefix="/api/v1")
app.include_router(reviews.router,       prefix="/api/v1")
app.include_router(calls.router,         prefix="/api/v1")
app.include_router(users_router.router,  prefix="/api/v1")
app.include_router(payments.router,      prefix="/api/v1")
app.include_router(dealers.router,       prefix="/api/v1")
app.include_router(video_ads.router,     prefix="/api/v1")
app.include_router(banner_ads.router,    prefix="/api/v1")
app.include_router(ad_analytics.router,  prefix="/api/v1")
app.include_router(trackers.router,        prefix="/api/v1")
app.include_router(tracker_devices.router,  prefix="/api/v1")
app.include_router(tracker_bookings.router, prefix="/api/v1")
app.include_router(financing.router,        prefix="/api/v1")
app.include_router(admin.router,            prefix="/api/v1")
app.include_router(plans.router,            prefix="/api/v1")
app.include_router(chatbot.router,          prefix="/api/v1")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def health_check():
    return {"status": "ok", "app": "Autowizor API"}
