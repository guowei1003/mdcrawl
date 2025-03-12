# MDCrawl

一个可以将 WEB 页面转换 Markdown 文档的工具

## 项目简介

MDCrawl 是一个专业的网页爬虫工具，能够将网页内容转换为 Markdown 格式并保存。它支持递归爬取同源 URL，可以处理图片资源的下载，并且提供了灵活的配置选项。项目同时提供命令行工具和Web界面，满足不同用户的使用需求。

## 功能特点

- 网页抓取与 Markdown 转换：将网页内容转换为结构化的 Markdown 文档
- 图片资源下载：自动下载页面中的图片并保存到本地
- 递归爬取：支持对同源 URL 进行递归爬取，构建完整的内容树
- 身份验证：支持基本的用户名密码登录认证
- 可配置规则：支持自定义规则和大模型辅助分析，提高转换质量
- 防循环机制：记录已爬取 URL，避免重复爬取和无限循环
- Web界面：提供友好的用户界面，方便管理爬取任务和查看结果

## 项目结构

```
mdcrawl/
├── src/                  # 源代码目录
│   ├── index.js          # 入口文件
│   ├── crawler/          # 爬虫核心模块
│   ├── parser/           # 解析器模块
│   ├── converter/        # Markdown 转换模块
│   ├── utils/            # 工具函数
│   ├── routes/           # API路由
│   └── config/           # 配置管理
├── config/               # 配置文件目录
│   ├── default.js        # 默认配置
│   └── rules.js          # 转换规则配置
├── web/                  # Web界面目录
│   ├── src/              # 前端源代码
│   ├── public/           # 静态资源
│   └── index.html        # 入口HTML
├── tests/                # 测试目录
├── examples/             # 示例目录
├── output/               # 输出目录
├── server.js             # API服务器
├── package.json          # 项目依赖配置
└── README.md             # 项目文档
```

## 安装方法

### 前置条件

- Node.js 14.0.0 或更高版本
- npm 6.0.0 或更高版本

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/mdcrawl.git
cd mdcrawl
```

2. 安装依赖

```bash
npm install
```

3. 安装Web界面依赖

```bash
cd web
npm install
cd ..
```

## 使用方法

### 命令行工具

```bash
node src/index.js <url> [options]
```

#### 参数说明

- `<url>`: 要爬取的网页URL（必填）
- `-o, --output <dir>`: 输出目录，默认为 `./output`
- `-d, --depth <number>`: 爬取深度 (0-100)，默认为 0（仅爬取当前页面）
- `-c, --concurrency <number>`: 并发请求数，默认为 3
- `-a, --auth`: 启用认证
- `-u, --username <username>`: 认证用户名
- `-p, --password <password>`: 认证密码
- `--ai`: 启用AI辅助分析
- `--no-images`: 不下载图片
- `--config <path>`: 自定义配置文件路径

#### 示例

```bash
# 爬取单个页面
node src/index.js https://example.com

# 爬取深度为2的页面，并指定输出目录
node src/index.js https://example.com -d 2 -o ./my-output

# 启用认证
node src/index.js https://example.com -a -u username -p password
```

### Web界面

#### 启动服务

1. 启动API服务器

```bash
node server.js
```

2. 启动Web界面开发服务器

```bash
cd web
npm run dev
```

或者构建生产版本：

```bash
cd web
npm run build
```

#### 访问Web界面

打开浏览器访问：http://localhost:3000

#### Web界面功能

- 创建新的爬取任务
- 设置爬取参数（URL、深度等）
- 查看任务执行状态和进度
- 浏览和下载生成的Markdown文件
- 查看下载的图片资源
- 停止或删除任务

## 开发计划

### 1. 项目初始化与基础架构搭建

- 创建项目目录结构
- 初始化 Node.js 项目
- 安装核心依赖包
- 设计模块接口

### 2. 核心爬虫模块开发

- 实现网页抓取功能
- 添加身份验证支持
- 实现 URL 队列管理
- 添加爬取深度控制

### 3. 解析与转换模块开发

- 实现 HTML 到 Markdown 的转换
- 实现图片下载与路径替换
- 添加规则引擎支持
- 集成大模型分析能力

### 4. 配置系统与工具函数

- 实现配置管理
- 开发日志记录功能
- 添加错误处理机制
- 实现工具函数库

### 5. Web界面开发

- 设计用户界面
- 实现任务管理功能
- 添加结果查看器
- 开发API服务器

### 6. 测试与优化

- 单元测试
- 集成测试
- 性能优化
- 代码质量检查

### 7. 文档与示例

- 完善使用文档
- 添加 API 文档
- 创建使用示例

## 技术栈

### 后端

- Node.js：运行环境
- Puppeteer：网页渲染与抓取
- Cheerio：HTML 解析
- Turndown：HTML 到 Markdown 转换
- Axios：HTTP 请求
- Commander：命令行接口
- Config：配置管理
- Express：API服务器
- Jest：测试框架

### 前端

- Vue 3：前端框架
- Vite：构建工具
- Tailwind CSS：样式框架
- Vue Router：路由管理
- Pinia：状态管理
- Axios：HTTP 客户端
- Marked：Markdown 渲染

## 配置说明

配置文件位于 `config/default.js`，可以通过命令行参数或自定义配置文件覆盖默认配置。

主要配置项包括：

- 爬虫配置：并发请求数、超时时间、爬取深度等
- 认证配置：用户名、密码等
- URL过滤规则：允许的域名、排除的URL模式等
- Markdown转换配置：图片下载、目录生成等
- 规则引擎配置：自定义规则、AI辅助分析等
- 输出配置：工作目录、日志级别等

## 许可证

Apache License 2.0
