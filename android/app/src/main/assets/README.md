# Assets 目录

请将您的 Whisper 模型文件放置在此目录中：

- `ggml-base-q8.bin` 或 `ggml-base.q8_0.bin` - Whisper Base Q8 量化模型文件

模型文件下载地址：
- Hugging Face: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.q8_0.bin
- 国内镜像: https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main/ggml-base.q8_0.bin

## 下载命令

```bash
# 使用wget下载（如果网络允许）
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.q8_0.bin

# 或使用curl下载
curl -L -o ggml-base.q8_0.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.q8_0.bin
```

## 注意事项

1. 模型文件较大（约78MB），请确保有足够的存储空间
2. 下载后请将文件重命名为 `ggml-base-q8.bin` 或保持 `ggml-base.q8_0.bin`
3. 应用会自动检测并加载此目录中的模型文件

支持的模型格式：.bin 和 .gguf 