/**
 * MDCrawl 默认配置文件
 */

module.exports = {
  // 爬虫基本配置
  crawler: {
    // 并发请求数
    concurrency: 3,
    // 请求超时时间（毫秒）
    timeout: 30000,
    // 请求间隔（毫秒）
    requestInterval: 1000,
    // 最大重试次数
    maxRetries: 3,
    // 默认爬取深度，0表示只爬取当前页面
    defaultDepth: 0,
    // 最大爬取深度
    maxDepth: 100,
    // 是否遵循robots.txt规则
    respectRobotsTxt: true,
    // 用户代理
    userAgent: 'MDCrawl/1.0.0 (+https://github.com/yourusername/mdcrawl)'
  },
  
  // 认证配置
  auth: {
    // 默认不启用认证
    enabled: false,
    // 认证类型：basic, form
    type: 'basic',
    // 用户名
    username: '',
    // 密码
    password: ''
  },
  
  // URL过滤规则
  urlFilters: {
    // 允许的域名（默认只允许同源）
    allowedDomains: [],
    // 排除的URL模式（正则表达式字符串数组）
    excludePatterns: [
      '\\.(css|js|json|xml|less|scss|png|jpg|jpeg|gif|pdf|doc|docx|xls|xlsx|zip|rar|gz|bz2|7z)$',
      '\\?(utm_|source=|from=)'
    ]
  },
  
  // Markdown转换配置
  markdown: {
    // 是否保留HTML标签
    keepHtml: false,
    // 是否下载图片
    downloadImages: true,
    // 图片保存目录（相对于Markdown文件）
    imagesDir: 'images',
    // 子页面保存目录
    childrenDir: 'children',
    // 是否在Markdown中添加原始URL引用
    addSourceUrl: true,
    // 是否添加目录
    addTableOfContents: true
  },
  
  // 规则引擎配置
  rules: {
    // 规则文件路径
    rulesFile: 'config/rules.js',
    // 是否启用大模型辅助分析
    enableAI: false,
    // 大模型配置
    ai: {
      // API密钥
      apiKey: '',
      // 模型名称
      model: 'gpt-3.5-turbo',
      // 提示词模板文件
      promptTemplate: 'config/prompt-template.txt'
    }
  },
  
  // 输出配置
  output: {
    // 工作区目录
    workDir: './output',
    // 日志级别: error, warn, info, verbose, debug, silly
    logLevel: 'info',
    // 是否在控制台显示进度
    showProgress: true
  }
};