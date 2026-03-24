import os
from datetime import timedelta
from dotenv import load_dotenv

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

    # ✅ FIX: fallback for local testing
    if not db_url:
        print("⚠️ DATABASE_URL not found → using SQLite (local)")
        db_url = "sqlite:///smart_gatepass.db"

    # ✅ FIX for PostgreSQL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    # ✅ SSL fix for Render
    if "postgresql" in db_url and "sslmode" not in db_url:
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