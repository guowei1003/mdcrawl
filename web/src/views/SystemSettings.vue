<template>
  <div>
    <h1 class="flex items-center">
      <i class="fas fa-cog mr-2 text-primary-600"></i>
      系统设置
    </h1>
    
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">基本设置</h2>
      
      <form @submit.prevent="saveSettings">
        <!-- 日志级别设置 -->
        <div class="mb-4">
          <label for="logLevel" class="form-label">日志级别</label>
          <select 
            id="logLevel" 
            v-model="settings.output.logLevel" 
            class="form-input"
          >
            <option value="error">错误 (Error)</option>
            <option value="warn">警告 (Warn)</option>
            <option value="info">信息 (Info)</option>
            <option value="verbose">详细 (Verbose)</option>
            <option value="debug">调试 (Debug)</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">设置日志记录的详细程度</p>
        </div>
        
        <!-- 爬虫设置 -->
        <div class="mb-4">
          <h3 class="text-md font-medium mb-3">爬虫设置</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 默认并发数 -->
            <div>
              <label for="concurrency" class="form-label">默认并发请求数</label>
              <input 
                type="number" 
                id="concurrency" 
                v-model.number="settings.crawler.concurrency" 
                min="1" 
                max="10" 
                class="form-input"
              >
              <p class="text-xs text-gray-500 mt-1">同时处理的请求数量</p>
            </div>
            
            <!-- 请求超时 -->
            <div>
              <label for="timeout" class="form-label">请求超时时间 (毫秒)</label>
              <input 
                type="number" 
                id="timeout" 
                v-model.number="settings.crawler.timeout" 
                min="1000" 
                step="1000" 
                class="form-input"
              >
              <p class="text-xs text-gray-500 mt-1">请求超时时间，单位毫秒</p>
            </div>
            
            <!-- 请求间隔 -->
            <div>
              <label for="requestInterval" class="form-label">请求间隔 (毫秒)</label>
              <input 
                type="number" 
                id="requestInterval" 
                v-model.number="settings.crawler.requestInterval" 
                min="0" 
                step="100" 
                class="form-input"
              >
              <p class="text-xs text-gray-500 mt-1">两次请求之间的间隔时间，避免请求过于频繁</p>
            </div>
            
            <!-- 最大重试次数 -->
            <div>
              <label for="maxRetries" class="form-label">最大重试次数</label>
              <input 
                type="number" 
                id="maxRetries" 
                v-model.number="settings.crawler.maxRetries" 
                min="0" 
                max="10" 
                class="form-input"
              >
              <p class="text-xs text-gray-500 mt-1">请求失败时的最大重试次数</p>
            </div>
          </div>
          
          <!-- 用户代理 -->
          <div class="mt-4">
            <label for="userAgent" class="form-label">用户代理 (User Agent)</label>
            <input 
              type="text" 
              id="userAgent" 
              v-model="settings.crawler.userAgent" 
              class="form-input"
            >
            <p class="text-xs text-gray-500 mt-1">发送HTTP请求时使用的用户代理标识</p>
          </div>
          
          <!-- 遵循robots.txt -->
          <div class="mt-4 flex items-center">
            <input 
              type="checkbox" 
              id="respectRobotsTxt" 
              v-model="settings.crawler.respectRobotsTxt" 
              class="mr-2"
            >
            <label for="respectRobotsTxt" class="form-label mb-0">遵循robots.txt规则</label>
          </div>
        </div>
      </form>
    </div>
    
    <!-- URL过滤规则 -->
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">URL过滤规则</h2>
      
      <!-- 允许的域名 -->
      <div class="mb-4">
        <label class="form-label">允许的域名</label>
        <div class="flex items-center mb-2">
          <input 
            type="text" 
            v-model="newDomain" 
            class="form-input mr-2" 
            placeholder="example.com"
          >
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="addDomain"
          >
            添加
          </button>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <div 
            v-for="(domain, index) in settings.urlFilters.allowedDomains" 
            :key="index"
            class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
          >
            {{ domain }}
            <button 
              class="ml-2 text-gray-500 hover:text-red-500"
              @click="removeDomain(index)"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <p v-if="settings.urlFilters.allowedDomains.length === 0" class="text-sm text-gray-500">
            未设置允许的域名，默认只允许同源URL
          </p>
        </div>
      </div>
      
      <!-- 排除的URL模式 -->
      <div>
        <label class="form-label">排除的URL模式 (正则表达式)</label>
        <div class="flex items-center mb-2">
          <input 
            type="text" 
            v-model="newPattern" 
            class="form-input mr-2" 
            placeholder="\\.(css|js|json)$"
          >
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="addPattern"
          >
            添加
          </button>
        </div>
        <div class="space-y-2 mt-2">
          <div 
            v-for="(pattern, index) in settings.urlFilters.excludePatterns" 
            :key="index"
            class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm flex items-center justify-between"
          >
            <code>{{ pattern }}</code>
            <button 
              class="ml-2 text-gray-500 hover:text-red-500"
              @click="removePattern(index)"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Markdown转换设置 -->
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">Markdown转换设置</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 图片目录 -->
        <div>
          <label for="imagesDir" class="form-label">图片保存目录</label>
          <input 
            type="text" 
            id="imagesDir" 
            v-model="settings.markdown.imagesDir" 
            class="form-input"
          >
          <p class="text-xs text-gray-500 mt-1">相对于Markdown文件的图片保存路径</p>
        </div>
        
        <!-- 子页面目录 -->
        <div>
          <label for="childrenDir" class="form-label">子页面保存目录</label>
          <input 
            type="text" 
            id="childrenDir" 
            v-model="settings.markdown.childrenDir" 
            class="form-input"
          >
          <p class="text-xs text-gray-500 mt-1">子页面的保存路径</p>
        </div>
      </div>
      
      <!-- Markdown选项 -->
      <div class="mt-4 space-y-3">
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="keepHtml" 
            v-model="settings.markdown.keepHtml" 
            class="mr-2"
          >
          <label for="keepHtml" class="form-label mb-0">保留HTML标签</label>
        </div>
        
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="downloadImages" 
            v-model="settings.markdown.downloadImages" 
            class="mr-2"
          >
          <label for="downloadImages" class="form-label mb-0">下载图片</label>
        </div>
        
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="addSourceUrl" 
            v-model="settings.markdown.addSourceUrl" 
            class="mr-2"
          >
          <label for="addSourceUrl" class="form-label mb-0">添加原始URL引用</label>
        </div>
        
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="addTableOfContents" 
            v-model="settings.markdown.addTableOfContents" 
            class="mr-2"
          >
          <label for="addTableOfContents" class="form-label mb-0">添加目录</label>
        </div>
      </div>
    </div>
    
    <!-- AI设置 -->
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">AI辅助分析设置</h2>
      
      <div class="mb-4 flex items-center">
        <input 
          type="checkbox" 
          id="enableAI" 
          v-model="settings.rules.enableAI" 
          class="mr-2"
        >
        <label for="enableAI" class="form-label mb-0">启用AI辅助分析</label>
      </div>
      
      <div v-if="settings.rules.enableAI" class="space-y-4">
        <!-- API密钥 -->
        <div>
          <label for="apiKey" class="form-label">API密钥</label>
          <input 
            type="password" 
            id="apiKey" 
            v-model="settings.rules.ai.apiKey" 
            class="form-input"
            placeholder="sk-..."
          >
          <p class="text-xs text-gray-500 mt-1">大模型API访问密钥</p>
        </div>
        
        <!-- 模型选择 -->
        <div>
          <label for="model" class="form-label">模型</label>
          <select 
            id="model" 
            v-model="settings.rules.ai.model" 
            class="form-input"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>
        
        <!-- 提示词模板 -->
        <div>
          <label for="promptTemplate" class="form-label">提示词模板</label>
          <textarea 
            id="promptTemplate" 
            v-model="promptTemplate" 
            rows="6" 
            class="form-input font-mono text-sm"
            placeholder="请分析以下HTML内容，提取主要文本内容并按照重要性组织成Markdown格式..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">用于指导AI分析网页内容的提示词模板</p>
        </div>
      </div>
    </div>
    
    <!-- 保存按钮 -->
    <div class="flex justify-end">
      <button 
        type="button" 
        class="btn btn-outline mr-2"
        @click="resetSettings"
        :disabled="loading"
      >
        恢复默认
      </button>
      <button 
        type="button" 
        class="btn btn-primary"
        @click="saveSettings"
        :disabled="loading"
      >
        保存设置
      </button>
    </div>
    
    <!-- 加载状态提示 -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded shadow-lg">
        <div class="flex items-center">
          <i class="fas fa-spinner fa-spin mr-2"></i>
          <span>{{ loadingMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getSettings, saveSettings as apiSaveSettings, resetSettings as apiResetSettings } from '../api/index'

// 新域名和模式输入
const newDomain = ref('')
const newPattern = ref('')
const promptTemplate = ref('')

// 加载状态和消息
const loading = ref(false)
const loadingMessage = ref('')

// 系统设置
const settings = reactive({
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
      promptTemplate: ''
    }
  }
})

