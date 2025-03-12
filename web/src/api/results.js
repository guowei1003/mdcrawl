// 结果查看相关API
import api from './index'

// 获取所有爬取结果文件列表
export function getResultFiles() {
  return api.get('/results/files')
}

// 获取特定任务的结果文件
export function getTaskResultFiles(taskId) {
  return api.get(`/tasks/${taskId}/results/files`)
}

// 获取文件内容
export function getFileContent(filePath) {
  return api.get(`/results/content`, {
    params: { path: filePath }
  })
}

// 获取图片资源列表
export function getImagesList() {
  return api.get('/results/images')
}

// 下载文件
export function downloadFile(filePath) {
  return api.get(`/results/download`, {
    params: { path: filePath },
    responseType: 'blob'
  })
}