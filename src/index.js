#!/usr/bin/env node

/**
 * MDCrawl - 网页转Markdown爬虫工具
 * 入口文件
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const config = require('config');
const winston = require('winston');

// 导入核心模块
const Crawler = require('./crawler/crawler');
const { setupLogger } = require('./utils/logger');

// 导入规则配置
const rulesConfig = require('../config/rules.js');

// 设置版本号和描述
const packageJson = require('../package.json');
program
  .version(packageJson.version)
  .description('一个将网页内容转换为Markdown格式的爬虫工具');

// 定义命令行选项
program
  .argument('<url>', '要爬取的网页URL')
  .option('-o, --output <dir>', '输出目录', config.get('output.workDir'))
  .option('-d, --depth <number>', '爬取深度 (0-100)', config.get('crawler.defaultDepth'))
  .option('-c, --concurrency <number>', '并发请求数', config.get('crawler.concurrency'))
  .option('-a, --auth', '启用认证', config.get('auth.enabled'))
  .option('-u, --username <username>', '认证用户名')
  .option('-p, --password <password>', '认证密码')
  .option('--ai', '启用AI辅助分析', config.get('rules.enableAI'))
  .option('--no-images', '不下载图片', true)
  .option('--config <path>', '自定义配置文件路径')
  .action(async (url, options) => {
    try {
      // 初始化日志
      const logger = setupLogger(options.output, options.verbose ? 'debug' : config.get('output.logLevel'));
      
      // 合并配置
      const crawlerConfig = {
        ...config,
        output: {
          ...config.get('output'),
          workDir: options.output
        },
        crawler: {
          ...config.get('crawler'),
          depth: parseInt(options.depth, 10),
          concurrency: parseInt(options.concurrency, 10)
        },
        auth: {
          ...config.get('auth'),
          enabled: options.auth,
          username: options.username || config.get('auth.username'),
          password: options.password || config.get('auth.password')
        },
        markdown: {
          ...config.get('markdown'),
          downloadImages: options.images
        },
        rules: {
          ...config.get('rules'),
          enableAI: options.ai,
          // 合并rules.js中的配置
          ...rulesConfig
        }
      };
      
      // 验证URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        logger.error('URL必须以http://或https://开头');
        process.exit(1);
      }
      
      // 验证爬取深度
      const depth = parseInt(options.depth, 10);
      if (isNaN(depth) || depth < 0 || depth > 100) {
        logger.error('爬取深度必须是0-100之间的整数');
        process.exit(1);
      }
      
      // 确保输出目录存在
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }
      
      // 创建爬虫实例并开始爬取
      logger.info(`开始爬取: ${url}`);
      logger.info(`输出目录: ${options.output}`);
      logger.info(`爬取深度: ${options.depth}`);
      
      const crawler = new Crawler(crawlerConfig);
      
      // 添加信号处理，优雅地停止爬虫
      process.on('SIGINT', async () => {
        logger.info('收到停止信号，正在停止爬虫...');
        await crawler.stop();
        logger.info('爬虫已停止，进程即将退出');
        process.exit(0);
      });
      
      await crawler.crawl(url);
      
      logger.info('爬取完成!');
    } catch (error) {
      console.error('爬取过程中发生错误:', error);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);