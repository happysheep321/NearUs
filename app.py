#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import json
import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
import uuid
# 尝试导入valx，如果失败则使用自定义实现
try:
    import valx
    valx_available = True
    print("valx导入成功，使用valx敏感词过滤器")
except Exception as e:
    print(f"valx导入失败，使用自定义敏感词过滤器: {e}")
    valx_available = False

# 中文敏感词列表
chinese_sensitive_words = [
    '政治', '政府', '领导人', '国家', '党', '军队', '警察', '法律', '宪法',
    '杀', '死', '暴力', '打架', '斗殴', '伤害', '攻击', '武器', '枪', '刀',
    '色情', '黄色', '成人', '性', '裸', '情色', '色情网站',
    '赌博', '博彩', '赌场', '彩票', '六合彩', '时时彩',
    '毒品', '吸毒', '大麻', '冰毒', '海洛因', '摇头丸',
    '诈骗', '传销', '非法集资', '中奖', '免费', '赚钱', '兼职',
    '自杀', '自残', '恐怖', '爆炸', '炸弹', '病毒', '黑客'
]

def check_sensitive_content(content):
    """检查内容是否包含敏感词"""
    if not content:
        return {
            'is_safe': True,
            'filtered_content': content,
            'found_words': [],
            'original_content': content
        }
    
    if valx_available:
        # 使用valx检查敏感词
        try:
            # 使用valx的detect_profanity函数
            text_data = [content]
            result = valx.detect_profanity(text_data, custom_words_list=chinese_sensitive_words)
            
            if result:
                # 获取找到的敏感词
                found_words = [item['Word'] for item in result]
                # 使用valx的remove_profanity函数过滤内容
                filtered_data = valx.remove_profanity(text_data, custom_words_list=chinese_sensitive_words)
                filtered_content = filtered_data[0] if filtered_data else content
                
                return {
                    'is_safe': False,
                    'filtered_content': filtered_content,
                    'found_words': found_words,
                    'original_content': content
                }
            else:
                return {
                    'is_safe': True,
                    'filtered_content': content,
                    'found_words': [],
                    'original_content': content
                }
        except Exception as e:
            print(f"valx过滤失败，使用自定义实现: {e}")
            # 如果valx失败，回退到自定义实现
            pass
    
    # 自定义敏感词检查实现
    found_words = []
    filtered_content = content
    
    for word in chinese_sensitive_words:
        if word in content:
            found_words.append(word)
            filtered_content = filtered_content.replace(word, '*' * len(word))
    
    return {
        'is_safe': len(found_words) == 0,
        'filtered_content': filtered_content,
        'found_words': found_words,
        'original_content': content
    }

# 角色常量
ROLES = {
    'ADMIN': 'admin',
    'MODERATOR': 'moderator', 
    'MERCHANT': 'merchant',
    'USER': 'user'
}

def has_role(user, role):
    """检查用户是否具有指定角色"""
    return user and user.user_type == role

def create_app() -> Flask:
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///neighbor_app.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-this-in-prod")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    CORS(app)
    return app


