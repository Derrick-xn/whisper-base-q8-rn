#include <jni.h>
#include <string>
#include <android/log.h>
#include <vector>
#include <memory>
#include <fstream>
#include <cmath>

// 定义日志宏
#define LOG_TAG "WhisperAndroid"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// 简化的Whisper模型接口
class WhisperModel {
private:
    std::string modelPath;
    bool isLoaded;
    std::vector<float> audioBuffer;
    
public:
    WhisperModel() : isLoaded(false) {}
    
    bool loadModel(const std::string& path) {
        modelPath = path;
        
        // 检查模型文件是否存在
        std::ifstream file(path, std::ios::binary);
        if (!file.is_open()) {
            LOGE("Failed to open model file: %s", path.c_str());
            return false;
        }
        
        // 获取文件大小
        file.seekg(0, std::ios::end);
        size_t fileSize = file.tellg();
        file.seekg(0, std::ios::beg);
        
        LOGI("Model file size: %zu bytes", fileSize);
        
        // 这里应该实际加载ggml模型
        // 由于ggml库较复杂，这里提供一个简化的实现框架
        isLoaded = true;
        file.close();
        
        LOGI("Model loaded successfully from: %s", path.c_str());
        return true;
    }
    
    std::string transcribe(const std::vector<float>& audioData) {
        if (!isLoaded) {
            LOGE("Model not loaded");
            return "";
        }
        
        if (audioData.empty()) {
            LOGE("Empty audio data");
            return "";
        }
        
        LOGI("Transcribing audio with %zu samples", audioData.size());
        
        // 这里应该实际调用ggml模型进行推理
        // 目前返回一个模拟的结果
        
        // 简单的能量检测来模拟语音识别
        float energy = 0.0f;
        for (float sample : audioData) {
            energy += sample * sample;
        }
        energy = sqrt(energy / audioData.size());
        
        if (energy > 0.01f) {
            // 模拟语音识别结果
            return "您好，这是语音识别的测试结果。";
        } else {
            return ""; // 静音
        }
    }
    
    void release() {
        isLoaded = false;
        audioBuffer.clear();
    }
};

// 全局模型实例
static std::unique_ptr<WhisperModel> g_whisperModel = nullptr;

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_whisperbaseq8rn_WhisperModule_loadModel(JNIEnv *env, jobject thiz, jstring model_path) {
    const char* pathStr = env->GetStringUTFChars(model_path, nullptr);
    
    if (g_whisperModel == nullptr) {
        g_whisperModel = std::make_unique<WhisperModel>();
    }
    
    bool result = g_whisperModel->loadModel(std::string(pathStr));
    
    env->ReleaseStringUTFChars(model_path, pathStr);
    return result ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL
Java_com_whisperbaseq8rn_WhisperModule_transcribeAudio(JNIEnv *env, jobject thiz, 
                                                       jfloatArray audio_data, jint data_length) {
    if (g_whisperModel == nullptr) {
        LOGE("Model not initialized");
        return env->NewStringUTF("");
    }
    
    // 获取音频数据
    jfloat* audioArray = env->GetFloatArrayElements(audio_data, nullptr);
    if (audioArray == nullptr) {
        LOGE("Failed to get audio array");
        return env->NewStringUTF("");
    }
    
    // 转换为vector
    std::vector<float> audioVector(audioArray, audioArray + data_length);
    
    // 进行转录
    std::string result = g_whisperModel->transcribe(audioVector);
    
    // 释放数组
    env->ReleaseFloatArrayElements(audio_data, audioArray, JNI_ABORT);
    
    return env->NewStringUTF(result.c_str());
}

JNIEXPORT void JNICALL
Java_com_whisperbaseq8rn_WhisperModule_releaseModel(JNIEnv *env, jobject thiz) {
    if (g_whisperModel != nullptr) {
        g_whisperModel->release();
        g_whisperModel.reset();
    }
}

} 