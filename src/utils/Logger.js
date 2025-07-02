/**
 * 日志工具类
 * 提供统一的日志记录功能
 */

class Logger {
  constructor() {
    this.enableConsoleLog = __DEV__;
    this.enableFileLog = false;
    this.logLevel = 'info';
  }

  /**
   * 信息日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  info(tag, message, data = null) {
    this.log('INFO', tag, message, data);
  }

  /**
   * 调试日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  debug(tag, message, data = null) {
    if (__DEV__) {
      this.log('DEBUG', tag, message, data);
    }
  }

  /**
   * 警告日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  warn(tag, message, data = null) {
    this.log('WARN', tag, message, data);
  }

  /**
   * 错误日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Object} error - 错误对象
   */
  error(tag, message, error = null) {
    this.log('ERROR', tag, message, error);
  }

  /**
   * 通用日志方法
   * @param {string} level - 日志级别
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  log(level, tag, message, data = null) {
    if (!this.enableConsoleLog) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${tag}] ${message}`;

    switch (level) {
      case 'DEBUG':
        console.log(logMessage, data);
        break;
      case 'INFO':
        console.info(logMessage, data);
        break;
      case 'WARN':
        console.warn(logMessage, data);
        break;
      case 'ERROR':
        console.error(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }

  /**
   * 记录音频处理性能
   * @param {string} operation - 操作名称
   * @param {number} startTime - 开始时间
   * @param {number} audioLength - 音频长度
   */
  logPerformance(operation, startTime, audioLength = 0) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const throughput = audioLength > 0 ? (audioLength / duration * 1000).toFixed(2) : 'N/A';
    
    this.info('PERFORMANCE', `${operation} completed`, {
      duration: `${duration}ms`,
      audioLength: `${audioLength} samples`,
      throughput: `${throughput} samples/sec`
    });
  }
}

// 导出单例实例
export const logger = new Logger();
export default logger; 