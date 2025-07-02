import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import {WhisperModule} from './src/native/WhisperModule';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    initializeAudio();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      AudioRecord.stop();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      // 请求麦克风权限
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '麦克风权限',
            message: '应用需要访问麦克风来录制语音',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('错误', '需要麦克风权限才能使用语音识别功能');
          return;
        }
      }

      // 初始化音频录制配置
      const options = {
        sampleRate: 16000, // ggml模型通常需要16kHz采样率
        channels: 1, // 单声道
        bitsPerSample: 16, // 16位采样
        audioSource: 6, // VOICE_RECOGNITION
        wavFile: 'audio.wav',
      };

      AudioRecord.init(options);

      // 监听音频数据
      AudioRecord.on('data', data => {
        if (isRecording) {
          processAudioChunk(data);
        }
      });

    } catch (error) {
      console.error('音频初始化失败:', error);
      Alert.alert('错误', '音频初始化失败: ' + error.message);
    }
  };

  const processAudioChunk = async (audioChunk) => {
    try {
      if (!isProcessing) {
        setIsProcessing(true);
        
        // 调用原生模块进行语音识别
        const result = await WhisperModule.transcribeAudio(audioChunk);
        
        if (result && result.text) {
          setTranscriptionText(prev => prev + ' ' + result.text);
        }
        
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('语音识别处理失败:', error);
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      setTranscriptionText('');
      setIsRecording(true);
      AudioRecord.start();
      
      // 启动实时处理定时器
      intervalRef.current = setInterval(() => {
        // 定期获取音频缓冲区数据
      }, 1000); // 每秒处理一次
      
    } catch (error) {
      console.error('开始录制失败:', error);
      Alert.alert('错误', '开始录制失败: ' + error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      AudioRecord.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
    } catch (error) {
      console.error('停止录制失败:', error);
    }
  };

  const clearTranscription = () => {
    setTranscriptionText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>实时语音转文字</Text>
        <Text style={styles.subtitle}>基于 ggml-base-q8 模型</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          {backgroundColor: isRecording ? '#4CAF50' : '#f44336'}
        ]}>
          <Text style={styles.statusText}>
            {isRecording ? '录制中...' : '待机中'}
          </Text>
        </View>
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.processingText}>处理中...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionText}>
          {transcriptionText || '点击开始录制按钮，开始实时语音转文字...'}
        </Text>
      </ScrollView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            {backgroundColor: isRecording ? '#f44336' : '#4CAF50'}
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '停止录制' : '开始录制'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearTranscription}
        >
          <Text style={styles.clearButtonText}>清除文本</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          采样率: 16kHz | 声道: 单声道 | 位深: 16bit
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
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
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  processingText: {
    marginLeft: 5,
    color: '#2196F3',
    fontSize: 12,
  },
  transcriptionContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recordButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default App; 