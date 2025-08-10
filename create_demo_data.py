#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
创建演示数据
"""

from app import app, db, User, Post, Group, Activity, Task, Announcement
from flask_bcrypt import Bcrypt
import json
from datetime import datetime, timedelta

bcrypt = Bcrypt(app)

def create_demo_data():
    with app.app_context():
        try:
            # 清空现有数据
            print("正在清空现有数据...")
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
            
            # 提交用户数据
            db.session.commit()
            
            # 创建演示动态
            post1 = Post(
                user_id=user.id,
                content='今天天气真好，准备去小区花园散步！有没有邻居一起的？',
                post_type='normal'
            )
            db.session.add(post1)
            
            post2 = Post(
                user_id=admin.id,
                content='社区即将举办春季摄影大赛，欢迎大家踊跃报名参加！',
                post_type='activity'
            )
            db.session.add(post2)
            
            # 创建演示群组
            group1 = Group(
                name='摄影爱好者',
                description='分享摄影技巧，交流拍摄心得',
                category='兴趣'
            )
            db.session.add(group1)
            
            group2 = Group(
                name='健身达人',
                description='一起运动，健康生活',
                category='运动'
            )
            db.session.add(group2)
            
            # 创建演示活动
            activity1 = Activity(
                title='春季摄影大赛',
                description='记录春天的美好瞬间，展示你的摄影才华',
                activity_type='比赛',
                start_time=datetime.now() + timedelta(days=7),
                end_time=datetime.now() + timedelta(days=14),
                location='社区活动中心',
                created_by=admin.id
            )
            db.session.add(activity1)
            
            # 创建演示任务
            task1 = Task(
                title='帮忙取快递',
                description='今天有事外出，能否帮忙取一下快递？',
                task_type='求助',
                reward_points=10,
                created_by=user.id
            )
            db.session.add(task1)
            
            # 创建演示公告
            announcement1 = Announcement(
                title='欢迎加入邻里APP',
                content='社区文明共建，互助有你有我。让我们一起打造温馨和谐的邻里关系！',
                category='公告',
                created_by=admin.id
            )
            db.session.add(announcement1)
            
            # 创建游戏化功能演示数据
            
            # 创建成就
            achievements = [
                Achievement(
                    name='首次登录',
                    description='欢迎加入邻里社区！',
                    category='social',
                    points_reward=10,
                    criteria=json.dumps({'type': 'login', 'count': 1})
                ),
                Achievement(
                    name='活跃用户',
                    description='发布10条动态',
                    category='activity',
                    points_reward=50,
                    criteria=json.dumps({'type': 'post', 'count': 10})
                ),
                Achievement(
                    name='热心助人',
                    description='完成5个任务',
                    category='social',
                    points_reward=100,
                    criteria=json.dumps({'type': 'task_complete', 'count': 5})
                ),
                Achievement(
                    name='摄影达人',
                    description='上传5张照片',
                    category='activity',
                    points_reward=80,
                    criteria=json.dumps({'type': 'photo_upload', 'count': 5})
                )
            ]
            
            for achievement in achievements:
                db.session.add(achievement)
            
            # 创建任务
            quests = [
                Quest(
                    title='每日签到',
                    description='每天登录APP获得积分奖励',
                    quest_type='daily',
                    target=1,
                    reward=5,
                    category='social'
                ),
                Quest(
                    title='发布动态',
                    description='分享你的生活点滴',
                    quest_type='daily',
                    target=1,
                    reward=10,
                    category='activity'
                ),
                Quest(
                    title='帮助邻居',
                    description='完成一个求助任务',
                    quest_type='weekly',
                    target=1,
                    reward=20,
                    category='social'
                ),
                Quest(
                    title='参与活动',
                    description='参加社区活动',
                    quest_type='event',
                    target=1,
                    reward=30,
                    category='activity'
                )
            ]
            
            for quest in quests:
                db.session.add(quest)
            
            # 创建游戏
            games = [
                Game(
                    name='社区问答',
                    game_type='quiz',
                    description='测试你对社区的了解程度',
                    rules='回答社区相关问题，答对获得积分',
                    reward_points=15
                ),
                Game(
                    name='记忆翻牌',
                    game_type='puzzle',
                    description='考验记忆力的翻牌游戏',
                    rules='翻开相同的卡片配对，完成所有配对获得奖励',
                    reward_points=20
                )
            ]
            
            for game in games:
                db.session.add(game)
            
            # 创建抽奖活动
            lottery = Lottery(
                name='春季大抽奖',
                description='参与抽奖，赢取丰厚奖品',
                prize_pool=json.dumps([
                    {'name': '一等奖', 'description': 'iPhone 15', 'probability': 0.01},
                    {'name': '二等奖', 'description': 'AirPods', 'probability': 0.05},
                    {'name': '三等奖', 'description': '100积分', 'probability': 0.2},
                    {'name': '参与奖', 'description': '10积分', 'probability': 0.74}
                ]),
                entry_cost=50,
                max_entries=100,
                draw_time=datetime.now() + timedelta(days=30),
                created_by=admin.id
            )
            db.session.add(lottery)
            
            # 创建演示图片
            demo_images = [
                Image(
                    user_id=user.id,
                    title='春天的花朵',
                    description='小区花园里的美丽花朵',
                    url='https://picsum.photos/400/300?random=1',
                    tags=json.dumps(['春天', '花朵', '自然']),
                    likes=5,
                    comments_count=2
                ),
                Image(
                    user_id=admin.id,
                    title='社区活动',
                    description='大家一起参加社区活动',
                    url='https://picsum.photos/400/300?random=2',
                    tags=json.dumps(['社区', '活动', '邻里']),
                    likes=8,
                    comments_count=3
                )
            ]
            
            for image in demo_images:
                db.session.add(image)
            
            # 提交所有数据
            db.session.commit()
            
            print("✅ 演示数据创建完成！")
            print("\n登录信息：")
            print("管理员账号：admin / admin123")
            print("普通用户账号：zhangsan / user123")
            print("\n演示内容：")
            print("- 2个用户（管理员和普通用户）")
            print("- 2条动态")
            print("- 2个群组")
            print("- 1个活动")
            print("- 1个任务")
            print("- 1个公告")
            print("- 4个成就")
            print("- 4个任务挑战")
            print("- 2个小游戏")
            print("- 1个抽奖活动")
            print("- 2张演示图片")
            
        except Exception as e:
            print(f"❌ 创建演示数据失败：{str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    create_demo_data()