// 添加域名
function addDomain() {
  if (newDomain.value && !settings.urlFilters.allowedDomains.includes(newDomain.value)) {
    settings.urlFilters.allowedDomains.push(newDomain.value)
    newDomain.value = ''
  }
}

// 移除域名
function removeDomain(index) {
  settings.urlFilters.allowedDomains.splice(index, 1)
}

// 添加排除模式
function addPattern() {
  if (newPattern.value && !settings.urlFilters.excludePatterns.includes(newPattern.value)) {
    settings.urlFilters.excludePatterns.push(newPattern.value)
    newPattern.value = ''
  }
}

// 移除排除模式
function removePattern(index) {
  settings.urlFilters.excludePatterns.splice(index, 1)
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})

// 加载设置
async function loadSettings() {
  loading.value = true
  loadingMessage.value = '加载设置中...'
  
  try {
    const response = await getSettings()
    Object.assign(settings, response)
    
    // 设置提示词模板
    if (settings.rules.ai && settings.rules.ai.promptTemplate) {
      promptTemplate.value = settings.rules.ai.promptTemplate
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    // 如果API请求失败，尝试从本地存储加载
    const savedSettings = localStorage.getItem('mdcrawl-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        Object.assign(settings, parsedSettings)
      } catch (error) {
        console.error('解析设置失败:', error)
      }
    }
  } finally {
    loading.value = false
  }
}

