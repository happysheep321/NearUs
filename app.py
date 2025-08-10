#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Optional

from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_sqlalchemy import SQLAlchemy


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///neighbor_app.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-this-in-prod")

    CORS(app)
    return app


app = create_app()
bcrypt = Bcrypt(app)
db = SQLAlchemy(app)
jwt = JWTManager(app)


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class User(db.Model, TimestampMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(32), unique=True)
    real_name = db.Column(db.String(120))
    password_hash = db.Column(db.String(255), nullable=False)
    interest_tags = db.Column(db.Text)  # JSON string
    credit_points = db.Column(db.Integer, default=0, nullable=False)
    user_type = db.Column(db.String(32), default="user", nullable=False)  # user/admin/merchant
    is_verified = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone": self.phone,
            "real_name": self.real_name,
            "interest_tags": json.loads(self.interest_tags or "[]"),
            "credit_points": self.credit_points,
            "user_type": self.user_type,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat(),
        }


class Post(db.Model, TimestampMixin):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255))
    post_type = db.Column(db.String(32), default="normal")  # normal/activity/help

    author = db.relationship("User", backref=db.backref("posts", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "image_url": self.image_url,
            "post_type": self.post_type,
            "created_at": self.created_at.isoformat(),
        }


class Group(db.Model, TimestampMixin):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(64))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at.isoformat(),
        }


class GroupMember(db.Model, TimestampMixin):
    __tablename__ = "group_members"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    group = db.relationship("Group", backref=db.backref("members", lazy=True))
    user = db.relationship("User", backref=db.backref("group_memberships", lazy=True))


class Activity(db.Model, TimestampMixin):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    activity_type = db.Column(db.String(32))
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    location = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    creator = db.relationship("User", backref=db.backref("activities", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "activity_type": self.activity_type,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "location": self.location,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
        }


class Task(db.Model, TimestampMixin):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.String(32))
    reward_points = db.Column(db.Integer, default=0, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"))
    is_completed = db.Column(db.Boolean, default=False, nullable=False)

    creator = db.relationship("User", foreign_keys=[created_by])
    assignee = db.relationship("User", foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "task_type": self.task_type,
            "reward_points": self.reward_points,
            "created_by": self.created_by,
            "assigned_to": self.assigned_to,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat(),
        }


class Announcement(db.Model, TimestampMixin):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(64))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
        }


class PointTransaction(db.Model, TimestampMixin):
    __tablename__ = "point_transactions"

    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    to_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))

    from_user = db.relationship("User", foreign_keys=[from_user_id])
    to_user = db.relationship("User", foreign_keys=[to_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "from_user_id": self.from_user_id,
            "to_user_id": self.to_user_id,
            "amount": self.amount,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }


def award_points(user: User, amount: int, description: str, from_user: Optional[User] = None):
    if amount == 0:
        return
    user.credit_points = (user.credit_points or 0) + amount
    txn = PointTransaction(
        from_user_id=from_user.id if from_user else None,
        to_user_id=user.id,
        amount=amount,
        description=description,
    )
    db.session.add(txn)


def require_admin(user: User):
    if user.user_type != "admin":
        return jsonify({"error": "需要管理员权限"}), 403
    return None


@app.route("/")
def index():
    return jsonify({
        "message": "邻里APP后端API", 
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "auth": "/auth/login, /auth/register",
            "users": "/users/me",
            "posts": "/posts",
            "groups": "/groups", 
            "activities": "/activities",
            "tasks": "/tasks",
            "announcements": "/announcements",
            "points": "/points/transfer",
            "demo": "/demo/bootstrap"
        }
    })

@app.route("/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip() or None
    real_name = (data.get("real_name") or "").strip() or None
    if not username or not password or not phone:
        return jsonify({"error": "username、password、phone 必填"}), 400

    if User.query.filter((User.username == username) | (User.phone == phone)).first():
        return jsonify({"error": "用户名或手机号已存在"}), 400

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        username=username,
        password_hash=pw_hash,
        phone=phone,
        email=email,
        real_name=real_name,
        interest_tags=json.dumps(data.get("interest_tags") or []),
        is_verified=True,
    )
    db.session.add(user)
    db.session.flush()
    award_points(user, 50, "注册奖励积分")
    db.session.commit()

    token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=7))
    return jsonify({"access_token": token, "user": user.to_dict()})


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "用户名或密码错误"}), 401
    token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=7))
    return jsonify({"access_token": token, "user": user.to_dict()})


