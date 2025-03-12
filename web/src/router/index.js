import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
const CrawlerConfig = () => import('../views/CrawlerConfig.vue')
const TaskManagement = () => import('../views/TaskManagement.vue')
const ResultsViewer = () => import('../views/ResultsViewer.vue')
const SystemSettings = () => import('../views/SystemSettings.vue')

// 定义路由
const routes = [
  {
    path: '/',
    name: 'CrawlerConfig',
    component: CrawlerConfig,
    meta: { title: '爬虫配置' }
  },
  {
    path: '/tasks',
    name: 'TaskManagement',
    component: TaskManagement,
    meta: { title: '任务管理' }
  },
  {
    path: '/results',
    name: 'ResultsViewer',
    component: ResultsViewer,
    meta: { title: '结果展示' }
  },
  {
    path: '/settings',
    name: 'SystemSettings',
    component: SystemSettings,
    meta: { title: '系统设置' }
  },
  // 重定向未匹配的路由到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - MDCrawl` : 'MDCrawl'
  next()
})

export default router