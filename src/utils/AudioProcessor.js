/**
 * 音频处理工具类
 * 提供音频数据预处理、格式转换、降噪等功能
 */

export class AudioProcessor {
  constructor() {
    this.sampleRate = 16000;
    this.channels = 1;
    this.bitsPerSample = 16;
    this.bufferSize = 4096;
  }

  /**
   * 将音频缓冲区转换为Float32Array
   * @param {ArrayBuffer} buffer - 原始音频缓冲区
   * @returns {Float32Array} 转换后的浮点数组
   */
  bufferToFloat32Array(buffer) {
    const view = new DataView(buffer);
    const samples = new Float32Array(buffer.byteLength / 2);
    
    for (let i = 0; i < samples.length; i++) {
      // 将16位PCM转换为浮点数 [-1, 1]
      const sample = view.getInt16(i * 2, true);
      samples[i] = sample / 32768.0;
    }
    
    return samples;
  }

  /**
   * 音频预处理
   * @param {Float32Array} audioData - 原始音频数据
   * @returns {Float32Array} 处理后的音频数据
   */
  preprocessAudio(audioData) {
    // 1. 直流分量去除
    const processedData = this.removeDCOffset(audioData);
    
    // 2. 音量归一化
    const normalizedData = this.normalizeVolume(processedData);
    
    // 3. 预强调滤波
    const emphasizedData = this.preEmphasis(normalizedData);
    
    return emphasizedData;
  }

  /**
   * 去除直流分量
   * @param {Float32Array} audioData - 音频数据
   * @returns {Float32Array} 处理后的数据
   */
  removeDCOffset(audioData) {
    const result = new Float32Array(audioData.length);
    
    // 计算平均值
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
    }
    const mean = sum / audioData.length;
    
    // 减去平均值
    for (let i = 0; i < audioData.length; i++) {
      result[i] = audioData[i] - mean;
    }
    
    return result;
  }

  /**
   * 音量归一化
   * @param {Float32Array} audioData - 音频数据
   * @returns {Float32Array} 归一化后的数据
   */
  normalizeVolume(audioData) {
    const result = new Float32Array(audioData.length);
    
    // 找到最大幅度
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
    
    if (maxAmplitude > 0) {
      const normalizationFactor = 0.8 / maxAmplitude;
      for (let i = 0; i < audioData.length; i++) {
        result[i] = audioData[i] * normalizationFactor;
      }
    } else {
      return audioData;
    }
    
    return result;
  }

  /**
   * 预强调滤波
   * @param {Float32Array} audioData - 音频数据
   * @returns {Float32Array} 滤波后的数据
   */
  preEmphasis(audioData, alpha = 0.97) {
    const result = new Float32Array(audioData.length);
    result[0] = audioData[0];
    
    for (let i = 1; i < audioData.length; i++) {
      result[i] = audioData[i] - alpha * audioData[i - 1];
    }
    
    return result;
  }

  /**
   * 简单的语音活动检测
   * @param {Float32Array} audioData - 音频数据
   * @param {number} threshold - 能量阈值
   * @returns {boolean} 是否检测到语音活动
   */
  detectVoiceActivity(audioData, threshold = 0.01) {
    // 计算能量
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    energy = Math.sqrt(energy / audioData.length);
    
    return energy > threshold;
  }

  /**
   * 将音频数据分割为固定长度的块
   * @param {Float32Array} audioData - 音频数据
   * @param {number} chunkSize - 块大小
   * @returns {Array<Float32Array>} 音频块数组
   */
  chunkAudio(audioData, chunkSize = 16000) {
    const chunks = [];
    for (let i = 0; i < audioData.length; i += chunkSize) {
      const chunk = audioData.slice(i, i + chunkSize);
      if (chunk.length === chunkSize) {
        chunks.push(chunk);
      }
    }
    return chunks;
  }

  /**
   * 计算音频特征
   * @param {Float32Array} audioData - 音频数据
   * @returns {Object} 音频特征对象
   */
  extractFeatures(audioData) {
    // 能量
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    energy = Math.sqrt(energy / audioData.length);

    // 零交叉率
    let zeroCrossingRate = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        zeroCrossingRate++;
      }
    }
    zeroCrossingRate /= audioData.length;

    // 频谱重心（简化版本）
    let spectralCentroid = 0;
    let totalMagnitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      const magnitude = Math.abs(audioData[i]);
      spectralCentroid += i * magnitude;
      totalMagnitude += magnitude;
    }
    spectralCentroid = totalMagnitude > 0 ? spectralCentroid / totalMagnitude : 0;

    return {
      energy,
      zeroCrossingRate,
      spectralCentroid,
      length: audioData.length
    };
  }
} 