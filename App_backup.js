import React, { useState, useEffect } from 'react';
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
import Voice from '@react-native-voice/voice';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [partialResults, setPartialResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeVoice();
    requestPermissions();
    
    return () => {
      cleanupVoice();
    };
  }, []);

  const initializeVoice = () => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;
  };

  const cleanupVoice = () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const audioPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (audioPermission === RESULTS.GRANTED) {
          console.log('录音权限已授予');
        } else {
          Alert.alert('权限错误', '需要录音权限才能使用语音识别功能');
        }
      } catch (err) {
        console.warn('权限请求失败:', err);
      }
    }
  };

  const onSpeechStart = () => {
    console.log('开始语音识别');
    setError('');
  };

  const onSpeechRecognized = () => {
    console.log('语音已识别');
  };

  const onSpeechEnd = () => {
    console.log('语音识别结束');
    setIsRecording(false);
    setIsLoading(false);
  };

  const onSpeechError = (error) => {
    console.log('语音识别错误:', error);
    setError(error.error?.message || '语音识别出错');
    setIsRecording(false);
    setIsLoading(false);
  };

  const onSpeechResults = (result) => {
    console.log('语音识别结果:', result);
    if (result.value && result.value.length > 0) {
      setRecognizedText(result.value[0]);
      setTranscription(prev => prev + (prev ? ' ' : '') + result.value[0]);
    }
  };

  const onSpeechPartialResults = (result) => {
    console.log('部分识别结果:', result);
    if (result.value && result.value.length > 0) {
      setPartialResults(result.value);
    }
  };

  const onSpeechVolumeChanged = (value) => {
    // 音量变化处理（可选）
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setIsLoading(true);
      setError('');
      setPartialResults([]);
      setRecognizedText('');
      
      await Voice.start('zh-CN'); // 使用中文语音识别
    } catch (error) {
      console.error('开始录音失败:', error);
      setError('开始录音失败: ' + error.message);
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
      setIsLoading(false);
    } catch (error) {
      console.error('停止录音失败:', error);
      setError('停止录音失败: ' + error.message);
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
    setRecognizedText('');
    setPartialResults([]);
    setError('');
  };

  const getCurrentDisplayText = () => {
    if (partialResults.length > 0) {
      return partialResults[0];
    }
    return recognizedText;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whisper 语音转文字</Text>
      <Text style={styles.subtitle}>实时语音识别应用</Text>
      
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isRecording ? '#4CAF50' : '#f44336' }
        ]}>
          <Text style={styles.statusText}>
            {isRecording ? '录音中...' : isLoading ? '处理中...' : '待机中'}
          </Text>
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.loadingText}>识别中...</Text>
          </View>
        )}
      </View>

      {/* 实时识别结果 */}
      {(isRecording || getCurrentDisplayText()) && (
        <View style={styles.realTimeContainer}>
          <Text style={styles.realTimeLabel}>实时识别:</Text>
          <Text style={styles.realTimeText}>
            {getCurrentDisplayText() || '正在监听...'}
          </Text>
        </View>
      )}

      {/* 错误信息 */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>错误: {error}</Text>
        </View>
      ) : null}

      {/* 完整转录结果 */}
      <View style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionLabel}>完整转录结果:</Text>
        <ScrollView style={styles.transcriptionScroll}>
          <Text style={styles.transcriptionText}>
            {transcription || '点击"开始录音"按钮开始语音转文字...'}
          </Text>
        </ScrollView>
      </View>

      {/* 控制按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : styles.idleButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isLoading && !isRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '停止录音' : '开始录音'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearTranscription}
          disabled={isRecording}
        >
          <Text style={styles.clearButtonText}>清除文本</Text>
        </TouchableOpacity>
      </View>

      {/* 功能说明 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          支持中文语音识别 • 实时显示结果 • 点击开始即可使用
        </Text>
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
  loadingText: {
    marginLeft: 5,
    color: '#2196F3',
    fontSize: 12,
  },
  realTimeContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  realTimeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2E7D32',
  },
  realTimeText: {
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
});

export default App; 