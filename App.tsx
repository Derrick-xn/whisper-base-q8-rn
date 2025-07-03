import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { initWhisper, WhisperContext } from 'whisper.rn';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [realtimeTranscription, setRealtimeTranscription] = useState('');
  const [isWhisperReady, setIsWhisperReady] = useState(false);
  const [error, setError] = useState('');
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [audioPath, setAudioPath] = useState('');
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const segmentCounter = useRef(0);
  const whisperContext = useRef<WhisperContext | null>(null);

  useEffect(() => {
    initializeApp();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      await requestPermissions();
      await initializeWhisper();
    } catch (error: any) {
      console.error('应用初始化失败:', error);
      setError('应用初始化失败: ' + error.message);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        
        if (granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('录音权限已授予');
        } else {
          throw new Error('录音权限被拒绝');
        }
      } catch (err: any) {
        console.warn('权限请求失败:', err);
        throw err;
      }
    }
  };

  const initializeWhisper = async () => {
    try {
      setError('正在初始化Whisper模型...');
      
      // 尝试不同的模型文件名
      const modelFilenames = ['ggml-base.q8_0.bin', 'ggml-base-q8.bin'];
      let context: WhisperContext | null = null;
      
      for (const filename of modelFilenames) {
        try {
          console.log(`尝试加载模型: ${filename}`);
          context = await initWhisper({
            filePath: filename,
            isBundleAsset: true,
          });
          console.log(`成功加载模型: ${filename}`);
          break;
        } catch (err) {
          console.log(`模型 ${filename} 加载失败:`, err);
          continue;
        }
      }
      
      if (!context) {
        throw new Error('未找到可用的模型文件，请确保已将模型文件放置在assets目录中');
      }
      
      whisperContext.current = context;
      setIsWhisperReady(true);
      setError('');
      console.log('Whisper模型初始化成功');
    } catch (error: any) {
      console.error('Whisper初始化失败:', error);
      setError('Whisper初始化失败: ' + error.message + '\n\n请下载模型文件到 android/app/src/main/assets/ 目录：\n1. ggml-base.q8_0.bin\n2. 或 ggml-base-q8.bin');
      setIsWhisperReady(false);
    }
  };

  const cleanup = async () => {
    try {
      if (isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      audioRecorderPlayer.removeRecordBackListener();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (whisperContext.current) {
        await whisperContext.current.release();
      }
    } catch (error) {
      console.error('清理资源失败:', error);
    }
  };

  const generateAudioPath = (): string => {
    const timestamp = Date.now();
    const segment = segmentCounter.current++;
    return `${audioRecorderPlayer.rnDirs.CacheDir}/audio_segment_${timestamp}_${segment}.wav`;
  };

  const startRealtimeRecording = async () => {
    if (!isWhisperReady || !whisperContext.current) {
      Alert.alert('错误', 'Whisper模型尚未准备就绪');
      return;
    }

    try {
      setIsRecording(true);
      setError('');
      setRealtimeTranscription('');
      setRecordingStartTime(Date.now());

      // 开始连续录制模式
      await startRecordingSegment();
      
      // 设置定时器，每3秒处理一次音频片段
      recordingTimer.current = setInterval(async () => {
        if (isRecording) {
          await processAudioSegment();
        }
      }, 3000);

    } catch (error: any) {
      console.error('开始录音失败:', error);
      setError('开始录音失败: ' + error.message);
      setIsRecording(false);
    }
  };

  const startRecordingSegment = async () => {
    const path = generateAudioPath();
    setAudioPath(path);
    
    const audioSet = {
      AudioEncoderAndroid: AudioRecorderPlayer.AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioRecorderPlayer.AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AudioRecorderPlayer.AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 1,
      AVFormatIDKeyIOS: AudioRecorderPlayer.AVFormatIDIOSType.wav,
    };

    console.log('开始录制音频片段到:', path);
    await audioRecorderPlayer.startRecorder(path, audioSet);
    audioRecorderPlayer.addRecordBackListener((e: any) => {
      // 可以在这里更新录音状态
      console.log('录音进度:', e.currentPosition);
    });
  };

  const processAudioSegment = async () => {
    try {
      // 停止当前录制
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      // 处理刚录制的音频片段
      if (audioPath) {
        setIsTranscribing(true);
        await transcribeAudioSegment(audioPath);
        setIsTranscribing(false);
      }

      // 如果还在录音模式，开始新的片段
      if (isRecording) {
        await startRecordingSegment();
      }
    } catch (error: any) {
      console.error('处理音频片段失败:', error);
      setError('处理音频片段失败: ' + error.message);
      setIsTranscribing(false);
    }
  };

  const transcribeAudioSegment = async (filePath: string) => {
    try {
      console.log('开始转录音频片段:', filePath);
      
      if (!whisperContext.current) {
        throw new Error('Whisper context不可用');
      }

      const options = {
        language: 'zh', // 中文
        maxLen: 1,
        tokenize: true,
        translate: false,
        noContext: false,
        singleSegment: false,
        printProgress: false,
        printRealtime: false,
        printTimestamps: false,
      };

      const { promise } = whisperContext.current.transcribe(filePath, options);
      const result = await promise;
      
      if (result && result.result) {
        const text = result.result.trim();
        if (text) {
          console.log('转录结果:', text);
          
          // 更新实时转录结果
          setRealtimeTranscription(text);
          
          // 累加到完整转录结果
          setTranscription(prev => {
            const newText = prev + (prev ? ' ' : '') + text;
            return newText;
          });
        }
      }
    } catch (error: any) {
      console.error('转录失败:', error);
      setError('转录失败: ' + error.message);
    }
  };

  const stopRealtimeRecording = async () => {
    try {
      setIsRecording(false);
      
      // 清除定时器
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // 停止录音并处理最后一个片段
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      // 处理最后的音频片段
      if (audioPath) {
        setIsTranscribing(true);
        await transcribeAudioSegment(audioPath);
        setIsTranscribing(false);
      }

      setRealtimeTranscription('');
      console.log('录音已停止');
    } catch (error: any) {
      console.error('停止录音失败:', error);
      setError('停止录音失败: ' + error.message);
      setIsTranscribing(false);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
    setRealtimeTranscription('');
    setError('');
    segmentCounter.current = 0;
  };

  const getStatusText = (): string => {
    if (!isWhisperReady) return '模型加载中...';
    if (isRecording && isTranscribing) return '录音中 + 转录中...';
    if (isRecording) return '录音中...';
    if (isTranscribing) return '转录中...';
    return '待机中';
  };

  const getStatusColor = (): string => {
    if (!isWhisperReady) return '#FF9500';
    if (isRecording) return '#4CAF50';
    if (isTranscribing) return '#2196F3';
    return '#666';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whisper 本地语音转文字</Text>
      <Text style={styles.subtitle}>基于whisper.rn的实时转录</Text>
      
      {/* 状态指示器 */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor() }
        ]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {(isTranscribing || !isWhisperReady) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
          </View>
        )}
      </View>

      {/* 实时转录结果 */}
      {realtimeTranscription && (
        <View style={styles.realtimeContainer}>
          <Text style={styles.realtimeLabel}>实时转录:</Text>
          <Text style={styles.realtimeText}>{realtimeTranscription}</Text>
        </View>
      )}

      {/* 错误信息 */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* 完整转录结果 */}
      <View style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionLabel}>完整转录结果:</Text>
        <ScrollView style={styles.transcriptionScroll}>
          <Text style={styles.transcriptionText}>
            {transcription || (isWhisperReady ? '点击"开始录音"按钮开始实时语音转文字...' : '正在加载Whisper模型，请稍候...')}
          </Text>
        </ScrollView>
      </View>

      {/* 控制按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : styles.idleButton,
            !isWhisperReady && styles.disabledButton
          ]}
          onPress={isRecording ? stopRealtimeRecording : startRealtimeRecording}
          disabled={!isWhisperReady}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '停止录音' : '开始录音'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, isRecording && styles.disabledButton]}
          onPress={clearTranscription}
          disabled={isRecording}
        >
          <Text style={styles.clearButtonText}>清除文本</Text>
        </TouchableOpacity>
      </View>

      {/* 功能说明 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          本地Whisper模型 • 3秒音频片段 • 实时转录处理
        </Text>
        {!isWhisperReady && (
          <Text style={styles.warningText}>
            提示：请下载模型文件到 android/app/src/main/assets/ 目录
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  realtimeContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  realtimeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2E7D32',
  },
  realtimeText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1B5E20',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
  },
  transcriptionContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  transcriptionScroll: {
    flex: 1,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recordButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  idleButton: {
    backgroundColor: '#007AFF',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  warningText: {
    fontSize: 11,
    color: '#FF9500',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default App; 