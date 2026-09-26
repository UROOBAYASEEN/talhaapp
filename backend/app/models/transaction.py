import enum
from datetime import datetime
from beanie import Document
from pydantic import Field


class TransactionStatus(str, enum.Enum):
    pending  = "Pending"
    success  = "Success"
    failed   = "Failed"
    refunded = "Refunded"


class Transaction(Document):
    user_id:    str
    initials:   str
    title:      str
    subtitle:   str
    amount:     float
    status:     TransactionStatus = TransactionStatus.pending
    safepay_tracker: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"
