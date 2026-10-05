"""
Seed initial car brands into the `brands` collection.

Usage (from backend/ folder):
    python seed_brands.py                      # uses .env / defaults (localhost)
    MONGODB_URL="mongodb+srv://..." MONGODB_DB_NAME="autowizor" python seed_brands.py

Idempotent: existing brands (matched case-insensitively) are updated, not duplicated.
Logos: if `uploads/brands/<name-lower>.png` exists, its URL is attached,
otherwise logo stays as-is (null for new brands).
So to add a logo later, drop the PNG in `uploads/brands/` and re-run this script.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.brand import Brand

BRANDS = [
    "Suzuki",
    "Toyota",
    "Honda",
    "Hyundai",
    "Kia",
    "MG",
    "Jetour",
    "Jaecoo",
    "BYD",
]

LOGO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "brands")


def logo_for(name: str):
    fname = f"{name.strip().lower()}.png"
    if os.path.isfile(os.path.join(LOGO_DIR, fname)):
        return f"/uploads/brands/{fname}"
    return None


async def main():
    url = os.environ.get("MONGODB_URL", settings.MONGODB_URL)
    db_name = os.environ.get("MONGODB_DB_NAME", settings.MONGODB_DB_NAME)
    client = AsyncIOMotorClient(url, tlsAllowInvalidCertificates=True)
    await init_beanie(database=client[db_name], document_models=[Brand])

    for name in BRANDS:
        existing = await Brand.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        logo = logo_for(name)
        if existing:
            changed = False
            if logo and existing.logo_url != logo:
                existing.logo_url = logo
                changed = True
            if not existing.is_active:
                existing.is_active = True
                changed = True
            if changed:
                await existing.save()
                print(f"updated: {existing.name} logo={existing.logo_url}")
            else:
                print(f"exists:  {existing.name} logo={existing.logo_url}")
        else:
            b = Brand(name=name, logo_url=logo, category="car", is_active=True)
            await b.insert()
            print(f"inserted: {name} logo={logo}")

    print("done.")


if __name__ == "__main__":
    asyncio.run(main())