// 保存设置
async function saveSettings() {
  // 保存提示词模板
  if (settings.rules.enableAI) {
    settings.rules.ai.promptTemplate = promptTemplate.value
  }
  
  loading.value = true
  loadingMessage.value = '保存设置中...'
  
  try {
    await apiSaveSettings(settings)
    // 同时保存到本地存储作为备份
    localStorage.setItem('mdcrawl-settings', JSON.stringify(settings))
    alert('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 重置设置
async function resetSettings() {
  if (confirm('确定要恢复默认设置吗？')) {
    loading.value = true
    loadingMessage.value = '恢复默认设置中...'
    
    try {
      const defaultSettings = await apiResetSettings()
      // 使用深度合并来确保所有嵌套对象都被正确更新
      for (const key in defaultSettings) {
        if (typeof defaultSettings[key] === 'object' && defaultSettings[key] !== null) {
          settings[key] = JSON.parse(JSON.stringify(defaultSettings[key]))
        } else {
          settings[key] = defaultSettings[key]
        }
      }
      
      // 重置提示词模板
      promptTemplate.value = settings.rules.ai.promptTemplate || `请分析以下HTML内容，提取主要文本内容并按照重要性组织成Markdown格式。

请遵循以下规则：
1. 保留页面的标题层级结构
2. 提取正文中的主要内容，忽略导航、页脚等非核心内容
3. 保留列表和表格的结构
4. 提取图片并标注适当的描述
5. 保留链接，但使用Markdown格式

输出格式应为规范的Markdown，包含标题、段落、列表、链接和图片。`
      
      // 同时更新本地存储
      localStorage.setItem('mdcrawl-settings', JSON.stringify(settings))
      
      alert('已恢复默认设置')
    } catch (error) {
      console.error('恢复默认设置失败:', error)
      alert('恢复默认设置失败: ' + (error.message || '未知错误'))
    } finally {
      loading.value = false
    }
  }
}
</script>