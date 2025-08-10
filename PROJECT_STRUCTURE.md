# NearUs邻里APP - 项目结构说明

## 📁 项目目录结构

```
NearUs/
├── app.py                          # Flask后端主文件
├── requirements.txt                 # Python依赖包列表
├── README.md                       # 项目说明文档
├── LEARNING_GUIDE.md              # 学习指南
├── PROJECT_STRUCTURE.md           # 项目结构说明（本文件）
├── start_app.bat                   # 启动脚本
├── start_frontend.ps1              # 前端启动脚本
├── start_backend.ps1               # 后端启动脚本
├── create_demo.bat                 # 创建演示数据脚本
├── fix_venv.bat                    # 修复虚拟环境脚本
├── venv/                           # Python虚拟环境
├── instance/                       # 数据库文件目录
│   └── nearus.db                   # SQLite数据库文件
├── frontend/                       # React前端项目
│   ├── package.json               # Node.js依赖配置
│   ├── webpack.config.js          # Webpack配置
│   ├── public/                    # 静态资源
│   └── src/                       # React源代码
│       ├── index.js               # 主入口文件
│       ├── index.css              # 全局样式
│       ├── contexts/              # React Context
│       │   ├── AuthContext.js     # 认证上下文
│       │   └── ToastContext.js    # 通知上下文
│       └── components/            # React组件
│           ├── BusinessMap.js     # 商家地图组件
│           ├── Coupons.js         # 优惠券组件
│           ├── ImageWall.js       # 图片墙组件
│           ├── Leaderboard.js     # 排行榜组件
│           ├── Notifications.js   # 通知组件
│           ├── Polls.js           # 投票组件
│           ├── Quest.js           # 任务挑战组件
│           └── RealTimeNotifications.js # 实时通知组件
└── uploads/                        # 文件上传目录
```

## 🏗️ 架构说明

### 后端架构 (Flask)

**核心文件：**
- `app.py`: 主应用文件，包含所有路由和业务逻辑

**主要模块：**
1. **数据库模型** (第144-1178行)
   - User: 用户模型
   - Post: 帖子模型
   - Group: 群组模型
   - Activity: 活动模型
   - Task: 任务模型
   - Notification: 通知模型
   - Business: 商家模型
   - Coupon: 优惠券模型
   - Poll: 投票模型
   - Image: 图片模型
   - Quest: 任务挑战模型

2. **API路由** (第1210-3300行)
   - 认证相关: `/auth/login`, `/auth/register`
   - 用户相关: `/users/me`, `/users/search`
   - 内容相关: `/posts`, `/groups`, `/activities`
   - 功能相关: `/businesses`, `/coupons`, `/polls`, `/quests`
   - 实时通信: WebSocket事件处理

3. **中间件和工具函数**
   - JWT认证装饰器
   - 敏感词过滤
   - 错误处理

### 前端架构 (React)

**核心文件：**
- `frontend/src/index.js`: 主入口文件，包含路由和主要组件

**主要模块：**
1. **Context管理**
   - AuthContext: 用户认证状态管理
   - ToastContext: 通知消息管理

2. **页面组件**
   - Home: 首页
   - Login/Register: 登录注册
   - Posts: 动态发布
   - Groups: 群组管理
   - Activities: 活动管理
   - Tasks: 任务管理
   - Chat: 聊天功能
   - Friends: 好友管理
   - Leaderboard: 排行榜
   - Notifications: 通知中心

3. **功能组件**
   - BusinessMap: 商家地图
   - Coupons: 优惠券
   - ImageWall: 图片墙
   - Polls: 投票
   - Quest: 任务挑战
   - RealTimeNotifications: 实时通知

## 🔧 技术栈

### 后端技术栈
- **Python 3.12**: 主要编程语言
- **Flask**: Web框架
- **SQLAlchemy**: ORM数据库操作
- **SQLite**: 数据库
- **Flask-JWT-Extended**: JWT认证
- **Flask-Bcrypt**: 密码加密
- **Flask-SocketIO**: WebSocket支持
- **Flask-CORS**: 跨域支持
- **valx**: 敏感词过滤

