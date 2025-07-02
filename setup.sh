#!/bin/bash

echo "开始设置 Whisper Base Q8 React Native 项目..."

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装。请先安装 Node.js。"
    exit 1
fi

# 检查 npm 是否已安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装。请先安装 npm。"
    exit 1
fi

# 安装依赖
echo "安装项目依赖..."
npm install

# 检查 Android SDK 是否已配置
if [ -z "$ANDROID_HOME" ]; then
    echo "警告: ANDROID_HOME 环境变量未设置。请确保已安装并配置 Android SDK。"
fi

# 创建 Android assets 目录
echo "创建 Android assets 目录..."
mkdir -p android/app/src/main/assets

# 复制模型文件到 Android assets
if [ -f "ggml-base-q8_0.bin" ]; then
    echo "复制模型文件到 Android assets..."
    cp ggml-base-q8_0.bin android/app/src/main/assets/
    echo "模型文件复制完成。"
else
    echo "警告: 模型文件 ggml-base-q8_0.bin 未找到。请确保模型文件存在于项目根目录。"
fi

# 生成调试密钥
echo "生成调试密钥..."
if [ ! -f "android/app/debug.keystore" ]; then
    keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" 2>/dev/null || echo "警告: 无法生成调试密钥。请手动创建或安装 Java SDK。"
fi

# 设置权限
echo "设置执行权限..."
chmod +x android/gradlew 2>/dev/null || echo "警告: 无法设置 gradlew 权限。"

echo ""
echo "项目设置完成！"
echo ""
echo "下一步操作："
echo "1. 确保 Android SDK 和 NDK 已安装"
echo "2. 启动 Android 模拟器或连接真机"
echo "3. 运行: npm run android"
echo ""
echo "或者："
echo "1. 启动开发服务器: npm start"
echo "2. 在另一个终端运行: npm run android"
echo "" 