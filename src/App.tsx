import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// 页面组件
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

// 布局组件
import Layout from './components/Layout';

// Hooks和stores
import { useGameStore } from './stores/gameStore';
import { useAlertStore } from './stores/alertStore';
import { usePriceMonitor } from './hooks/usePriceMonitor';

// 样式
import './index.css';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { loadPopularGames } = useGameStore();
  const { loadAlerts } = useAlertStore();

  // 启用价格监控
  usePriceMonitor();
const showUpdateAvailable=(registration: ServiceWorkerRegistration)=> {
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
  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 加载本地数据
        await Promise.all([
          loadPopularGames(),
          loadAlerts(),
        ]);

        // 注册Service Worker
        if ('serviceWorker' in navigator && import.meta.env.PROD) {
          try {
          const registration =  await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');

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
              // 处理跳过等待命令
              if (event.data && event.data.type === 'SKIP_WAITING') {
                //@ts-ignore
                self.skipWaiting();
              }
            })
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initializeApp();
  }, [loadPopularGames, loadAlerts]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>

          {/* 全局提示组件 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </Router>

      {/* React Query开发工具 */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;