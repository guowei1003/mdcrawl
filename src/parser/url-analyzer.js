/**
 * URL分析器模块
 * 负责URL的规范化、过滤和分析
 */

const URL = require('url').URL;
const path = require('path');

/**
 * URL分析器类
 */
class UrlAnalyzer {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    
    // 编译排除模式正则表达式
    this.excludePatterns = this.config.urlFilters.excludePatterns.map(pattern => new RegExp(pattern));
  }
  
  /**
   * 规范化URL
   * @param {string} url - 原始URL
   * @returns {string} 规范化后的URL
   */
  normalizeUrl(url) {
    try {
      // 解析URL
      const urlObj = new URL(url);
      
      // 移除URL中的片段标识符
      urlObj.hash = '';
      
      // 返回规范化的URL
      return urlObj.toString();
    } catch (error) {
      // 如果URL无效，则返回原始URL
      return url;
    }
  }
  
  /**
   * 判断URL是否应该被爬取
   * @param {string} url - 要检查的URL
   * @param {string} [parentUrl] - 父URL
   * @returns {boolean} 是否应该爬取
   */
  shouldCrawl(url, parentUrl = null) {
    try {
      // 解析URL
      const urlObj = new URL(url);
      
      // 检查是否为同源URL
      if (parentUrl) {
        const parentUrlObj = new URL(parentUrl);
        
        // 如果配置了允许的域名列表，则检查当前域名是否在列表中
        if (this.config.urlFilters.allowedDomains.length > 0) {
          const isAllowed = this.config.urlFilters.allowedDomains.some(domain => {
            return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
          });
          
          if (!isAllowed) {
            return false;
          }
        }
        // 否则只允许同源URL
        else if (urlObj.hostname !== parentUrlObj.hostname) {
          return false;
        }
      }
      
      // 检查URL是否匹配排除模式
      for (const pattern of this.excludePatterns) {
        if (pattern.test(url)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // 如果URL无效，则不爬取
      return false;
    }
  }
  
  /**
   * 从HTML中提取链接
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {string} baseUrl - 基础URL，用于解析相对URL
   * @returns {Array<string>} 提取的链接数组
   */
  extractLinks($, baseUrl) {
    const links = new Set();
    
    // 提取所有链接
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      
      try {
        // 解析URL，处理相对URL
        const url = new URL(href, baseUrl).toString();
        
        // 规范化URL并添加到集合
        links.add(this.normalizeUrl(url));
      } catch (error) {
        // 忽略无效URL
      }
    });
    
    return Array.from(links);
  }
  
  /**
   * 获取URL的文件名
   * @param {string} url - URL
   * @returns {string} 文件名
   */
  getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      
      // 如果路径以斜杠结尾，使用index
      if (pathname.endsWith('/')) {
        pathname += 'index';
      }
      
      // 获取路径的最后一部分作为文件名
      let filename = path.basename(pathname);
      
      // 如果文件名为空，使用主机名
      if (!filename) {
        filename = urlObj.hostname;
      }
      
      // 清理文件名，移除无效字符
      filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // 如果文件名仍然为空，使用时间戳
      if (!filename) {
        filename = 'page_' + Date.now();
      }
      
      return filename + '.md';
    } catch (error) {
      // 如果URL无效，返回默认文件名
      return 'page_' + Date.now() + '.md';
    }
  }
}

module.exports = UrlAnalyzer;