app = create_app()
bcrypt = Bcrypt(app)
db = SQLAlchemy(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')


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


# 聊天功能相关模型
class ChatRoom(db.Model, TimestampMixin):
    __tablename__ = "chat_rooms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    room_type = db.Column(db.String(32), default="group")  # group/private
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    creator = db.relationship("User", backref=db.backref("created_rooms", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "room_type": self.room_type,
            "created_by": self.created_by,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }


class ChatMember(db.Model, TimestampMixin):
    __tablename__ = "chat_members"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(32), default="member")  # owner/admin/member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    room = db.relationship("ChatRoom", backref=db.backref("members", lazy=True))
    user = db.relationship("User", backref=db.backref("chat_memberships", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "user_id": self.user_id,
            "role": self.role,
            "joined_at": self.joined_at.isoformat(),
        }


class ChatMessage(db.Model, TimestampMixin):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(32), default="text")  # text/image/file/system
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    room = db.relationship("ChatRoom", backref=db.backref("messages", lazy=True))
    sender = db.relationship("User", backref=db.backref("sent_messages", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "sender_id": self.sender_id,
            "content": self.content,
            "message_type": self.message_type,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }


class Friendship(db.Model, TimestampMixin):
    __tablename__ = "friendships"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(32), default="pending")  # pending/accepted/blocked
    accepted_at = db.Column(db.DateTime)

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("friendships", lazy=True))
    friend = db.relationship("User", foreign_keys=[friend_id], backref=db.backref("friend_of", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "friend_id": self.friend_id,
            "status": self.status,
            "accepted_at": self.accepted_at.isoformat() if self.accepted_at else None,
            "created_at": self.created_at.isoformat(),
        }


# ==================== 新增功能模型 ====================

# 1. 实时通知系统
class Notification(db.Model, TimestampMixin):
    __tablename__ = "notifications"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(32), default="info")  # info/warning/error/success
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    related_url = db.Column(db.String(255))
    
    user = db.relationship("User", backref=db.backref("notifications", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "notification_type": self.notification_type,
            "is_read": self.is_read,
            "related_url": self.related_url,
            "created_at": self.created_at.isoformat(),
        }

# 2. 本地商家地图
class Business(db.Model, TimestampMixin):
    __tablename__ = "businesses"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(64))  # restaurant/shop/service/other
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    phone = db.Column(db.String(32))
    business_hours = db.Column(db.Text)  # JSON string
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    rating = db.Column(db.Float, default=0.0)
    rating_count = db.Column(db.Integer, default=0)
    
    owner = db.relationship("User", backref=db.backref("businesses", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "phone": self.phone,
            "business_hours": json.loads(self.business_hours or "{}"),
            "owner_id": self.owner_id,
            "is_verified": self.is_verified,
            "rating": self.rating,
            "rating_count": self.rating_count,
            "created_at": self.created_at.isoformat(),
        }

# 3. 优惠券系统
class Coupon(db.Model, TimestampMixin):
    __tablename__ = "coupons"
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    discount_type = db.Column(db.String(32), default="percentage")  # percentage/fixed
    discount_value = db.Column(db.Float, nullable=False)
    min_amount = db.Column(db.Float, default=0.0)
    max_discount = db.Column(db.Float)
    valid_from = db.Column(db.DateTime, nullable=False)
    valid_until = db.Column(db.DateTime, nullable=False)
    usage_limit = db.Column(db.Integer, default=1)
    used_count = db.Column(db.Integer, default=0)
    business_id = db.Column(db.Integer, db.ForeignKey("businesses.id"))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    business = db.relationship("Business", backref=db.backref("coupons", lazy=True))
    creator = db.relationship("User", backref=db.backref("created_coupons", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "min_amount": self.min_amount,
            "max_discount": self.max_discount,
            "valid_from": self.valid_from.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "usage_limit": self.usage_limit,
            "used_count": self.used_count,
            "business_id": self.business_id,
            "created_by": self.created_by,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }

class UserCoupon(db.Model, TimestampMixin):
    __tablename__ = "user_coupons"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    coupon_id = db.Column(db.Integer, db.ForeignKey("coupons.id"), nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    used_at = db.Column(db.DateTime)
    
    user = db.relationship("User", backref=db.backref("user_coupons", lazy=True))
    coupon = db.relationship("Coupon", backref=db.backref("user_coupons", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "coupon_id": self.coupon_id,
            "is_used": self.is_used,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "created_at": self.created_at.isoformat(),
        }

# 4. 投票系统
class Poll(db.Model, TimestampMixin):
    __tablename__ = "polls"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    poll_type = db.Column(db.String(32), default="single")  # single/multiple
    options = db.Column(db.Text, nullable=False)  # JSON string
    end_time = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    
    creator = db.relationship("User", backref=db.backref("created_polls", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "poll_type": self.poll_type,
            "options": json.loads(self.options),
            "end_time": self.end_time.isoformat(),
            "created_by": self.created_by,
            "is_active": self.is_active,
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat(),
        }

class PollVote(db.Model, TimestampMixin):
    __tablename__ = "poll_votes"
    
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey("polls.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    selected_options = db.Column(db.Text, nullable=False)  # JSON string
    
    poll = db.relationship("Poll", backref=db.backref("votes", lazy=True))
    user = db.relationship("User", backref=db.backref("poll_votes", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "user_id": self.user_id,
            "selected_options": json.loads(self.selected_options),
            "created_at": self.created_at.isoformat(),
        }

# 5. 图片分享墙
class Photo(db.Model, TimestampMixin):
    __tablename__ = "photos"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(255))
    tags = db.Column(db.Text)  # JSON string
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    
    user = db.relationship("User", backref=db.backref("photos", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "image_url": self.image_url,
            "thumbnail_url": self.thumbnail_url,
            "tags": json.loads(self.tags or "[]"),
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat(),
        }

# 6. 事件日历
class Event(db.Model, TimestampMixin):
    __tablename__ = "events"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    event_type = db.Column(db.String(32), default="community")  # community/personal/business
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    max_participants = db.Column(db.Integer)
    current_participants = db.Column(db.Integer, default=0)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    recurrence_rule = db.Column(db.String(255))  # RRULE string
    
    creator = db.relationship("User", backref=db.backref("created_events", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "event_type": self.event_type,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "max_participants": self.max_participants,
            "current_participants": self.current_participants,
            "created_by": self.created_by,
            "is_public": self.is_public,
            "is_recurring": self.is_recurring,
            "recurrence_rule": self.recurrence_rule,
            "created_at": self.created_at.isoformat(),
        }

class EventParticipant(db.Model, TimestampMixin):
    __tablename__ = "event_participants"
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(32), default="confirmed")  # confirmed/maybe/declined
    
    event = db.relationship("Event", backref=db.backref("participants", lazy=True))
    user = db.relationship("User", backref=db.backref("event_participations", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

# 7. 二手交易平台
class MarketplaceItem(db.Model, TimestampMixin):
    __tablename__ = "marketplace_items"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(64))  # electronics/clothing/furniture/books/other
    price = db.Column(db.Float, nullable=False)
    original_price = db.Column(db.Float)
    condition = db.Column(db.String(32), default="good")  # new/like_new/good/fair/poor
    images = db.Column(db.Text)  # JSON string
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_sold = db.Column(db.Boolean, default=False, nullable=False)
    is_negotiable = db.Column(db.Boolean, default=True, nullable=False)
    location = db.Column(db.String(255))
    contact_phone = db.Column(db.String(32))
    
    seller = db.relationship("User", backref=db.backref("marketplace_items", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "price": self.price,
            "original_price": self.original_price,
            "condition": self.condition,
            "images": json.loads(self.images or "[]"),
            "seller_id": self.seller_id,
            "is_sold": self.is_sold,
            "is_negotiable": self.is_negotiable,
            "location": self.location,
            "contact_phone": self.contact_phone,
            "created_at": self.created_at.isoformat(),
        }

# 8. 技能交换系统
class Skill(db.Model, TimestampMixin):
    __tablename__ = "skills"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(64))  # language/music/sports/cooking/tech/other
    description = db.Column(db.Text)
    level = db.Column(db.String(32), default="intermediate")  # beginner/intermediate/advanced/expert
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_teaching = db.Column(db.Boolean, default=True, nullable=False)
    is_learning = db.Column(db.Boolean, default=False, nullable=False)
    hourly_rate = db.Column(db.Float)
    is_free = db.Column(db.Boolean, default=True, nullable=False)
    
    user = db.relationship("User", backref=db.backref("skills", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "level": self.level,
            "user_id": self.user_id,
            "is_teaching": self.is_teaching,
            "is_learning": self.is_learning,
            "hourly_rate": self.hourly_rate,
            "is_free": self.is_free,
            "created_at": self.created_at.isoformat(),
        }

class SkillRequest(db.Model, TimestampMixin):
    __tablename__ = "skill_requests"
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.String(32), default="pending")  # pending/accepted/rejected/completed
    scheduled_time = db.Column(db.DateTime)
    duration_hours = db.Column(db.Float, default=1.0)
    
    requester = db.relationship("User", foreign_keys=[requester_id], backref=db.backref("skill_requests_sent", lazy=True))
    provider = db.relationship("User", foreign_keys=[provider_id], backref=db.backref("skill_requests_received", lazy=True))
    skill = db.relationship("Skill", backref=db.backref("requests", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "requester_id": self.requester_id,
            "provider_id": self.provider_id,
            "skill_id": self.skill_id,
            "message": self.message,
            "status": self.status,
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "duration_hours": self.duration_hours,
            "created_at": self.created_at.isoformat(),
        }

# 9. 社区统计仪表板
class UserActivity(db.Model, TimestampMixin):
    __tablename__ = "user_activities"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    activity_type = db.Column(db.String(64), nullable=False)  # login/post/comment/like/task_complete
    activity_data = db.Column(db.Text)  # JSON string
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    user = db.relationship("User", backref=db.backref("activities_log", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity_type": self.activity_type,
            "activity_data": json.loads(self.activity_data or "{}"),
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat(),
        }


class Quest(db.Model, TimestampMixin):
    __tablename__ = "quests"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    quest_type = db.Column(db.String(32), default="daily")  # daily/weekly/achievement/challenge/social/business/event
    target = db.Column(db.Integer, default=1)  # target count to complete
    reward = db.Column(db.Integer, default=10)  # points reward
    category = db.Column(db.String(64))  # social/activity/game/business/other
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_repeatable = db.Column(db.Boolean, default=True, nullable=False)
    expires_at = db.Column(db.DateTime)  # for time-limited quests
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "quest_type": self.quest_type,
            "target": self.target,
            "reward": self.reward,
            "category": self.category,
            "is_active": self.is_active,
            "is_repeatable": self.is_repeatable,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat(),
        }


class UserQuest(db.Model, TimestampMixin):
    __tablename__ = "user_quests"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    quest_id = db.Column(db.Integer, db.ForeignKey("quests.id"), nullable=False)
    progress = db.Column(db.Integer, default=0, nullable=False)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    completed_at = db.Column(db.DateTime)
    reward_claimed = db.Column(db.Boolean, default=False, nullable=False)
    
    user = db.relationship("User", backref=db.backref("user_quests", lazy=True))
    quest = db.relationship("Quest", backref=db.backref("user_quests", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quest_id": self.quest_id,
            "progress": self.progress,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "reward_claimed": self.reward_claimed,
            "quest": self.quest.to_dict() if self.quest else None,
            "created_at": self.created_at.isoformat(),
        }


class Image(db.Model, TimestampMixin):
    __tablename__ = "images"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    url = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(255))
    tags = db.Column(db.Text)  # JSON string
    likes = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    
    user = db.relationship("User", backref=db.backref("images", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "tags": json.loads(self.tags or "[]"),
            "likes": self.likes,
            "comments_count": self.comments_count,
            "is_public": self.is_public,
            "username": self.user.username if self.user else None,
            "user_avatar": None,  # TODO: Add avatar field to User model
            "liked": False,  # TODO: Check if current user liked
            "comments": [],  # TODO: Load comments
            "created_at": self.created_at.isoformat(),
        }


class ImageLike(db.Model, TimestampMixin):
    __tablename__ = "image_likes"
    
    id = db.Column(db.Integer, primary_key=True)
    image_id = db.Column(db.Integer, db.ForeignKey("images.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    image = db.relationship("Image", backref=db.backref("likes_rel", lazy=True))
    user = db.relationship("User", backref=db.backref("image_likes", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "image_id": self.image_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
        }


class ImageComment(db.Model, TimestampMixin):
    __tablename__ = "image_comments"
    
    id = db.Column(db.Integer, primary_key=True)
    image_id = db.Column(db.Integer, db.ForeignKey("images.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    
    image = db.relationship("Image", backref=db.backref("comments_rel", lazy=True))
    user = db.relationship("User", backref=db.backref("image_comments", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "image_id": self.image_id,
            "user_id": self.user_id,
            "comment": self.comment,
            "username": self.user.username if self.user else None,
            "user_avatar": None,  # TODO: Add avatar field to User model
            "created_at": self.created_at.isoformat(),
        }

# 10. 社区小游戏
class Game(db.Model, TimestampMixin):
    __tablename__ = "games"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    game_type = db.Column(db.String(32), default="puzzle")  # puzzle/quiz/arcade/strategy
    description = db.Column(db.Text)
    rules = db.Column(db.Text)
    max_players = db.Column(db.Integer, default=1)
    reward_points = db.Column(db.Integer, default=10)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "game_type": self.game_type,
            "description": self.description,
            "rules": self.rules,
            "max_players": self.max_players,
            "reward_points": self.reward_points,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }

class GameScore(db.Model, TimestampMixin):
    __tablename__ = "game_scores"
    
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    level = db.Column(db.Integer, default=1)
    time_spent = db.Column(db.Integer)  # seconds
    game_data = db.Column(db.Text)  # JSON string
    
    game = db.relationship("Game", backref=db.backref("scores", lazy=True))
    user = db.relationship("User", backref=db.backref("game_scores", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "game_id": self.game_id,
            "user_id": self.user_id,
            "score": self.score,
            "level": self.level,
            "time_spent": self.time_spent,
            "game_data": json.loads(self.game_data or "{}"),
            "created_at": self.created_at.isoformat(),
        }

# 11. 抽奖系统
class Lottery(db.Model, TimestampMixin):
    __tablename__ = "lotteries"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    prize_pool = db.Column(db.Text, nullable=False)  # JSON string
    entry_cost = db.Column(db.Integer, default=0)  # points required
    max_entries = db.Column(db.Integer)
    current_entries = db.Column(db.Integer, default=0)
    draw_time = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    creator = db.relationship("User", backref=db.backref("created_lotteries", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "prize_pool": json.loads(self.prize_pool),
            "entry_cost": self.entry_cost,
            "max_entries": self.max_entries,
            "current_entries": self.current_entries,
            "draw_time": self.draw_time.isoformat(),
            "is_active": self.is_active,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
        }

class LotteryEntry(db.Model, TimestampMixin):
    __tablename__ = "lottery_entries"
    
    id = db.Column(db.Integer, primary_key=True)
    lottery_id = db.Column(db.Integer, db.ForeignKey("lotteries.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    entry_number = db.Column(db.Integer, nullable=False)
    is_winner = db.Column(db.Boolean, default=False, nullable=False)
    prize_won = db.Column(db.String(255))
    
    lottery = db.relationship("Lottery", backref=db.backref("entries", lazy=True))
    user = db.relationship("User", backref=db.backref("lottery_entries", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "lottery_id": self.lottery_id,
            "user_id": self.user_id,
            "entry_number": self.entry_number,
            "is_winner": self.is_winner,
            "prize_won": self.prize_won,
            "created_at": self.created_at.isoformat(),
        }

# 12. 成就系统
class Achievement(db.Model, TimestampMixin):
    __tablename__ = "achievements"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon_url = db.Column(db.String(255))
    category = db.Column(db.String(64))  # social/activity/game/points/other
    points_reward = db.Column(db.Integer, default=0)
    criteria = db.Column(db.Text)  # JSON string
    is_hidden = db.Column(db.Boolean, default=False, nullable=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "category": self.category,
            "points_reward": self.points_reward,
            "criteria": json.loads(self.criteria or "{}"),
            "is_hidden": self.is_hidden,
            "created_at": self.created_at.isoformat(),
        }

class UserAchievement(db.Model, TimestampMixin):
    __tablename__ = "user_achievements"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    user = db.relationship("User", backref=db.backref("achievements", lazy=True))
    achievement = db.relationship("Achievement", backref=db.backref("user_achievements", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "unlocked_at": self.unlocked_at.isoformat(),
            "created_at": self.created_at.isoformat(),
        }

# 13. 社区问答系统
class Question(db.Model, TimestampMixin):
    __tablename__ = "questions"
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(64))  # general/tech/life/community/other
    tags = db.Column(db.Text)  # JSON string
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    views_count = db.Column(db.Integer, default=0)
    answers_count = db.Column(db.Integer, default=0)
    is_solved = db.Column(db.Boolean, default=False, nullable=False)
    best_answer_id = db.Column(db.Integer)
    
    user = db.relationship("User", backref=db.backref("questions", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "tags": json.loads(self.tags or "[]"),
            "user_id": self.user_id,
            "views_count": self.views_count,
            "answers_count": self.answers_count,
            "is_solved": self.is_solved,
            "best_answer_id": self.best_answer_id,
            "created_at": self.created_at.isoformat(),
        }

class Answer(db.Model, TimestampMixin):
    __tablename__ = "answers"
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_best = db.Column(db.Boolean, default=False, nullable=False)
    likes_count = db.Column(db.Integer, default=0)
    
    question = db.relationship("Question", backref=db.backref("answers", lazy=True))
    user = db.relationship("User", backref=db.backref("answers", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "content": self.content,
            "user_id": self.user_id,
            "is_best": self.is_best,
            "likes_count": self.likes_count,
            "created_at": self.created_at.isoformat(),
        }

# 14. 社区活动签到系统
class EventCheckIn(db.Model, TimestampMixin):
    __tablename__ = "event_checkins"
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    location_latitude = db.Column(db.Float)
    location_longitude = db.Column(db.Float)
    points_earned = db.Column(db.Integer, default=0)
    
    event = db.relationship("Event", backref=db.backref("checkins", lazy=True))
    user = db.relationship("User", backref=db.backref("event_checkins", lazy=True))
    
    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "check_in_time": self.check_in_time.isoformat(),
            "location_latitude": self.location_latitude,
            "location_longitude": self.location_longitude,
            "points_earned": self.points_earned,
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
        # 检查用户权限：只有管理员和版主可以查看公告管理页面
        if get_jwt_identity() is None:
            return jsonify({"error": "需要登录"}), 401
        user = current_user()
        if user.user_type not in ["admin", "moderator"]:
            return jsonify({"error": "权限不足，只有管理员和版主可以访问公告管理"}), 403
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


# 排行榜API (统一使用 /api/leaderboard 端点)


# 聊天功能API
@app.route("/chat/rooms", methods=["GET", "POST"])
@jwt_required()
def chat_rooms():
    user = current_user()
    if request.method == "GET":
        # 获取用户加入的聊天室
        memberships = ChatMember.query.filter_by(user_id=user.id).all()
        rooms = []
        for membership in memberships:
            room = ChatRoom.query.get(membership.room_id)
            if room and room.is_active:
                room_data = room.to_dict()
                room_data["user_role"] = membership.role
                rooms.append(room_data)
        return jsonify(rooms)
    
    # 创建聊天室
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "聊天室名称不能为空"}), 400
    
    room = ChatRoom(
        name=name,
        description=data.get("description"),
        room_type=data.get("room_type") or "group",
        created_by=user.id
    )
    db.session.add(room)
    db.session.flush()
    
    # 创建者自动成为群主
    member = ChatMember(
        room_id=room.id,
        user_id=user.id,
        role="owner"
    )
    db.session.add(member)
    db.session.commit()
    
    return jsonify(room.to_dict()), 201


@app.route("/chat/rooms/<int:room_id>/join", methods=["POST"])
@jwt_required()
def join_chat_room(room_id: int):
    user = current_user()
    room = ChatRoom.query.get_or_404(room_id)
    
    if not room.is_active:
        return jsonify({"error": "聊天室已关闭"}), 400
    
    # 检查是否已经是成员
    existing_member = ChatMember.query.filter_by(room_id=room_id, user_id=user.id).first()
    if existing_member:
        return jsonify({"message": "已经是聊天室成员"})
    
    member = ChatMember(
        room_id=room_id,
        user_id=user.id,
        role="member"
    )
    db.session.add(member)
    
    # 发送系统消息
    system_message = ChatMessage(
        room_id=room_id,
        sender_id=user.id,
        content=f"{user.username} 加入了聊天室",
        message_type="system"
    )
    db.session.add(system_message)
    
    db.session.commit()
    return jsonify({"message": "成功加入聊天室"})


@app.route("/chat/rooms/<int:room_id>/messages", methods=["GET", "POST"])
@jwt_required()
def chat_messages(room_id: int):
    user = current_user()
    
    # 检查用户是否是聊天室成员
    member = ChatMember.query.filter_by(room_id=room_id, user_id=user.id).first()
    if not member:
        return jsonify({"error": "不是聊天室成员"}), 403
    
    if request.method == "GET":
        # 获取聊天记录
        messages = ChatMessage.query.filter_by(room_id=room_id).order_by(ChatMessage.created_at.desc()).limit(50).all()
        return jsonify([msg.to_dict() for msg in reversed(messages)])
    
    # 发送消息
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "消息内容不能为空"}), 400
    
    message = ChatMessage(
        room_id=room_id,
        sender_id=user.id,
        content=content,
        message_type=data.get("message_type") or "text"
    )
    db.session.add(message)
    db.session.commit()
    
    return jsonify(message.to_dict()), 201


# 好友功能API
@app.route("/friends", methods=["GET"])
@jwt_required()
def get_friends():
    user = current_user()
    
    # 获取已接受的好友关系
    friendships = Friendship.query.filter(
        ((Friendship.user_id == user.id) | (Friendship.friend_id == user.id)) &
        (Friendship.status == "accepted")
    ).all()
    
    friends = []
    for friendship in friendships:
        if friendship.user_id == user.id:
            friend_user = User.query.get(friendship.friend_id)
        else:
            friend_user = User.query.get(friendship.user_id)
        
        if friend_user:
            friends.append({
                "id": friend_user.id,
                "username": friend_user.username,
                "real_name": friend_user.real_name,
                "user_type": friend_user.user_type,
                "friendship_id": friendship.id
            })
    
    return jsonify(friends)


@app.route("/friends/requests", methods=["GET"])
@jwt_required()
def get_friend_requests():
    user = current_user()
    
    # 获取待处理的好友请求
    requests = Friendship.query.filter_by(friend_id=user.id, status="pending").all()
    
    request_list = []
    for req in requests:
        requester = User.query.get(req.user_id)
        if requester:
            request_list.append({
                "id": req.id,
                "user_id": requester.id,
                "username": requester.username,
                "real_name": requester.real_name,
                "user_type": requester.user_type,
                "created_at": req.created_at.isoformat()
            })
    
    return jsonify(request_list)


@app.route("/friends/request", methods=["POST"])
@jwt_required()
def send_friend_request():
    user = current_user()
    data = request.get_json() or {}
    friend_id = data.get("friend_id")
    
    if not friend_id:
        return jsonify({"error": "friend_id 必填"}), 400
    
    if friend_id == user.id:
        return jsonify({"error": "不能添加自己为好友"}), 400
    
    # 检查是否已经是好友
    existing = Friendship.query.filter(
        ((Friendship.user_id == user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == user.id))
    ).first()
    
    if existing:
        return jsonify({"error": "已经是好友或请求已存在"}), 400
    
    friendship = Friendship(
        user_id=user.id,
        friend_id=friend_id,
        status="pending"
    )
    db.session.add(friendship)
    db.session.commit()
    
    return jsonify({"message": "好友请求已发送"})


@app.route("/friends/request/<int:request_id>/accept", methods=["POST"])
@jwt_required()
def accept_friend_request(request_id: int):
    user = current_user()
    
    friendship = Friendship.query.filter_by(id=request_id, friend_id=user.id, status="pending").first()
    if not friendship:
        return jsonify({"error": "好友请求不存在"}), 404
    
    friendship.status = "accepted"
    friendship.accepted_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({"message": "好友请求已接受"})


@app.route("/friends/request/<int:request_id>/reject", methods=["POST"])
@jwt_required()
def reject_friend_request(request_id: int):
    user = current_user()
    
    friendship = Friendship.query.filter_by(id=request_id, friend_id=user.id, status="pending").first()
    if not friendship:
        return jsonify({"error": "好友请求不存在"}), 404
    
    db.session.delete(friendship)
    db.session.commit()
    
    return jsonify({"message": "好友请求已拒绝"})


@app.route("/users/search", methods=["GET"])
@jwt_required()
def search_users():
    user = current_user()
    query = request.args.get("q", "").strip()
    
    if not query:
        return jsonify([])
    
    # 搜索用户（排除自己）
    users = User.query.filter(
        User.username.contains(query),
        User.id != user.id
    ).limit(10).all()
    
    user_list = []
    for u in users:
        # 检查好友关系
        friendship = Friendship.query.filter(
            ((Friendship.user_id == user.id) & (Friendship.friend_id == u.id)) |
            ((Friendship.user_id == u.id) & (Friendship.friend_id == user.id))
        ).first()
        
        status = "none"
        if friendship:
            status = friendship.status
        
        user_list.append({
            "id": u.id,
            "username": u.username,
            "real_name": u.real_name,
            "user_type": u.user_type,
            "friendship_status": status
        })
    
    return jsonify(user_list)


@app.route("/demo/bootstrap", methods=["POST"])
def bootstrap():
    try:
        admin = User.query.filter_by(username="admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@neighbor.com",
                password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
                phone="13800000000",
                real_name="社区管理员",
                user_type="admin",
                is_verified=True,
                interest_tags=json.dumps(["社区管理", "活动组织"]),
                credit_points=1000,
            )
            db.session.add(admin)

        # 创建普通用户
        user = User.query.filter_by(username="zhangsan").first()
        if not user:
            user = User(
                username="zhangsan",
                email="zhangsan@example.com",
                password_hash=bcrypt.generate_password_hash("user123").decode("utf-8"),
                phone="13800000001",
                real_name="张三",
                user_type="user",
                is_verified=True,
                interest_tags=json.dumps(["运动健身", "读书学习"]),
                credit_points=150,
            )
            db.session.add(user)

        # 创建版主用户
        moderator = User.query.filter_by(username="moderator").first()
        if not moderator:
            moderator = User(
                username="moderator",
                email="moderator@neighbor.com",
                password_hash=bcrypt.generate_password_hash("mod123").decode("utf-8"),
                phone="13800000002",
                real_name="李版主",
                user_type="moderator",
                is_verified=True,
                interest_tags=json.dumps(["社区管理", "活动组织"]),
                credit_points=500,
            )
            db.session.add(moderator)

        # 创建商家用户
        merchant = User.query.filter_by(username="merchant").first()
        if not merchant:
            merchant = User(
                username="merchant",
                email="merchant@neighbor.com",
                password_hash=bcrypt.generate_password_hash("mer123").decode("utf-8"),
                phone="13800000003",
                real_name="王商家",
                user_type="merchant",
                is_verified=True,
                interest_tags=json.dumps(["商业服务", "邻里互助"]),
                credit_points=300,
            )
            db.session.add(merchant)

        # 创建VIP用户
        vip_user = User.query.filter_by(username="vipuser").first()
        if not vip_user:
            vip_user = User(
                username="vipuser",
                email="vip@neighbor.com",
                password_hash=bcrypt.generate_password_hash("vip123").decode("utf-8"),
                phone="13800000004",
                real_name="赵VIP",
                user_type="vip_user",
                is_verified=True,
                interest_tags=json.dumps(["高级服务", "品质生活"]),
                credit_points=800,
            )
            db.session.add(vip_user)

        if Announcement.query.count() == 0:
            a = Announcement(
                title="欢迎加入邻里APP",
                content="社区文明共建，互助有你有我。",
                category="公告",
                created_by=admin.id,
            )
            db.session.add(a)

        # 创建一些演示动态
        if Post.query.count() == 0:
            post1 = Post(
                user_id=user.id,
                content="今天天气真好，准备去小区花园散步！有没有邻居一起的？",
                post_type="normal"
            )
            db.session.add(post1)
            
            post2 = Post(
                user_id=admin.id,
                content="社区即将举办春季摄影大赛，欢迎大家踊跃报名参加！",
                post_type="activity"
            )
            db.session.add(post2)

        # 创建一些演示群组
        if Group.query.count() == 0:
            group1 = Group(
                name="摄影爱好者",
                description="分享摄影技巧，交流拍摄心得",
                category="兴趣"
            )
            db.session.add(group1)
            
            group2 = Group(
                name="健身达人",
                description="一起运动，健康生活",
                category="运动"
            )
            db.session.add(group2)

        # 创建一些演示活动
        if Activity.query.count() == 0:
            activity1 = Activity(
                title="春季摄影大赛",
                description="记录春天的美好瞬间，展示你的摄影才华",
                activity_type="比赛",
                start_time=datetime.now() + timedelta(days=7),
                end_time=datetime.now() + timedelta(days=14),
                location="社区活动中心",
                created_by=admin.id
            )
            db.session.add(activity1)

        # 创建一些演示任务
        if Task.query.count() == 0:
            task1 = Task(
                title="帮忙取快递",
                description="今天有事外出，能否帮忙取一下快递？",
                task_type="求助",
                reward_points=10,
                created_by=user.id
            )
            db.session.add(task1)

        # 创建演示聊天室
        if ChatRoom.query.count() == 0:
            # 社区总群
            community_room = ChatRoom(
                name="社区总群",
                description="邻里交流总群，欢迎所有邻居加入",
                room_type="group",
                created_by=admin.id
            )
            db.session.add(community_room)
            db.session.flush()
            
            # 添加成员到社区总群
            for test_user in [admin, user, moderator, merchant, vip_user]:
                member = ChatMember(
                    room_id=community_room.id,
                    user_id=test_user.id,
                    role="owner" if test_user.id == admin.id else "member"
                )
                db.session.add(member)
            
            # 摄影爱好者群
            photo_room = ChatRoom(
                name="摄影爱好者",
                description="分享摄影技巧，交流拍摄心得",
                room_type="group",
                created_by=moderator.id
            )
            db.session.add(photo_room)
            db.session.flush()
            
            # 添加成员到摄影群
            photo_members = [moderator, user, vip_user]
            for test_user in photo_members:
                member = ChatMember(
                    room_id=photo_room.id,
                    user_id=test_user.id,
                    role="owner" if test_user.id == moderator.id else "member"
                )
                db.session.add(member)
            
            # 商家服务群
            merchant_room = ChatRoom(
                name="商家服务群",
                description="商家服务交流群",
                room_type="group",
                created_by=merchant.id
            )
            db.session.add(merchant_room)
            db.session.flush()
            
            # 添加成员到商家群
            merchant_members = [merchant, admin, moderator]
            for test_user in merchant_members:
                member = ChatMember(
                    room_id=merchant_room.id,
                    user_id=test_user.id,
                    role="owner" if test_user.id == merchant.id else "member"
                )
                db.session.add(member)

        # 创建演示聊天消息
        if ChatMessage.query.count() == 0:
            # 社区总群消息
            messages = [
                (community_room.id, admin.id, "欢迎各位邻居加入社区总群！"),
                (community_room.id, user.id, "大家好，我是张三，很高兴认识大家"),
                (community_room.id, moderator.id, "我是版主，有什么问题可以找我"),
                (community_room.id, merchant.id, "我是王商家，提供各种便民服务"),
                (community_room.id, vip_user.id, "大家好，我是VIP用户"),
                (photo_room.id, moderator.id, "欢迎摄影爱好者加入"),
                (photo_room.id, user.id, "有摄影技巧可以分享吗？"),
                (merchant_room.id, merchant.id, "商家服务群正式成立"),
                (merchant_room.id, admin.id, "支持商家服务，促进社区发展")
            ]
            
            for room_id, sender_id, content in messages:
                message = ChatMessage(
                    room_id=room_id,
                    sender_id=sender_id,
                    content=content,
                    message_type="text"
                )
                db.session.add(message)

        # 创建演示好友关系
        if Friendship.query.count() == 0:
            friendships = [
                (user.id, moderator.id, "accepted"),  # 张三和版主是好友
                (user.id, vip_user.id, "accepted"),   # 张三和VIP用户是好友
                (admin.id, merchant.id, "accepted"),  # 管理员和商家是好友
                (moderator.id, merchant.id, "pending"), # 版主向商家发送好友请求
            ]
            
            for user_id, friend_id, status in friendships:
                friendship = Friendship(
                    user_id=user_id,
                    friend_id=friend_id,
                    status=status
                )
                if status == "accepted":
                    friendship.accepted_at = datetime.utcnow()
                db.session.add(friendship)

        db.session.commit()
        return jsonify({
            "message": "演示数据生成完成",
            "users_created": 5,
            "posts_created": 2,
            "groups_created": 2,
            "activities_created": 1,
            "tasks_created": 1,
            "announcements_created": 1,
            "chat_rooms_created": 3,
            "chat_messages_created": 9,
            "friendships_created": 4,
            "test_accounts": {
                "admin": {"username": "admin", "password": "admin123", "role": "管理员"},
                "moderator": {"username": "moderator", "password": "mod123", "role": "版主"},
                "merchant": {"username": "merchant", "password": "mer123", "role": "商家"},
                "vip_user": {"username": "vipuser", "password": "vip123", "role": "VIP用户"},
                "user": {"username": "zhangsan", "password": "user123", "role": "普通用户"}
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"演示数据生成失败: {str(e)}")
        return jsonify({"error": f"演示数据生成失败: {str(e)}"}), 500


# ==================== 新增功能API端点 ====================

# 1. 实时通知系统API (统一使用 /api/notifications 端点)

# 2. 本地商家地图API
@app.route("/businesses", methods=["GET", "POST"])
@jwt_required(optional=True)
def businesses():
    if request.method == "GET":
        businesses = Business.query.filter_by(is_verified=True).all()
        return jsonify([b.to_dict() for b in businesses])
    
    user = current_user()
    if user.user_type not in ["admin", "merchant"]:
        return jsonify({"error": "只有商家和管理员可以创建商家信息"}), 403
    
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "商家名称必填"}), 400
    
    business = Business(
        name=name,
        description=data.get("description"),
        category=data.get("category"),
        address=data.get("address", ""),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        phone=data.get("phone"),
        business_hours=json.dumps(data.get("business_hours") or {}),
        owner_id=user.id,
        is_verified=user.user_type == "admin"
    )
    db.session.add(business)
    db.session.commit()
    return jsonify(business.to_dict()), 201

# 3. 优惠券系统API
@app.route("/coupons", methods=["GET", "POST"])
@jwt_required()
def coupons():
    user = current_user()
    if request.method == "GET":
        if user.user_type in ["admin", "merchant"]:
            # 商家查看自己创建的优惠券
            coupons = Coupon.query.filter_by(created_by=user.id).all()
        else:
            # 用户查看可用的优惠券
            now = datetime.utcnow()
            coupons = Coupon.query.filter(
                Coupon.is_active == True,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now,
                Coupon.used_count < Coupon.usage_limit
            ).all()
        return jsonify([c.to_dict() for c in coupons])
    
    if user.user_type not in ["admin", "merchant"]:
        return jsonify({"error": "只有商家和管理员可以创建优惠券"}), 403
    
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "优惠券标题必填"}), 400
    
    # 生成唯一优惠券代码
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    while Coupon.query.filter_by(code=code).first():
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    coupon = Coupon(
        code=code,
        title=title,
        description=data.get("description"),
        discount_type=data.get("discount_type", "percentage"),
        discount_value=float(data.get("discount_value", 0)),
        min_amount=float(data.get("min_amount", 0)),
        max_discount=data.get("max_discount"),
        valid_from=datetime.fromisoformat(data.get("valid_from")),
        valid_until=datetime.fromisoformat(data.get("valid_until")),
        usage_limit=int(data.get("usage_limit", 1)),
        business_id=data.get("business_id"),
        created_by=user.id
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify(coupon.to_dict()), 201

@app.route("/coupons/<string:code>/claim", methods=["POST"])
@jwt_required()
def claim_coupon(code):
    user = current_user()
    coupon = Coupon.query.filter_by(code=code, is_active=True).first()
    if not coupon:
        return jsonify({"error": "优惠券不存在或已失效"}), 404
    
    now = datetime.utcnow()
    if now < coupon.valid_from or now > coupon.valid_until:
        return jsonify({"error": "优惠券不在有效期内"}), 400
    
    if coupon.used_count >= coupon.usage_limit:
        return jsonify({"error": "优惠券已被领完"}), 400
    
    # 检查用户是否已经领取过
    existing = UserCoupon.query.filter_by(user_id=user.id, coupon_id=coupon.id).first()
    if existing:
        return jsonify({"error": "您已经领取过此优惠券"}), 400
    
    user_coupon = UserCoupon(user_id=user.id, coupon_id=coupon.id)
    coupon.used_count += 1
    db.session.add(user_coupon)
    db.session.commit()
    
    # 发送通知
    notification = Notification(
        user_id=user.id,
        title="优惠券领取成功",
        content=f"您已成功领取优惠券：{coupon.title}",
        notification_type="success"
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({"message": "优惠券领取成功", "coupon": coupon.to_dict()})

# 4. 投票系统API
@app.route("/polls", methods=["GET", "POST"])
@jwt_required(optional=True)
def polls():
    if request.method == "GET":
        polls = Poll.query.filter_by(is_active=True, is_public=True).order_by(Poll.created_at.desc()).all()
        return jsonify([p.to_dict() for p in polls])
    
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "投票标题必填"}), 400
    
    poll = Poll(
        title=title,
        description=data.get("description"),
        poll_type=data.get("poll_type", "single"),
        options=json.dumps(data.get("options") or []),
        end_time=datetime.fromisoformat(data.get("end_time")),
        created_by=user.id,
        is_public=data.get("is_public", True)
    )
    db.session.add(poll)
    db.session.commit()
    return jsonify(poll.to_dict()), 201

@app.route("/polls/<int:poll_id>/vote", methods=["POST"])
@jwt_required()
def vote_poll(poll_id):
    user = current_user()
    poll = Poll.query.get_or_404(poll_id)
    
    if not poll.is_active:
        return jsonify({"error": "投票已结束"}), 400
    
    if datetime.utcnow() > poll.end_time:
        return jsonify({"error": "投票已过期"}), 400
    
    # 检查是否已经投票
    existing_vote = PollVote.query.filter_by(poll_id=poll_id, user_id=user.id).first()
    if existing_vote:
        return jsonify({"error": "您已经参与过此投票"}), 400
    
    data = request.get_json() or {}
    selected_options = data.get("selected_options", [])
    if not selected_options:
        return jsonify({"error": "请选择投票选项"}), 400
    
    vote = PollVote(
        poll_id=poll_id,
        user_id=user.id,
        selected_options=json.dumps(selected_options)
    )
    db.session.add(vote)
    db.session.commit()
    
    return jsonify({"message": "投票成功"})

# 5. 图片分享墙API
@app.route("/photos", methods=["GET", "POST"])
@jwt_required(optional=True)
def photos():
    if request.method == "GET":
        photos = Photo.query.filter_by(is_public=True).order_by(Photo.created_at.desc()).all()
        return jsonify([p.to_dict() for p in photos])
    
    user = current_user()
    data = request.get_json() or {}
    image_url = data.get("image_url")
    if not image_url:
        return jsonify({"error": "图片URL必填"}), 400
    
    photo = Photo(
        user_id=user.id,
        title=data.get("title"),
        description=data.get("description"),
        image_url=image_url,
        thumbnail_url=data.get("thumbnail_url"),
        tags=json.dumps(data.get("tags") or []),
        is_public=data.get("is_public", True)
    )
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201

# 6. 事件日历API
@app.route("/events", methods=["GET", "POST"])
@jwt_required(optional=True)
def events():
    if request.method == "GET":
        events = Event.query.filter_by(is_public=True).order_by(Event.start_time).all()
        return jsonify([e.to_dict() for e in events])
    
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "事件标题必填"}), 400
    
    event = Event(
        title=title,
        description=data.get("description"),
        event_type=data.get("event_type", "community"),
        start_time=datetime.fromisoformat(data.get("start_time")),
        end_time=datetime.fromisoformat(data.get("end_time")),
        location=data.get("location"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        max_participants=data.get("max_participants"),
        created_by=user.id,
        is_public=data.get("is_public", True),
        is_recurring=data.get("is_recurring", False),
        recurrence_rule=data.get("recurrence_rule")
    )
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201

@app.route("/events/<int:event_id>/join", methods=["POST"])
@jwt_required()
def join_event(event_id):
    user = current_user()
    event = Event.query.get_or_404(event_id)
    
    if event.current_participants >= (event.max_participants or float('inf')):
        return jsonify({"error": "活动人数已满"}), 400
    
    existing = EventParticipant.query.filter_by(event_id=event_id, user_id=user.id).first()
    if existing:
        return jsonify({"error": "您已经报名参加此活动"}), 400
    
    participant = EventParticipant(
        event_id=event_id,
        user_id=user.id,
        status="confirmed"
    )
    event.current_participants += 1
    db.session.add(participant)
    db.session.commit()
    
    return jsonify({"message": "报名成功"})

# 7. 二手交易平台API
@app.route("/marketplace", methods=["GET", "POST"])
@jwt_required(optional=True)
def marketplace():
    if request.method == "GET":
        items = MarketplaceItem.query.filter_by(is_sold=False).order_by(MarketplaceItem.created_at.desc()).all()
        return jsonify([i.to_dict() for i in items])
    
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "商品标题必填"}), 400
    
    item = MarketplaceItem(
        title=title,
        description=data.get("description"),
        category=data.get("category"),
        price=float(data.get("price", 0)),
        original_price=data.get("original_price"),
        condition=data.get("condition", "good"),
        images=json.dumps(data.get("images") or []),
        seller_id=user.id,
        is_negotiable=data.get("is_negotiable", True),
        location=data.get("location"),
        contact_phone=data.get("contact_phone")
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

# 8. 技能交换系统API
@app.route("/skills", methods=["GET", "POST"])
@jwt_required(optional=True)
def skills():
    if request.method == "GET":
        skills = Skill.query.all()
        return jsonify([s.to_dict() for s in skills])
    
    user = current_user()
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "技能名称必填"}), 400
    
    skill = Skill(
        name=name,
        category=data.get("category"),
        description=data.get("description"),
        level=data.get("level", "intermediate"),
        user_id=user.id,
        is_teaching=data.get("is_teaching", True),
        is_learning=data.get("is_learning", False),
        hourly_rate=data.get("hourly_rate"),
        is_free=data.get("is_free", True)
    )
    db.session.add(skill)
    db.session.commit()
    return jsonify(skill.to_dict()), 201

@app.route("/skills/<int:skill_id>/request", methods=["POST"])
@jwt_required()
def request_skill(skill_id):
    user = current_user()
    skill = Skill.query.get_or_404(skill_id)
    
    if skill.user_id == user.id:
        return jsonify({"error": "不能向自己请求技能"}), 400
    
    data = request.get_json() or {}
    request_obj = SkillRequest(
        requester_id=user.id,
        provider_id=skill.user_id,
        skill_id=skill_id,
        message=data.get("message"),
        scheduled_time=datetime.fromisoformat(data.get("scheduled_time")) if data.get("scheduled_time") else None,
        duration_hours=float(data.get("duration_hours", 1.0))
    )
    db.session.add(request_obj)
    db.session.commit()
    
    return jsonify({"message": "技能请求已发送"})

# 9. 社区统计API
@app.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    user = current_user()
    if user.user_type != "admin":
        return jsonify({"error": "需要管理员权限"}), 403
    
    total_users = User.query.count()
    total_posts = Post.query.count()
    total_activities = Activity.query.count()
    total_tasks = Task.query.count()
    
    # 今日活跃用户
    today = datetime.utcnow().date()
    today_activities = UserActivity.query.filter(
        db.func.date(UserActivity.created_at) == today
    ).distinct(UserActivity.user_id).count()
    
    stats = {
        "total_users": total_users,
        "total_posts": total_posts,
        "total_activities": total_activities,
        "total_tasks": total_tasks,
        "today_active_users": today_activities
    }
    
    return jsonify(stats)

# 10. 社区小游戏API
@app.route("/games", methods=["GET"])
def get_games():
    games = Game.query.filter_by(is_active=True).all()
    return jsonify([g.to_dict() for g in games])

@app.route("/games/<int:game_id>/score", methods=["POST"])
@jwt_required()
def submit_game_score(game_id):
    user = current_user()
    game = Game.query.get_or_404(game_id)
    
    data = request.get_json() or {}
    score = int(data.get("score", 0))
    if score <= 0:
        return jsonify({"error": "分数必须大于0"}), 400
    
    game_score = GameScore(
        game_id=game_id,
        user_id=user.id,
        score=score,
        level=int(data.get("level", 1)),
        time_spent=data.get("time_spent"),
        game_data=json.dumps(data.get("game_data") or {})
    )
    db.session.add(game_score)
    
    # 奖励积分
    award_points(user, game.reward_points, f"游戏奖励: {game.name}")
    db.session.commit()
    
    return jsonify({"message": "分数提交成功", "points_earned": game.reward_points})

# 11. 抽奖系统API
@app.route("/lotteries", methods=["GET", "POST"])
@jwt_required(optional=True)
def lotteries():
    if request.method == "GET":
        now = datetime.utcnow()
        active_lotteries = Lottery.query.filter(
            Lottery.is_active == True,
            Lottery.draw_time > now
        ).all()
        return jsonify([l.to_dict() for l in active_lotteries])
    
    user = current_user()
    if user.user_type != "admin":
        return jsonify({"error": "只有管理员可以创建抽奖"}), 403
    
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "抽奖名称必填"}), 400
    
    lottery = Lottery(
        name=name,
        description=data.get("description"),
        prize_pool=json.dumps(data.get("prize_pool") or []),
        entry_cost=int(data.get("entry_cost", 0)),
        max_entries=data.get("max_entries"),
        draw_time=datetime.fromisoformat(data.get("draw_time")),
        created_by=user.id
    )
    db.session.add(lottery)
    db.session.commit()
    return jsonify(lottery.to_dict()), 201

@app.route("/lotteries/<int:lottery_id>/enter", methods=["POST"])
@jwt_required()
def enter_lottery(lottery_id):
    user = current_user()
    lottery = Lottery.query.get_or_404(lottery_id)
    
    if not lottery.is_active:
        return jsonify({"error": "抽奖已结束"}), 400
    
    if datetime.utcnow() > lottery.draw_time:
        return jsonify({"error": "抽奖已过期"}), 400
    
    if lottery.max_entries and lottery.current_entries >= lottery.max_entries:
        return jsonify({"error": "抽奖人数已满"}), 400
    
    if user.credit_points < lottery.entry_cost:
        return jsonify({"error": "积分不足"}), 400
    
    # 检查是否已经参与
    existing = LotteryEntry.query.filter_by(lottery_id=lottery_id, user_id=user.id).first()
    if existing:
        return jsonify({"error": "您已经参与过此抽奖"}), 400
    
    # 扣除积分
    user.credit_points -= lottery.entry_cost
    
    entry = LotteryEntry(
        lottery_id=lottery_id,
        user_id=user.id,
        entry_number=lottery.current_entries + 1
    )
    lottery.current_entries += 1
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({"message": "参与成功", "entry_number": entry.entry_number})



# 13. 社区问答系统API
@app.route("/questions", methods=["GET", "POST"])
@jwt_required(optional=True)
def questions():
    if request.method == "GET":
        questions = Question.query.order_by(Question.created_at.desc()).all()
        return jsonify([q.to_dict() for q in questions])
    
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "问题标题必填"}), 400
    
    question = Question(
        title=title,
        content=data.get("content", ""),
        category=data.get("category"),
        tags=json.dumps(data.get("tags") or []),
        user_id=user.id
    )
    db.session.add(question)
    db.session.commit()
    return jsonify(question.to_dict()), 201

@app.route("/questions/<int:question_id>/answers", methods=["GET", "POST"])
@jwt_required(optional=True)
def answers(question_id):
    question = Question.query.get_or_404(question_id)
    
    if request.method == "GET":
        answers = Answer.query.filter_by(question_id=question_id).order_by(Answer.created_at).all()
        return jsonify([a.to_dict() for a in answers])
    
    user = current_user()
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "回答内容必填"}), 400
    
    answer = Answer(
        question_id=question_id,
        content=content,
        user_id=user.id
    )
    question.answers_count += 1
    db.session.add(answer)
    db.session.commit()
    return jsonify(answer.to_dict()), 201

# 14. 社区活动签到系统API
@app.route("/events/<int:event_id>/checkin", methods=["POST"])
@jwt_required()
def event_checkin(event_id):
    user = current_user()
    event = Event.query.get_or_404(event_id)
    
    # 检查是否已经签到
    existing = EventCheckIn.query.filter_by(event_id=event_id, user_id=user.id).first()
    if existing:
        return jsonify({"error": "您已经签到过此活动"}), 400
    
    data = request.get_json() or {}
    checkin = EventCheckIn(
        event_id=event_id,
        user_id=user.id,
        location_latitude=data.get("latitude"),
        location_longitude=data.get("longitude"),
        points_earned=10  # 签到奖励10积分
    )
    
    # 奖励积分
    award_points(user, 10, f"活动签到奖励: {event.title}")
    
    db.session.add(checkin)
    db.session.commit()
    
    return jsonify({"message": "签到成功", "points_earned": 10})

# ==================== 游戏化功能API端点 ====================

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    period = request.args.get('period', 'all')
    
    if period == 'week':
        # Get users with most points earned this week
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        users = User.query.join(PointTransaction).filter(
            PointTransaction.created_at >= week_ago
        ).group_by(User.id).order_by(
            db.func.sum(PointTransaction.amount).desc()
        ).limit(50).all()
    elif period == 'month':
        # Get users with most points earned this month
        from datetime import datetime, timedelta
        month_ago = datetime.utcnow() - timedelta(days=30)
        users = User.query.join(PointTransaction).filter(
            PointTransaction.created_at >= month_ago
        ).group_by(User.id).order_by(
            db.func.sum(PointTransaction.amount).desc()
        ).limit(50).all()
    else:
        # Get all users ordered by total points
        users = User.query.order_by(User.credit_points.desc()).limit(50).all()
    
    leaderboard = []
    for i, user in enumerate(users, 1):
        leaderboard.append({
            "id": user.id,
            "username": user.username,
            "points": user.credit_points,
            "rank": i
        })
    
    return jsonify(leaderboard)


@app.route("/api/achievements", methods=["GET"])
@jwt_required()
def get_achievements():
    user = current_user()
    
    # Get all achievements
    achievements = Achievement.query.all()
    
    # Get user's unlocked achievements
    user_achievements = UserAchievement.query.filter_by(user_id=user.id).all()
    unlocked_ids = {ua.achievement_id for ua in user_achievements}
    
    result = []
    for achievement in achievements:
        achievement_dict = achievement.to_dict()
        achievement_dict["unlocked"] = achievement.id in unlocked_ids
        result.append(achievement_dict)
    
    return jsonify(result)


@app.route("/api/user/stats", methods=["GET"])
@jwt_required()
def get_user_stats():
    user = current_user()
    
    # Calculate user rank
    rank = User.query.filter(User.credit_points > user.credit_points).count() + 1
    
    # Count achievements
    achievements_count = UserAchievement.query.filter_by(user_id=user.id).count()
    
    return jsonify({
        "points": user.credit_points,
        "rank": rank,
        "achievements": achievements_count
    })


@app.route("/api/quests", methods=["GET", "POST"])
@jwt_required()
def get_quests():
    if request.method == "GET":
        user = current_user()
        category = request.args.get('category', 'all')
        
        query = Quest.query.filter_by(is_active=True)
        if category != 'all':
            query = query.filter_by(quest_type=category)
        
        quests = query.all()
        return jsonify([quest.to_dict() for quest in quests])
    
    elif request.method == "POST":
        user = current_user()
        data = request.json
        
        # 创建新任务
        quest = Quest(
            title=data.get('title'),
            description=data.get('description'),
            quest_type=data.get('category', 'daily'),
            target=data.get('target', 1),
            reward=data.get('reward_points', 10),
            category=data.get('category', 'general'),
            is_active=True,
            is_repeatable=data.get('is_repeatable', True)
        )
        
        db.session.add(quest)
        db.session.commit()
        
        return jsonify(quest.to_dict()), 201


@app.route("/api/user/quests", methods=["GET"])
@jwt_required()
def get_user_quests():
    user = current_user()
    
    user_quests = UserQuest.query.filter_by(user_id=user.id).all()
    return jsonify([uq.to_dict() for uq in user_quests])


@app.route("/api/quests/<int:quest_id>/accept", methods=["POST"])
@jwt_required()
def accept_quest(quest_id):
    user = current_user()
    quest = Quest.query.get_or_404(quest_id)
    
    # Check if user already has this quest
    existing_quest = UserQuest.query.filter_by(
        user_id=user.id, quest_id=quest_id
    ).first()
    
    if existing_quest:
        return jsonify({"error": "Quest already accepted"}), 400
    
    # Create user quest
    user_quest = UserQuest(
        user_id=user.id,
        quest_id=quest_id,
        progress=0
    )
    
    db.session.add(user_quest)
    db.session.commit()
    
    return jsonify(user_quest.to_dict()), 201


@app.route("/api/quests/<int:quest_id>/complete", methods=["POST"])
@jwt_required()
def complete_quest(quest_id):
    user = current_user()
    
    user_quest = UserQuest.query.filter_by(
        user_id=user.id, quest_id=quest_id
    ).first_or_404()
    
    if user_quest.completed:
        return jsonify({"error": "Quest already completed"}), 400
    
    if user_quest.progress < user_quest.quest.target:
        return jsonify({"error": "Quest target not reached"}), 400
    
    # Mark quest as completed
    user_quest.completed = True
    user_quest.completed_at = datetime.utcnow()
    
    # Award points
    award_points(user, user_quest.quest.reward, f"Quest completed: {user_quest.quest.title}")
    
    db.session.commit()
    
    return jsonify(user_quest.to_dict())


@app.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user = current_user()
    
    notifications = Notification.query.filter_by(user_id=user.id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    
    unread_count = Notification.query.filter_by(
        user_id=user.id, is_read=False
    ).count()
    
    return jsonify({
        "notifications": [notif.to_dict() for notif in notifications],
        "unread_count": unread_count
    })


@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    user = current_user()
    
    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first_or_404()
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify(notification.to_dict())


@app.route("/api/notifications/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_read():
    user = current_user()
    
    Notification.query.filter_by(user_id=user.id, is_read=False).update({
        "is_read": True
    })
    db.session.commit()
    
    return jsonify({"message": "All notifications marked as read"})


@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    user = current_user()
    
    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first_or_404()
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({"message": "Notification deleted"})


@app.route("/api/images", methods=["GET"])
@jwt_required(optional=True)
def get_images():
    filter_type = request.args.get('filter', 'all')
    user = current_user() if request.headers.get('Authorization') else None
    
    query = Image.query.filter_by(is_public=True)
    
    if filter_type == 'recent':
        query = query.order_by(Image.created_at.desc())
    elif filter_type == 'popular':
        query = query.order_by(Image.likes.desc())
    elif filter_type == 'mine' and user:
        query = Image.query.filter_by(user_id=user.id)
    
    images = query.limit(50).all()
    
    result = []
    for image in images:
        image_dict = image.to_dict()
        
        # Check if current user liked this image
        if user:
            liked = ImageLike.query.filter_by(
                image_id=image.id, user_id=user.id
            ).first() is not None
            image_dict["liked"] = liked
        
        # Load comments
        comments = ImageComment.query.filter_by(image_id=image.id).limit(10).all()
        image_dict["comments"] = [comment.to_dict() for comment in comments]
        
        result.append(image_dict)
    
    return jsonify(result)


@app.route("/api/images/upload", methods=["POST"])
@jwt_required()
def upload_images():
    user = current_user()
    
    if 'images' not in request.files:
        return jsonify({"error": "No images provided"}), 400
    
    files = request.files.getlist('images')
    uploaded_images = []
    
    for file in files:
        if file.filename == '':
            continue
        
        # For demo purposes, we'll just save the filename
        # In production, you'd want to save to cloud storage
        filename = f"image_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        image = Image(
            user_id=user.id,
            title=request.form.get('title', ''),
            description=request.form.get('description', ''),
            url=f"/uploads/{filename}",
            tags=json.dumps(request.form.get('tags', '').split(','))
        )
        
        db.session.add(image)
        uploaded_images.append(image)
    
    db.session.commit()
    
    return jsonify([img.to_dict() for img in uploaded_images])


@app.route("/api/images/<int:image_id>/like", methods=["POST"])
@jwt_required()
def like_image(image_id):
    user = current_user()
    image = Image.query.get_or_404(image_id)
    
    # Check if already liked
    existing_like = ImageLike.query.filter_by(
        image_id=image_id, user_id=user.id
    ).first()
    
    if existing_like:
        return jsonify({"error": "Already liked"}), 400
    
    # Create like
    like = ImageLike(image_id=image_id, user_id=user.id)
    db.session.add(like)
    
    # Update image like count
    image.likes += 1
    
    db.session.commit()
    
    return jsonify({"message": "Image liked"})


@app.route("/api/images/<int:image_id>/like", methods=["DELETE"])
@jwt_required()
def unlike_image(image_id):
    user = current_user()
    
    like = ImageLike.query.filter_by(
        image_id=image_id, user_id=user.id
    ).first_or_404()
    
    db.session.delete(like)
    
    # Update image like count
    image = Image.query.get(image_id)
    if image:
        image.likes = max(0, image.likes - 1)
    
    db.session.commit()
    
    return jsonify({"message": "Image unliked"})


@app.route("/api/images/<int:image_id>/comments", methods=["POST"])
@jwt_required()
def add_image_comment(image_id):
    user = current_user()
    image = Image.query.get_or_404(image_id)
    
    data = request.get_json()
    comment_text = data.get('comment', '').strip()
    
    if not comment_text:
        return jsonify({"error": "Comment cannot be empty"}), 400
    
    comment = ImageComment(
        image_id=image_id,
        user_id=user.id,
        comment=comment_text
    )
    
    db.session.add(comment)
    
    # Update image comment count
    image.comments_count += 1
    
    db.session.commit()
    
    return jsonify(comment.to_dict()), 201


@app.route("/api/images/<int:image_id>", methods=["DELETE"])
@jwt_required()
def delete_image(image_id):
    user = current_user()
    image = Image.query.filter_by(id=image_id, user_id=user.id).first_or_404()
    
    db.session.delete(image)
    db.session.commit()
    
    return jsonify({"message": "Image deleted"})


# ==================== Socket.io 事件处理 ====================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('status', {'msg': f'Joined room: {room}'}, room=room)

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room')
    if room:
        leave_room(room)
        emit('status', {'msg': f'Left room: {room}'}, room=room)

@socketio.on('send_message')
def handle_send_message(data):
    room = data.get('room')
    message = data.get('message')
    user_id = data.get('user_id')
    
    if room and message and user_id:
        # 保存消息到数据库
        chat_message = ChatMessage(
            room_id=int(room),
            sender_id=int(user_id),
            content=message
        )
        db.session.add(chat_message)
        db.session.commit()
        
        # 广播消息给房间内所有用户
        emit('new_message', {
            'id': chat_message.id,
            'content': message,
            'sender_id': user_id,
            'created_at': chat_message.created_at.isoformat()
        }, room=room)

@socketio.on('send_notification')
def handle_send_notification(data):
    user_id = data.get('user_id')
    title = data.get('title')
    content = data.get('content')
    notification_type = data.get('type', 'info')
    
    if user_id and title and content:
        notification = Notification(
            user_id=int(user_id),
            title=title,
            content=content,
            notification_type=notification_type
        )
        db.session.add(notification)
        db.session.commit()
        
        # 发送实时通知给指定用户
        emit('new_notification', notification.to_dict(), room=f'user_{user_id}')

# 敏感词检查API
@app.route("/api/content/check", methods=["POST"])
@jwt_required()
def check_content():
    """检查内容是否包含敏感词"""
    data = request.get_json()
    content = data.get('content', '')
    
    if not content:
        return jsonify({"error": "内容不能为空"}), 400
    
    result = check_sensitive_content(content)
    return jsonify(result)

# 敏感词管理API
@app.route("/api/admin/sensitive-words", methods=["GET"])
@jwt_required()
def get_sensitive_words():
    """获取敏感词列表（仅管理员）"""
    user = current_user()
    if not has_role(user, ROLES.ADMIN):
        return jsonify({"error": "权限不足"}), 403
    
    return jsonify({
        "sensitive_words": chinese_sensitive_words,
        "total_count": len(chinese_sensitive_words)
    })

@app.route("/api/admin/sensitive-words", methods=["POST"])
@jwt_required()
def add_sensitive_word():
    """添加敏感词（仅管理员）"""
    user = current_user()
    if not has_role(user, ROLES.ADMIN):
        return jsonify({"error": "权限不足"}), 403
    
    data = request.get_json()
    word = data.get('word', '').strip()
    
    if not word:
        return jsonify({"error": "敏感词不能为空"}), 400
    
    if word in chinese_sensitive_words:
        return jsonify({"error": "敏感词已存在"}), 400
    
    chinese_sensitive_words.append(word)
    
    # valx会自动使用更新后的chinese_sensitive_words列表
    
    return jsonify({"message": "敏感词添加成功", "word": word})

@app.route("/api/admin/sensitive-words/<word>", methods=["DELETE"])
@jwt_required()
def delete_sensitive_word(word):
    """删除敏感词（仅管理员）"""
    user = current_user()
    if not has_role(user, ROLES.ADMIN):
        return jsonify({"error": "权限不足"}), 403
    
    if word not in chinese_sensitive_words:
        return jsonify({"error": "敏感词不存在"}), 404
    
    chinese_sensitive_words.remove(word)
    
    # valx会自动使用更新后的chinese_sensitive_words列表
    
    return jsonify({"message": "敏感词删除成功", "word": word})

def _ensure_db_initialized():
    with app.app_context():
        db.create_all()
        print("Database initialized")


# 添加缺失的API端点

@app.route("/image-wall", methods=["GET"])
@jwt_required(optional=True)
def get_image_wall():
    """获取图片墙数据"""
    user = current_user() if request.headers.get('Authorization') else None
    
    # 获取公开的图片
    images = Image.query.filter_by(is_public=True).order_by(Image.created_at.desc()).limit(50).all()
    
    result = []
    for image in images:
        image_dict = image.to_dict()
        
        # 检查当前用户是否点赞
        if user:
            liked = ImageLike.query.filter_by(
                image_id=image.id, user_id=user.id
            ).first() is not None
            image_dict["liked"] = liked
        
        # 加载评论
        comments = ImageComment.query.filter_by(image_id=image.id).limit(10).all()
        image_dict["comments"] = [comment.to_dict() for comment in comments]
        
        result.append(image_dict)
    
    return jsonify(result)


@app.route("/image-wall/upload", methods=["POST"])
@jwt_required()
def upload_image_wall():
    """上传图片到图片墙"""
    user = current_user()
    
    if 'images' not in request.files:
        return jsonify({"error": "No images provided"}), 400
    
    files = request.files.getlist('images')
    uploaded_images = []
    
    for file in files:
        if file.filename == '':
            continue
        
        # 生成文件名
        filename = f"image_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        image = Image(
            user_id=user.id,
            title=request.form.get('title', ''),
            description=request.form.get('description', ''),
            url=f"/uploads/{filename}",
            tags=json.dumps(request.form.get('tags', '').split(','))
        )
        
        db.session.add(image)
        uploaded_images.append(image)
    
    db.session.commit()
    
    return jsonify([img.to_dict() for img in uploaded_images])


@app.route("/image-wall/<int:image_id>/like", methods=["POST"])
@jwt_required()
def like_image_wall(image_id):
    """点赞图片墙图片"""
    user = current_user()
    image = Image.query.get_or_404(image_id)
    
    # 检查是否已经点赞
    existing_like = ImageLike.query.filter_by(
        image_id=image_id, user_id=user.id
    ).first()
    
    if existing_like:
        return jsonify({"error": "Already liked"}), 400
    
    # 创建点赞
    like = ImageLike(image_id=image_id, user_id=user.id)
    db.session.add(like)
    
    # 更新图片点赞数
    image.likes += 1
    
    db.session.commit()
    
    return jsonify({"message": "Image liked"})


@app.route("/real-time-notifications", methods=["GET"])
@jwt_required()
def get_real_time_notifications():
    """获取实时通知"""
    user = current_user()
    
    # 获取用户的通知
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(50).all()
    
    return jsonify([notification.to_dict() for notification in notifications])


@app.route("/real-time-notifications/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_real_time_notification_read(notification_id):
    """标记实时通知为已读"""
    user = current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first_or_404()
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({"message": "Notification marked as read"})


@app.route("/real-time-notifications/settings", methods=["PUT"])
@jwt_required()
def update_notification_settings():
    """更新通知设置"""
    user = current_user()
    settings = request.json
    
    # 这里可以添加用户通知设置的逻辑
    # 暂时返回成功
    return jsonify({"message": "Settings updated"})


@app.route("/coupons/<int:coupon_id>/use", methods=["POST"])
@jwt_required()
def use_coupon(coupon_id):
    """使用优惠券"""
    user = current_user()
    
    # 检查用户是否拥有该优惠券
    user_coupon = UserCoupon.query.filter_by(
        user_id=user.id, 
        coupon_id=coupon_id,
        is_used=False
    ).first()
    
    if not user_coupon:
        return jsonify({"error": "Coupon not found or already used"}), 404
    
    # 标记为已使用
    user_coupon.is_used = True
    user_coupon.used_at = datetime.utcnow()
    
    # 更新优惠券使用次数
    coupon = user_coupon.coupon
    coupon.used_count += 1
    
    db.session.commit()
    
    return jsonify({"message": "Coupon used successfully"})


if __name__ == "__main__":
    _ensure_db_initialized()
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)


