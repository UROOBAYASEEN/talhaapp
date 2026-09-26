from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings


async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsAllowInvalidCertificates=True)
    from app.models.user import User, OTPRecord
    from app.models.vehicle import VehicleListing, Reservation, TestDrive
    from app.models.chat import Conversation, Message
    from app.models.call import Call
    from app.models.follow import Follow, Notification
    from app.models.save import SavedVehicle
    from app.models.document import UserDocument
    from app.models.transaction import Transaction
    from app.models.ad_promotion import AdPromotion
    from app.models.review import VehicleReview, AdReport, DealerReview
    from app.models.video_ad import VideoAd
    from app.models.banner_ad import BannerAd
    from app.models.ad_analytics import AdAnalytics
    from app.models.dealer_subscription import DealerSubscription
    from app.models.insurance import (
        InsurancePlan, InsuranceClaim, InsuranceApplication,
        InsuranceDocument, InsurancePayment,
    )
    from app.models.tracker_device import TrackerDevice
    from app.models.tracker_booking import TrackerBooking
    from app.models.financing import FinancingBank, FinancingApplication, FinancingDocument
    from app.models.subscription_plan import SubscriptionPlan
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[
            User, OTPRecord, VehicleListing, Reservation, TestDrive,
            Conversation, Message, Call,
            Follow, Notification,
            SavedVehicle,
            UserDocument,
            Transaction,
            AdPromotion,
            VehicleReview, AdReport, DealerReview,
            InsurancePlan, InsuranceClaim, InsuranceApplication,
            InsuranceDocument, InsurancePayment,
            VideoAd,
            BannerAd,
            AdAnalytics,
            DealerSubscription,
            TrackerDevice,
            TrackerBooking,
            FinancingBank, FinancingApplication, FinancingDocument,
            SubscriptionPlan,
        ],
    )
