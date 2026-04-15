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

    role = db.Column(db.String(20), nullable=False, default="student", index=True)

    # ================= ACADEMIC =================
    department = db.Column(db.String(50), nullable=True, index=True)
    year = db.Column(db.Integer, nullable=True)
    section = db.Column(db.String(10), nullable=True)

    # ================= EXTRA =================
    profile_image = db.Column(db.String(500), nullable=True)

    # 🔥 FIXED: REMOVE DEFAULT (IMPORTANT)
    parent_mobile = db.Column(db.String(15), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

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

    # ================= IMAGE URL =================
    def get_image_url(self, base_url):
        if not self.profile_image:
            return None

        img = self.profile_image.strip().replace("\\", "/")

        try:
            if img.startswith("http"):
                return img

            if "uploads/" in img:
                filename = img.split("uploads/")[-1]
                return f"{base_url}/uploads/{filename}"

            return f"{base_url}/uploads/{img}"

        except Exception as e:
            print("Image URL Error:", e)
            return None

    def __repr__(self):
        return f"<User {self.id} | {self.role} | {self.name}>"


# =====================================================
# GATEPASS MODEL
# =====================================================
class GatePass(db.Model):
    __tablename__ = "gate_passes"

    id = db.Column(db.Integer, primary_key=True)

    # ================= FOREIGN KEYS =================
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    hod_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # ================= DETAILS =================
    reason = db.Column(db.String(255), nullable=False)

    # 🔥 FIXED: OPTIONAL (avoid forcing wrong data)
    parent_mobile = db.Column(db.String(15), nullable=True)

    # 🔥 IMPROVED STATUS VALUES
    status = db.Column(db.String(30), default="PendingFaculty", nullable=False, index=True)

    # ================= APPROVAL =================
    faculty_approved_at = db.Column(db.DateTime, nullable=True)
    hod_approved_at = db.Column(db.DateTime, nullable=True)

    # ================= REJECTION =================
    rejected_by = db.Column(db.String(50), nullable=True)
    rejection_reason = db.Column(db.String(255), nullable=True)

    # ================= QR =================
    qr_token = db.Column(db.Text, nullable=True)

    # ================= USAGE =================
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)

    # ================= ENTRY =================
    out_time = db.Column(db.DateTime, nullable=True)
    in_time = db.Column(db.DateTime, nullable=True)

    # ================= CREATED =================
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # ================= METHODS =================
    def approve_by_faculty(self, faculty_id):
        self.status = "PendingHOD"
        self.faculty_id = faculty_id
        self.faculty_approved_at = datetime.utcnow()

    def approve_by_hod(self, hod_id):
        self.status = "Approved"
        self.hod_id = hod_id
        self.hod_approved_at = datetime.utcnow()

    def reject(self, role, reason):
        self.status = "Rejected"
        self.rejected_by = role
        self.rejection_reason = reason

    def mark_used(self):
        self.is_used = True
        self.used_at = datetime.utcnow()

    def __repr__(self):
        return f"<GatePass {self.id} | {self.status}>"