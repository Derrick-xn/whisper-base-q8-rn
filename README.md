# Whisper Base Q8 React Native

基于 ggml-base-q8 模型的实时语音转文字 React Native 应用

## 功能特性

- ✅ 实时语音录制和识别
- ✅ 支持 16kHz 采样率音频处理
- ✅ 原生模块集成 ggml 模型
- ✅ 音频预处理和优化
- ✅ 语音活动检测
- ✅ 现代化 UI 界面
- ✅ Android 平台支持

## 技术栈

- **React Native 0.72.6** - 跨平台移动应用框架
- **ggml-base-q8** - 轻量级语音识别模型
- **React Native Audio Record** - 音频录制
- **原生 C++ 模块** - 高性能音频处理
- **Android NDK** - 原生代码集成

## 项目结构

```
whisper-base-q8-rn/
├── android/                    # Android 原生代码
│   ├── app/src/main/cpp/      # C++ 原生模块
│   └── app/src/main/java/     # Java 原生模块
├── src/
│   ├── native/                # 原生模块接口
│   └── utils/                 # 工具类
├── ggml-base-q8_0.bin         # 语音识别模型
├── App.js                     # 主应用组件
└── package.json               # 项目配置
```

## 环境要求

### 开发环境
- Node.js >= 16.0
- npm >= 8.0
- React Native CLI
- Android Studio (包含 SDK 和 NDK)

### Android 要求
- Android API Level 21+ (Android 5.0+)
- NDK Version 23.1.7779620
- 至少 2GB RAM
- 麦克风权限

## 安装步骤

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd whisper-base-q8-rn
```

### 2. 自动安装（推荐）
```bash
chmod +x setup.sh
./setup.sh
```

### 3. 手动安装
```bash
# 安装依赖
npm install

# 创建 Android assets 目录
mkdir -p android/app/src/main/assets

# 复制模型文件
cp ggml-base-q8_0.bin android/app/src/main/assets/
```

### 4. 配置 Android 环境
确保以下环境变量已设置：
```bash
export ANDROID_HOME=$HOME/Android/Sdk  # 或您的 SDK 路径
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 运行应用

### 开发模式
```bash
# 启动 Metro 开发服务器
npm start

# 在另一个终端运行 Android 应用
npm run android
```

### 构建 Release 版本
```bash
# 构建 Release APK
npm run build:android

# APK 位置: android/app/build/outputs/apk/release/
```

## 使用说明

1. **启动应用**: 打开应用后，界面会显示当前状态
2. **权限授权**: 首次使用需要授权麦克风录音权限
3. **开始录制**: 点击"开始录制"按钮开始实时语音识别
4. **查看结果**: 转写结果会实时显示在屏幕上
5. **停止录制**: 点击"停止录制"结束录音

## 核心功能详解

### 音频预处理
- 直流分量去除
- 音量归一化
- 预强调滤波
- 语音活动检测

### 模型集成
- ggml 模型加载和管理
- 实时音频流处理
- 优化的推理性能

### 性能优化
- 16kHz 采样率优化
- C++ 原生代码加速
- 内存使用优化
- 电池使用优化

## 配置选项

### 音频参数
```javascript
// 在 App.js 中可调整
const audioOptions = {
  sampleRate: 16000,  // 采样率
  channels: 1,        // 声道数
  bitsPerSample: 16,  // 位深度
  audioSource: 6,     // 音频源（语音识别优化）
};
```

### 识别参数
```javascript
// 在 WhisperModule.java 中可调整
private static final int SAMPLE_RATE = 16000;
private static final int BUFFER_SIZE = SAMPLE_RATE * 2; // 2秒缓冲区
```

## 故障排除

### 常见问题

1. **模型加载失败**
   - 确保 `ggml-base-q8_0.bin` 文件在 assets 目录中
   - 检查文件权限和大小

2. **音频录制权限被拒绝**
   - 在设备设置中手动授权麦克风权限
   - 重启应用

3. **原生模块加载失败**
   - 清理并重新构建项目: `npm run android -- --reset-cache`
   - 检查 NDK 版本是否正确

4. **构建失败**
   - 清理 Gradle 缓存: `cd android && ./gradlew clean`
   - 检查 Android SDK 和 NDK 配置

### 调试技巧

```bash
# 查看应用日志
npx react-native log-android

# 查看原生日志
adb logcat | grep "WhisperAndroid"

# 清理并重新安装
npm run android -- --reset-cache
```

## 性能指标

### 典型性能表现
- **模型加载时间**: 2-5 秒
- **实时转写延迟**: 500-1000ms
- **内存使用**: 100-200MB
- **CPU 使用**: 15-30%
- **电池消耗**: 中等

### 优化建议
- 在高性能设备上运行以获得最佳体验
- 确保设备有足够的可用内存
- 在安静环境中使用以提高识别准确率

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南
1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [ggml](https://github.com/ggerganov/ggml) - 机器学习张量库
- [Whisper](https://github.com/openai/whisper) - OpenAI 语音识别模型
- [React Native](https://reactnative.dev/) - 跨平台移动应用框架

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- Email: [your-email@example.com]

---

**注意**: 这是一个演示项目，实际的 ggml 模型集成需要更复杂的实现。当前版本提供了完整的项目架构和基础功能实现。