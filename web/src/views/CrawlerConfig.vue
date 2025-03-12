<template>
  <div>
    <h1 class="flex items-center">
      <i class="fas fa-sliders-h mr-2 text-primary-600"></i>
      爬虫配置
    </h1>
    
    <div class="card mb-6">
      <form @submit.prevent="startCrawling">
        <!-- URL输入 -->
        <div class="mb-4">
          <label for="url" class="form-label">目标URL</label>
          <div class="flex">
            <input 
              type="url" 
              id="url" 
              v-model="formData.url" 
              class="form-input" 
              placeholder="https://example.com" 
              required
            >
          </div>
          <p class="text-xs text-gray-500 mt-1">输入要爬取的网页URL，必须以http://或https://开头</p>
        </div>
        
        <!-- 基本配置 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- 爬取深度 -->
          <div>
            <label for="depth" class="form-label">爬取深度</label>
            <div class="flex items-center">
              <input 
                type="range" 
                id="depth" 
                v-model.number="formData.depth" 
                min="0" 
                max="100" 
                class="w-full mr-2"
              >
              <span class="text-sm font-medium w-8 text-center">{{ formData.depth }}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">0表示只爬取当前页面，最大为100级</p>
          </div>
          
          <!-- 并发请求数 -->
          <div>
            <label for="concurrency" class="form-label">并发请求数</label>
            <select 
              id="concurrency" 
              v-model.number="formData.concurrency" 
              class="form-input"
            >
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">同时处理的请求数量</p>
          </div>
        </div>
        
        <!-- 高级选项 -->
        <div class="mb-4">
          <button 
            type="button" 
            class="flex items-center text-sm text-primary-600 hover:text-primary-700"
            @click="showAdvanced = !showAdvanced"
          >
            <i :class="`fas ${showAdvanced ? 'fa-chevron-down' : 'fa-chevron-right'} mr-1`"></i>
            高级选项
          </button>
          
          <div v-if="showAdvanced" class="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <!-- 认证设置 -->
            <div class="mb-4">
              <div class="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="auth" 
                  v-model="formData.auth.enabled" 
                  class="mr-2"
                >
                <label for="auth" class="form-label mb-0">启用认证</label>
              </div>
              
              <div v-if="formData.auth.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label for="username" class="form-label">用户名</label>
                  <input 
                    type="text" 
                    id="username" 
                    v-model="formData.auth.username" 
                    class="form-input" 
                    placeholder="用户名"
                  >
                </div>
                <div>
                  <label for="password" class="form-label">密码</label>
                  <input 
                    type="password" 
                    id="password" 
                    v-model="formData.auth.password" 
                    class="form-input" 
                    placeholder="密码"
                  >
                </div>
              </div>
            </div>
            
            <!-- 其他高级选项 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 图片下载 -->
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="downloadImages" 
                  v-model="formData.downloadImages" 
                  class="mr-2"
                >
                <label for="downloadImages" class="form-label mb-0">下载图片</label>
              </div>
              
              <!-- AI辅助分析 -->
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="enableAI" 
                  v-model="formData.enableAI" 
                  class="mr-2"
                >
                <label for="enableAI" class="form-label mb-0">启用AI辅助分析</label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输出目录 -->
        <!-- <div class="mb-6">
          <label for="output" class="form-label">输出目录</label>
          <input 
            type="text" 
            id="output" 
            v-model="formData.output" 
            class="form-input" 
            placeholder="./output"
          >
          <p class="text-xs text-gray-500 mt-1">Markdown文件和图片的保存位置</p>
        </div> -->
        
        <!-- 提交按钮 -->
        <div class="flex justify-end">
          <button 
            type="submit" 
            class="btn btn-primary flex items-center"
            :disabled="isLoading"
          >
            <i class="fas fa-spider mr-2"></i>
            {{ isLoading ? '爬取中...' : '开始爬取' }}
          </button>
        </div>
      </form>
    </div>
    
    <!-- 快速配置模板 -->
    <div class="card">
      <h2 class="text-lg font-medium mb-3">配置模板</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="(template, index) in configTemplates" 
          :key="index"
          class="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          @click="applyTemplate(template)"
        >
          <div class="flex items-center mb-2">
            <i :class="`fas ${template.icon} text-primary-600 mr-2`"></i>
            <h3 class="text-base font-medium m-0">{{ template.name }}</h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 m-0">{{ template.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createTask } from '../api/tasks'

const router = useRouter()
const isLoading = ref(false)
const showAdvanced = ref(false)

// 表单数据
const formData = reactive({
  url: '',
  depth: 1,
  concurrency: 3,
  output: './output',
  downloadImages: true,
  enableAI: false,
  auth: {
    enabled: false,
    username: '',
    password: ''
  }
})

// 配置模板
const configTemplates = [
  {
    name: '基础爬取',
    icon: 'fa-file-alt',
    description: '仅爬取当前页面，不递归爬取链接',
    config: {
      depth: 0,
      concurrency: 1,
      downloadImages: true,
      enableAI: false
    }
  },
  {
    name: '完整站点',
    icon: 'fa-sitemap',
    description: '递归爬取整个网站的内容',
    config: {
      depth: 10,
      concurrency: 5,
      downloadImages: true,
      enableAI: true
    }
  },
  {
    name: '轻量模式',
    icon: 'fa-feather',
    description: '不下载图片，快速爬取文本内容',
    config: {
      depth: 3,
      concurrency: 3,
      downloadImages: false,
      enableAI: false
    }
  }
]

// 应用模板
function applyTemplate(template) {
  Object.assign(formData, template.config)
}

// 开始爬取
async function startCrawling() {
  try {
    isLoading.value = true
    
    // 构建爬取参数
    const params = {
      url: formData.url,
      depth: formData.depth,
      concurrency: formData.concurrency,
      output: formData.output,
      downloadImages: formData.downloadImages,
      enableAI: formData.enableAI
    }
    
    // 添加认证信息
    if (formData.auth.enabled) {
      params.auth = {
        enabled: true,
        username: formData.auth.username,
        password: formData.auth.password
      }
    }
    
    // 发送爬取请求到后端API
    console.log('开始爬取:', params)
    
    // 调用createTask API创建新任务
    const response = await createTask(params)
    console.log('任务创建成功:', response)
    
    // 跳转到任务管理页面
    router.push('/tasks')
  } catch (error) {
    console.error('爬取失败:', error)
    alert('爬取失败: ' + error.message)
  } finally {
    isLoading.value = false
  }
}
</script>