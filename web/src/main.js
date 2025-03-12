import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入Tailwind CSS
import './assets/css/tailwind.css'

// 导入FontAwesome图标
import '@fortawesome/fontawesome-free/css/all.min.css'

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia状态管理
app.use(createPinia())

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')