import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from models import db

from routes.auth_routes import auth_bp
from routes.gatepass_routes import gatepass_bp
from routes.student_routes import student_bp
from routes.faculty_routes import faculty_bp
from routes.hod_routes import hod_bp
from routes.security_routes import security_bp


load_dotenv()


def create_app():
    app = Flask(__name__)

    # ===============================
    # ENV CONFIGURATION
    # ===============================
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_EXPIRES", 7200))
    )

    # ===============================
    # INIT EXTENSIONS
    # ===============================
    db.init_app(app)
    JWTManager(app)

    # 🔐 Restrict CORS only to frontend
    CORS(app,
         resources={r"/api/*": {"origins": os.environ.get("FRONTEND_URL")}},
         supports_credentials=True)

    # ===============================
    # CREATE TABLES
    # ===============================
    with app.app_context():
        db.create_all()

    # ===============================
    # REGISTER BLUEPRINTS
    # ===============================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(gatepass_bp, url_prefix="/api/gatepass")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(hod_bp, url_prefix="/api/hod")
    app.register_blueprint(security_bp, url_prefix="/api/security")

    # Health route
    @app.route("/")
    def health():
        return jsonify({"status": "Secure Smart Gatepass Backend Running"})

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)