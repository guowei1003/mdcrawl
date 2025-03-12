// 任务管理相关API
import api from './index'

// 获取任务列表
export function getTasks() {
  return api.get('/tasks')
}

// 获取任务详情
export function getTaskDetail(taskId) {
  return api.get(`/tasks/${taskId}`)
}

// 创建新任务
export function createTask(taskData) {
  return api.post('/tasks', taskData)
}

// 停止任务
export function stopTask(taskId) {
  return api.post(`/tasks/${taskId}/stop`)
}

// 删除任务
export function deleteTask(taskId) {
  return api.delete(`/tasks/${taskId}`)
}

// 获取任务结果
export function getTaskResults(taskId) {
  return api.get(`/tasks/${taskId}/results`)
}

// 获取任务统计信息
export function getTaskStats() {
  return api.get('/tasks/stats')
}