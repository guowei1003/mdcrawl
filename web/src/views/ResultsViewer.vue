<template>
  <div>
    <h1 class="flex items-center">
      <i class="fas fa-file-alt mr-2 text-primary-600"></i>
      结果展示
    </h1>
    
    <!-- 结果选择器 -->
    <div class="card mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 class="text-lg font-medium m-0">爬取结果</h2>
        <div class="mt-2 md:mt-0 flex items-center">
          <div class="relative">
            <input 
              type="text" 
              v-model="searchQuery" 
              class="form-input pr-10" 
              placeholder="搜索文件..."
            >
            <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>
      
      <!-- 文件浏览器 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- 目录树 -->
        <div class="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-4">
          <div class="mb-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">文件目录</h3>
              <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            <div class="file-tree">
              <div 
                v-for="(folder, index) in fileFolders" 
                :key="index"
                class="mb-2"
              >
                <div 
                  class="flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="folder.expanded = !folder.expanded"
                >
                  <i 
                    :class="`fas ${folder.expanded ? 'fa-folder-open text-yellow-500' : 'fa-folder text-yellow-400'} mr-2`"
                  ></i>
                  <span class="text-sm">{{ folder.name }}</span>
                  <i 
                    :class="`fas ${folder.expanded ? 'fa-chevron-down' : 'fa-chevron-right'} ml-auto text-xs text-gray-500`"
                  ></i>
                </div>
                
                <div v-if="folder.expanded" class="ml-4 mt-1">
                  <div 
                    v-for="(file, fileIndex) in folder.files" 
                    :key="fileIndex"
                    class="flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{'bg-primary-50 dark:bg-primary-900': selectedFile === file}"
                    @click="selectFile(file)"
                  >
                    <i class="fas fa-file-alt text-gray-400 mr-2"></i>
                    <span class="text-sm truncate">{{ file.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 文件内容预览 -->
        <div class="md:col-span-3">
          <div v-if="selectedFile" class="h-full flex flex-col">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center">
                <i class="fas fa-file-alt text-gray-400 mr-2"></i>
                <h3 class="text-sm font-medium truncate">{{ selectedFile.name }}</h3>
              </div>
              <div class="flex space-x-2">
                <button 
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                  title="下载文件"
                  @click="downloadFile(selectedFile)"
                >
                  <i class="fas fa-download"></i>
                </button>
                <button 
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                  title="复制内容"
                  @click="copyContent(selectedFile)"
                >
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
            
            <!-- Markdown预览 -->
            <div class="flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
              <div v-html="renderedMarkdown" class="markdown-body prose dark:prose-invert max-w-none"></div>
            </div>
          </div>
          
          <div v-else class="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-file-alt text-4xl mb-2"></i>
            <p>选择一个文件查看内容</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片资源 -->
    <div class="card">
      <h2 class="text-lg font-medium mb-4">图片资源</h2>
      
      <div v-if="images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div 
          v-for="(image, index) in images" 
          :key="index"
          class="relative group"
        >
          <div class="aspect-w-1 aspect-h-1 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
            <img 
              :src="image.url" 
              :alt="image.name"
              class="object-cover w-full h-full group-hover:opacity-75 transition-opacity"
              @click="previewImage(image)"
            >
          </div>
          <div class="mt-1 flex justify-between items-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ image.name }}</p>
            <button 
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              @click="downloadImage(image)"
            >
              <i class="fas fa-download text-xs"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="h-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <i class="fas fa-images text-4xl mb-2"></i>
        <p>暂无图片资源</p>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <div 
      v-if="previewImageUrl" 
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="previewImageUrl = null"
    >
      <div class="max-w-4xl max-h-screen p-4">
        <img 
          :src="previewImageUrl" 
          class="max-w-full max-h-[80vh] object-contain"
          alt="预览图片"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getResultFiles, getTaskResultFiles, getFileContent, getImagesList, downloadFile as apiDownloadFile } from '../api/results'

const route = useRoute()
const searchQuery = ref('')
const selectedFile = ref(null)
const previewImageUrl = ref(null)
const loading = ref(false)
const error = ref(null)

// 文件夹和文件数据
const fileFolders = ref([])

// 图片数据
const images = ref([])

// 渲染Markdown内容
const renderedMarkdown = computed(() => {
  if (!selectedFile.value) return ''
  return marked(selectedFile.value.content)
})

// 获取文件列表
async function fetchFiles() {
  loading.value = true
  error.value = null
  
  try {
    // 检查是否有taskId参数
    const taskId = route.query.taskId
    let response
    
    if (taskId) {
      // 获取特定任务的结果文件
      response = await getTaskResultFiles(taskId)
    } else {
      // 获取所有结果文件
      response = await getResultFiles()
    }
    
    // 处理文件结构
    if (response && response.files) {
      // 将文件组织成文件夹结构
      const folders = {}
      
      // 创建基本文件夹结构
      folders['output'] = { name: 'output', expanded: true, files: [] }
      folders['children'] = { name: 'children', expanded: false, files: [] }
      folders['images'] = { name: 'images', expanded: false, files: [] }
      
      // 分类文件
      response.files.forEach(file => {
        const path = file.path || ''
        if (path.includes('/children/')) {
          folders['children'].files.push({
            ...file,
            name: file.name || path.split('/').pop()
          })
        } else if (path.includes('/images/')) {
          folders['images'].files.push({
            ...file,
            name: file.name || path.split('/').pop()
          })
        } else {
          folders['output'].files.push({
            ...file,
            name: file.name || path.split('/').pop()
          })
        }
      })
      
      // 更新文件夹数据
      fileFolders.value = Object.values(folders)
    }
    
    // 获取图片列表
    fetchImages()
  } catch (err) {
    console.error('获取文件列表失败:', err)
    error.value = '获取文件列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 获取图片列表
async function fetchImages() {
  try {
    const response = await getImagesList()
    if (response && response.images) {
      images.value = response.images.map(img => ({
        name: img.name || img.path.split('/').pop(),
        url: img.url || img.path,
        size: img.size || '未知'
      }))
    }
  } catch (err) {
    console.error('获取图片列表失败:', err)
  }
}

// 获取文件内容
async function fetchFileContent(file) {
  if (!file || !file.path) return
  
  loading.value = true
  try {
    const response = await getFileContent(file.path)
    if (response && response.content) {
      // 更新文件内容
      file.content = response.content
      selectedFile.value = {...file}
    }
  } catch (err) {
    console.error('获取文件内容失败:', err)
    error.value = '获取文件内容失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 选择文件
function selectFile(file) {
  // 如果文件没有内容，先获取内容
  if (!file.content) {
    fetchFileContent(file)
  } else {
    selectedFile.value = file
  }
}

// 下载文件
async function downloadFile(file) {
  if (!file || !file.path) return
  
  try {
    const response = await apiDownloadFile(file.path)
    
    // 创建Blob对象
    const blob = new Blob([response], { type: 'application/octet-stream' })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('下载文件失败:', err)
  }
}

// 下载图片
async function downloadImage(image) {
  if (!image || !image.url) return
  
  try {
    // 创建一个链接元素
    const a = document.createElement('a')
    a.href = image.url
    a.download = image.name
    document.body.appendChild(a)
    a.click()
    
    // 清理
    document.body.removeChild(a)
  } catch (err) {
    console.error('下载图片失败:', err)
  }
}

// 预览图片
function previewImage(image) {
  previewImageUrl.value = image.url
}

// 复制内容
function copyContent(file) {
  if (!file || !file.content) return
  
  try {
    navigator.clipboard.writeText(file.content)
    alert('内容已复制到剪贴板')
  } catch (err) {
    console.error('复制内容失败:', err)
    // 兼容性处理
    const textarea = document.createElement('textarea')
    textarea.value = file.content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('内容已复制到剪贴板')
  }
}

// 监听路由参数变化
watch(() => route.query.taskId, (newTaskId) => {
  if (newTaskId) {
    // 当taskId变化时重新获取文件
    fetchFiles()
  }
})

// 监听搜索查询
watch(searchQuery, (newQuery) => {
  // 简单的前端搜索实现
  if (newQuery) {
    const query = newQuery.toLowerCase()
    fileFolders.value.forEach(folder => {
      folder.files = folder.files.filter(file => 
        file.name.toLowerCase().includes(query)
      )
    })
  } else {
    // 重新获取所有文件
    fetchFiles()
  }
})

onMounted(() => {
  // 页面加载时获取文件列表
  fetchFiles()
  
  // 如果URL中有taskId参数，加载对应任务的结果
  const taskId = route.query.taskId
  if (taskId) {
    // 这里将来会调用后端API获取任务结果
    console.log('加载任务结果:', taskId)
  }
  
  // 默认选择第一个文件
  if (fileFolders.value.length > 0 && fileFolders.value[0].files.length > 0) {
    selectedFile.value = fileFolders.value[0].files[0]
  }
})
</script>

<style>
/* Markdown样式 */
.markdown-body h1 {
  @apply text-2xl font-bold mb-4;
}
.markdown-body h2 {
  @apply text-xl font-bold mb-3 mt-6;
}
.markdown-body h3 {
  @apply text-lg font-bold mb-2 mt-5;
}
.markdown-body p {
  @apply mb-4;
}
.markdown-body ul, .markdown-body ol {
  @apply mb-4 pl-5;
}
.markdown-body li {
  @apply mb-1;
}
.markdown-body img {
  @apply max-w-full rounded-md my-4;
}
.markdown-body a {
  @apply text-primary-600 hover:underline;
}
.markdown-body code {
  @apply bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm;
}
</style>