/**
 * 示例配置文件，展示如何配置代理服务器
 */

module.exports = {
  // 爬虫基本配置
  crawler: {
    concurrency: 3,
    timeout: 30000,
    requestInterval: 1000,
    maxRetries: 3,
    userAgent: 'MDCrawl/1.0.0 (+https://github.com/yourusername/mdcrawl)',
    // 代理设置
    proxy: {
      // 是否启用代理
      enabled: true,
      // 代理服务器地址
      host: 'proxy.example.com',
      // 代理服务器端口
      port: 8080,
      // 代理认证用户名
      username: 'proxyuser',
      // 代理认证密码
      password: 'proxypassword',
      // 代理协议 (http, https, socks5)
      protocol: 'http'
    }
  },

  // 其他配置项...
  urlFilters: {
    allowedDomains: [],
    excludePatterns: [
      '\\.(css|js|json|xml|less|scss|png|jpg|jpeg|gif|pdf|doc|docx|xls|xlsx|zip|rar|gz|bz2|7z)$',
      '\\?(utm_|source=|from=)'
    ]
  },

  markdown: {
    keepHtml: false,
    downloadImages: true,
    imagesDir: 'images',
    childrenDir: 'children',
    addSourceUrl: true,
    addTableOfContents: true
  }
};