def current_user() -> User:
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


@app.route("/users/me", methods=["GET", "PATCH"])
@jwt_required()
def me():
    user = current_user()
    if request.method == "GET":
        return jsonify(user.to_dict())
    data = request.get_json() or {}
    if "real_name" in data:
        user.real_name = (data.get("real_name") or "").strip() or None
    if "interest_tags" in data:
        user.interest_tags = json.dumps(data.get("interest_tags") or [])
    db.session.commit()
    return jsonify(user.to_dict())


@app.route("/posts", methods=["GET", "POST"])
@jwt_required(optional=True)
def posts():
    if request.method == "GET":
        items = Post.query.order_by(Post.created_at.desc()).limit(100).all()
        return jsonify([p.to_dict() for p in items])
    if get_jwt_identity() is None:
        return jsonify({"error": "需要登录"}), 401
    user = current_user()
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "内容不能为空"}), 400
    post = Post(
        user_id=user.id,
        content=content,
        image_url=data.get("image_url"),
        post_type=data.get("post_type") or "normal",
    )
    db.session.add(post)
    award_points(user, 5, "发布动态奖励")
    db.session.commit()
    return jsonify(post.to_dict()), 201


@app.route("/groups", methods=["GET", "POST"])
@jwt_required(optional=True)
def groups():
    if request.method == "GET":
        items = Group.query.order_by(Group.created_at.desc()).all()
        return jsonify([g.to_dict() for g in items])
    if get_jwt_identity() is None:
        return jsonify({"error": "需要登录"}), 401
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name 必填"}), 400
    group = Group(name=name, description=data.get("description"), category=data.get("category"))
    db.session.add(group)
    db.session.commit()
    return jsonify(group.to_dict()), 201


@app.route("/groups/<int:group_id>/join", methods=["POST"])
@jwt_required()
def join_group(group_id: int):
    user = current_user()
    group = Group.query.get_or_404(group_id)
    exists = GroupMember.query.filter_by(group_id=group.id, user_id=user.id).first()
    if exists:
        return jsonify({"message": "已在该小组"})
    gm = GroupMember(group_id=group.id, user_id=user.id)
    db.session.add(gm)
    award_points(user, 3, f"加入小组: {group.name}")
    db.session.commit()
    return jsonify({"message": "加入成功"})


@app.route("/groups/<int:group_id>/leave", methods=["POST"])
@jwt_required()
def leave_group(group_id: int):
    user = current_user()
    gm = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not gm:
        return jsonify({"error": "未加入该小组"}), 400
    db.session.delete(gm)
    db.session.commit()
    return jsonify({"message": "已退出小组"})


