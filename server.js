/**
 * MDCrawl API服务器
 * 为前端提供API接口，连接爬虫功能
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// 导入设置路由
const settingsRouter = require('./src/routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 注册路由
app.use('/settings', settingsRouter);

// 存储任务信息
const tasks = new Map();

// 输出目录
const OUTPUT_DIR = path.join(__dirname, 'output');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// 获取任务列表
app.get('/tasks', (req, res) => {
  const taskList = Array.from(tasks.values()).map(task => ({
    id: task.id,
    url: task.url,
    status: task.status,
    progress: task.progress,
    createdAt: task.createdAt
  }));
  res.json(taskList);
});

// 获取任务统计信息
app.get('/tasks/stats', (req, res) => {
  const total = tasks.size;
  let completed = 0;
  let running = 0;
  let failed = 0;
  let stopped = 0;

  tasks.forEach(task => {
    if (task.status === '已完成') completed++;
    else if (task.status === '进行中') running++;
    else if (task.status === '失败') failed++;
    else if (task.status === '已停止') stopped++;
  });

  res.json({
    total,
    completed,
    running,
    failed,
    stopped
  });
});

// 获取任务详情
app.get('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

// 创建新任务
app.post('/tasks', (req, res) => {
  const { url, depth = 1 } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: '缺少URL参数' });
  }
  
  const taskId = uuidv4();
  const task = {
    id: taskId,
    url,
    depth,
    status: '进行中',
    progress: 0,
    createdAt: new Date().toLocaleString(),
    output: path.join(OUTPUT_DIR, `task_${taskId}`)
  };
  
  // 确保任务输出目录存在
  if (!fs.existsSync(task.output)) {
    fs.mkdirSync(task.output, { recursive: true });
  }
  
  // 启动爬虫进程
  const crawler = spawn('node', [
    path.join(__dirname, 'src/index.js'),
    url,
    '-o', task.output,
    '-d', depth.toString()
  ]);
  
  task.process = crawler;
  
  crawler.stdout.on('data', (data) => {
    console.log(`[Task ${taskId}] ${data}`);
    // 模拟进度更新
    if (task.progress < 100) {
      task.progress += 5;
      if (task.progress > 95) {
        task.progress = 95;
      }
    }
  });
  
  crawler.stderr.on('data', (data) => {
    console.error(`[Task ${taskId}] Error: ${data}`);
  });
  
  crawler.on('close', (code) => {
    console.log(`[Task ${taskId}] 爬虫进程结束，退出码 ${code}`);
    task.status = code === 0 ? '已完成' : '失败';
    task.progress = code === 0 ? 100 : task.progress;
    task.process = null;
  });
  
  tasks.set(taskId, task);
  res.status(201).json({ id: taskId, url, status: task.status });
});

// 停止任务
app.post('/tasks/:id/stop', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.process) {
    // 发送SIGINT信号，允许爬虫进程优雅地关闭
    task.process.kill('SIGINT');
    
    // 设置任务状态为已停止
    task.status = '已停止';
    
    // 记录停止时间
    task.stoppedAt = new Date().toLocaleString();
    
    // 设置进度
    if (task.progress < 100) {
      // 保留当前进度，表示部分完成
      task.progress = Math.max(task.progress, 10);
    }
    
    // 清除进程引用
    task.process = null;
    
    console.log(`[Task ${task.id}] 已发送停止信号`);
  }
  
  res.json({ id: task.id, status: task.status });
});


// 删除任务
app.delete('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  // 如果任务正在运行，先停止它
  if (task.process) {
    // 发送SIGINT信号，允许爬虫进程优雅地关闭
    task.process.kill('SIGINT');
    console.log(`[Task ${task.id}] 已发送停止信号`);
  }
  
  // 清理任务相关的文件和目录
  try {
    if (task.output && fs.existsSync(task.output)) {
      console.log(`[Task ${task.id}] 正在清理任务输出目录: ${task.output}`);
      // 递归删除任务输出目录
      fs.rmSync(task.output, { recursive: true, force: true });
      console.log(`[Task ${task.id}] 任务输出目录已清理`);
    }
  } catch (error) {
    console.error(`[Task ${task.id}] 清理任务文件失败:`, error);
    // 即使清理失败，也继续删除任务
  }
  
  // 从任务列表中删除
  tasks.delete(req.params.id);
  console.log(`[Task ${task.id}] 任务已从系统中删除`);
  
  res.json({ success: true, message: '任务及相关文件已删除' });
});

// 获取结果文件列表
app.get('/results/files', (req, res) => {
  try {
    const files = [];
    const folders = [];
    
    // 读取输出目录中的所有文件
    const items = fs.readdirSync(OUTPUT_DIR);
    
    items.forEach(item => {
      const itemPath = path.join(OUTPUT_DIR, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory() && item !== 'images') {
        // 如果是目录（排除images目录），则添加到文件夹列表
        const folderFiles = fs.readdirSync(itemPath)
          .filter(file => file.endsWith('.md'))
          .map(file => ({
            name: file,
            path: path.join(itemPath, file),
            size: fs.statSync(path.join(itemPath, file)).size
          }));
        
        if (folderFiles.length > 0) {
          folders.push({
            name: item,
            files: folderFiles
          });
        }
      } else if (stats.isFile() && item.endsWith('.md')) {
        // 如果是Markdown文件，则添加到文件列表
        files.push({
          name: item,
          path: itemPath,
          size: stats.size
        });
      }
    });
    
    res.json({
      folders,
      files
    });
  } catch (error) {
    console.error('获取结果文件列表失败:', error);
    res.status(500).json({ error: '获取结果文件列表失败' });
  }
});

// 获取特定任务的结果文件
app.get('/tasks/:id/results/files', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  try {
    const files = [];
    const taskOutputDir = task.output;
    
    if (fs.existsSync(taskOutputDir)) {
      const items = fs.readdirSync(taskOutputDir);
      
      items.forEach(item => {
        const itemPath = path.join(taskOutputDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile() && item.endsWith('.md')) {
          files.push({
            name: item,
            path: itemPath,
            size: stats.size
          });
        }
      });
    }
    
    res.json({
      folders: [],
      files
    });
  } catch (error) {
    console.error(`获取任务 ${req.params.id} 结果文件列表失败:`, error);
    res.status(500).json({ error: '获取任务结果文件列表失败' });
  }
});

// 获取文件内容
app.get('/results/content', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: '缺少文件路径参数' });
  }
  
  try {
    // 安全检查：确保文件路径在OUTPUT_DIR内
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(OUTPUT_DIR)) {
      return res.status(403).json({ error: '无权访问该文件' });
    }
    
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const content = fs.readFileSync(normalizedPath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('获取文件内容失败:', error);
    res.status(500).json({ error: '获取文件内容失败' });
  }
});

// 获取图片资源列表
app.get('/results/images', (req, res) => {
  try {
    const images = [];
    
    if (fs.existsSync(IMAGES_DIR)) {
      const items = fs.readdirSync(IMAGES_DIR);
      
      items.forEach(item => {
        const itemPath = path.join(IMAGES_DIR, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) {
            images.push({
              name: item,
              url: `/api/results/images/${item}`,
              path: itemPath,
              size: stats.size
            });
          }
        }
      });
    }
    
    res.json(images);
  } catch (error) {
    console.error('获取图片资源列表失败:', error);
    res.status(500).json({ error: '获取图片资源列表失败' });
  }
});

// 提供图片访问
app.use('/results/images', express.static(IMAGES_DIR));

// 下载文件
app.get('/results/download', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: '缺少文件路径参数' });
  }
  
  try {
    // 安全检查：确保文件路径在OUTPUT_DIR内
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(OUTPUT_DIR)) {
      return res.status(403).json({ error: '无权访问该文件' });
    }
    
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    res.download(normalizedPath);
  } catch (error) {
    console.error('下载文件失败:', error);
    res.status(500).json({ error: '下载文件失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`MDCrawl API服务器运行在 http://localhost:${PORT}`);
});