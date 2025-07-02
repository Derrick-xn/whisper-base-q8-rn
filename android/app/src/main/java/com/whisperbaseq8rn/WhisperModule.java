package com.whisperbaseq8rn;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

public class WhisperModule extends ReactContextBaseJavaModule {
    private static final String TAG = "WhisperModule";
    private static final String MODEL_NAME = "ggml-base-q8_0.bin";
    
    private ReactApplicationContext reactContext;
    private String modelPath;
    private boolean isModelLoaded = false;
    
    // 音频处理相关常量
    private static final int SAMPLE_RATE = 16000;
    private static final int CHANNELS = 1;
    private static final int BITS_PER_SAMPLE = 16;
    private static final int BUFFER_SIZE = SAMPLE_RATE * 2; // 2秒的音频缓冲区
    
    // 原生库函数声明
    static {
        try {
            System.loadLibrary("whisper_android");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native library: " + e.getMessage());
        }
    }
    
    // 原生函数声明
    public native boolean loadModel(String modelPath);
    public native String transcribeAudio(float[] audioData, int dataLength);
    public native void releaseModel();

    public WhisperModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        initializeModel();
    }

    @Override
    public String getName() {
        return "WhisperModule";
    }

    private void initializeModel() {
        try {
            // 将模型文件复制到应用的内部存储
            File modelFile = new File(reactContext.getFilesDir(), MODEL_NAME);
            if (!modelFile.exists()) {
                copyModelFromAssets(modelFile);
            }
            
            modelPath = modelFile.getAbsolutePath();
            Log.d(TAG, "Model path: " + modelPath);
            
            // 加载模型
            loadModelAsync();
            
        } catch (Exception e) {
            Log.e(TAG, "Error initializing model: " + e.getMessage());
        }
    }
    
    private void copyModelFromAssets(File targetFile) throws IOException {
        try {
            // 从assets复制模型文件
            InputStream inputStream = reactContext.getAssets().open(MODEL_NAME);
            FileOutputStream outputStream = new FileOutputStream(targetFile);
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            
            inputStream.close();
            outputStream.close();
            
            Log.d(TAG, "Model file copied to: " + targetFile.getAbsolutePath());
        } catch (IOException e) {
            // 模型文件在项目根目录，尝试从那里复制
            File sourceFile = new File(reactContext.getExternalFilesDir(null).getParent() + "/../../" + MODEL_NAME);
            if (sourceFile.exists()) {
                Log.d(TAG, "Copying model from project root");
                // 实现文件复制逻辑
            } else {
                Log.e(TAG, "Model file not found in assets or project root");
                throw e;
            }
        }
    }
    
    private void loadModelAsync() {
        new Thread(() -> {
            try {
                isModelLoaded = loadModel(modelPath);
                if (isModelLoaded) {
                    Log.d(TAG, "Model loaded successfully");
                } else {
                    Log.e(TAG, "Failed to load model");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error loading model: " + e.getMessage());
            }
        }).start();
    }

    @ReactMethod
    public void transcribeAudio(ReadableArray audioData, Promise promise) {
        if (!isModelLoaded) {
            promise.reject("MODEL_NOT_LOADED", "Whisper model is not loaded");
            return;
        }
        
        try {
            // 转换音频数据
            float[] audioArray = convertToFloatArray(audioData);
            
            // 预处理音频数据
            float[] processedAudio = preprocessAudio(audioArray);
            
            // 调用原生函数进行转录
            String result = transcribeAudio(processedAudio, processedAudio.length);
            
            // 返回结果
            WritableMap response = Arguments.createMap();
            response.putString("text", result);
            response.putDouble("confidence", 0.8); // 简单的置信度估计
            
            promise.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transcribing audio: " + e.getMessage());
            promise.reject("TRANSCRIPTION_ERROR", "Failed to transcribe audio: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void transcribeAudioBuffer(String audioBase64, Promise promise) {
        if (!isModelLoaded) {
            promise.reject("MODEL_NOT_LOADED", "Whisper model is not loaded");
            return;
        }
        
        try {
            // 解码base64音频数据
            byte[] audioBytes = android.util.Base64.decode(audioBase64, android.util.Base64.DEFAULT);
            
            // 转换为float数组
            float[] audioArray = bytesToFloatArray(audioBytes);
            
            // 预处理音频数据
            float[] processedAudio = preprocessAudio(audioArray);
            
            // 调用原生函数进行转录
            String result = transcribeAudio(processedAudio, processedAudio.length);
            
            // 返回结果
            WritableMap response = Arguments.createMap();
            response.putString("text", result);
            response.putDouble("confidence", 0.8);
            
            promise.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transcribing audio buffer: " + e.getMessage());
            promise.reject("TRANSCRIPTION_ERROR", "Failed to transcribe audio buffer: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void getModelStatus(Promise promise) {
        WritableMap status = Arguments.createMap();
        status.putBoolean("isLoaded", isModelLoaded);
        status.putString("modelPath", modelPath);
        promise.resolve(status);
    }
    
    private float[] convertToFloatArray(ReadableArray audioData) {
        float[] result = new float[audioData.size()];
        for (int i = 0; i < audioData.size(); i++) {
            result[i] = (float) audioData.getDouble(i);
        }
        return result;
    }
    
    private float[] bytesToFloatArray(byte[] audioBytes) {
        // 将16位PCM数据转换为float数组
        float[] result = new float[audioBytes.length / 2];
        ByteBuffer buffer = ByteBuffer.wrap(audioBytes);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        for (int i = 0; i < result.length; i++) {
            short sample = buffer.getShort();
            result[i] = sample / 32768.0f; // 归一化到[-1, 1]
        }
        
        return result;
    }
    
    private float[] preprocessAudio(float[] audioData) {
        // 音频预处理：降噪、归一化等
        float[] processed = Arrays.copyOf(audioData, audioData.length);
        
        // 简单的音量归一化
        float maxAmplitude = 0;
        for (float sample : processed) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
        }
        
        if (maxAmplitude > 0) {
            float normalizationFactor = 0.8f / maxAmplitude;
            for (int i = 0; i < processed.length; i++) {
                processed[i] *= normalizationFactor;
            }
        }
        
        return processed;
    }
    
    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (isModelLoaded) {
            releaseModel();
        }
    }
} 