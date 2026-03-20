import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db

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

    # =====================================================
    # CREATE REQUIRED FOLDERS
    # =====================================================
    os.makedirs("uploads/student_images", exist_ok=True)
    os.makedirs("uploads/faculty_faces", exist_ok=True)
    os.makedirs("temp", exist_ok=True)

    # =====================================================
    # ENABLE CORS
    # =====================================================
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True
    )

    # =====================================================
    # INIT DATABASE & JWT
    # =====================================================
    db.init_app(app)
    JWTManager(app)

    # =====================================================
    # DATABASE INIT (SAFE)
    # =====================================================
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database Connected Successfully")
        except Exception as e:
            print("❌ Database Connection Failed:", e)

    # =====================================================
    # REGISTER BLUEPRINTS
    # =====================================================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(gatepass_bp, url_prefix="/api/gatepass")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(hod_bp, url_prefix="/api/hod")
    app.register_blueprint(security_bp, url_prefix="/api/security")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # =====================================================
    # STATIC FILE SERVING
    # =====================================================

    # Student images
    @app.route("/uploads/student_images/<filename>")
    def student_image(filename):
        return send_from_directory("uploads/student_images", filename)

    # Faculty face images
    @app.route("/uploads/faculty_faces/<filename>")
    def faculty_face(filename):
        return send_from_directory("uploads/faculty_faces", filename)

    # =====================================================
    # HEALTH CHECK ROUTE
    # =====================================================
    @app.route("/")
    def health():
        return jsonify({
            "status": "Smart Gatepass Backend Running",
            "database": "Connected",
            "jwt": "Active"
        }), 200

    return app


# =====================================================
# GUNICORN ENTRY POINT (RENDER)
# =====================================================
app = create_app()


# =====================================================
# LOCAL DEVELOPMENT
# =====================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)