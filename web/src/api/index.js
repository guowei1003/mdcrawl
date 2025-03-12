// API服务基础配置
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 根据实际后端API地址配置
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证信息等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 统一错误处理
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// 获取系统设置
export function getSettings() {
  return api.get('/settings')
}

// 保存系统设置
export function saveSettings(settings) {
  return api.post('/settings', settings)
}

// 重置系统设置
export function resetSettings() {
  return api.post('/settings/reset')
}

export default api