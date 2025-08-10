#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
创建演示数据
"""

from app import app, db, User
from flask_bcrypt import Bcrypt
import json

bcrypt = Bcrypt(app)

def create_demo_data():
    with app.app_context():
        # 清空现有数据
        db.drop_all()
        db.create_all()
        
        print("正在创建演示数据...")
        
        # 创建管理员用户
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin = User(
            username='admin',
            email='admin@neighbor.com',
            phone='13800000000',
            password_hash=admin_password,
            real_name='社区管理员',
            interest_tags=json.dumps(['社区管理', '活动组织']),
            credit_points=1000,
            user_type='admin',
            is_verified=True
        )
        db.session.add(admin)
        
        # 创建普通用户
        user_password = bcrypt.generate_password_hash('user123').decode('utf-8')
        user = User(
            username='zhangsan',
            email='zhangsan@example.com',
            phone='13800000001',
            password_hash=user_password,
            real_name='张三',
            interest_tags=json.dumps(['运动健身', '读书学习']),
            credit_points=150,
            user_type='user',
            is_verified=True
        )
        db.session.add(user)
        
        db.session.commit()
        
        print("✅ 演示数据创建完成！")
        print("\n登录信息：")
        print("管理员账号：admin / admin123")
        print("普通用户账号：zhangsan / user123")

if __name__ == '__main__':
    create_demo_data()
