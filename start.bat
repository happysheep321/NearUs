@echo off
setlocal enableextensions enabledelayedexpansion
title 邻里APP 一键启动
rem 清理可能影响 pip/npm 的代理环境变量
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set PIP_PROXY=
echo [1/5] 准备 Python 虚拟环境...
if not exist .venv (
  py -3 -m venv .venv
)
call .venv\Scripts\activate
python -V

echo [2/5] 安装后端依赖...
python -m pip install --upgrade pip --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org 2>nul
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt || (
  echo 尝试其他镜像源...
  pip install --trusted-host pypi.tuna.tsinghua.edu.cn -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt || (
    echo 尝试阿里云镜像...
    pip install --trusted-host mirrors.aliyun.com -i https://mirrors.aliyun.com/pypi/simple -r requirements.txt || goto :pipfail
  )
)

echo [3/5] 启动后端服务...
start "邻里APP后端" cmd /k ".venv\Scripts\activate && python app.py"

echo [4/5] 安装前端依赖...
cd frontend
if not exist node_modules (
  call npm config set fund false
  call npm config set audit false
  call npm config set registry https://registry.npmmirror.com
  call npm install --no-fund --no-audit
)

echo [5/5] 启动前端服务...
start "邻里APP前端" cmd /k "npm start"

echo.
echo ✅ 邻里APP启动完成！
echo 后端: http://localhost:5000
echo 前端: http://localhost:3000
echo.
goto :eof

:pipfail
echo 依赖安装失败，请检查 Python/Pip 安装。
pause
