from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# =================================================
# USER MODEL
# =================================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    college_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    # student | faculty | hod | security
    role = db.Column(db.String(20), nullable=False)

    department = db.Column(db.String(20), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    section = db.Column(db.String(2), nullable=True)

    # ================= RELATIONSHIPS =================
    student_gatepasses = db.relationship(
        "GatePass",
        foreign_keys="GatePass.student_id",
        backref="student",
        lazy=True
    )

    faculty_gatepasses = db.relationship(
        "GatePass",
        foreign_keys="GatePass.faculty_id",
        backref="faculty",
        lazy=True
    )

    hod_gatepasses = db.relationship(
        "GatePass",
        foreign_keys="GatePass.hod_id",
        backref="hod",
        lazy=True
    )

    def __repr__(self):
        return f"<User {self.id} {self.role}>"


# =================================================
# GATEPASS MODEL
# =================================================
class GatePass(db.Model):
    __tablename__ = "gate_passes"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    faculty_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    hod_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    reason = db.Column(db.String(255), nullable=False)
    parent_mobile = db.Column(db.String(15), nullable=False)

    status = db.Column(
        db.String(30),
        default="PendingFaculty",
        index=True
    )

    # ================= QR SYSTEM =================
    qr_token = db.Column(db.Text, nullable=True)

    # Prevent QR reuse
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)

    # Exit tracking
    out_time = db.Column(db.DateTime, nullable=True)
    in_time = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        index=True
    )

    def __repr__(self):
        return f"<GatePass {self.id} {self.status}>"