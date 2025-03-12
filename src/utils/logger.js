/**
 * 日志工具模块
 * 提供日志记录功能
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * 设置日志记录器
 * @param {string} outputDir - 日志输出目录
 * @param {string} logLevel - 日志级别
 * @returns {winston.Logger} - 日志记录器实例
 */
function setupLogger(outputDir, logLevel = 'info') {
  // 确保日志目录存在
  const logDir = path.join(outputDir, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 创建日志格式
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  );

  // 创建日志记录器
  const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports: [
      // 控制台输出
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),
      // 文件输出
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error'
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log')
      })
    ]
  });

  return logger;
}

module.exports = {
  setupLogger
};