/**
 * MDCrawl 站点特定规则配置文件
 * 为不同网站定义特定的爬取和转换规则
 */

module.exports = {
  // 站点规则映射，键为域名，值为该站点的特定规则
  siteRules: {
    // GitHub 相关规则
    'github.com': {
      // 内容选择器：用于选择页面的主要内容区域
      contentSelectors: [
        '.markdown-body',  // GitHub 仓库 README 和文档
        '.repository-content', // 仓库主页
        '.issue-detail',  // Issues 页面
        '.pull-request-tab-content', // PR 页面
        '.wiki-body'  // Wiki 页面
      ],
      // 需要移除的元素选择器
      removeSelectors: [
        '.file-navigation',
        '.pagehead',
        '.commit-tease',
        '.gh-header-actions',
        '.pr-toolbar',
        '.discussion-sidebar'
      ],
      // 图片处理规则
      images: {
        // 图片路径前缀，用于处理相对路径
        pathPrefix: 'https://github.com',
        // 是否下载图片
        downloadImages: true
      }
    },
    
    // 简书相关规则
    'jianshu.com': {
      contentSelectors: [
        'article.article',  // 文章正文
        '.note-content',   // 笔记内容
        '.show-content'    // 显示内容
      ],
      removeSelectors: [
        '.author',          // 作者信息
        '.meta-bottom',    // 底部元数据
        '.comment-list',   // 评论列表
        '.support-author', // 赞赏作者
        '.follow-detail',  // 关注详情
        '.recommend-note'  // 推荐笔记
      ],
      // 标题处理规则
      headings: {
        // 标题级别偏移量（用于调整标题层级）
        headingLevelOffset: 0
      }
    },
    
    // 知乎相关规则
    'zhihu.com': {
      contentSelectors: [
        '.Post-RichTextContainer', // 文章内容
        '.QuestionAnswer-content', // 问答内容
        '.RichContent-inner'       // 富文本内容
      ],
      removeSelectors: [
        '.FollowButton',           // 关注按钮
        '.ContentItem-actions',    // 内容项操作
        '.Post-topicsAndReviewer', // 文章主题和审核者
        '.Reward',                 // 赞赏区域
        '.MoreAnswers',            // 更多回答
        '.Comments-container'      // 评论容器
      ],
      // 知乎特有的内容处理规则
      customRules: {
        // 处理知乎卡片
        processZhihuCards: true,
        // 处理知乎视频
        processZhihuVideos: true
      }
    },
    
    // 掘金相关规则
    'juejin.cn': {
      contentSelectors: [
        '.article-content',  // 文章内容
        '.markdown-body'     // Markdown 内容
      ],
      removeSelectors: [
        '.author-info-block', // 作者信息
        '.article-suspended-panel', // 悬浮面板
        '.comment-box',      // 评论框
        '.recommended-area'  // 推荐区域
      ]
    },
    
    // 微信公众号文章规则
    'mp.weixin.qq.com': {
      contentSelectors: [
        '#js_content',       // 文章内容
        '.rich_media_content' // 富媒体内容
      ],
      removeSelectors: [
        '#js_pc_qr_code',    // PC 二维码
        '#js_profile_qrcode', // 个人资料二维码
        '.rich_media_meta_list', // 元数据列表
        '.qr_code_pc'        // PC 二维码
      ],
      // 微信公众号特有的内容处理规则
      customRules: {
        // 处理微信代码块
        processWechatCodeBlocks: true,
        // 处理微信图片
        processWechatImages: true
      }
    },
    
    // CSDN 相关规则
    'blog.csdn.net': {
      contentSelectors: [
        '#article_content', // 文章内容
        '.blog-content-box' // 博客内容盒子
      ],
      removeSelectors: [
        '.recommend-box',   // 推荐盒子
        '.blog-sidebar',    // 博客侧边栏
        '.article-header-box', // 文章头部盒子
        '.comment-box',     // 评论盒子
        '.template-box',    // 模板盒子
        '.hide-article-box' // 隐藏文章盒子
      ]
    }
  },
  
  /**
   * 根据URL获取站点规则
   * @param {string} url - 网页URL
   * @returns {Object|null} 站点规则对象，如果没有匹配的规则则返回null
   */
  getSiteRuleByUrl: function(url) {
    try {
      // 解析URL获取域名
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // 尝试精确匹配域名
      if (this.siteRules[hostname]) {
        return this.siteRules[hostname];
      }
      
      // 尝试匹配子域名
      for (const domain in this.siteRules) {
        if (hostname.endsWith('.' + domain) || hostname === domain) {
          return this.siteRules[domain];
        }
      }
      
      // 没有找到匹配的规则
      return null;
    } catch (error) {
      // URL解析错误
      return null;
    }
  },
  
  /**
   * 合并站点规则与默认规则
   * @param {Object} defaultRules - 默认规则对象
   * @param {Object} siteRules - 站点特定规则对象
   * @returns {Object} 合并后的规则对象
   */
  mergeWithDefaultRules: function(defaultRules, siteRules) {
    if (!siteRules) {
      return defaultRules;
    }
    
    // 深度合并规则对象
    const mergedRules = { ...defaultRules };
    
    // 合并内容选择器（站点规则优先）
    if (siteRules.contentSelectors) {
      mergedRules.contentSelectors = [
        ...siteRules.contentSelectors,
        ...defaultRules.contentSelectors.filter(selector => 
          !siteRules.contentSelectors.includes(selector)
        )
      ];
    }
    
    // 合并移除选择器
    if (siteRules.removeSelectors) {
      mergedRules.removeSelectors = [
        ...siteRules.removeSelectors,
        ...defaultRules.removeSelectors.filter(selector => 
          !siteRules.removeSelectors.includes(selector)
        )
      ];
    }
    
    // 合并其他规则配置
    for (const key in siteRules) {
      if (key !== 'contentSelectors' && key !== 'removeSelectors') {
        if (typeof siteRules[key] === 'object' && !Array.isArray(siteRules[key])) {
          mergedRules[key] = { ...defaultRules[key], ...siteRules[key] };
        } else {
          mergedRules[key] = siteRules[key];
        }
      }
    }
    
    return mergedRules;
  }
};