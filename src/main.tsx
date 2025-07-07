import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 确保容器元素存在
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

function showUpdateAvailable(registration: ServiceWorkerRegistration) {
  const updateBanner = document.createElement('div')
  updateBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2c3e50;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 10000;
      font-size: 14px;
    ">
      <span>新版本可用！</span>
      <button id="update-btn" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 6px 12px;
        margin-left: 12px;
        border-radius: 4px;
        cursor: pointer;
      ">立即更新</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 12px;
        margin-left: 8px;
        border-radius: 4px;
        cursor: pointer;
      ">稍后</button>
    </div>
  `
  
  document.body.appendChild(updateBanner)
  
  // 更新按钮点击事件
  document.getElementById('update-btn')?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    updateBanner.remove()
  })
  
  // 稍后按钮点击事件
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    updateBanner.remove()
  })
}

const registerServiceWorker = async () => {
      // 在客户端环境中注册Service Worker
      if (typeof window !== 'undefined') {
        // 检查浏览器是否支持Service Worker
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', async () => {
            try {
              const registration = await navigator.serviceWorker.register('/sw.js')
              console.log('Service Worker 注册成功:', registration.scope)
              
              // 监听Service Worker更新
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      // 有新版本可用
                      console.log('新版本可用，准备更新')
                      showUpdateAvailable(registration)
                    }
                  })
                }
              })
              
              // 监听Service Worker消息
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHES_CLEARED') {
                  console.log('缓存已清理，页面将刷新')
                  window.location.reload()
                }
              })
              
            } catch (error) {
              console.error('Service Worker 注册失败:', error)
            }
          })
        }
        
        // 检查是否支持推送通知
        if ('Notification' in window && 'serviceWorker' in navigator) {
          // 可以在这里添加推送通知订阅逻辑
          console.log('支持推送通知')
        }
      }
}
registerServiceWorker()

// 创建React根实例
const root = ReactDOM.createRoot(container);

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 热模块替换支持
if (import.meta.hot) {
  import.meta.hot.accept();
} 