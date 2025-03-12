/**
 * MDCrawl 转换规则配置文件
 * 定义了HTML到Markdown转换的规则和选择器
 */

module.exports = {
  // 内容选择器：用于选择页面的主要内容区域
  contentSelectors: [
    // 常见的内容区域选择器，按优先级排序
    'article',
    '.article',
    '.post',
    '.content',
    '#content',
    '.main-content',
    'main',
    '.entry-content',
    '.post-content',
    '.article-content',
    // 如果没有找到特定内容区域，则使用body
    'body'
  ],

  // 需要移除的元素选择器
  removeSelectors: [
    // 导航区域 - 保留主导航，但移除次要导航
    // 'nav', // 不移除主导航，以保持页面结构
    '.navigation:not(.main-navigation)',
    // '.menu', // 不移除菜单，以保持页面结构
    '.navbar:not(.main-navbar)',
    // 侧边栏 - 选择性保留
    'aside:not(.main-sidebar)',
    '.sidebar:not(.main-sidebar)',
    // 页脚
    'footer',
    '.footer',
    // 广告
    '.ad',
    '.ads',
    '.advertisement',
    // 评论区
    '.comments',
    '#comments',
    '.comment-section',
    // 社交分享按钮
    '.share',
    '.social',
    '.social-share',
    // 相关文章
    '.related',
    '.related-posts',
    // 其他常见的非内容元素
    '.cookie-notice',
    '.popup',
    '.modal'
  ],

  // 标题处理规则
  headings: {
    // 是否保留原始标题级别
    preserveHeadingLevel: true,
    // 标题级别偏移量（用于调整标题层级）
    headingLevelOffset: 0,
    // 最小标题级别（小于此级别的标题将被调整）
    minHeadingLevel: 1,
    // 是否保留标题的原始样式和缩进
    preserveHeadingStyle: true
  },

  // 链接处理规则
  links: {
    // 是否在链接后添加URL
    addLinkUrls: false,
    // 是否处理相对URL
    resolveRelativeUrls: true
  },

  // 图片处理规则
  images: {
    // 是否包含图片alt文本
    includeAltText: true,
    // 是否包含图片标题
    includeImageTitle: true,
    // 图片下载超时时间（毫秒）
    downloadTimeout: 10000,
    // 图片最大大小（字节）
    maxSize: 5 * 1024 * 1024
  },

  // 表格处理规则
  tables: {
    // 是否保留表格
    preserveTables: true,
    // 是否添加表格标题
    includeTableCaption: true
  },

  // 代码块处理规则
  codeBlocks: {
    // 是否保留代码块语言
    preserveLanguage: true,
    // 默认代码块语言（当无法检测时）
    defaultLanguage: 'text'
  },

  // 列表处理规则
  lists: {
    // 是否保留列表类型（有序/无序）
    preserveListType: true,
    // 是否保留列表的缩进和嵌套结构
    preserveListIndent: true,
    // 列表项之间是否添加空行
    addBlankLine: false,
    // 子列表缩进空格数
    subListIndent: 4
  },

  // 自定义元素处理规则
  customElements: [
    // 示例：将特定元素转换为特定的Markdown格式
    {
      selector: '.note',
      replacement: function(content) {
        return '> **Note:** ' + content + '\n\n';
      }
    },
    {
      selector: '.warning',
      replacement: function(content) {
        return '> **Warning:** ' + content + '\n\n';
      }
    },
    // 导航菜单项处理
    {
      selector: '.menu-item',
      replacement: function(content, node) {
        // 获取节点的嵌套级别
        let level = 0;
        let parent = node.parentNode;
        while (parent && parent.nodeName !== 'NAV' && level < 5) {
          if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
            level++;
          }
          parent = parent.parentNode;
        }
        // 根据嵌套级别添加缩进
        const indent = '    '.repeat(level);
        return indent + '- ' + content + '\n';
      }
    },
    // 处理嵌套菜单
    {
      selector: '.sub-menu, .dropdown-menu',
      replacement: function(content) {
        // 保持子菜单的缩进结构
        return content;
      }
    }
  ],

  // 大模型分析提示词模板
  aiPromptTemplate: `
    请将以下HTML内容转换为结构良好的Markdown格式。
    保留原文的标题结构、段落划分、列表和重要格式。
    保留主导航菜单的结构，但可以简化次要导航。
    对于嵌套菜单，请保持其层级结构和缩进。
    对于表格，保持其结构并转换为Markdown表格格式。
    对于代码块，保留其格式和语言标记。
    对于图片，确保其位置和排版与原始页面一致。
    保持页面的整体布局和视觉结构，使Markdown版本尽可能接近原始HTML页面的视觉效果。
    
    HTML内容：
    {{html}}
  `
};