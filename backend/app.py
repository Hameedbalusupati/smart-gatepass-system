import os
import sys

# ==============================
# FIX MODULE PATH (Render Safe)
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db

# ==============================
# ROUTES IMPORT
# ==============================
from routes.auth_routes import auth_bp
from routes.gatepass_routes import gatepass_bp
from routes.student_routes import student_bp
from routes.faculty_routes import faculty_bp
from routes.hod_routes import hod_bp
from routes.security_routes import security_bp
from routes.notification_routes import notifications_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ==============================
    # FOLDER SETUP
    # ==============================
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    STUDENT_FOLDER = os.path.join(UPLOAD_FOLDER, "student_images")
    FACULTY_FOLDER = os.path.join(UPLOAD_FOLDER, "faculty_faces")
    TEMP_FOLDER = os.path.join(BASE_DIR, "temp")

    os.makedirs(STUDENT_FOLDER, exist_ok=True)
    os.makedirs(FACULTY_FOLDER, exist_ok=True)
    os.makedirs(TEMP_FOLDER, exist_ok=True)

    # ==============================
    # CORS (ALLOW ALL)
    # ==============================
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True
    )

    # ==============================
    # INIT DB & JWT
    # ==============================
    db.init_app(app)
    JWTManager(app)

    # ==============================
    # CREATE DB
    # ==============================
    with app.app_context():
        try:
            db.create_all()
            print("Database Connected Successfully")
        except Exception as e:
            print("Database Error:", e)

    # ==============================
    # REGISTER BLUEPRINTS
    # ==============================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(gatepass_bp, url_prefix="/api/gatepass")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(hod_bp, url_prefix="/api/hod")
    app.register_blueprint(security_bp, url_prefix="/api/security")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # ==============================
    # 🔥 UNIVERSAL IMAGE SERVING (FIXED)
    # ==============================
    @app.route("/uploads/<path:filename>")
    def serve_uploaded_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)

    # ==============================
    # HEALTH CHECK
    # ==============================
    @app.route("/")
    def health():
        return jsonify({
            "status": "Backend Running",
            "database": "Connected",
            "jwt": "Active"
        }), 200

    return app


# ==============================
# APP INSTANCE (REQUIRED FOR GUNICORN)
# ==============================
app = create_app()


# ==============================
# LOCAL RUN
# ==============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)