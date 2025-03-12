/**
 * Markdown转换器模块
 * 负责将HTML内容转换为Markdown格式
 */

const TurndownService = require('turndown');
const cheerio = require('cheerio');
const path = require('path');
const URL = require('url').URL;

// 导入站点特定规则
const siteRules = require('../../config/site-rules');

/**
 * Markdown转换器类
 */
class MarkdownConverter {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    
    // 初始化Turndown服务
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });
    
    // 配置Turndown规则
    this.configureRules();
  }
  
  /**
   * 配置Turndown转换规则
   * @private
   */
  configureRules() {
    // 配置列表规则，保持缩进和嵌套结构
    if (this.config.rules.lists && this.config.rules.lists.preserveListIndent) {
      this.turndownService.addRule('listItem', {
        filter: 'li',
        replacement: (content, node, options) => {
          // 检查是否为导航菜单项
          const isMenuOrNavItem = node.parentNode && 
            (node.parentNode.classList.contains('menu-list') || 
             node.parentNode.classList.contains('nested-menu') ||
             node.closest('nav') || 
             node.closest('.navbar') || 
             node.closest('.menu'));
          
          // 检查是否为顶部导航项
          const isTopNavItem = node.classList.contains('top-nav-item');
          
          // 处理内容，保留格式
          content = content
            .replace(/^\n+/, '') // 移除开头的换行
            .replace(/\n+$/, '\n'); // 确保结尾只有一个换行
          
          // 如果不是菜单项，则缩进内容
          if (!isMenuOrNavItem) {
            content = content.replace(/\n/gm, '\n    '); // 缩进内容
          }
          
          // 获取列表项的缩进级别
          let level = 0;
          let parent = node.parentNode;
          while (parent && parent.nodeName !== 'BODY' && level < 5) {
            if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
              level++;
            }
            parent = parent.parentNode;
          }
          
          // 对于顶部导航，使用特殊处理
          if (isTopNavItem) {
            // 提取链接文本和URL
            const link = $(node).find('a').first();
            const linkText = link.text().trim();
            
            // 只返回文本，不包含链接
            return `- ${linkText}\n`;
          }
          
          // 配置链接规则
          this.turndownService.addRule('link', {
            filter: 'a',
            replacement: (content, node) => {
              // 检查是否为菜单项
              const isMenuOrNavItem = node.closest('.menu-item') || 
                               node.closest('nav') || 
                               node.closest('.navbar') || 
                               node.closest('.menu');
              
              // 对于菜单项，只返回文本内容，不包含链接
              if (isMenuOrNavItem) {
                return content;
              }
              
              // 对于普通链接，也只返回文本内容，不包含URL
              return content;
            }
          });
          
          // 计算缩进
          const indent = isMenuOrNavItem ? '    '.repeat(level - 1) : '  '.repeat(level - 1);
          const bullet = parent && parent.nodeName === 'OL' ? `${node.getAttribute('start') || '1'}. ` : '- ';
          
          // 添加空行（如果配置了）
          const blankLine = this.config.rules.lists.addBlankLine ? '\n' : '';
          
          // 对于导航菜单项，使用特殊格式
          if (isMenuOrNavItem) {
            // 检查是否有子菜单
            const hasSubmenu = $(node).find('ul, ol').length > 0;
            if (hasSubmenu) {
              // 提取链接文本
              const link = $(node).find('a').first();
              const linkText = link.text().trim();
              
              // 只返回文本，不包含链接
              return `${indent}${bullet}${linkText}\n`;
            }
          }
          
          return `${indent}${bullet}${content}${blankLine}`;
        }
      });
    }
    
    // 配置代码块规则
    this.turndownService.addRule('fencedCodeBlock', {
      filter: function(node, options) {
        return (
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        );
      },
      replacement: function(content, node, options) {
        const code = node.firstChild.textContent;
        const lang = node.firstChild.getAttribute('class') || '';
        const language = lang.replace(/^language-/, '');
        return '\n```' + language + '\n' + code + '\n```\n';
      }
    });
    
    // 配置菜单表格规则
    this.turndownService.addRule('menuTable', {
      filter: (node, options) => {
        return node.classList && 
               (node.classList.contains('menu-table') || 
                node.classList.contains('navbar') || 
                node.nodeName === 'NAV');
      },
      replacement: (content, node, options) => {
        // 提取菜单项
        const $ = cheerio.load(node.outerHTML);
        const menuItems = [];
        
        // 获取一级菜单项
        $('li').each((i, el) => {
          const linkText = $(el).find('a').first().text().trim();
          if (linkText) {
            menuItems.push(linkText);
          }
        });
        
        // 如果没有菜单项，返回原始内容
        if (menuItems.length === 0) {
          return content;
        }
        
        // 生成表格头部
        let tableContent = '| 导航菜单 |\n| --- |\n';
        
        // 添加菜单项到表格
        for (const item of menuItems) {
          tableContent += `| ${item} |\n`;
        }
        
        return '\n\n' + tableContent + '\n\n';
      }
    });
    
    // 配置表格规则
    if (this.config.rules.tables.preserveTables) {
      this.turndownService.addRule('tableCell', {
        filter: ['th', 'td'],
        replacement: function(content, node) {
          return ' ' + content + ' |';
        }
      });
      
      this.turndownService.addRule('tableRow', {
        filter: 'tr',
        replacement: function(content, node) {
          let borderRow = '';
          if (node.parentNode.nodeName === 'THEAD') {
            const columns = node.childNodes.length;
            borderRow = '|' + ' --- |'.repeat(columns) + '\n';
          }
          return '|' + content + '\n' + borderRow;
        }
      });
      
      this.turndownService.addRule('table', {
        filter: 'table',
        replacement: function(content, node) {
          const caption = node.querySelector('caption');
          const captionText = caption ? caption.textContent.trim() + '\n\n' : '';
          return '\n\n' + captionText + content + '\n\n';
        }
      });
    }
    
    // 配置图片规则
    this.turndownService.addRule('image', {
      filter: 'img',
      replacement: (content, node) => {
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        const title = node.getAttribute('title') || '';
        const titlePart = title ? ' "' + title + '"' : '';
        return src ? '![' + alt + '](' + src + titlePart + ')' : '';
      }
    });
    
    // 应用自定义规则
    if (this.config.rules.customElements) {
      for (const rule of this.config.rules.customElements) {
        this.turndownService.addRule(rule.selector, {
          filter: rule.selector,
          replacement: rule.replacement
        });
      }
    }
  }
  
  /**
   * 转换HTML为Markdown
   * @param {string} html - HTML内容
   * @param {string} baseUrl - 基础URL，用于解析相对链接
   * @returns {Object} 包含Markdown内容、链接和图片的对象
   */
  async convert(html, baseUrl) {
    // 加载HTML
    const $ = cheerio.load(html);
    
    // 获取站点特定规则
    const siteSpecificRules = siteRules.getSiteRuleByUrl(baseUrl);
    
    // 合并站点规则与默认规则
    let currentRules = this.config.rules;
    if (siteSpecificRules) {
      currentRules = siteRules.mergeWithDefaultRules(this.config.rules, siteSpecificRules);
    }
    
    // 使用合并后的规则
    const rulesForThisSite = { ...this.config, rules: currentRules };
    
    // 提取主要内容（使用站点特定选择器）
    const mainContent = this.extractMainContent($, rulesForThisSite.rules.contentSelectors);
    
    // 移除不需要的元素（使用站点特定选择器）
    this.removeUnwantedElements($, mainContent, rulesForThisSite.rules.removeSelectors);
    
    // 处理相对URL
    this.processUrls($, baseUrl);
    
    // 提取链接和图片
    const links = this.extractLinks($, baseUrl);
    const images = this.extractImages($, baseUrl);
    
    // 转换为Markdown
    let markdown;
    if (rulesForThisSite.rules.enableAI && rulesForThisSite.rules.ai.apiKey) {
      // 使用大模型辅助分析
      markdown = await this.convertWithAI(mainContent.html(), baseUrl);
    } else {
      // 使用规则转换
      markdown = this.turndownService.turndown(mainContent.html());
    }
    
    // 添加目录（如果启用）
    if (rulesForThisSite.markdown.addTableOfContents) {
      markdown = this.addTableOfContents(markdown);
    }
    
    return {
      markdown,
      links,
      images
    };
  }
  
  /**
   * 提取页面的主要内容
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {Array<string>} [contentSelectors] - 内容选择器数组，如果未提供则使用默认配置
   * @returns {Cheerio} 主要内容元素
   * @private
   */
  extractMainContent($, contentSelectors) {
    // 使用提供的选择器或默认配置
    const selectors = contentSelectors || this.config.rules.contentSelectors;
    
    // 尝试使用配置的内容选择器找到主要内容
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        return element.first();
      }
    }
    
    // 如果没有找到，返回body
    return $('body');
  }
  
  /**
   * 移除不需要的元素
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {Cheerio} content - 内容元素
   * @param {Array<string>} [removeSelectors] - 要移除的元素选择器数组，如果未提供则使用默认配置
   * @private
   */
  removeUnwantedElements($, content, removeSelectors) {
    // 移除脚本和样式
    content.find('script, style').remove();
    
    // 使用提供的选择器或默认配置
    const selectors = removeSelectors || this.config.rules.removeSelectors;
    
    // 移除配置的不需要的元素
    for (const selector of selectors) {
      content.find(selector).remove();
    }
    
    // 处理导航菜单的样式，保持其结构
    content.find('nav, .menu, .navbar').each((i, el) => {
      $(el).find('ul, ol').addClass('menu-list');
      $(el).find('li').addClass('menu-item');
    });
    
    // 优化嵌套菜单的结构
    content.find('.dropdown-menu, .sub-menu').each((i, el) => {
      $(el).addClass('nested-menu');
    });
    
    // 处理标题元素，保持其层级结构
    content.find('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const level = parseInt(el.tagName.substring(1));
      $(el).attr('data-level', level);
    });
  }
  
  /**
   * 处理页面中的URL
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {string} baseUrl - 基础URL
   * @private
   */
  processUrls($, baseUrl) {
    // 优化顶部导航菜单的结构
    $('.navbar-nav > li, .nav > li, header nav > ul > li').each((i, el) => {
      // 为顶级导航项添加特殊类
      $(el).addClass('top-nav-item');
      
      // 处理子菜单
      $(el).find('ul, ol').addClass('nested-menu');
      $(el).find('li').addClass('menu-item');
    });
    
    // 将导航菜单转换为表格结构
    $('nav, .menu, .navbar').each((i, el) => {
      // 添加特殊类以便后续处理
      $(el).addClass('menu-table');
    });
    
    if (this.config.rules.links.resolveRelativeUrls) {
      // 处理链接
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          $(el).attr('href', absoluteUrl);
        } catch (error) {
          // 忽略无效URL
        }
      });
      
      // 处理图片
      $('img[src]').each((i, el) => {
        const src = $(el).attr('src');
        try {
          const absoluteUrl = new URL(src, baseUrl).toString();
          $(el).attr('src', absoluteUrl);
        } catch (error) {
          // 忽略无效URL
        }
      });
    }
  }
  
  /**
   * 提取页面中的链接
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {string} baseUrl - 基础URL
   * @returns {Array<string>} 链接数组
   * @private
   */
  extractLinks($, baseUrl) {
    const links = new Set();
    
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      
      try {
        // 解析URL，处理相对URL
        const url = new URL(href, baseUrl).toString();
        links.add(url);
      } catch (error) {
        // 忽略无效URL
      }
    });
    
    return Array.from(links);
  }
  
  /**
   * 提取页面中的图片
   * @param {CheerioStatic} $ - Cheerio实例
   * @param {string} baseUrl - 基础URL
   * @returns {Array<Object>} 图片信息数组
   * @private
   */
  extractImages($, baseUrl) {
    const images = [];
    
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const title = $(el).attr('title') || '';
      
      try {
        // 解析URL，处理相对URL
        const url = new URL(src, baseUrl).toString();
        
        images.push({
          url,
          alt,
          title
        });
      } catch (error) {
        // 忽略无效URL
      }
    });
    
    return images;
  }
  
  /**
   * 使用大模型辅助分析转换HTML
   * @param {string} html - HTML内容
   * @param {string} baseUrl - 基础URL
   * @returns {string} Markdown内容
   * @private
   */
  async convertWithAI(html, baseUrl) {
    try {
      // 这里应该实现调用大模型API的逻辑
      // 由于API调用需要密钥和具体实现，这里只是一个占位
      // 实际项目中需要根据具体的大模型API进行实现
      
      // 使用规则转换作为后备方案
      return this.turndownService.turndown(html);
    } catch (error) {
      console.error('使用大模型转换失败:', error);
      // 使用规则转换作为后备方案
      return this.turndownService.turndown(html);
    }
  }
  
  /**
   * 添加目录
   * @param {string} markdown - Markdown内容
   * @returns {string} 添加了目录的Markdown内容
   * @private
   */
  addTableOfContents(markdown) {
    // 提取标题
    const headings = [];
    const headingRegex = /^(#{1,6})\s+(.+?)\s*$/gm;
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const anchor = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      
      headings.push({
        level,
        text,
        anchor
      });
    }
    
    // 如果没有标题，则不添加目录
    if (headings.length === 0) {
      return markdown;
    }
    
    // 生成目录
    let toc = '## 目录\n\n';
    
    for (const heading of headings) {
      const indent = '  '.repeat(heading.level - 1);
      toc += `${indent}- [${heading.text}](#${heading.anchor})\n`;
    }
    
    // 添加目录到Markdown内容前面
    return toc + '\n' + markdown;
  }
}

module.exports = MarkdownConverter;