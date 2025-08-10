#!/bin/bash

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        🏠 邻里APP - 一键启动         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到Python3，请先安装Python 3.7+"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js 16+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到npm，请确保Node.js安装正确"
    exit 1
fi

echo "🔍 检查依赖安装状态..."

# 检查Python依赖
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

echo "🔧 激活虚拟环境并安装Python依赖..."
source venv/bin/activate
pip install -r requirements.txt --quiet

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install --silent
    cd ..
fi

echo ""
echo "🚀 启动应用服务..."
echo ""
echo "📍 后端服务：http://localhost:5000"
echo "📍 前端服务：http://localhost:3000"
echo ""
echo "💡 按 Ctrl+C 停止服务"
echo ""

# 启动后端（后台运行）
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端（后台运行）
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# 等待前端启动
echo "⏳ 等待服务启动完成..."
sleep 8

# 尝试打开浏览器
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000
fi

echo ""
echo "✅ 应用启动完成！"
echo ""
echo "📋 使用说明："
echo "   • 前端地址：http://localhost:3000"
echo "   • 后端地址：http://localhost:5000"
echo "   • 测试账号：admin / admin123"
echo "   • 普通用户：zhangsan / user123"
echo ""
echo "💡 提示：按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
