# 🏠 邻里APP (NearUs)

一个现代化的社区邻里互动平台，基于React + Flask开发，采用2025年最新的UI/UX设计标准。

## ✨ 主要功能

- 🗨️ **邻里动态** - 发布和浏览社区动态，分享生活点滴
- 👥 **社区群组** - 创建和加入兴趣群组，结识邻居朋友  
- 🎯 **任务中心** - 发布和接受邻里互助任务
- 🎉 **活动广场** - 组织和参与社区活动
- 🏆 **积分排行** - 积分系统激励社区参与
- 👤 **个人中心** - 管理个人信息和查看参与记录

## 🎨 设计特色

- **2025年最新设计**：采用玻璃拟态(Glassmorphism)和神经拟态(Neumorphism)设计
- **现代化交互**：流畅的动画效果和直观的用户体验
- **响应式布局**：完美适配桌面端和移动端
- **高对比度**：确保所有用户都能清晰阅读

## 🚀 快速开始

### 一键启动（推荐）

**Windows用户：**
```bash
# 双击运行或在命令行执行
start_app.bat
```

**Linux/Mac用户：**
```bash
# 给脚本执行权限并运行
chmod +x start_app.sh
./start_app.sh
```

### 手动启动

**环境要求：**
- Python 3.7+
- Node.js 16+
- npm 6+

**启动步骤：**

1. **克隆项目**
```bash
git clone https://github.com/happysheep321/NearUs.git
cd NearUs
```

2. **启动后端**
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate
# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python simple_app.py
```

3. **启动前端**
```bash
# 新开终端窗口
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm start
```

4. **访问应用**
- 前端地址：http://localhost:3000
- 后端地址：http://localhost:5000

## 👥 测试账号

```
管理员账号：admin / admin123
普通用户：zhangsan / user123
```

## 📁 项目结构

```
NearUs/
├── frontend/                 # React前端
│   ├── public/              # 静态文件
│   ├── src/                 # 源代码
│   │   ├── components/      # React组件
│   │   ├── App.js          # 主应用组件
│   │   ├── index.js        # 应用入口
│   │   └── index.css       # 全局样式
│   ├── package.json        # 前端依赖
│   └── webpack.config.js   # Webpack配置
├── simple_app.py           # Flask后端主文件
├── requirements.txt        # Python依赖
├── start_app.bat          # Windows一键启动脚本
├── start_app.sh           # Linux/Mac一键启动脚本
├── stop_app.bat           # Windows停止服务脚本
└── README.md              # 项目说明
```

## 🛠️ 技术栈

**前端：**
- React 18
- React Router
- Axios
- CSS3 (Glassmorphism & Neumorphism)

**后端：**
- Flask
- SQLite
- Python 3.7+

**开发工具：**
- Webpack
- npm
- Git

## 🎯 功能特色

### 🗨️ 邻里动态
- 发布图文动态，支持表情和图片
- 实时浏览社区最新消息
- 样例数据展示丰富的社区生活

### 👥 社区群组  
- 创建主题群组（如摄影、美食、健身等）
- 查看群组成员和活跃度
- 加入感兴趣的邻里群组

### 🎯 任务中心
- 发布邻里互助任务
- 按类型筛选任务（求助、拼车、代购等）
- 任务状态管理和积分奖励

### 🎉 活动广场
- 组织社区聚会和活动
- 活动报名和参与统计
- 丰富的活动类型支持

### 🏆 积分排行
- 社区贡献积分系统
- 排行榜激励参与
- 积分获取指南

## 🎨 设计系统

- **主色调**：蓝色渐变 (#3b82f6 - #8b5cf6)
- **辅助色**：绿色系 (#10b981 - #06b6d4)
- **字体**：Inter, system-ui
- **圆角**：统一使用12px-20px圆角
- **阴影**：多层阴影营造深度感
- **毛玻璃**：backdrop-filter实现现代感

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📝 开发计划

- [ ] 移动端App开发
- [ ] 实时消息推送
- [ ] 地理位置服务
- [ ] 社区商城功能
- [ ] AI智能推荐

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- GitHub: [@happysheep321](https://github.com/happysheep321)
- 项目链接: [https://github.com/happysheep321/NearUs](https://github.com/happysheep321/NearUs)

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！