### 前端技术栈
- **React 18**: 前端框架
- **React Router**: 路由管理
- **Axios**: HTTP客户端
- **Framer Motion**: 动画库
- **Webpack**: 模块打包器
- **Babel**: JavaScript编译器

## 🚀 启动流程

### 1. 环境准备
```bash
# 检查Python版本 (需要3.12+)
python --version

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务
```bash
# 方式1: 使用批处理脚本
start_app.bat

# 方式2: 分别启动
# 启动后端
start_backend.ps1

# 启动前端
start_frontend.ps1
```

### 3. 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:5000

## 📊 数据库设计

### 核心表结构

**用户系统：**
- `users`: 用户基本信息
- `friendships`: 好友关系
- `notifications`: 通知消息

**内容系统：**
- `posts`: 动态帖子
- `groups`: 群组信息
- `group_members`: 群组成员
- `activities`: 活动信息
- `tasks`: 任务信息

**功能系统：**
- `businesses`: 商家信息
- `coupons`: 优惠券
- `user_coupons`: 用户优惠券
- `polls`: 投票
- `poll_votes`: 投票记录
- `images`: 图片
- `image_likes`: 图片点赞
- `image_comments`: 图片评论
- `quests`: 任务挑战
- `user_quests`: 用户任务进度

**游戏化系统：**
- `achievements`: 成就
- `user_achievements`: 用户成就
- `games`: 游戏
- `game_scores`: 游戏分数
- `lotteries`: 抽奖
- `lottery_entries`: 抽奖记录

## 🔐 安全机制

### 1. 用户认证
- JWT Token认证
- 密码BCrypt加密
- 路由权限控制

### 2. 内容安全
- 敏感词过滤 (valx)
- 输入验证
- XSS防护

### 3. 数据安全
- SQL注入防护 (SQLAlchemy)
- CSRF防护
- 文件上传限制

## 📱 功能模块

### 1. 用户系统
- 注册/登录
- 个人资料管理
- 好友系统
- 积分系统

### 2. 社交功能
- 动态发布
- 群组管理
- 聊天系统
- 通知系统

### 3. 商业功能
- 商家地图
- 优惠券系统
- 活动管理

### 4. 游戏化功能
- 任务挑战
- 投票系统
- 排行榜
- 成就系统

### 5. 内容管理
- 图片墙
- 实时通知
- 内容审核

## 🛠️ 开发指南

### 添加新功能

1. **后端开发**
   ```python
   # 1. 定义数据模型
   class NewFeature(db.Model):
       id = db.Column(db.Integer, primary_key=True)
       # 其他字段...
   
   # 2. 创建API路由
   @app.route('/api/new-feature', methods=['GET', 'POST'])
   @jwt_required()
   def new_feature():
       # 业务逻辑...
   ```

2. **前端开发**
   ```jsx
   // 1. 创建组件
   function NewFeature() {
       const [data, setData] = useState([]);
       
       // 组件逻辑...
       
       return <div>新功能组件</div>;
   }
   
   // 2. 添加路由
   <Route path="/new-feature" element={<NewFeature />} />
   ```

### 调试技巧

1. **后端调试**
   - 使用Flask调试模式
   - 查看控制台日志
   - 使用数据库工具查看数据

2. **前端调试**
   - 使用浏览器开发者工具
   - React Developer Tools
   - 网络请求监控

### 性能优化

1. **后端优化**
   - 数据库查询优化
   - 缓存机制
   - 分页处理

2. **前端优化**
   - 组件懒加载
   - 图片优化
   - 代码分割

## 📚 学习路径

1. **基础阶段**
   - 理解项目结构
   - 运行项目
   - 修改简单内容

2. **进阶阶段**
   - 添加新功能
   - 修改现有功能
   - 优化性能

3. **高级阶段**
   - 重构代码
   - 添加测试
   - 部署上线

## 🔗 相关文档

- [学习指南](./LEARNING_GUIDE.md): 详细的学习教程
- [README](./README.md): 项目基本说明
- [requirements.txt](./requirements.txt): 依赖包列表
- [package.json](./frontend/package.json): 前端依赖配置

---

通过这个项目结构说明，你可以快速了解整个项目的架构和各个模块的作用。建议按照学习指南逐步深入，从简单的修改开始，逐步掌握全栈开发技能。
