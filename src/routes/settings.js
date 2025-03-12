// 设置相关API路由
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { setupLogger } = require('../utils/logger');

// 创建一个默认的日志目录
const logOutputDir = path.join(process.cwd(), '../../logs');
// 确保输出目录存在
if (!fs.existsSync(logOutputDir)) {
  fs.mkdirSync(logOutputDir, { recursive: true });
}

const logger = setupLogger(logOutputDir);

// 默认设置
const defaultSettings = {
  output: {
    logLevel: 'info',
    showProgress: true
  },
  crawler: {
    concurrency: 3,
    timeout: 30000,
    requestInterval: 1000,
    maxRetries: 3,
    userAgent: 'MDCrawl/1.0.0',
    respectRobotsTxt: true
  },
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
  },
  rules: {
    enableAI: false,
    ai: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      promptTemplate: `请分析以下HTML内容，提取主要文本内容并按照重要性组织成Markdown格式。

请遵循以下规则：
1. 保留页面的标题层级结构
2. 提取正文中的主要内容，忽略导航、页脚等非核心内容
3. 保留列表和表格的结构
4. 提取图片并标注适当的描述
5. 保留链接，但使用Markdown格式

输出格式应为规范的Markdown，包含标题、段落、列表、链接和图片。`
    }
  }
};

// 设置文件路径
const settingsFilePath = path.join(process.cwd(), 'config', 'settings.json');

// 获取设置
router.get('/', (req, res) => {
  try {
    // 检查设置文件是否存在
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      return res.json(settings);
    } else {
      // 如果设置文件不存在，返回默认设置
      return res.json(defaultSettings);
    }
  } catch (err) {
    logger.error(`获取设置失败: ${err.message}`);
    return res.status(500).json({ error: '获取设置失败', message: err.message });
  }
});

// 保存设置
router.post('/', (req, res) => {
  try {
    const settings = req.body;
    
    // 确保config目录存在
    if (!fs.existsSync(path.join(process.cwd(), 'config'))) {
      fs.mkdirSync(path.join(process.cwd(), 'config'), { recursive: true });
    }
    
    // 保存设置到文件
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    
    logger.info('设置已保存');
    return res.json({ success: true, message: '设置已保存' });
  } catch (err) {
    logger.error(`保存设置失败: ${err.message}`);
    return res.status(500).json({ error: '保存设置失败', message: err.message });
  }
});

// 重置设置
router.post('/reset', (req, res) => {
  try {
    // 确保config目录存在
    if (!fs.existsSync(path.join(process.cwd(), 'config'))) {
      fs.mkdirSync(path.join(process.cwd(), 'config'), { recursive: true });
    }
    
    // 创建一个深拷贝的默认设置对象，确保不会被引用修改
    const defaultSettingsCopy = JSON.parse(JSON.stringify(defaultSettings));
    
    // 保存默认设置到文件
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettingsCopy, null, 2), 'utf8');
    
    logger.info('设置已重置为默认值');
    return res.json(defaultSettingsCopy);
  } catch (err) {
    logger.error(`重置设置失败: ${err.message}`);
    return res.status(500).json({ error: '重置设置失败', message: err.message });
  }
});

module.exports = router;