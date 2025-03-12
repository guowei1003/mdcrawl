<template>
  <div>
    <h1 class="flex items-center">
      <i class="fas fa-tasks mr-2 text-primary-600"></i>
      任务管理
    </h1>
    
    <!-- 任务统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="card bg-white dark:bg-gray-800 p-4 flex items-center">
        <div class="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-3">
          <i class="fas fa-list text-blue-600 dark:text-blue-300"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">总任务数</p>
          <p class="text-xl font-bold">{{ taskStats.total }}</p>
        </div>
      </div>
      
      <div class="card bg-white dark:bg-gray-800 p-4 flex items-center">
        <div class="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-3">
          <i class="fas fa-check text-green-600 dark:text-green-300"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">已完成</p>
          <p class="text-xl font-bold">{{ taskStats.completed }}</p>
        </div>
      </div>
      
      <div class="card bg-white dark:bg-gray-800 p-4 flex items-center">
        <div class="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3 mr-3">
          <i class="fas fa-spinner text-yellow-600 dark:text-yellow-300"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">进行中</p>
          <p class="text-xl font-bold">{{ taskStats.running }}</p>
        </div>
      </div>
      
      <div class="card bg-white dark:bg-gray-800 p-4 flex items-center">
        <div class="rounded-full bg-gray-100 dark:bg-gray-900 p-3 mr-3">
          <i class="fas fa-stop text-gray-600 dark:text-gray-300"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">已停止</p>
          <p class="text-xl font-bold">{{ taskStats.stopped }}</p>
        </div>
      </div>
      
      <div class="card bg-white dark:bg-gray-800 p-4 flex items-center">
        <div class="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-3">
          <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-300"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">失败</p>
          <p class="text-xl font-bold">{{ taskStats.failed }}</p>
        </div>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium m-0">爬取任务列表</h2>
        <div class="flex space-x-2">
          <button 
            class="btn btn-outline text-sm flex items-center"
            @click="refreshTasks"
          >
            <i class="fas fa-sync-alt mr-1"></i>
            刷新
          </button>
          <router-link 
            to="/"
            class="btn btn-primary text-sm flex items-center"
          >
            <i class="fas fa-plus mr-1"></i>
            新建任务
          </router-link>
        </div>
      </div>
      
      <!-- 任务过滤器 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button 
          v-for="status in ['全部', '进行中', '已完成', '已停止', '失败']"
          :key="status"
          class="px-3 py-1 text-sm rounded-full transition-colors"
          :class="{
            'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300': filterStatus === status,
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': filterStatus !== status
          }"
          @click="filterStatus = status"
        >
          {{ status }}
        </button>
      </div>
      
      <!-- 任务表格 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">任务ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">进度</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">创建时间</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="filteredTasks.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <i class="fas fa-inbox text-4xl mb-2"></i>
                <p>暂无任务数据</p>
              </td>
            </tr>
            <tr 
              v-for="task in filteredTasks" 
              :key="task.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ task.id.substring(0, 8) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center">
                  <i class="fas fa-globe-asia text-gray-400 mr-2"></i>
                  <span class="truncate max-w-xs">{{ task.url }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="{
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': task.status === '进行中',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': task.status === '已完成',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': task.status === '失败',
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300': task.status === '已停止'
                  }"
                >
                  {{ task.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    class="bg-primary-600 h-2.5 rounded-full" 
                    :style="{ width: `${task.progress}%` }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">{{ task.progress }}%</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ task.createdAt }}
              </td>
              <td class="px-4 py-3 text-sm">
                <div class="flex space-x-2">
                  <button 
                    v-if="task.status === '进行中'"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    @click="stopTask(task.id)"
                    title="停止任务"
                  >
                    <i class="fas fa-stop"></i>
                  </button>
                  <button 
                    v-if="task.status === '已完成' || task.status === '已停止'"
                    class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    @click="viewResults(task.id)"
                    title="查看结果"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button 
                    class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                    @click="deleteTask(task.id)"
                    title="删除任务"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTasks, stopTask as apiStopTask, deleteTask as apiDeleteTask, getTaskStats as apiGetTaskStats } from '../api/tasks'

const router = useRouter()
const filterStatus = ref('全部')
const tasks = ref([])
const loading = ref(false)
const error = ref(null)

// 过滤后的任务列表
const filteredTasks = computed(() => {
  if (filterStatus.value === '全部') {
    return tasks.value
  }
  return tasks.value.filter(task => task.status === filterStatus.value)
})

// 任务统计
const taskStats = computed(() => {
  return {
    total: tasks.value.length,
    completed: tasks.value.filter(task => task.status === '已完成').length,
    running: tasks.value.filter(task => task.status === '进行中').length,
    failed: tasks.value.filter(task => task.status === '失败').length,
    stopped: tasks.value.filter(task => task.status === '已停止').length
  }
})

// 获取任务统计信息
async function fetchTaskStats() {
  try {
    const stats = await apiGetTaskStats()
    // 如果后端返回了统计数据，则使用后端数据
    // 否则继续使用前端计算的统计数据
    console.log('获取任务统计信息:', stats)
  } catch (err) {
    console.error('获取任务统计信息失败:', err)
  }
}

// 刷新任务列表
async function refreshTasks() {
  loading.value = true
  error.value = null
  
  try {
    const response = await getTasks()
    tasks.value = response.map(task => ({
      ...task,
      // 确保数据格式一致
      status: task.status || '未知',
      progress: task.progress || 0
    }))
    
    // 更新任务统计
    fetchTaskStats()
  } catch (err) {
    console.error('获取任务列表失败:', err)
    error.value = '获取任务列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 停止任务
async function stopTask(taskId) {
  try {
    await apiStopTask(taskId)
    // 更新本地任务状态
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = '已停止'
    }
    // 刷新任务列表
    refreshTasks()
  } catch (err) {
    console.error('停止任务失败:', err)
  }
}

// 查看结果
function viewResults(taskId) {
  // 跳转到结果页面
  router.push(`/results?taskId=${taskId}`)
}

// 删除任务
async function deleteTask(taskId) {
  try {
    await apiDeleteTask(taskId)
    // 从本地列表中移除
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
    // 更新任务统计
    fetchTaskStats()
  } catch (err) {
    console.error('删除任务失败:', err)
  }
}

onMounted(() => {
  // 页面加载时获取任务列表
  refreshTasks()
})
</script>