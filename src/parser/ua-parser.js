/**
 * UA 解析器模块
 * 负责解析 User-Agent 字符串，识别浏览器、操作系统和设备类型
 */

/**
 * UA 解析器类
 */
class UaParser {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    
    // 浏览器识别规则
    this.browserRules = [
      { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/ },
      { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/ },
      { name: 'Safari', pattern: /Version\/([0-9.]+).*Safari/ },
      { name: 'Edge', pattern: /Edg\/([0-9.]+)/ },
      { name: 'Opera', pattern: /(?:Opera|OPR)\/([0-9.]+)/ },
      { name: 'Internet Explorer', pattern: /MSIE\s([0-9.]+)/ },
      { name: 'Internet Explorer', pattern: /Trident\/([0-9.]+)/ },
      { name: 'MDCrawl', pattern: /MDCrawl\/([0-9.]+)/ }
    ];
    
    // 操作系统识别规则
    this.osRules = [
      { name: 'Windows', pattern: /Windows\sNT\s([0-9.]+)/ },
      { name: 'macOS', pattern: /Mac\sOS\sX\s([0-9_]+)/ },
      { name: 'Linux', pattern: /Linux/ },
      { name: 'Android', pattern: /Android\s([0-9.]+)/ },
      { name: 'iOS', pattern: /OS\s([0-9_]+)/ },
      { name: 'Chrome OS', pattern: /CrOS/ }
    ];
    
    // 设备类型识别规则
    this.deviceRules = [
      { type: 'mobile', pattern: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Kindle/ },
      { type: 'tablet', pattern: /iPad|Android(?!.*Mobile)/ },
      { type: 'desktop', pattern: /Windows NT|Macintosh|Linux/ }
    ];
  }
  
  /**
   * 解析 User-Agent 字符串
   * @param {string} userAgent - User-Agent 字符串
   * @returns {Object} 解析结果
   */
  parse(userAgent) {
    if (!userAgent) {
      return {
        browser: { name: 'Unknown', version: 'Unknown' },
        os: { name: 'Unknown', version: 'Unknown' },
        deviceType: 'Unknown'
      };
    }
    
    // 解析浏览器信息
    const browser = this.getBrowser(userAgent);
    
    // 解析操作系统信息
    const os = this.getOS(userAgent);
    
    // 解析设备类型
    const deviceType = this.getDeviceType(userAgent);
    
    return {
      browser,
      os,
      deviceType
    };
  }
  
  /**
   * 获取浏览器信息
   * @param {string} userAgent - User-Agent 字符串
   * @returns {Object} 浏览器信息
   */
  getBrowser(userAgent) {
    for (const rule of this.browserRules) {
      const match = userAgent.match(rule.pattern);
      if (match) {
        return {
          name: rule.name,
          version: match[1] || 'Unknown'
        };
      }
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }
  
  /**
   * 获取操作系统信息
   * @param {string} userAgent - User-Agent 字符串
   * @returns {Object} 操作系统信息
   */
  getOS(userAgent) {
    for (const rule of this.osRules) {
      const match = userAgent.match(rule.pattern);
      if (match) {
        let version = 'Unknown';
        
        // 特殊处理版本号格式
        if (rule.name === 'Windows') {
          const versionMap = {
            '10.0': '10',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
            '6.0': 'Vista',
            '5.1': 'XP'
          };
          version = versionMap[match[1]] || match[1];
        } else if (rule.name === 'macOS') {
          version = match[1].replace(/_/g, '.');
        } else if (rule.name === 'iOS') {
          version = match[1].replace(/_/g, '.');
        } else if (match[1]) {
          version = match[1];
        }
        
        return {
          name: rule.name,
          version
        };
      }
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }
  
  /**
   * 获取设备类型
   * @param {string} userAgent - User-Agent 字符串
   * @returns {string} 设备类型
   */
  getDeviceType(userAgent) {
    for (const rule of this.deviceRules) {
      if (rule.pattern.test(userAgent)) {
        return rule.type;
      }
    }
    
    return 'Unknown';
  }
  
  /**
   * 判断是否为移动设备
   * @param {string} userAgent - User-Agent 字符串
   * @returns {boolean} 是否为移动设备
   */
  isMobile(userAgent) {
    const deviceType = this.getDeviceType(userAgent);
    return deviceType === 'mobile' || deviceType === 'tablet';
  }
  
  /**
   * 判断是否为爬虫
   * @param {string} userAgent - User-Agent 字符串
   * @returns {boolean} 是否为爬虫
   */
  isCrawler(userAgent) {
    if (!userAgent) return false;
    
    // 常见的爬虫标识
    const crawlerPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /MDCrawl/i
    ];
    
    return crawlerPatterns.some(pattern => pattern.test(userAgent));
  }
}

module.exports = UaParser;