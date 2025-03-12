/**
 * 爬虫核心模块
 * 负责网页抓取、URL分析和队列管理
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const URL = require('url').URL;
const cheerio = require('cheerio');

// 导入其他模块
const MarkdownConverter = require('../converter/markdown-converter');
const UrlAnalyzer = require('../parser/url-analyzer');
const { setupLogger } = require('../utils/logger');

/**
 * 爬虫类
 */
class Crawler {
  /**
   * 构造函数
   * @param {Object} config - 爬虫配置
   */
  constructor(config) {
    this.config = config;
    this.logger = setupLogger(config.output.workDir, config.output.logLevel);
    this.markdownConverter = new MarkdownConverter(config);
    this.urlAnalyzer = new UrlAnalyzer(config);
    
    // 已访问的URL集合，用于防止重复爬取
    this.visitedUrls = new Set();
    
    // 待爬取的URL队列
    this.urlQueue = [];
    
    // 当前正在处理的URL数量
    this.processingCount = 0;
    
    // 是否已初始化浏览器
    this.browserInitialized = false;
    
    // 停止标志，用于控制爬虫停止
    this.isStopped = false;
    
    // 当前活跃的页面集合，用于在停止时关闭所有页面
    this.activePages = new Set();
  }
  
  /**
   * 初始化浏览器
   * @private
   */
  async initBrowser() {
    if (this.browserInitialized) return;
    
    this.logger.info('初始化浏览器...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.browserInitialized = true;
    this.logger.info('浏览器初始化完成');
  }
  
  /**
   * 关闭浏览器
   * @private
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browserInitialized = false;
      this.logger.info('浏览器已关闭');
    }
  }
  
  /**
   * 开始爬取
   * @param {string} startUrl - 起始URL
   */
  async crawl(startUrl) {
    try {
      // 初始化浏览器
      await this.initBrowser();
      
      // 将起始URL添加到队列
      this.addToQueue(startUrl, 0);
      
      // 开始处理队列
      await this.processQueue();
      
      // 关闭浏览器
      await this.closeBrowser();
      
      this.logger.info(`爬取完成，共处理 ${this.visitedUrls.size} 个URL`);
      return true;
    } catch (error) {
      this.logger.error(`爬取过程中发生错误: ${error.message}`);
      await this.closeBrowser();
      throw error;
    }
  }
  
  /**
   * 将URL添加到队列
   * @param {string} url - 要添加的URL
   * @param {number} depth - 当前深度
   * @param {string} [parentUrl] - 父URL
   * @private
   */
  addToQueue(url, depth, parentUrl = null) {
    // 规范化URL
    const normalizedUrl = this.urlAnalyzer.normalizeUrl(url);
    
    // 如果URL已访问过或已在队列中，则跳过
    if (this.visitedUrls.has(normalizedUrl)) {
      return;
    }
    
    // 检查URL是否符合过滤规则
    if (!this.urlAnalyzer.shouldCrawl(normalizedUrl, parentUrl)) {
      return;
    }
    
    // 检查深度是否超过限制
    if (depth > this.config.crawler.maxDepth) {
      return;
    }
    
    // 添加到队列
    this.urlQueue.push({
      url: normalizedUrl,
      depth,
      parentUrl
    });
    
    this.logger.debug(`添加到队列: ${normalizedUrl} (深度: ${depth})`);
  }
  
  /**
   * 停止爬虫
   * 优雅地关闭所有连接和浏览器
   */
  async stop() {
    this.logger.info('正在停止爬虫...');
    this.isStopped = true;
    
    // 清空队列
    this.urlQueue = [];
    
    // 关闭所有活跃页面
    for (const page of this.activePages) {
      try {
        await page.close();
      } catch (error) {
        // 忽略关闭页面时的错误
      }
    }
    this.activePages.clear();
    
    // 关闭浏览器
    await this.closeBrowser();
    
    this.logger.info('爬虫已停止');
  }
  
  /**
   * 处理URL队列
   * @private
   */
  async processQueue() {
    while ((this.urlQueue.length > 0 || this.processingCount > 0) && !this.isStopped) {
      // 如果没有URL或者正在处理的URL数量达到并发上限，则等待
      if (this.urlQueue.length === 0 || this.processingCount >= this.config.crawler.concurrency) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // 检查是否已停止
      if (this.isStopped) {
        break;
      }
      
      // 从队列中取出一个URL
      const { url, depth, parentUrl } = this.urlQueue.shift();
      
      // 标记为已访问
      this.visitedUrls.add(url);
      
      // 增加处理计数
      this.processingCount++;
      
      // 异步处理URL
      this.processUrl(url, depth, parentUrl)
        .catch(error => {
          if (!this.isStopped) {
            this.logger.error(`处理URL ${url} 时发生错误: ${error.message}`);
          }
        })
        .finally(() => this.processingCount--);
    }
  }
  
  /**
   * 处理单个URL
   * @param {string} url - 要处理的URL
   * @param {number} depth - 当前深度
   * @param {string} [parentUrl] - 父URL
   * @private
   */
  async processUrl(url, depth, parentUrl) {
    this.logger.info(`开始处理: ${url} (深度: ${depth})`);
    
    // 如果已停止，则不处理
    if (this.isStopped) {
      return;
    }
    
    let page = null;
    
    try {
      // 创建新的页面
      page = await this.browser.newPage();
      
      // 将页面添加到活跃页面集合
      this.activePages.add(page);
      
      // 设置用户代理
      await page.setUserAgent(this.config.crawler.userAgent);
      
      // 如果启用了认证，设置认证信息
      if (this.config.auth.enabled) {
        if (this.config.auth.type === 'basic') {
          await page.authenticate({
            username: this.config.auth.username,
            password: this.config.auth.password
          });
        }
      }
      
      // 设置超时
      page.setDefaultNavigationTimeout(this.config.crawler.timeout);
      
      // 检查是否已停止
      if (this.isStopped) {
        throw new Error('爬虫已停止');
      }
      
      // 访问页面
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // 获取页面HTML
      const html = await page.content();
      
      // 解析页面内容
      const $ = cheerio.load(html);
      
      // 检查是否已停止
      if (this.isStopped) {
        throw new Error('爬虫已停止');
      }
      
      // 转换为Markdown
      const { markdown, links, images } = await this.markdownConverter.convert(html, url);
      
      // 保存Markdown文件
      const outputPath = await this.saveMarkdown(url, markdown, depth, parentUrl);
      
      // 下载图片
      if (this.config.markdown.downloadImages && images.length > 0 && !this.isStopped) {
        await this.downloadImages(images, outputPath);
      }
      
      // 如果深度未达到最大值且未停止，将链接添加到队列
      if (depth < this.config.crawler.maxDepth && !this.isStopped) {
        for (const link of links) {
          this.addToQueue(link, depth + 1, url);
        }
      }
      
      this.logger.info(`处理完成: ${url}`);
    } catch (error) {
      // 如果不是因为停止导致的错误，才记录错误
      if (!this.isStopped || error.message !== '爬虫已停止') {
        this.logger.error(`处理URL ${url} 时发生错误: ${error.message}`);
      }
      throw error;
    } finally {
      // 关闭页面并从活跃页面集合中移除
      if (page) {
        try {
          // 从活跃页面集合中移除
          this.activePages.delete(page);
          // 关闭页面
          await page.close();
        } catch (closeError) {
          // 忽略关闭页面时的错误
        }
      }
    }
  }
  
  /**
   * 保存Markdown文件
   * @param {string} url - 原始URL
   * @param {string} markdown - Markdown内容
   * @param {number} depth - 当前深度
   * @param {string} [parentUrl] - 父URL
   * @returns {string} 输出文件路径
   * @private
   */
  async saveMarkdown(url, markdown, depth, parentUrl) {
    // 生成文件名
    const urlObj = new URL(url);
    let fileName = urlObj.hostname + urlObj.pathname.replace(/\//g, '_');
    if (fileName.endsWith('_')) fileName = fileName.slice(0, -1);
    fileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md';
    
    // 确定输出目录
    let outputDir = this.config.output.workDir;
    if (depth > 0 && parentUrl) {
      outputDir = path.join(outputDir, this.config.markdown.childrenDir);
    }
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 完整的输出路径
    const outputPath = path.join(outputDir, fileName);
    
    // 如果启用了添加源URL，在Markdown开头添加原始URL引用
    let content = markdown;
    if (this.config.markdown.addSourceUrl) {
      content = `> 原始页面: [${url}](${url})\n\n${content}`;
    }
    
    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf8');
    
    this.logger.info(`保存Markdown文件: ${outputPath}`);
    return outputPath;
  }
  
  /**
   * 下载图片
   * @param {Array<Object>} images - 图片信息数组
   * @param {string} markdownPath - Markdown文件路径
   * @private
   */
  async downloadImages(images, markdownPath) {
    // 创建图片目录
    const imagesDir = path.join(path.dirname(markdownPath), this.config.markdown.imagesDir);
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // 读取Markdown内容
    let markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // 下载每个图片
    for (const image of images) {
      try {
        // 生成图片文件名
        const imageName = path.basename(image.url).replace(/[^a-zA-Z0-9._-]/g, '_');
        const imageExt = path.extname(imageName) || '.jpg';
        const imageFileName = `${Date.now()}_${imageName}`;
        const imagePath = path.join(imagesDir, imageFileName);
        
        // 下载图片
        const response = await axios({
          method: 'get',
          url: image.url,
          responseType: 'arraybuffer',
          timeout: this.config.rules.images.downloadTimeout
        });
        
        // 保存图片
        fs.writeFileSync(imagePath, response.data);
        
        // 替换Markdown中的图片URL
        const relativeImagePath = path.join(this.config.markdown.imagesDir, imageFileName);
        markdownContent = markdownContent.replace(
          new RegExp(`!\\[(.*?)\\]\\(${image.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
          `![${image.alt || ''}](${relativeImagePath})`
        );
        
        this.logger.debug(`下载图片: ${image.url} -> ${imagePath}`);
      } catch (error) {
        this.logger.error(`下载图片 ${image.url} 失败: ${error.message}`);
      }
    }
    
    // 更新Markdown文件
    fs.writeFileSync(markdownPath, markdownContent, 'utf8');
  }
}

module.exports = Crawler;