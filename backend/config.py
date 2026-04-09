import os
from datetime import timedelta
from dotenv import load_dotenv

# ==============================
# LOAD ENV VARIABLES
# ==============================
load_dotenv()


class Config:
    # ==============================
    # SECRET KEYS
    # ==============================
    SECRET_KEY = os.getenv("SECRET_KEY", "smart_secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt_secret")
    QR_SECRET_KEY = os.getenv("QR_SECRET_KEY", "qr_secret")

    # ==============================
    # DATABASE CONFIGURATION
    # ==============================
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        raise ValueError("❌ DATABASE_URL not found. Check your .env file.")

    # ✅ Fix PostgreSQL driver (Render compatible)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    # ✅ Ensure SSL mode (required for Render)
    if "sslmode" not in db_url:
        if "?" in db_url:
            db_url += "&sslmode=require"
        else:
            db_url += "?sslmode=require"

    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ==============================
    # JWT CONFIG
    # ==============================
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # ==============================
    # CLOUDINARY CONFIG (IMPORTANT)
    # ==============================
    CLOUD_NAME = os.getenv("CLOUD_NAME")
    API_KEY = os.getenv("API_KEY")
    API_SECRET = os.getenv("API_SECRET")

    # ==============================
    # VALIDATION CHECKS (DEBUG)
    # ==============================
    if not CLOUD_NAME or not API_KEY or not API_SECRET:
        print("⚠️ Cloudinary config missing. Check your .env file.")

    if not SECRET_KEY or not JWT_SECRET_KEY:
        print("⚠️ Secret keys missing. Using default values (not recommended).")