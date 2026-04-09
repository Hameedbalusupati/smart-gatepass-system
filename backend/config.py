import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
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
        raise ValueError("DATABASE_URL not found. Check your .env file.")

    #  FIX: use psycopg (v3)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    # Ensure SSL mode for Render
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