@app.route("/announcements", methods=["GET", "POST"])
@jwt_required(optional=True)
def announcements():
    if request.method == "GET":
        items = Announcement.query.order_by(Announcement.created_at.desc()).all()
        return jsonify([a.to_dict() for a in items])
    if get_jwt_identity() is None:
        return jsonify({"error": "需要登录"}), 401
    user = current_user()
    if (err := require_admin(user)) is not None:
        return err
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    if not title or not content:
        return jsonify({"error": "title、content 必填"}), 400
    a = Announcement(
        title=title,
        content=content,
        category=data.get("category"),
        created_by=user.id,
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@app.route("/activities", methods=["GET", "POST"])
@jwt_required(optional=True)
def activities():
    if request.method == "GET":
        items = Activity.query.order_by(Activity.created_at.desc()).all()
        return jsonify([a.to_dict() for a in items])
    if get_jwt_identity() is None:
        return jsonify({"error": "需要登录"}), 401
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title 必填"}), 400
    start_time = (
        datetime.fromisoformat(data["start_time"]) if data.get("start_time") else None
    )
    end_time = (
        datetime.fromisoformat(data["end_time"]) if data.get("end_time") else None
    )
    act = Activity(
        title=title,
        description=data.get("description"),
        activity_type=data.get("activity_type"),
        start_time=start_time,
        end_time=end_time,
        location=data.get("location"),
        created_by=user.id,
    )
    db.session.add(act)
    award_points(user, 8, "创建活动奖励")
    db.session.commit()
    return jsonify(act.to_dict()), 201


@app.route("/tasks", methods=["GET", "POST"])
@jwt_required(optional=True)
def tasks():
    if request.method == "GET":
        items = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([t.to_dict() for t in items])
    if get_jwt_identity() is None:
        return jsonify({"error": "需要登录"}), 401
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title 必填"}), 400
    t = Task(
        title=title,
        description=data.get("description"),
        task_type=data.get("task_type"),
        reward_points=int(data.get("reward_points") or 0),
        created_by=user.id,
        assigned_to=data.get("assigned_to"),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@app.route("/tasks/<int:task_id>/complete", methods=["POST"])
@jwt_required()
def complete_task(task_id: int):
    user = current_user()
    t = Task.query.get_or_404(task_id)
    if t.is_completed:
        return jsonify({"message": "任务已完成"})
    finisher = None
    if t.assigned_to:
        finisher = User.query.get(t.assigned_to)
    if finisher is None:
        finisher = user
    t.is_completed = True
    award_points(finisher, t.reward_points, f"完成任务奖励: {t.title}")
    db.session.commit()
    return jsonify(t.to_dict())


@app.route("/points/transfer", methods=["POST"])
@jwt_required()
def transfer_points():
    sender = current_user()
    data = request.get_json() or {}
    to_user_id = data.get("to_user_id")
    amount = int(data.get("amount") or 0)
    if not to_user_id or amount <= 0:
        return jsonify({"error": "to_user_id、amount 必填且大于0"}), 400
    if sender.credit_points < amount:
        return jsonify({"error": "积分不足"}), 400
    receiver = User.query.get(to_user_id)
    if not receiver:
        return jsonify({"error": "收款用户不存在"}), 404
    sender.credit_points -= amount
    award_points(receiver, amount, "用户间积分转账", from_user=sender)
    db.session.commit()
    return jsonify({
        "message": "转账成功",
        "from": sender.to_dict(),
        "to": receiver.to_dict(),
    })


@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    users = User.query.order_by(User.credit_points.desc()).limit(10).all()
    leaderboard_data = []
    for i, user in enumerate(users):
        leaderboard_data.append({
            "rank": i + 1,
            "username": user.username,
            "credit_points": user.credit_points,
            "user_type": user.user_type,
            "is_verified": user.is_verified
        })
    return jsonify(leaderboard_data)


@app.route("/demo/bootstrap", methods=["POST"])
def bootstrap():
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
            phone="13800000000",
            real_name="社区管理员",
            user_type="admin",
            is_verified=True,
            interest_tags=json.dumps(["社区管理", "活动组织"]),
            credit_points=1000,
        )
        db.session.add(admin)

    user = User.query.filter_by(username="zhangsan").first()
    if not user:
        user = User(
            username="zhangsan",
            password_hash=bcrypt.generate_password_hash("user123").decode("utf-8"),
            phone="13800000001",
            real_name="张三",
            user_type="user",
            is_verified=True,
            interest_tags=json.dumps(["运动健身", "读书学习"]),
            credit_points=150,
        )
        db.session.add(user)

    if Announcement.query.count() == 0:
        a = Announcement(
            title="欢迎加入邻里APP",
            content="社区文明共建，互助有你有我。",
            category="公告",
            created_by=1,
        )
        db.session.add(a)

    db.session.commit()
    return jsonify({"message": "bootstrap 完成"})


def _ensure_db_initialized():
    with app.app_context():
        db.create_all()


if __name__ == "__main__":
    _ensure_db_initialized()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)


