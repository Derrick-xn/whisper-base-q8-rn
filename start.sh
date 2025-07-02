#!/bin/bash

echo "启动 Whisper Base Q8 React Native 应用..."

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "依赖未安装，正在安装..."
    npm install
fi

# 检查模型文件是否存在
if [ ! -f "android/app/src/main/assets/ggml-base-q8_0.bin" ]; then
    echo "复制模型文件到 Android assets..."
    mkdir -p android/app/src/main/assets
    cp ggml-base-q8_0.bin android/app/src/main/assets/ 2>/dev/null || echo "警告: 模型文件未找到"
fi

# 启动Metro开发服务器
echo "启动Metro开发服务器..."
npm start &

# 等待几秒让Metro启动
sleep 3

echo ""
echo "Metro服务器已启动！"
echo "请在另一个终端运行: npm run android"
echo "或者按 Ctrl+C 停止服务器，然后运行 setup.sh 进行完整安装"
echo "" 