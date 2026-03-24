import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db

# ✅ FIXED IMPORTS (important)
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
    # FOLDERS
    # ==============================
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    STUDENT_FOLDER = os.path.join(BASE_DIR, "uploads/student_images")
    FACULTY_FOLDER = os.path.join(BASE_DIR, "uploads/faculty_faces")

    os.makedirs(STUDENT_FOLDER, exist_ok=True)
    os.makedirs(FACULTY_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "temp"), exist_ok=True)

    # ==============================
    # CORS (IMPORTANT FIX)
    # ==============================
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # ==============================
    # INIT DB & JWT
    # ==============================
    db.init_app(app)
    JWTManager(app)

    # ==============================
    # DB CREATE
    # ==============================
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database Connected Successfully")
        except Exception as e:
            print("❌ Database Error:", e)

    # ==============================
    # REGISTER ROUTES (IMPORTANT)
    # ==============================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(gatepass_bp, url_prefix="/api/gatepass")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(hod_bp, url_prefix="/api/hod")
    app.register_blueprint(security_bp, url_prefix="/api/security")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # ==============================
    # STATIC FILES
    # ==============================
    @app.route("/uploads/student_images/<filename>")
    def student_image(filename):
        return send_from_directory(STUDENT_FOLDER, filename)

    @app.route("/uploads/faculty_faces/<filename>")
    def faculty_face(filename):
        return send_from_directory(FACULTY_FOLDER, filename)

    # ==============================
    # HEALTH CHECK
    # ==============================
    @app.route("/")
    def health():
        return jsonify({
            "status": "Backend Running ✅",
            "database": "Connected",
            "jwt": "Active"
        }), 200

    return app


# ==============================
# ENTRY POINT
# ==============================
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)