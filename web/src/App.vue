<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Logo和标题 -->
        <div class="flex items-center space-x-2">
          <i class="fas fa-spider text-primary-600 text-2xl"></i>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white m-0">MDCrawl</h1>
        </div>
        
        <!-- 导航菜单 -->
        <nav class="hidden md:flex space-x-6">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium"
          >
            <i :class="`fas ${item.icon} mr-1`"></i>
            {{ item.name }}
          </router-link>
        </nav>
        
        <!-- 移动端菜单按钮 -->
        <button 
          class="md:hidden text-gray-600 dark:text-gray-300 focus:outline-none"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <i class="fas fa-bars text-xl"></i>
        </button>
      </div>
      
      <!-- 移动端菜单 -->
      <div 
        v-if="isMobileMenuOpen" 
        class="md:hidden bg-white dark:bg-gray-800 shadow-md"
      >
        <div class="container mx-auto px-4 py-2">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="block py-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium"
            @click="isMobileMenuOpen = false"
          >
            <i :class="`fas ${item.icon} mr-2`"></i>
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="flex-grow container mx-auto px-4 py-6">
      <router-view />
    </main>
    
    <!-- 页脚 -->
    <footer class="bg-white dark:bg-gray-800 shadow-inner py-4">
      <div class="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>MDCrawl - 一个专业的网页爬虫工具，能够将网页内容转换为Markdown格式并保存</p>
        <p class="mt-1">© {{ new Date().getFullYear() }} MDCrawl. 基于 Apache-2.0 许可证开源</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 移动端菜单状态
const isMobileMenuOpen = ref(false)

// 导航菜单项
const navItems = [
  { name: '爬虫配置', path: '/', icon: 'fa-sliders-h' },
  { name: '任务管理', path: '/tasks', icon: 'fa-tasks' },
  { name: '结果展示', path: '/results', icon: 'fa-file-alt' },
  { name: '系统设置', path: '/settings', icon: 'fa-cog' }
]

// 监听路由变化，关闭移动端菜单
const router = useRouter()
router.afterEach(() => {
  isMobileMenuOpen.value = false
})
</script>