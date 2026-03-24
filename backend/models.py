from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# =====================================================
# USER MODEL
# =====================================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    # ================= BASIC INFO =================
    college_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)

    # Roles → student | faculty | hod | security
    role = db.Column(db.String(20), nullable=False, index=True)

    # ================= ACADEMIC =================
    department = db.Column(db.String(50), nullable=True, index=True)
    year = db.Column(db.Integer, nullable=True)
    section = db.Column(db.String(10), nullable=True)

    # ================= IMAGES =================
    profile_image = db.Column(db.String(255), nullable=True)

    # ================= RELATIONSHIPS =================

    student_gatepasses = db.relationship(
        "GatePass",
        foreign_keys="GatePass.student_id",
        backref="student",
        lazy=True,
        cascade="all, delete-orphan"
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

    # ================= TIMESTAMP =================
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    def __repr__(self):
        return f"<User {self.id} - {self.role}>"


# =====================================================
# GATEPASS MODEL
# =====================================================
class GatePass(db.Model):
    __tablename__ = "gate_passes"

    id = db.Column(db.Integer, primary_key=True)

    # ================= FOREIGN KEYS =================
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    hod_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    # ================= CORE DETAILS =================
    reason = db.Column(db.String(255), nullable=False)
    parent_mobile = db.Column(db.String(15), nullable=False)

    status = db.Column(
        db.String(30),
        default="PendingFaculty",
        nullable=False,
        index=True
    )

    # ================= APPROVAL =================
    faculty_approved_at = db.Column(db.DateTime, nullable=True)
    hod_approved_at = db.Column(db.DateTime, nullable=True)

    # ================= REJECTION =================
    rejected_by = db.Column(db.String(50), nullable=True)
    rejection_reason = db.Column(db.String(255), nullable=True)

    # ================= QR =================
    qr_token = db.Column(db.Text, nullable=True)

    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)

    # ================= IN / OUT =================
    out_time = db.Column(db.DateTime, nullable=True)
    in_time = db.Column(db.DateTime, nullable=True)

    # ================= TIMESTAMP =================
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    def __repr__(self):
        return f"<GatePass {self.id} - {self.status}>"