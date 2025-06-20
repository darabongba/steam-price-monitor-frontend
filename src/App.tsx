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
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');
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